/**
 * Category Discovery Module
 * 
 * Analyzes bookmarks to discover and suggest optimal category hierarchies.
 * Uses Gemini AI when available, falls back to local clustering algorithm.
 */

import {
  isGeminiAvailable,
  analyzeBookmarksForCategories,
  CategorySuggestion,
  HierarchySuggestion
} from './geminiClient';

export interface BookmarkForAnalysis {
  url: string;
  title: string;
  description?: string;
  sourceFolder?: string;
}

export interface DiscoveredCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  keywords: string[];
  parentId?: string;
  parentName?: string;
  estimatedCount: number;
  level: number;
  children: DiscoveredCategory[];
}

export interface DiscoveryResult {
  categories: DiscoveredCategory[];
  method: 'gemini' | 'clustering';
  reasoning: string;
  totalBookmarks: number;
}

/**
 * Main entry point for category discovery
 */
export async function discoverCategories(
  bookmarks: BookmarkForAnalysis[]
): Promise<DiscoveryResult> {
  // Try Gemini AI first
  if (isGeminiAvailable()) {
    const aiResult = await analyzeBookmarksForCategories(bookmarks);
    
    if (aiResult) {
      const categories = buildHierarchyFromSuggestions(aiResult.categories);
      return {
        categories,
        method: 'gemini',
        reasoning: aiResult.reasoning,
        totalBookmarks: bookmarks.length
      };
    }
  }

  // Fallback to local clustering
  const clusteredCategories = clusterBookmarks(bookmarks);
  
  return {
    categories: clusteredCategories,
    method: 'clustering',
    reasoning: 'Categories discovered using domain analysis, folder structure, and keyword clustering.',
    totalBookmarks: bookmarks.length
  };
}

/**
 * Convert flat suggestions to hierarchical structure
 */
function buildHierarchyFromSuggestions(
  suggestions: CategorySuggestion[]
): DiscoveredCategory[] {
  const categoryMap = new Map<string, DiscoveredCategory>();
  const rootCategories: DiscoveredCategory[] = [];

  // First pass: create all categories
  for (const suggestion of suggestions) {
    const category: DiscoveredCategory = {
      id: generateId(),
      name: suggestion.name,
      slug: slugify(suggestion.name),
      description: suggestion.description,
      keywords: suggestion.keywords,
      parentName: suggestion.parentName || undefined,
      estimatedCount: suggestion.estimatedCount,
      level: 0,
      children: []
    };
    categoryMap.set(suggestion.name, category);
  }

  // Second pass: build hierarchy
  for (const [, category] of categoryMap) {
    if (category.parentName && categoryMap.has(category.parentName)) {
      const parent = categoryMap.get(category.parentName)!;
      category.parentId = parent.id;
      category.level = parent.level + 1;
      parent.children.push(category);
    } else {
      rootCategories.push(category);
    }
  }

  // Validate max depth (4 levels)
  flattenIfTooDeep(rootCategories, 4);

  return rootCategories;
}

/**
 * Flatten categories that exceed max depth
 */
function flattenIfTooDeep(categories: DiscoveredCategory[], maxDepth: number, currentDepth = 0): void {
  for (const category of categories) {
    category.level = currentDepth;
    
    if (currentDepth >= maxDepth - 1 && category.children.length > 0) {
      // Move grandchildren to children level
      const grandchildren: DiscoveredCategory[] = [];
      for (const child of category.children) {
        grandchildren.push(...child.children);
        child.children = [];
      }
      // Add grandchildren as direct children
      for (const gc of grandchildren) {
        gc.parentId = category.id;
        gc.parentName = category.name;
        gc.level = currentDepth + 1;
        category.children.push(gc);
      }
    }
    
    flattenIfTooDeep(category.children, maxDepth, currentDepth + 1);
  }
}

/**
 * Local clustering algorithm (fallback when Gemini unavailable)
 */
function clusterBookmarks(bookmarks: BookmarkForAnalysis[]): DiscoveredCategory[] {
  const domainClusters = new Map<string, BookmarkForAnalysis[]>();
  const folderClusters = new Map<string, BookmarkForAnalysis[]>();
  const keywordClusters = new Map<string, BookmarkForAnalysis[]>();

  // Cluster by domain category
  for (const bookmark of bookmarks) {
    const domainCategory = getDomainCategory(bookmark.url);
    if (!domainClusters.has(domainCategory)) {
      domainClusters.set(domainCategory, []);
    }
    domainClusters.get(domainCategory)!.push(bookmark);

    // Also cluster by folder
    if (bookmark.sourceFolder) {
      const folder = normalizeFolder(bookmark.sourceFolder);
      if (!folderClusters.has(folder)) {
        folderClusters.set(folder, []);
      }
      folderClusters.get(folder)!.push(bookmark);
    }

    // Extract keywords and cluster
    const keywords = extractKeywords(bookmark);
    for (const keyword of keywords) {
      if (!keywordClusters.has(keyword)) {
        keywordClusters.set(keyword, []);
      }
      keywordClusters.get(keyword)!.push(bookmark);
    }
  }

  // Build category hierarchy from clusters
  const categories: DiscoveredCategory[] = [];
  const usedBookmarks = new Set<string>();

  // Priority 1: Folder-based categories (user's original organization)
  const significantFolders = [...folderClusters.entries()]
    .filter(([, items]) => items.length >= 3)
    .sort((a, b) => b[1].length - a[1].length);

  for (const [folder, items] of significantFolders.slice(0, 15)) {
    const category = createCategoryFromCluster(folder, items, 'folder');
    categories.push(category);
    items.forEach(b => usedBookmarks.add(b.url));
  }

  // Priority 2: Domain-based categories
  const significantDomains = [...domainClusters.entries()]
    .filter(([name, items]) => items.length >= 5 && name !== 'Other')
    .sort((a, b) => b[1].length - a[1].length);

  for (const [domainCategory, items] of significantDomains.slice(0, 10)) {
    // Skip if most bookmarks already categorized
    const uncategorized = items.filter(b => !usedBookmarks.has(b.url));
    if (uncategorized.length < 3) continue;

    const existingCategory = categories.find(c => 
      c.name.toLowerCase().includes(domainCategory.toLowerCase()) ||
      domainCategory.toLowerCase().includes(c.name.toLowerCase())
    );

    if (existingCategory) {
      // Merge as subcategory
      const subCategory = createCategoryFromCluster(
        `${domainCategory} Links`,
        uncategorized,
        'domain'
      );
      subCategory.parentId = existingCategory.id;
      subCategory.parentName = existingCategory.name;
      subCategory.level = 1;
      existingCategory.children.push(subCategory);
    } else {
      const category = createCategoryFromCluster(domainCategory, uncategorized, 'domain');
      categories.push(category);
    }
    uncategorized.forEach(b => usedBookmarks.add(b.url));
  }

  // Priority 3: Keyword-based subcategories
  const significantKeywords = [...keywordClusters.entries()]
    .filter(([keyword, items]) => {
      const uncategorized = items.filter(b => !usedBookmarks.has(b.url));
      return uncategorized.length >= 5 && keyword.length > 3;
    })
    .sort((a, b) => b[1].length - a[1].length);

  for (const [keyword, items] of significantKeywords.slice(0, 8)) {
    const uncategorized = items.filter(b => !usedBookmarks.has(b.url));
    if (uncategorized.length < 3) continue;

    const category = createCategoryFromCluster(
      capitalizeWords(keyword),
      uncategorized,
      'keyword'
    );
    categories.push(category);
    uncategorized.forEach(b => usedBookmarks.add(b.url));
  }

  // Create "Uncategorized" for remaining bookmarks
  const remaining = bookmarks.filter(b => !usedBookmarks.has(b.url));
  if (remaining.length > 0) {
    categories.push({
      id: generateId(),
      name: 'Uncategorized',
      slug: 'uncategorized',
      description: 'Bookmarks that could not be automatically categorized',
      keywords: [],
      estimatedCount: remaining.length,
      level: 0,
      children: []
    });
  }

  return categories;
}

/**
 * Create a category from a cluster of bookmarks
 */
function createCategoryFromCluster(
  name: string,
  bookmarks: BookmarkForAnalysis[],
  source: 'folder' | 'domain' | 'keyword'
): DiscoveredCategory {
  // Extract common keywords from the cluster
  const keywordCounts = new Map<string, number>();
  for (const bookmark of bookmarks) {
    const keywords = extractKeywords(bookmark);
    for (const keyword of keywords) {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    }
  }

  const topKeywords = [...keywordCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword]) => keyword);

  // Generate description
  const domains = [...new Set(bookmarks.map(b => extractDomain(b.url)))].slice(0, 5);
  const description = source === 'folder'
    ? `Bookmarks from your "${name}" folder`
    : source === 'domain'
    ? `${name}-related bookmarks from ${domains.join(', ')}`
    : `Bookmarks related to ${name.toLowerCase()}`;

  return {
    id: generateId(),
    name: cleanCategoryName(name),
    slug: slugify(name),
    description,
    keywords: topKeywords,
    estimatedCount: bookmarks.length,
    level: 0,
    children: []
  };
}

/**
 * Domain to category mapping
 */
const DOMAIN_CATEGORIES: Record<string, string> = {
  'github.com': 'Development',
  'gitlab.com': 'Development',
  'bitbucket.org': 'Development',
  'stackoverflow.com': 'Development',
  'dev.to': 'Development',
  'medium.com': 'Reading',
  'substack.com': 'Reading',
  'news.ycombinator.com': 'Tech News',
  'reddit.com': 'Social',
  'twitter.com': 'Social',
  'x.com': 'Social',
  'linkedin.com': 'Professional',
  'youtube.com': 'Video',
  'vimeo.com': 'Video',
  'spotify.com': 'Music',
  'soundcloud.com': 'Music',
  'amazon.com': 'Shopping',
  'ebay.com': 'Shopping',
  'google.com': 'Google Services',
  'docs.google.com': 'Google Docs',
  'drive.google.com': 'Google Drive',
  'notion.so': 'Productivity',
  'trello.com': 'Productivity',
  'asana.com': 'Productivity',
  'figma.com': 'Design',
  'dribbble.com': 'Design',
  'behance.net': 'Design',
  'coursera.org': 'Learning',
  'udemy.com': 'Learning',
  'edx.org': 'Learning',
  'aws.amazon.com': 'Cloud',
  'azure.microsoft.com': 'Cloud',
  'cloud.google.com': 'Cloud',
  'vercel.com': 'Hosting',
  'netlify.com': 'Hosting',
  'heroku.com': 'Hosting',
  'npmjs.com': 'Packages',
  'pypi.org': 'Packages',
  'arxiv.org': 'Research',
  'scholar.google.com': 'Research',
  'wikipedia.org': 'Reference',
};

function getDomainCategory(url: string): string {
  const domain = extractDomain(url);
  
  // Check exact match
  if (DOMAIN_CATEGORIES[domain]) {
    return DOMAIN_CATEGORIES[domain];
  }

  // Check subdomain matches
  for (const [key, category] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domain.endsWith(key) || domain.includes(key.split('.')[0])) {
      return category;
    }
  }

  // Infer from domain name
  if (domain.includes('blog')) return 'Blogs';
  if (domain.includes('news')) return 'News';
  if (domain.includes('docs')) return 'Documentation';
  if (domain.includes('api')) return 'API Reference';
  if (domain.includes('shop') || domain.includes('store')) return 'Shopping';
  if (domain.includes('learn') || domain.includes('edu')) return 'Learning';
  if (domain.includes('health') || domain.includes('medical')) return 'Health';
  if (domain.includes('finance') || domain.includes('bank')) return 'Finance';
  if (domain.includes('travel')) return 'Travel';
  if (domain.includes('food') || domain.includes('recipe')) return 'Food';
  if (domain.includes('game') || domain.includes('gaming')) return 'Gaming';

  return 'Other';
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

function normalizeFolder(folder: string): string {
  // Clean up folder path
  return folder
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .pop() || folder;
}

function extractKeywords(bookmark: BookmarkForAnalysis): string[] {
  const text = `${bookmark.title} ${bookmark.description || ''}`.toLowerCase();
  
  // Extract words, filter common ones
  const words = text
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !COMMON_WORDS.has(w));

  return [...new Set(words)].slice(0, 10);
}

const COMMON_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'been',
  'are', 'was', 'were', 'will', 'would', 'could', 'should', 'being',
  'your', 'more', 'about', 'which', 'when', 'what', 'where', 'who',
  'how', 'why', 'than', 'then', 'just', 'also', 'only', 'very',
  'most', 'some', 'such', 'much', 'many', 'any', 'all', 'each',
  'both', 'few', 'other', 'new', 'old', 'best', 'first', 'last',
  'long', 'great', 'little', 'own', 'same', 'right', 'big', 'high',
  'different', 'small', 'large', 'next', 'early', 'young', 'important',
  'public', 'good', 'made', 'possible', 'home', 'page', 'site', 'website',
  'click', 'here', 'read', 'view', 'open', 'free', 'online', 'official'
]);

function cleanCategoryName(name: string): string {
  return name
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Re-export types
export type { CategorySuggestion, HierarchySuggestion };
