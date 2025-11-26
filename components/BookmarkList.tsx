export type BookmarkViewModel = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  sourceFolder: string | null;
  category: {
    id: string;
    name: string;
  } | null;
};

export type BookmarkListProps = {
  bookmarks: BookmarkViewModel[];
};

export function BookmarkList({ bookmarks }: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="alert alert-info shadow-lg">
        <div className="flex-1">
          <p>No bookmarks to display yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((bookmark) => (
        <div key={bookmark.id} className="card bg-base-100 shadow-sm">
          <div className="card-body space-y-2">
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
            </div>
            <p className="text-sm text-base-content/70 break-all">
              {bookmark.url}
            </p>
            {bookmark.description && (
              <p className="text-sm text-base-content/80">{bookmark.description}</p>
            )}
            {bookmark.sourceFolder && (
              <p className="text-xs uppercase tracking-wide text-base-content/60">
                Source folder: {bookmark.sourceFolder}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
