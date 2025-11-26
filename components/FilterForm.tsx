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
  total: number;
};

export default function FilterForm({ categories, query, categoryId, total }: FilterFormProps) {
  const router = useRouter();

  const handleCategoryChange = (newCategoryId: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (newCategoryId && newCategoryId !== '') params.set('categoryId', newCategoryId);
    params.set('page', '1');
    router.push(`/bookmarks?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    const catId = formData.get('categoryId') as string;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (catId && catId !== '') params.set('categoryId', catId);
    params.set('page', '1');
    router.push(`/bookmarks?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
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
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-primary">
          Apply filters
        </button>
        <div className="text-sm text-base-content/70">
          {total} bookmark{total === 1 ? "" : "s"} found
        </div>
      </div>
    </form>
  );
}