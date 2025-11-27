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
          children: {
            orderBy: { name: "asc" },
            include: {
              _count: {
                select: { bookmarks: true },
              },
            },
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

  // Separate parent categories (those without parents) from all categories
  const parentCategories = categories.filter(category => !category.parentId);

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

      <div className="space-y-8">
        {parentCategories.map((parentCategory) => (
          <div key={parentCategory.id} className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">{parentCategory.name}</h2>
              <span className="badge badge-primary">
                {parentCategory._count.bookmarks + parentCategory.children.reduce((sum, child) => sum + child._count.bookmarks, 0)} total bookmarks
              </span>
            </div>
            <p className="text-sm text-base-content/70 ml-4">
              {parentCategory.description ?? "No description available."}
            </p>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ml-4">
              {parentCategory.children.map((subcategory) => (
                <div key={subcategory.id} className="card bg-base-100 shadow border-l-4 border-l-primary">
                  <div className="card-body space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="card-title text-base">{subcategory.name}</h3>
                      <span className="badge badge-outline badge-sm">
                        {subcategory._count.bookmarks}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/70">
                      {subcategory.description ?? "No description available."}
                    </p>
                    <div className="card-actions justify-end">
                      <Link
                        href={`/categories/${subcategory.slug}`}
                        className="btn btn-xs btn-primary"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
