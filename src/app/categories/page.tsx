import Link from "next/link";
import prisma from "@lib/db";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { bookmarks: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-base-content/70">
          Browse every category that Fury keeps in sync with your imports.
        </p>
      </div>
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
