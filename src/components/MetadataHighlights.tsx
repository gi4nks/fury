import Link from "next/link";
import {
  buildBookmarkQueryURL,
  type BookmarkFilters,
} from "@lib/filterUtils";

type MetadataHighlightsProps = {
  highlights: string[];
  filters: BookmarkFilters;
  title?: string;
  description?: string;
};

export default function MetadataHighlights({
  highlights,
  filters,
  title = "Metadata highlights",
  description = "Tap a tag to filter the list by that metadata keyword or AI tag.",
}: MetadataHighlightsProps) {
  const onlyEnrichedHref = buildBookmarkQueryURL(
    filters,
    { hasMetadata: "true", page: "1" }
  );

  const clearFiltersHref = buildBookmarkQueryURL(
    filters,
    { metadata: undefined, hasMetadata: undefined, page: "1" }
  );

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body space-y-3">
        <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="card-title">{title}</h2>
            <p className="text-sm text-base-content/70">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={onlyEnrichedHref} className="btn btn-xs btn-ghost">
              Only enriched
            </Link>
            {(filters.metadata || filters.hasMetadata) && (
              <Link
                href={clearFiltersHref}
                className="btn btn-xs btn-outline"
              >
                Clear metadata filters
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {highlights.length > 0 ? (
            highlights.map((highlight) => (
              <Link
                key={highlight}
                href={buildBookmarkQueryURL(filters, {
                  metadata: highlight,
                  hasMetadata: "true",
                  page: "1",
                })}
                className="btn btn-xs btn-outline"
              >
                {highlight}
              </Link>
            ))
          ) : (
            <p className="text-xs text-base-content/60">
              Metadata highlights appear once enriched bookmarks exist in your
              library.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
