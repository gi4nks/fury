'use client';

import { useRouter } from 'next/navigation';

type Category = {
  id: string;
  name: string;
};

type FilterFormProps = {
  categories: Category[];
  query: string;
  categoryId: string | undefined;
  metadataFilter?: string;
  hasMetadata?: string;
  total: number;
};

const normalize = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed?.length ? trimmed : undefined;
};

export default function FilterForm({
  categories,
  query,
  categoryId,
  metadataFilter,
  hasMetadata,
  total,
}: FilterFormProps) {
  const router = useRouter();

  const defaultFilters = {
    q: normalize(query),
    categoryId: normalize(categoryId),
    metadata: normalize(metadataFilter),
    hasMetadata: hasMetadata === "true" ? "true" : undefined,
  };

  const buildParams = (overrides: {
    q?: string | undefined;
    categoryId?: string | undefined;
    metadata?: string | undefined;
    hasMetadata?: string | undefined;
    page?: string;
  }) => {
    const merged = {
      ...defaultFilters,
      ...overrides,
    };

    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.categoryId) params.set("categoryId", merged.categoryId);
    if (merged.metadata) params.set("metadata", merged.metadata);
    if (merged.hasMetadata) params.set("hasMetadata", merged.hasMetadata);

    params.set("page", overrides.page ?? "1");
    return params.toString();
  };

  const handleCategoryChange = (newCategoryId: string) => {
    const params = buildParams({
      categoryId: normalize(newCategoryId) ?? undefined,
      page: "1",
    });
    router.push(`/bookmarks?${params}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = normalize(formData.get("q") as string);
    const catId = normalize(formData.get("categoryId") as string);
    const metadata = normalize(formData.get("metadata") as string);
    const hasMeta = formData.get("hasMetadata") === "on" ? "true" : undefined;

    const params = buildParams({
      q,
      categoryId: catId,
      metadata,
      hasMetadata: hasMeta,
      page: "1",
    });

    router.push(`/bookmarks?${params}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by title, URL or description"
          className="input input-bordered w-full"
        />
        <select
          name="categoryId"
          value={categoryId ?? ""}
          className="select select-bordered w-full"
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="metadata"
          defaultValue={metadataFilter ?? ""}
          placeholder="Metadata keyword or AI tag"
          className="input input-bordered w-full"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary">
          Apply filters
        </button>
        <label className="flex items-center gap-2 text-sm text-base-content/70">
          <input
            type="checkbox"
            name="hasMetadata"
            defaultChecked={hasMetadata === "true"}
            className="toggle toggle-sm"
          />
          <span>Only metadata-rich bookmarks</span>
        </label>
        <div className="text-sm text-base-content/70">
          {total} bookmark{total === 1 ? "" : "s"} found
        </div>
      </div>
    </form>
  );
}
