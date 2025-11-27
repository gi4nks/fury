import type { Prisma } from "@prisma/client";

export type MetadataAware =
  | {
      keywords?: string | null;
      summary?: string | null;
      aiCategory?: string | null;
      metaTitle?: string | null;
      metaDescription?: string | null;
      ogTitle?: string | null;
      ogDescription?: string | null;
      ogImage?: string | null;
    }
  | null;

export const metadataWhereClause: Prisma.BookmarkWhereInput = {
  OR: [
    { keywords: { not: null } },
    { summary: { not: null } },
    { aiCategory: { not: null } },
    { metaTitle: { not: null } },
    { metaDescription: { not: null } },
    { ogTitle: { not: null } },
    { ogDescription: { not: null } },
    { ogImage: { not: null } },
  ],
};

export function hasMetadata(parts: MetadataAware): boolean {
  if (!parts) {
    return false;
  }

  return Boolean(
    parts.keywords ||
      parts.summary ||
      parts.aiCategory ||
      parts.metaTitle ||
      parts.metaDescription ||
      parts.ogTitle ||
      parts.ogDescription ||
      parts.ogImage
  );
}

export function keywordTokens(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

export function collectTopKeywords(
  bookmarks: MetadataAware[],
  limit = 6
): string[] {
  const counts: Record<string, number> = {};

  for (const bookmark of bookmarks) {
    const tokens = keywordTokens(bookmark?.keywords);
    for (const token of tokens) {
      counts[token] = (counts[token] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

export function topAiCategory(
  bookmarks: MetadataAware[]
): { name: string; count: number } | null {
  const counts: Record<string, number> = {};

  for (const bookmark of bookmarks) {
    const category = bookmark?.aiCategory?.trim();
    if (!category) {
      continue;
    }
    counts[category] = (counts[category] || 0) + 1;
  }

  const entries = Object.entries(counts);
  if (entries.length === 0) {
    return null;
  }

  const [name, count] = entries.sort((a, b) => b[1] - a[1])[0];
  return { name, count };
}
