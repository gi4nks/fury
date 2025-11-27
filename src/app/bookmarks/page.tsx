import { BookmarkList, type BookmarkViewModel } from "@components/BookmarkList";
import FilterForm from "@components/FilterForm";
import MetadataHighlights from "@components/MetadataHighlights";
import ExportButton from "@components/ExportButton";
import prisma from "@lib/db";
import { Prisma } from "@prisma/client";
import {
  collectTopKeywords,
  hasMetadata as bookmarkHasMetadata,
  metadataWhereClause,
  topAiCategory,
} from "@lib/metadataUtils";
import { type BookmarkFilters } from "@lib/filterUtils";

type SearchParams = {
  q?: string;
  categoryId?: string;
  metadata?: string;
  hasMetadata?: string;
  page?: string;
};

const PAGE_SIZE = 12;

export default async function BookmarksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = (params?.q ?? "").trim();
  const categoryId = params?.categoryId;
  const pageNumber = Math.max(1, Number(params?.page ?? "1"));

  const metadataTerm = (params?.metadata ?? "").trim();
  const metadataFilter = metadataTerm ? metadataTerm : undefined;
  const hasMetadataFilter = params?.hasMetadata === "true";

  const searchFilters = query
    ? {
        OR: [
          { title: { contains: query } },
          { url: { contains: query } },
          { description: { contains: query } },
          { metaTitle: { contains: query } },
          { metaDescription: { contains: query } },
          { keywords: { contains: query } },
          { summary: { contains: query } },
          { aiCategory: { contains: query } },
          { ogTitle: { contains: query } },
          { ogDescription: { contains: query } },
        ],
      }
    : undefined;

  const metadataFilters = metadataFilter
    ? {
        OR: [
          { keywords: { contains: metadataFilter } },
          { summary: { contains: metadataFilter } },
          { aiCategory: { contains: metadataFilter } },
          { metaTitle: { contains: metadataFilter } },
          { metaDescription: { contains: metadataFilter } },
          { ogTitle: { contains: metadataFilter } },
          { ogDescription: { contains: metadataFilter } },
        ],
      }
    : undefined;

  const conditions: Prisma.BookmarkWhereInput[] = [];
  if (categoryId && categoryId !== "") {
    conditions.push({ categoryId });
  }
  if (searchFilters) {
    conditions.push(searchFilters);
  }
  if (metadataFilters) {
    conditions.push(metadataFilters);
  }
  if (hasMetadataFilter) {
    conditions.push(metadataWhereClause);
  }

  const where: Prisma.BookmarkWhereInput | undefined =
    conditions.length > 0 ? { AND: conditions } : undefined;

  const [categories, total, bookmarks] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.bookmark.count({ where }),
    prisma.bookmark.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const bookmarkItems: BookmarkViewModel[] = bookmarks.map((bookmark) => ({
    id: bookmark.id,
    url: bookmark.url,
    title: bookmark.title,
    description: bookmark.description,
    sourceFolder: bookmark.sourceFolder,
    // Enhanced metadata
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
  }));

  const baseParams = new URLSearchParams();
  if (query) {
    baseParams.set("q", query);
  }
  if (categoryId) {
    baseParams.set("categoryId", categoryId);
  }
  if (metadataFilter) {
    baseParams.set("metadata", metadataFilter);
  }
  if (hasMetadataFilter) {
    baseParams.set("hasMetadata", "true");
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(baseParams);
    params.set("page", String(page));
    return `/bookmarks?${params.toString()}`;
  };

  const activeFilters: BookmarkFilters = {
    q: query || undefined,
    categoryId: categoryId || undefined,
    metadata: metadataFilter,
    hasMetadata: hasMetadataFilter ? "true" : undefined,
  };

  const metadataCount = bookmarkItems.filter((bookmark) =>
    bookmarkHasMetadata(bookmark)
  ).length;

  const metadataCoverage = bookmarkItems.length
    ? Math.round((metadataCount / bookmarkItems.length) * 100)
    : 0;

  const aiCategory = topAiCategory(bookmarkItems);
  const metadataHighlights = collectTopKeywords(bookmarkItems, 6);

  return (
    <div className="space-y-6">

      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Bookmarks</h1>
              <p className="text-base-content/70">
                Search, filter and browse every saved link. Fury keeps everything
                in one list.
              </p>
            </div>
            <ExportButton categoryId={categoryId} />
          </div>

          <FilterForm
            categories={categories}
            query={query}
            categoryId={categoryId}
            metadataFilter={metadataFilter}
            hasMetadata={hasMetadataFilter ? "true" : undefined}
            total={total}
          />

          {(query || categoryId || metadataFilter || hasMetadataFilter) && (
            <div className="text-sm text-base-content/70">
              <strong>Current filters:</strong>
              {query && (
                <span>
                  {" "}
                  Query: &quot;{query}&quot;
                </span>
              )}
              {query && metadataFilter && <span> | </span>}
              {metadataFilter && (
                <span>
                  Metadata: &quot;{metadataFilter}&quot;
                </span>
              )}
              {(query || metadataFilter) && hasMetadataFilter && (
                <span> | </span>
              )}
              {hasMetadataFilter && (
                <span>Only metadata-rich bookmarks</span>
              )}
              {(query || metadataFilter || hasMetadataFilter) && categoryId && (
                <>
                  <span> | </span>
                  <span>
                    Category:{" "}
                    {categories.find((c) => c.id === categoryId)?.name ||
                      "Unknown"}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
          <div className="stat-title">Metadata enriched</div>
          <div className="stat-value">{metadataCount}</div>
          <div className="stat-desc">{metadataCoverage}% of visible bookmarks</div>
        </div>
        <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
          <div className="stat-title">AI category</div>
          <div className="stat-value">{aiCategory ? aiCategory.name : "—"}</div>
          <div className="stat-desc">
            {aiCategory
              ? `${aiCategory.count} bookmarks tagged`
              : "Awaiting AI analysis"}
          </div>
        </div>
        <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
          <div className="stat-title">Metadata filter</div>
          <div className="stat-value">
            {metadataFilter ? `"${metadataFilter}"` : "None"}
          </div>
          <div className="stat-desc">
            {hasMetadataFilter ? "Only enriched" : "All bookmarks"}
          </div>
        </div>
      </div>

      <MetadataHighlights
        highlights={metadataHighlights}
        filters={activeFilters}
        title="Metadata explorer"
        description="The most common keywords and AI tags from the current list."
      />

      <BookmarkList bookmarks={bookmarkItems} filters={activeFilters} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {pageNumber > 1 ? (
            <a href={buildPageUrl(pageNumber - 1)} className="btn btn-outline">
              Previous
            </a>
          ) : (
            <button className="btn btn-outline" disabled>
              Previous
            </button>
          )}
          {pageNumber < pageCount ? (
            <a href={buildPageUrl(pageNumber + 1)} className="btn btn-outline">
              Next
            </a>
          ) : (
            <button className="btn btn-outline" disabled>
              Next
            </button>
          )}
        </div>
        <div className="text-sm text-base-content/70">
          Page {pageNumber} of {pageCount}
        </div>
      </div>
    </div>
  );
}
