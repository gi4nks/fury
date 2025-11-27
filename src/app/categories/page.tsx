import Link from "next/link";
import MetadataHighlights from "@components/MetadataHighlights";
import prisma from "@lib/db";
import {
  collectTopKeywords,
  metadataWhereClause,
} from "@lib/metadataUtils";

export default async function CategoriesPage() {
  const [categories, totalBookmarks, metadataBookmarks, recentBookmarks] =
    await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { bookmarks: true },
          },
        },
      }),
      prisma.bookmark.count(),
      prisma.bookmark.count({
        where: metadataWhereClause,
      }),
      prisma.bookmark.findMany({
        orderBy: { updatedAt: "desc" },
        take: 60,
        select: {
          keywords: true,
        },
      }),
    ]);

  const metadataCoverage = totalBookmarks
    ? Math.round((metadataBookmarks / totalBookmarks) * 100)
    : 0;
  const metadataHighlights = collectTopKeywords(recentBookmarks, 6);
  const metadataFilters = { hasMetadata: "true" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-base-content/70">
          Browse every category that Fury keeps in sync with your imports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
          <div className="stat-title">Total bookmarks</div>
          <div className="stat-value">{totalBookmarks}</div>
          <div className="stat-desc">Across all categories</div>
        </div>
        <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
          <div className="stat-title">Metadata-enriched</div>
          <div className="stat-value">{metadataBookmarks}</div>
          <div className="stat-desc">{metadataCoverage}% coverage</div>
        </div>
        <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
          <div className="stat-title">Metadata filter</div>
          <div className="stat-value">Only metadata-rich</div>
          <div className="stat-desc">Use the explorer below to jump in.</div>
        </div>
      </div>

      <MetadataHighlights
        highlights={metadataHighlights}
        filters={metadataFilters}
        title="Metadata explorer"
        description="Tap a keyword to filter bookmarks that carry that metadata."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <div key={category.id} className="card bg-base-100 shadow">
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="card-title text-lg">{category.name}</h2>
                <span className="badge badge-outline">
                  {category._count.bookmarks} bookmarks
                </span>
              </div>
              <p className="text-sm text-base-content/70">
                {category.description ?? "No description available."}
              </p>
              <div className="card-actions justify-end">
                <Link
                  href={`/categories/${category.slug}`}
                  className="btn btn-sm btn-primary"
                >
                  View bookmarks
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
