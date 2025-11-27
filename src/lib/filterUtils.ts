export type BookmarkFilters = {
  q?: string;
  categoryId?: string;
  metadata?: string;
  hasMetadata?: string;
};

export type BookmarkQueryOverrides = Partial<BookmarkFilters> & {
  page?: string;
};

export function buildBookmarkQueryURL(
  filters: BookmarkFilters = {},
  overrides: BookmarkQueryOverrides = {},
  path = "/bookmarks"
) {
  const merged: Record<string, string | undefined> = {
    ...filters,
    ...overrides,
  };

  const params = new URLSearchParams();

  if (merged.q) {
    params.set("q", merged.q);
  }
  if (merged.categoryId) {
    params.set("categoryId", merged.categoryId);
  }
  if (merged.metadata) {
    params.set("metadata", merged.metadata);
  }
  if (merged.hasMetadata) {
    params.set("hasMetadata", merged.hasMetadata);
  }

  const pageValue = overrides.page ?? "1";
  params.set("page", pageValue);

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}
