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

    await ensureDefaultCategories();

    let successful = 0;
    let failed = 0;
    let skipped = 0;

    // Process bookmarks in batches
    for (let i = 0; i < parsedBookmarks.length; i += BATCH_SIZE) {
      const batch = parsedBookmarks.slice(i, i + BATCH_SIZE);
      const { results: enhancedBatch, skipped: batchSkipped } = await processBookmarkBatch(batch);
      skipped += batchSkipped;

      for (const bookmark of enhancedBatch) {
        if (!bookmark.url) {
          failed += 1;
          continue;
        }

        const categoryName = bookmark.aiAnalysis?.suggestedCategory ||
                           guessCategoryNameFromBookmark(bookmark);
        const category = await ensureCategoryByName(categoryName);

        try {
          await prisma.bookmark.upsert({
            where: { url: bookmark.url },
            update: {
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
            },
            create: {
              url: bookmark.url,
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
            },
          });
          successful += 1;
        } catch (error) {
          console.error("Failed to store bookmark", error);
          failed += 1;
        }
      }

      // Delay between batches to be respectful to servers
      if (i + BATCH_SIZE < parsedBookmarks.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    const importSession = await prisma.importSession.create({
      data: {
        fileName,
        totalBookmarks: parsedBookmarks.length,
        successfulBookmarks: successful,
        failedBookmarks: failed,
        skippedBookmarks: skipped,
      },
    });

    return NextResponse.json({
      importSessionId: importSession.id,
      totalBookmarks: parsedBookmarks.length,
      successfulBookmarks: successful,
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
