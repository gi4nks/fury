/**
 * Keyword Generator Module
 * 
 * Generates and manages keywords for category matching.
 * Uses Gemini AI when available, falls back to TF-IDF-like extraction.
 */

import { generateCategoryKeywords, isGeminiAvailable } from './geminiClient';
import { DiscoveredCategory } from './categoryDiscovery';
import { STOP_WORDS } from './textProcessor';

export interface KeywordGenerationResult {
  categoryId: string;
  categoryName: string;
  keywords: string[];
  source: 'gemini' | 'extraction';
}

export interface BookmarkForKeywords {
  url: string;
  title: string;
  description?: string;
}

/**
 * Generate keywords for a single category based on its bookmarks
 */
export async function generateKeywordsForCategory(
  category: DiscoveredCategory,
  bookmarks: BookmarkForKeywords[]
): Promise<KeywordGenerationResult> {
  // Try Gemini first
  if (isGeminiAvailable() && bookmarks.length > 0) {
    const aiKeywords = await generateCategoryKeywords(category.name, bookmarks);
    if (aiKeywords && aiKeywords.length > 0) {
      return {
        categoryId: category.id,
        categoryName: category.name,
        keywords: deduplicateKeywords([...category.keywords, ...aiKeywords]),
        source: 'gemini'
      };
    }
  }

  // Fallback to extraction
  const extractedKeywords = extractKeywordsFromBookmarks(bookmarks, category.name);
  
  return {
    categoryId: category.id,
    categoryName: category.name,
    keywords: deduplicateKeywords([...category.keywords, ...extractedKeywords]),
    source: 'extraction'
  };
}

/**
 * Generate keywords for all categories
 */
export async function generateKeywordsForAllCategories(
  categories: DiscoveredCategory[],
  bookmarksByCategory: Map<string, BookmarkForKeywords[]>
): Promise<KeywordGenerationResult[]> {
  const results: KeywordGenerationResult[] = [];
  
  // Process categories sequentially to avoid rate limiting
  for (const category of flattenCategories(categories)) {
    const bookmarks = bookmarksByCategory.get(category.id) || [];
    const result = await generateKeywordsForCategory(category, bookmarks);
    results.push(result);
    
    // Small delay to avoid rate limiting if using Gemini
    if (isGeminiAvailable()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Extract keywords from bookmarks using TF-IDF-like approach
 */
function extractKeywordsFromBookmarks(
  bookmarks: BookmarkForKeywords[],
  categoryName: string
): string[] {
  const wordFrequency = new Map<string, number>();
  const documentFrequency = new Map<string, number>();
  
  // Count word frequencies
  for (const bookmark of bookmarks) {
    const text = `${bookmark.title} ${bookmark.description || ''} ${extractDomain(bookmark.url)}`;
    const words = tokenize(text);
    const seenInDoc = new Set<string>();
    
    for (const word of words) {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      
      if (!seenInDoc.has(word)) {
        documentFrequency.set(word, (documentFrequency.get(word) || 0) + 1);
        seenInDoc.add(word);
      }
    }
  }

  // Calculate TF-IDF-like scores
  const scores: Array<[string, number]> = [];
  const totalDocs = bookmarks.length;
  
  for (const [word, tf] of wordFrequency) {
    const df = documentFrequency.get(word) || 1;
    // Modified IDF: prefer words that appear in multiple documents but not all
    const idf = Math.log((totalDocs + 1) / (df + 1));
    const relevance = tf * idf;
    
    // Boost if word appears in category name
    const categoryBoost = categoryName.toLowerCase().includes(word) ? 2 : 1;
    
    scores.push([word, relevance * categoryBoost]);
  }

  // Sort by score and take top keywords
  scores.sort((a, b) => b[1] - a[1]);
  
  // Extract bigrams from top scoring words
  const topWords = new Set(scores.slice(0, 30).map(([word]) => word));
  const bigrams = extractBigrams(bookmarks, topWords);
  
  // Combine single words and bigrams
  const keywords = [
    ...scores.slice(0, 15).map(([word]) => word),
    ...bigrams.slice(0, 10)
  ];

  return deduplicateKeywords(keywords);
}

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => {
      return word.length > 2 && 
             word.length < 30 &&
             !STOP_WORDS.has(word) &&
             !/^\d+$/.test(word);
    });
}

/**
 * Extract meaningful bigrams (two-word phrases)
 */
function extractBigrams(
  bookmarks: BookmarkForKeywords[],
  relevantWords: Set<string>
): string[] {
  const bigramCounts = new Map<string, number>();
  
  for (const bookmark of bookmarks) {
    const text = `${bookmark.title} ${bookmark.description || ''}`;
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < words.length - 1; i++) {
      const w1 = words[i].replace(/[^a-z0-9]/g, '');
      const w2 = words[i + 1].replace(/[^a-z0-9]/g, '');
      
      if (w1.length > 2 && w2.length > 2 &&
          (relevantWords.has(w1) || relevantWords.has(w2)) &&
          !STOP_WORDS.has(w1) && !STOP_WORDS.has(w2)) {
        const bigram = `${w1} ${w2}`;
        bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
      }
    }
  }

  // Return bigrams that appear multiple times
  return [...bigramCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([bigram]) => bigram);
}

/**
 * Deduplicate and clean keywords
 */
function deduplicateKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const keyword of keywords) {
    const normalized = keyword.toLowerCase().trim();
    if (normalized && !seen.has(normalized) && normalized.length > 2) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  
  return result.slice(0, 25); // Limit to 25 keywords per category
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '').replace(/\./g, ' ');
  } catch {
    return '';
  }
}

/**
 * Flatten categories hierarchy
 */
function flattenCategories(categories: DiscoveredCategory[]): DiscoveredCategory[] {
  const result: DiscoveredCategory[] = [];
  
  function flatten(category: DiscoveredCategory): void {
    result.push(category);
    for (const child of category.children) {
      flatten(child);
    }
  }
  
  for (const category of categories) {
    flatten(category);
  }
  
  return result;
}

/**
 * Suggest keyword improvements based on analysis
 */
export function suggestKeywordImprovements(
  category: DiscoveredCategory,
  matchingBookmarks: BookmarkForKeywords[],
  nonMatchingBookmarks: BookmarkForKeywords[]
): {
  addKeywords: string[];
  removeKeywords: string[];
  reasoning: string;
} {
  // Find words common in matching but not in current keywords
  const matchingWords = extractCommonWords(matchingBookmarks);
  const nonMatchingWords = extractCommonWords(nonMatchingBookmarks);
  const currentKeywords = new Set(category.keywords.map(k => k.toLowerCase()));
  
  // Keywords to add: common in matching, not in non-matching, not already present
  const addKeywords: string[] = [];
  for (const [word, count] of matchingWords) {
    if (count >= 2 && 
        !currentKeywords.has(word) &&
        (!nonMatchingWords.has(word) || nonMatchingWords.get(word)! < count / 2)) {
      addKeywords.push(word);
    }
  }

  // Keywords to remove: common in non-matching but rare in matching
  const removeKeywords: string[] = [];
  for (const keyword of category.keywords) {
    const matchCount = matchingWords.get(keyword.toLowerCase()) || 0;
    const nonMatchCount = nonMatchingWords.get(keyword.toLowerCase()) || 0;
    
    if (nonMatchCount > matchCount * 2 && matchCount < 3) {
      removeKeywords.push(keyword);
    }
  }

  return {
    addKeywords: addKeywords.slice(0, 10),
    removeKeywords: removeKeywords.slice(0, 5),
    reasoning: `Based on analysis of ${matchingBookmarks.length} matching and ${nonMatchingBookmarks.length} non-matching bookmarks`
  };
}

/**
 * Extract common words from bookmarks
 */
function extractCommonWords(bookmarks: BookmarkForKeywords[]): Map<string, number> {
  const wordCounts = new Map<string, number>();
  
  for (const bookmark of bookmarks) {
    const text = `${bookmark.title} ${bookmark.description || ''}`;
    const words = tokenize(text);
    
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }
  
  return wordCounts;
}

/**
 * Score how well keywords match a set of bookmarks
 */
export function scoreKeywordMatch(
  keywords: string[],
  bookmarks: BookmarkForKeywords[]
): {
  matchRate: number;
  avgMatchScore: number;
  unmatchedCount: number;
} {
  let totalMatches = 0;
  const matchScores: number[] = [];
  
  for (const bookmark of bookmarks) {
    const text = `${bookmark.title} ${bookmark.url} ${bookmark.description || ''}`.toLowerCase();
    let matchScore = 0;
    
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matchScore++;
      }
    }
    
    matchScores.push(matchScore);
    if (matchScore > 0) {
      totalMatches++;
    }
  }

  const avgMatchScore = matchScores.length > 0
    ? matchScores.reduce((a, b) => a + b, 0) / matchScores.length
    : 0;

  return {
    matchRate: bookmarks.length > 0 ? totalMatches / bookmarks.length : 0,
    avgMatchScore,
    unmatchedCount: bookmarks.length - totalMatches
  };
}
