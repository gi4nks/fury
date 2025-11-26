import { NextResponse } from "next/server";
import prisma from "@lib/db";

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

    const searchFilter = q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { url: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined;

    const filters = [
      categoryId ? { categoryId } : undefined,
      searchFilter,
    ].filter(Boolean);

    const where = filters.length > 0 ? { AND: filters } : undefined;

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
