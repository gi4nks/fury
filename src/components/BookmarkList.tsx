import Link from "next/link";
import { buildBookmarkQueryURL, type BookmarkFilters } from "@lib/filterUtils";
import { keywordTokens } from "@lib/metadataUtils";

export type BookmarkViewModel = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  sourceFolder: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  keywords: string | null;
  summary: string | null;
  aiCategory: string | null;
  category: {
    id: string;
    name: string;
  } | null;
};

export type BookmarkListProps = {
  bookmarks: BookmarkViewModel[];
  filters?: BookmarkFilters;
};

export function BookmarkList({ bookmarks, filters }: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="alert alert-info shadow-lg">
        <div className="flex-1">
          <p>No bookmarks to display yet.</p>
        </div>
      </div>
    );
  }

  const buildMetadataLink = (value: string) =>
    buildBookmarkQueryURL(filters ?? {}, {
      metadata: value,
      hasMetadata: "true",
    });

  return (
    <div className="space-y-3">
      {bookmarks.map((bookmark) => {
        const keywords = keywordTokens(bookmark.keywords).slice(0, 5);
        const metadataNotes: string[] = [];

        if (bookmark.metaTitle && bookmark.metaTitle !== bookmark.title) {
          metadataNotes.push(`Meta title: ${bookmark.metaTitle}`);
        }
        if (bookmark.metaDescription) {
          metadataNotes.push(`Meta description: ${bookmark.metaDescription}`);
        }
        if (bookmark.ogTitle && bookmark.ogTitle !== bookmark.title) {
          metadataNotes.push(`OG title: ${bookmark.ogTitle}`);
        }
        if (bookmark.ogDescription) {
          metadataNotes.push(`OG description: ${bookmark.ogDescription}`);
        }

        return (
          <div key={bookmark.id} className="card bg-base-100 shadow-sm">
            <div className="card-body space-y-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg font-semibold text-primary underline-offset-4 focus-visible:ring-2 focus-visible:ring-primary-focus"
                >
                  {bookmark.title}
                </a>
                <span className="badge badge-sm badge-outline">
                  {bookmark.category ? bookmark.category.name : "Uncategorized"}
                </span>
                {bookmark.aiCategory && (
                  <Link
                    href={buildMetadataLink(bookmark.aiCategory)}
                    className="badge badge-sm badge-primary badge-outline"
                  >
                    AI: {bookmark.aiCategory}
                  </Link>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <p className="text-sm text-base-content/70 break-all">
                    {bookmark.url}
                  </p>
                  {bookmark.description && (
                    <p className="text-sm text-base-content/80">
                      {bookmark.description}
                    </p>
                  )}
                  {bookmark.summary && (
                    <p className="text-sm text-base-content/70">
                      {bookmark.summary}
                    </p>
                  )}
                  {metadataNotes.length > 0 && (
                    <div className="grid gap-1 text-xs text-base-content/60">
                      {metadataNotes.map((note) => (
                        <p key={note}>{note}</p>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {keywords.map((keyword) => (
                      <Link
                        key={`${bookmark.id}-${keyword}`}
                        href={buildMetadataLink(keyword)}
                        className="badge badge-xs badge-outline"
                      >
                        {keyword}
                      </Link>
                    ))}
                  </div>
                  {bookmark.sourceFolder && (
                    <p className="text-xs uppercase tracking-wide text-base-content/60">
                      Source folder: {bookmark.sourceFolder}
                    </p>
                  )}
                </div>
                {bookmark.ogImage && (
                  <div
                    className="w-full max-w-[160px] shrink-0 overflow-hidden rounded border border-base-200 bg-base-200"
                    role="img"
                    aria-label={`Preview for ${bookmark.title}`}
                    style={{
                      backgroundImage: `url(${bookmark.ogImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      minHeight: "96px",
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
