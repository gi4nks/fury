import prisma from "@lib/db";

type CategoryDefinition = {
  name: string;
  slug: string;
  description: string;
};

const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { name: "Tech & Dev", slug: "tech-and-dev", description: "Tools, docs and platforms for developers." },
  { name: "Video", slug: "video", description: "Video platforms and streaming content." },
  { name: "Shopping", slug: "shopping", description: "E-commerce stores and deals." },
  { name: "News & Articles", slug: "news-and-articles", description: "News sites and long-form articles." },
  { name: "Docs & Reference", slug: "docs-and-reference", description: "Documentation and technical references." },
  { name: "Social", slug: "social", description: "Social networks and communities." },
  { name: "Travel", slug: "travel", description: "Travel guides, booking and planning." },
  { name: "Other", slug: "other", description: "Miscellaneous bookmarks." },
];

const CATEGORY_KEYWORDS: {
  name: string;
  keywords: string[];
}[] = [
  { name: "Video", keywords: ["youtube", "vimeo", "dailymotion", "twitch", "netflix", "hulu", "video", "stream"] },
  { name: "Tech & Dev", keywords: ["github", "gitlab", "stack overflow", "npm", "react", "next", "next.js", "node", "javascript", "typescript", "python", "golang", "rust", "docker", "kubernetes", "aws", "azure", "cloud", "programming", "code", "developer", "api", "sdk", "linux", "terminal", "git"] },
  { name: "Shopping", keywords: ["amazon", "ebay", "shop", "store", "buy", "price", "deal", "discount", "cart", "checkout", "marketplace"] },
  { name: "Docs & Reference", keywords: ["docs", "documentation", "api reference", "manual", "guide", "tutorial", "wiki", "howto", "learn", "reference", "cheatsheet"] },
  { name: "News & Articles", keywords: ["news", "blog", "article", "medium", "post", "journal", "times", "daily", "weekly", "report", "magazine"] },
  { name: "Social", keywords: ["facebook", "twitter", "linkedin", "instagram", "reddit", "tiktok", "pinterest", "social", "community", "forum", "discord", "slack"] },
  { name: "Travel", keywords: ["tripadvisor", "booking", "airbnb", "hotel", "flight", "travel", "destination", "tour", "guide", "map", "vacation"] },
];

export function guessCategoryNameFromBookmark(bookmark: {
  url: string;
  title: string;
  description?: string;
  keywords?: string[];
}): string {
  const text = `${bookmark.title} ${bookmark.url} ${bookmark.description || ""} ${bookmark.keywords?.join(" ") || ""}`.toLowerCase();
  
  let bestCategory = "Other";
  let maxScore = 0;

  for (const candidate of CATEGORY_KEYWORDS) {
    let score = 0;
    for (const keyword of candidate.keywords) {
      if (text.includes(keyword)) {
        score += 1;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestCategory = candidate.name;
    }
  }

  return bestCategory;
}

export async function ensureCategoryByName(name: string) {
  const normalized = name.trim() || "Other";
  const preset = DEFAULT_CATEGORIES.find((presetCategory) => presetCategory.name === normalized);
  const slug = preset?.slug ?? slugify(normalized);

  return prisma.category.upsert({
    where: { slug },
    update: { name: normalized },
    create: {
      name: normalized,
      slug,
      description: preset?.description,
    },
  });
}

export async function ensureDefaultCategories() {
  await Promise.all(DEFAULT_CATEGORIES.map((category) => ensureCategoryByName(category.name)));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
