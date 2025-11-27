import { NextResponse } from "next/server";
import prisma from "@lib/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        parentId: null, // Only get parent categories
      },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { bookmarks: true },
        },
        children: {
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { bookmarks: true },
            },
          },
        },
      },
    });

    const payload = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      bookmarkCount: category._count.bookmarks + category.children.reduce((sum, child) => sum + child._count.bookmarks, 0),
      subcategories: category.children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description,
        bookmarkCount: child._count.bookmarks,
      })),
    }));

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to list categories", error);
    return NextResponse.json(
      { message: "Unable to load categories right now." },
      { status: 500 }
    );
  }
}
