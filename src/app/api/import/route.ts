import { NextResponse } from "next/server";
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

// Batch processing to avoid overwhelming servers
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 1000; // 1 second

/**
 * Deduplicate bookmarks by URL within the import file
 * Keeps the last occurrence (which might have better metadata from a later folder)
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
      // Keep the bookmark with more metadata, or the later one
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
 * Normalize URL for comparison (remove trailing slashes, normalize protocol)
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Normalize: lowercase host, remove default ports, remove trailing slash
    let normalized = `${urlObj.protocol}//${urlObj.host.toLowerCase()}${urlObj.pathname}`;
    // Remove trailing slash unless it's the root
    if (normalized.endsWith('/') && urlObj.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }
    // Add query and hash if present
    if (urlObj.search) normalized += urlObj.search;
    if (urlObj.hash) normalized += urlObj.hash;
    return normalized;
  } catch {
    return url.toLowerCase().trim();
  }
}

async function processBookmarkBatch(bookmarks: ParsedBookmark[]) {
  const results = [];
  let skipped = 0;
  for (const bookmark of bookmarks) {
    try {
      // Validate URL first
      const isValid = await validateUrl(bookmark.url);
      if (!isValid) {
        console.warn(`Skipping invalid URL: ${bookmark.url}`);
        skipped += 1;
        continue; // Skip invalid URLs
      }

      const scraped = await scrapeMetadata(bookmark.url);
      const aiAnalysis = await analyzeBookmark(
        bookmark.url,
        bookmark.title,
        bookmark.description,
        scraped
      );

      results.push({
        ...bookmark,
        scraped,
        aiAnalysis,
      });
    } catch (error) {
      console.warn(`Failed to enhance ${bookmark.url}:`, (error as Error).message);
      results.push(bookmark); // Return original if enhancement fails
    }
  }
  return { results, skipped };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Bookmark file is required." },
        { status: 400 }
      );
    }

    const fileName = file.name ?? "bookmarks.html";
    if (!fileName.toLowerCase().endsWith(".html")) {
      return NextResponse.json(
        { message: "Only HTML bookmark exports from Chrome are supported." },
        { status: 400 }
      );
    }

    const contents = await file.text();
    const parsedBookmarks = parseBookmarksFromHtml(contents);

    // Deduplicate bookmarks within the import file
    const { unique: uniqueBookmarks, duplicatesInFile } = deduplicateBookmarks(parsedBookmarks);
    
    if (duplicatesInFile > 0) {
      console.log(`Found ${duplicatesInFile} duplicate URLs in import file, deduplicated to ${uniqueBookmarks.length} unique bookmarks`);
    }

    await ensureDefaultCategories();

    let newBookmarks = 0;
    let updatedBookmarks = 0;
    let failed = 0;
    let skipped = 0;

    // Process bookmarks in batches
    for (let i = 0; i < uniqueBookmarks.length; i += BATCH_SIZE) {
      const batch = uniqueBookmarks.slice(i, i + BATCH_SIZE);
      const { results: enhancedBatch, skipped: batchSkipped } = await processBookmarkBatch(batch);
      skipped += batchSkipped;

      for (const bookmark of enhancedBatch) {
        if (!bookmark.url) {
          failed += 1;
          continue;
        }

        // Normalize URL for consistent storage
        const normalizedUrl = normalizeUrl(bookmark.url);

        const categoryName = bookmark.aiAnalysis?.suggestedCategory ||
                           guessCategoryNameFromBookmark(bookmark);
        const category = await ensureCategoryByName(categoryName);

        try {
          // Check if bookmark already exists
          const existingBookmark = await prisma.bookmark.findUnique({
            where: { url: normalizedUrl }
          });

          if (existingBookmark) {
            // Update existing bookmark
            await prisma.bookmark.update({
              where: { url: normalizedUrl },
              data: {
                title: bookmark.title,
                description: bookmark.description ?? undefined,
                sourceFolder: bookmark.sourceFolder,
                categoryId: category.id,
                // Enhanced metadata
                metaTitle: bookmark.scraped?.metaTitle,
                metaDescription: bookmark.scraped?.metaDescription,
                ogTitle: bookmark.scraped?.ogTitle,
                ogDescription: bookmark.scraped?.ogDescription,
                ogImage: bookmark.scraped?.ogImage,
                keywords: bookmark.aiAnalysis?.keywords?.join(', '),
                summary: bookmark.aiAnalysis?.summary,
                aiCategory: bookmark.aiAnalysis?.suggestedCategory,
                aiConfidence: bookmark.aiAnalysis?.confidence,
              },
            });
            updatedBookmarks += 1;
          } else {
            // Create new bookmark
            await prisma.bookmark.create({
              data: {
                url: normalizedUrl,
                title: bookmark.title,
                description: bookmark.description ?? undefined,
                sourceFolder: bookmark.sourceFolder,
                categoryId: category.id,
                // Enhanced metadata
                metaTitle: bookmark.scraped?.metaTitle,
                metaDescription: bookmark.scraped?.metaDescription,
                ogTitle: bookmark.scraped?.ogTitle,
                ogDescription: bookmark.scraped?.ogDescription,
                ogImage: bookmark.scraped?.ogImage,
                keywords: bookmark.aiAnalysis?.keywords?.join(', '),
                summary: bookmark.aiAnalysis?.summary,
                aiCategory: bookmark.aiAnalysis?.suggestedCategory,
                aiConfidence: bookmark.aiAnalysis?.confidence,
              },
            });
            newBookmarks += 1;
          }
        } catch (error) {
          console.error("Failed to store bookmark", error);
          failed += 1;
        }
      }

      // Delay between batches to be respectful to servers
      if (i + BATCH_SIZE < uniqueBookmarks.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    const importSession = await prisma.importSession.create({
      data: {
        fileName,
        totalBookmarks: parsedBookmarks.length,
        successfulBookmarks: newBookmarks + updatedBookmarks,
        failedBookmarks: failed,
        skippedBookmarks: skipped + duplicatesInFile,
      },
    });

    return NextResponse.json({
      importSessionId: importSession.id,
      totalBookmarks: parsedBookmarks.length,
      uniqueBookmarks: uniqueBookmarks.length,
      duplicatesInFile,
      newBookmarks,
      updatedBookmarks,
      successfulBookmarks: newBookmarks + updatedBookmarks,
      failedBookmarks: failed,
      skippedBookmarks: skipped,
    });
  } catch (error) {
    console.error("Import failed", error);
    return NextResponse.json(
      { message: "Unable to process bookmarks at the moment." },
      { status: 500 }
    );
  }
}
