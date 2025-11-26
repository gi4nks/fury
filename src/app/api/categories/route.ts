import { NextResponse } from "next/server";
import prisma from "@lib/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { bookmarks: true },
        },
      },
    });

    const payload = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      bookmarkCount: category._count.bookmarks,
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
