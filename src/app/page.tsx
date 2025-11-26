import Link from "next/link";
import prisma from "@lib/db";

export default async function HomePage() {
  const [totalBookmarks, totalCategories, lastImport] = await Promise.all([
    prisma.bookmark.count(),
    prisma.category.count(),
    prisma.importSession.findFirst({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          <p className="text-sm font-semibold uppercase text-primary tracking-[0.3em]">
            Fury
          </p>
          <h1 className="text-3xl font-bold">
            Fury – Smart Bookmark Organizer
          </h1>
          <p className="text-base-content/70 max-w-2xl">
            Import your Chrome bookmarks, keep them neatly categorized, and find
            what you need in seconds. Fury keeps it simple for the disorganized
            mind.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/import" className="btn btn-primary">
              Import bookmarks
            </Link>
            <Link href="/bookmarks" className="btn btn-outline btn-primary">
              View bookmarks
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-base-content/70">Total bookmarks</p>
            <p className="text-3xl font-bold">{totalBookmarks}</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-base-content/70">Categories</p>
            <p className="text-3xl font-bold">{totalCategories}</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <p className="text-sm text-base-content/70">Last import</p>
            <p className="text-lg font-semibold">
              {lastImport
                ? new Date(lastImport.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Never"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
