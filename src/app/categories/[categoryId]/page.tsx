import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@lib/db";
import { BookmarkList, type BookmarkViewModel } from "@components/BookmarkList";

type CategoryPageProps = {
  params: Promise<{
    categoryId: string;
  }>;
};

export default async function CategoryDetail({ params }: CategoryPageProps) {
  const { categoryId } = await params;
  const category = await prisma.category.findUnique({
    where: { slug: categoryId },
    include: {
      bookmarks: {
        include: { category: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!category) {
    notFound();
  }

  const bookmarkItems: BookmarkViewModel[] = category.bookmarks.map(
    (bookmark) => ({
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
    })
  );

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">{category.name}</h1>
              <p className="text-sm text-base-content/70">
                {category.description ?? "No description provided."}
              </p>
            </div>
            <Link href="/bookmarks" className="btn btn-sm btn-outline">
              View all bookmarks
            </Link>
          </div>
          <div className="badge badge-outline">
            {category.bookmarks.length} bookmark
            {category.bookmarks.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <BookmarkList bookmarks={bookmarkItems} />
    </div>
  );
}
