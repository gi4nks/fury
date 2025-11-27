import { notFound } from "next/navigation";
import Link from "next/link";
import MetadataHighlights from "@components/MetadataHighlights";
import prisma from "@lib/db";
import { BookmarkList, type BookmarkViewModel } from "@components/BookmarkList";
import {
  collectTopKeywords,
  hasMetadata as bookmarkHasMetadata,
} from "@lib/metadataUtils";
import { type BookmarkFilters } from "@lib/filterUtils";

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
      metaTitle: bookmark.metaTitle,
      metaDescription: bookmark.metaDescription,
      ogTitle: bookmark.ogTitle,
      ogDescription: bookmark.ogDescription,
      ogImage: bookmark.ogImage,
      keywords: bookmark.keywords,
      summary: bookmark.summary,
      aiCategory: bookmark.aiCategory,
      category: bookmark.category
        ? {
            id: bookmark.category.id,
            name: bookmark.category.name,
          }
        : null,
    })
  );

  const metadataCount = category.bookmarks.filter((bookmark) =>
    bookmarkHasMetadata(bookmark)
  ).length;
  const metadataCoverage = category.bookmarks.length
    ? Math.round((metadataCount / category.bookmarks.length) * 100)
    : 0;
  const metadataHighlights = collectTopKeywords(category.bookmarks, 5);
  const categoryFilters: BookmarkFilters = {
    categoryId: category.slug,
  };

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

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="card rounded border border-base-200 bg-base-100 shadow-sm">
          <div className="card-body space-y-3">
            <p className="text-sm text-base-content/70">
              Metadata coverage inside this category.
            </p>
            <div className="stats stats-vertical">
              <div className="stat">
                <div className="stat-title">Bookmarks</div>
                <div className="stat-value">{category.bookmarks.length}</div>
                <div className="stat-desc">Total</div>
              </div>
              <div className="stat">
                <div className="stat-title">Metadata enriched</div>
                <div className="stat-value">{metadataCount}</div>
                <div className="stat-desc">{metadataCoverage}% coverage</div>
              </div>
            </div>
          </div>
        </div>
        <MetadataHighlights
          highlights={metadataHighlights}
          filters={categoryFilters}
          title="Category metadata insights"
          description="Stay inside this category while filtering further."
        />
      </div>

      <BookmarkList bookmarks={bookmarkItems} filters={categoryFilters} />
    </div>
  );
}
