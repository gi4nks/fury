import { NextResponse } from "next/server";
import prisma from "@lib/db";
import { Prisma } from "@prisma/client";

const MAX_LIMIT = 100;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? undefined;
    const categoryId = url.searchParams.get("categoryId") ?? undefined;
    const limit = Math.min(
      MAX_LIMIT,
      Number(url.searchParams.get("limit") ?? "50") || 50
    );
    const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0") || 0);

    const conditions: Prisma.BookmarkWhereInput[] = [];
    if (categoryId) {
      conditions.push({ categoryId });
    }
    if (q) {
      conditions.push({
        OR: [
          { title: { contains: q } },
          { url: { contains: q } },
          { description: { contains: q } },
          { metaTitle: { contains: q } },
          { metaDescription: { contains: q } },
          { keywords: { contains: q } },
          { summary: { contains: q } },
          { aiCategory: { contains: q } },
          { ogTitle: { contains: q } },
          { ogDescription: { contains: q } },
        ],
      });
    }

    const where: Prisma.BookmarkWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [total, items] = await Promise.all([
      prisma.bookmark.count({ where }),
      prisma.bookmark.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      total,
      items: items.map((bookmark) => ({
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description,
        sourceFolder: bookmark.sourceFolder,
        category: bookmark.category
          ? {
            id: bookmark.category.id,
            name: bookmark.category.name,
          }
          : null,
      })),
    });
  } catch (error) {
    console.error("Failed to list bookmarks", error);
    return NextResponse.json(
      { message: "Unable to load bookmarks at the moment." },
      { status: 500 }
    );
  }
}
