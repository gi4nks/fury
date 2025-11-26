import { BookmarkList, type BookmarkViewModel } from "@components/BookmarkList";
import FilterForm from "@components/FilterForm";
import prisma from "@lib/db";

type SearchParams = {
  q?: string;
  categoryId?: string;
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

  const searchFilters = query
    ? {
        OR: [
          { title: { contains: query } },
          { url: { contains: query } },
          { description: { contains: query } },
        ],
      }
    : undefined;

  const rawFilters = [
    categoryId && categoryId !== "" ? { categoryId } : undefined,
    searchFilters,
  ].filter(Boolean);

  const where = rawFilters.length > 0 ? { AND: rawFilters } : undefined;

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

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(baseParams);
    params.set("page", String(page));
    return `/bookmarks?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Bookmarks</h1>
            <p className="text-base-content/70">
              Search, filter and browse every saved link. Fury keeps everything
              in one list.
            </p>
          </div>

          <FilterForm
            categories={categories}
            query={query}
            categoryId={categoryId}
            total={total}
          />

          {(query || categoryId) && (
            <div className="text-sm text-base-content/70">
              <strong>Current filters:</strong>
              {query && <span> Query: "{query}"</span>}
              {query && categoryId && <span> | </span>}
              {categoryId && (
                <span>
                  Category: {categories.find(c => c.id === categoryId)?.name || 'Unknown'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <BookmarkList bookmarks={bookmarkItems} />

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
