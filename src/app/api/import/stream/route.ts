import { NextRequest } from "next/server";
import prisma from "@lib/db";
import { parseBookmarksFromHtml } from "@lib/bookmarkParser";
import {
  ensureCategoryByName,
  ensureDefaultCategories,
  guessCategoryNameFromBookmark,
} from "@lib/categorization";
import { scrapeMetadata, validateUrl } from "@lib/metadataScraper";
import { analyzeBookmark } from "@lib/aiAnalyzer";
import { ParsedBookmark } from "@lib/bookmarkParser";
import { DiscoveredCategory } from "@lib/categoryDiscovery";
import { batchAssignBookmarksToCategories, isGeminiAvailable } from "@lib/geminiClient";

// Batch processing for fallback crawling
const CRAWL_BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 500; // 500ms

interface CategoryWithKeywords {
  id: string;
  name: string;
  keywords: string[];
  slug: string;
  parentName?: string | null;
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let normalized = `${urlObj.protocol}//${urlObj.host.toLowerCase()}${urlObj.pathname}`;
    if (normalized.endsWith('/') && urlObj.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }
    if (urlObj.search) normalized += urlObj.search;
    if (urlObj.hash) normalized += urlObj.hash;
    return normalized;
  } catch {
    return url.toLowerCase().trim();
  }
}

/**
 * Deduplicate bookmarks by URL
 */
function deduplicateBookmarks(bookmarks: ParsedBookmark[]): {
  unique: ParsedBookmark[];
  duplicatesInFile: number;
} {
  const urlMap = new Map<string, ParsedBookmark>();
  let duplicatesInFile = 0;

  for (const bookmark of bookmarks) {
    const normalizedUrl = normalizeUrl(bookmark.url);
    if (urlMap.has(normalizedUrl)) {
      duplicatesInFile++;
      const existing = urlMap.get(normalizedUrl)!;
      if ((bookmark.description && !existing.description) || 
          (bookmark.sourceFolder && !existing.sourceFolder)) {
        urlMap.set(normalizedUrl, bookmark);
      }
    } else {
      urlMap.set(normalizedUrl, bookmark);
    }
  }

  return {
    unique: Array.from(urlMap.values()),
    duplicatesInFile
  };
}

/**
 * Flatten discovered categories hierarchy for AI assignment
 */
function flattenCategories(categories: DiscoveredCategory[], parentName: string | null = null): Array<{name: string; keywords: string[]; parentName: string | null}> {
  const result: Array<{name: string; keywords: string[]; parentName: string | null}> = [];
  
  for (const cat of categories) {
    result.push({
      name: cat.name,
      keywords: cat.keywords,
      parentName: parentName
    });
    
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children, cat.name));
    }
  }
  
  return result;
}

/**
 * Create custom categories in the database from discovered hierarchy
 */
async function createCustomCategories(
  categories: DiscoveredCategory[],
  parentId: string | null = null,
  parentName: string | null = null
): Promise<CategoryWithKeywords[]> {
  const createdCategories: CategoryWithKeywords[] = [];

  for (const cat of categories) {
    // Check if category already exists
    let dbCategory = await prisma.category.findUnique({
      where: { slug: cat.slug }
    });

    if (dbCategory) {
      // Update existing category with new keywords
      dbCategory = await prisma.category.update({
        where: { slug: cat.slug },
        data: {
          keywords: JSON.stringify(cat.keywords),
          parentId: parentId,
          description: cat.description,
        }
      });
    } else {
      // Create new category
      dbCategory = await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          keywords: JSON.stringify(cat.keywords),
          parentId: parentId,
        }
      });
    }

    createdCategories.push({
      id: dbCategory.id,
      name: dbCategory.name,
      keywords: cat.keywords,
      slug: dbCategory.slug,
      parentName: parentName,
    });

    // Recursively create children
    if (cat.children && cat.children.length > 0) {
      const childCategories = await createCustomCategories(cat.children, dbCategory.id, cat.name);
      createdCategories.push(...childCategories);
    }
  }

  return createdCategories;
}

/**
 * Match a bookmark to the best custom category based on keywords (fallback)
 */
function matchBookmarkToCategory(
  bookmark: ParsedBookmark,
  categories: CategoryWithKeywords[]
): CategoryWithKeywords | null {
  const textToMatch = [
    bookmark.title || '',
    bookmark.description || '',
    bookmark.url || '',
    bookmark.sourceFolder || '',
  ].join(' ').toLowerCase();

  // Extract domain for matching
  let domain = '';
  try {
    const urlObj = new URL(bookmark.url);
    domain = urlObj.hostname.replace('www.', '').toLowerCase();
  } catch {
    // Ignore URL parse errors
  }

  let bestMatch: CategoryWithKeywords | null = null;
  let bestScore = 0;

  for (const category of categories) {
    let score = 0;
    const categoryNameLower = category.name.toLowerCase();

    // Match keywords
    for (const keyword of category.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Exact word match (with word boundaries)
      const wordBoundaryRegex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (wordBoundaryRegex.test(textToMatch)) {
        score += 10;
      }
      
      // Domain match
      if (domain.includes(keywordLower) || keywordLower.includes(domain)) {
        score += 15;
      }

      // Category name in text
      if (textToMatch.includes(categoryNameLower)) {
        score += 5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  // Only return match if score is meaningful
  return bestScore >= 10 ? bestMatch : null;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      
      const sendEvent = (event: string, data: unknown) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          console.error('Failed to send event:', e);
        }
      };
      
      const closeController = () => {
        if (!isClosed) {
          isClosed = true;
          controller.close();
        }
      };

      try {
        const formData = await request.formData();
        const file = formData.get("file");
        const customCategoriesJson = formData.get("customCategories");

        if (!(file instanceof File)) {
          sendEvent("error", { message: "Bookmark file is required." });
          closeController();
          return;
        }

        const fileName = file.name ?? "bookmarks.html";
        if (!fileName.toLowerCase().endsWith(".html")) {
          sendEvent("error", { message: "Only HTML bookmark exports are supported." });
          closeController();
          return;
        }

        // Parse custom categories if provided
        let customCategories: DiscoveredCategory[] = [];
        let customCategoryList: CategoryWithKeywords[] = [];
        const useCustomCategories = !!customCategoriesJson;

        if (customCategoriesJson && typeof customCategoriesJson === "string") {
          try {
            customCategories = JSON.parse(customCategoriesJson);
          } catch (e) {
            console.error("Failed to parse custom categories:", e);
          }
        }

        // Parse bookmarks
        sendEvent("status", { phase: "parsing", message: "Parsing bookmark file..." });
        const contents = await file.text();
        const parsedBookmarks = parseBookmarksFromHtml(contents);

        // Deduplicate
        const { unique: uniqueBookmarks, duplicatesInFile } = deduplicateBookmarks(parsedBookmarks);
        
        sendEvent("init", { 
          totalInFile: parsedBookmarks.length,
          uniqueBookmarks: uniqueBookmarks.length,
          duplicatesInFile
        });

        // Create custom categories in database if provided
        if (useCustomCategories && customCategories.length > 0) {
          sendEvent("status", { phase: "categories", message: "Creating custom categories..." });
          customCategoryList = await createCustomCategories(customCategories);
        } else {
          // Only ensure default categories if not using custom ones
          await ensureDefaultCategories();
        }

        let processed = 0;
        let newBookmarks = 0;
        let updatedBookmarks = 0;
        let failed = 0;
        let skipped = 0;

        // Build bookmark-to-category assignment map
        const categoryAssignments = new Map<number, string>(); // index -> category name

        // OPTION 1: Use AI batch assignment for custom categories
        if (useCustomCategories && customCategoryList.length > 0 && isGeminiAvailable()) {
          sendEvent("status", { phase: "assigning", message: "AI is assigning bookmarks to categories..." });
          
          const flatCategories = flattenCategories(customCategories);
          
          // Use smaller batch size for reliability
          const assignmentResult = await batchAssignBookmarksToCategories(
            uniqueBookmarks,
            flatCategories,
            50, // Smaller batches to avoid truncation
            (assignedCount, totalCount) => {
              // Send progress during AI assignment
              sendEvent("progress", {
                processed: assignedCount,
                total: totalCount,
                percent: Math.round((assignedCount / totalCount) * 100),
                currentBookmark: `AI assigning batch ${Math.floor(assignedCount / 50) + 1}...`,
                newBookmarks: 0,
                updatedBookmarks: 0,
                skipped: 0,
                failed: 0,
                phase: "assigning"
              });
            }
          );
          
          // Store assignments
          for (const assignment of assignmentResult.assignments) {
            categoryAssignments.set(assignment.index, assignment.category);
          }
          
          sendEvent("status", { 
            phase: "assigned", 
            message: `AI assigned ${assignmentResult.assignments.length}/${uniqueBookmarks.length} bookmarks. Saving to database...` 
          });
        }

        // Process bookmarks (fast mode for custom categories with AI assignment)
        sendEvent("status", { phase: "importing", message: "Saving bookmarks to database..." });
        
        for (let i = 0; i < uniqueBookmarks.length; i++) {
          const bookmark = uniqueBookmarks[i];
          processed++;
          
          // Send progress update (less frequently for fast mode)
          if (!useCustomCategories || processed % 10 === 0 || processed === uniqueBookmarks.length) {
            sendEvent("progress", {
              processed,
              total: uniqueBookmarks.length,
              percent: Math.round((processed / uniqueBookmarks.length) * 100),
              currentBookmark: (bookmark.title || bookmark.url).substring(0, 50),
              newBookmarks,
              updatedBookmarks,
              skipped,
              failed
            });
          }

          if (!bookmark.url) {
            failed++;
            continue;
          }

          try {
            const normalizedUrl = normalizeUrl(bookmark.url);
            let categoryId: string;

            if (useCustomCategories && customCategoryList.length > 0) {
              // Try AI assignment first
              const aiAssignedCategory = categoryAssignments.get(i);
              
              if (aiAssignedCategory) {
                // Find category by name
                const matchedCat = customCategoryList.find(
                  c => c.name.toLowerCase() === aiAssignedCategory.toLowerCase()
                );
                if (matchedCat) {
                  categoryId = matchedCat.id;
                } else {
                  // AI assigned to unknown category, use keyword fallback
                  const keywordMatch = matchBookmarkToCategory(bookmark, customCategoryList);
                  categoryId = keywordMatch?.id || customCategoryList[0].id;
                }
              } else {
                // OPTION 2 FALLBACK: Use keyword matching
                const keywordMatch = matchBookmarkToCategory(bookmark, customCategoryList);
                if (keywordMatch) {
                  categoryId = keywordMatch.id;
                } else {
                  // Last resort: find "Other" or "Uncategorized" or use first category
                  const fallbackCat = customCategoryList.find(c => 
                    c.name.toLowerCase() === 'uncategorized' || 
                    c.name.toLowerCase() === 'other' ||
                    c.name.toLowerCase() === 'miscellaneous'
                  );
                  categoryId = fallbackCat?.id || customCategoryList[0].id;
                }
              }

              // Fast import: skip URL validation and metadata scraping for custom categories
              const existingBookmark = await prisma.bookmark.findUnique({
                where: { url: normalizedUrl }
              });

              if (existingBookmark) {
                await prisma.bookmark.update({
                  where: { url: normalizedUrl },
                  data: {
                    title: bookmark.title,
                    description: bookmark.description ?? undefined,
                    sourceFolder: bookmark.sourceFolder,
                    categoryId: categoryId,
                  },
                });
                updatedBookmarks++;
              } else {
                await prisma.bookmark.create({
                  data: {
                    url: normalizedUrl,
                    title: bookmark.title,
                    description: bookmark.description ?? undefined,
                    sourceFolder: bookmark.sourceFolder,
                    categoryId: categoryId,
                  },
                });
                newBookmarks++;
              }
            } else {
              // Default mode: validate URL, scrape metadata, use default categorization
              const isValid = await validateUrl(bookmark.url);
              if (!isValid) {
                skipped++;
                sendEvent("skipped", { url: bookmark.url, reason: "Invalid URL" });
                continue;
              }

              // Scrape metadata
              const scraped = await scrapeMetadata(bookmark.url);
              const aiAnalysis = await analyzeBookmark(
                bookmark.url,
                bookmark.title,
                bookmark.description,
                scraped
              );

              const categoryName = aiAnalysis?.suggestedCategory ||
                                 guessCategoryNameFromBookmark(bookmark);
              const category = await ensureCategoryByName(categoryName);
              categoryId = category.id;

              // Check if exists
              const existingBookmark = await prisma.bookmark.findUnique({
                where: { url: normalizedUrl }
              });

              if (existingBookmark) {
                await prisma.bookmark.update({
                  where: { url: normalizedUrl },
                  data: {
                    title: bookmark.title,
                    description: bookmark.description ?? undefined,
                    sourceFolder: bookmark.sourceFolder,
                    categoryId: categoryId,
                    metaTitle: scraped?.metaTitle,
                    metaDescription: scraped?.metaDescription,
                    ogTitle: scraped?.ogTitle,
                    ogDescription: scraped?.ogDescription,
                    ogImage: scraped?.ogImage,
                    keywords: aiAnalysis?.keywords?.join(', '),
                    summary: aiAnalysis?.summary,
                    aiCategory: aiAnalysis?.suggestedCategory,
                    aiConfidence: aiAnalysis?.confidence,
                  },
                });
                updatedBookmarks++;
              } else {
                await prisma.bookmark.create({
                  data: {
                    url: normalizedUrl,
                    title: bookmark.title,
                    description: bookmark.description ?? undefined,
                    sourceFolder: bookmark.sourceFolder,
                    categoryId: categoryId,
                    metaTitle: scraped?.metaTitle,
                    metaDescription: scraped?.metaDescription,
                    ogTitle: scraped?.ogTitle,
                    ogDescription: scraped?.ogDescription,
                    ogImage: scraped?.ogImage,
                    keywords: aiAnalysis?.keywords?.join(', '),
                    summary: aiAnalysis?.summary,
                    aiCategory: aiAnalysis?.suggestedCategory,
                    aiConfidence: aiAnalysis?.confidence,
                  },
                });
                newBookmarks++;
              }

              // Add delay between batches only in default mode (crawling)
              if ((i + 1) % CRAWL_BATCH_SIZE === 0 && i + 1 < uniqueBookmarks.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
              }
            }
          } catch (error) {
            console.error("Failed to process bookmark:", error);
            failed++;
          }
        }

        // Save import session
        const importSession = await prisma.importSession.create({
          data: {
            fileName,
            totalBookmarks: parsedBookmarks.length,
            successfulBookmarks: newBookmarks + updatedBookmarks,
            failedBookmarks: failed,
            skippedBookmarks: skipped + duplicatesInFile,
          },
        });

        // Send completion
        sendEvent("complete", {
          importSessionId: importSession.id,
          totalInFile: parsedBookmarks.length,
          uniqueBookmarks: uniqueBookmarks.length,
          duplicatesInFile,
          newBookmarks,
          updatedBookmarks,
          successfulBookmarks: newBookmarks + updatedBookmarks,
          failedBookmarks: failed,
          skippedBookmarks: skipped,
          customCategoriesCreated: useCustomCategories ? customCategoryList.length : 0,
          aiAssignments: categoryAssignments.size
        });

      } catch (error) {
        console.error("Import failed:", error);
        sendEvent("error", { message: "Import failed. Please try again." });
      } finally {
        closeController();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
