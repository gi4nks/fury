import { NextResponse } from "next/server";
import prisma from "@lib/db";
import { parseBookmarksFromHtml } from "@lib/bookmarkParser";
import {
  ensureCategoryByName,
  ensureDefaultCategories,
  guessCategoryNameFromBookmark,
} from "@lib/categorization";

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

    for (const bookmark of parsedBookmarks) {
      if (!bookmark.url) {
        failed += 1;
        continue;
      }

      const categoryName = guessCategoryNameFromBookmark(bookmark);
      const category = await ensureCategoryByName(categoryName);

      try {
        await prisma.bookmark.upsert({
          where: { url: bookmark.url },
          update: {
            title: bookmark.title,
            description: bookmark.description ?? undefined,
            sourceFolder: bookmark.sourceFolder,
            categoryId: category.id,
          },
          create: {
            url: bookmark.url,
            title: bookmark.title,
            description: bookmark.description ?? undefined,
            sourceFolder: bookmark.sourceFolder,
            categoryId: category.id,
          },
        });
        successful += 1;
      } catch (error) {
        console.error("Failed to store bookmark", error);
        failed += 1;
      }
    }

    const importSession = await prisma.importSession.create({
      data: {
        fileName,
        totalBookmarks: parsedBookmarks.length,
        successfulBookmarks: successful,
        failedBookmarks: failed,
      },
    });

    return NextResponse.json({
      importSessionId: importSession.id,
      totalBookmarks: parsedBookmarks.length,
      successfulBookmarks: successful,
      failedBookmarks: failed,
    });
  } catch (error) {
    console.error("Import failed", error);
    return NextResponse.json(
      { message: "Unable to process bookmarks at the moment." },
      { status: 500 }
    );
  }
}
