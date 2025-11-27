import { ScrapedMetadata } from './metadataScraper';
import { guessCategoryNameFromBookmark, CATEGORY_KEYWORDS } from './categorization';

export interface AIAnalysis {
  keywords: string[];
  summary: string;
  suggestedCategory: string;
  confidence?: number;
}

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
]);

function extractKeywords(text: string, count: number = 8): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const frequency: Record<string, number> = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

export async function analyzeBookmark(
  url: string,
  title: string,
  description: string | undefined,
  scraped: ScrapedMetadata | null
): Promise<AIAnalysis | null> {
  try {
    // 1. Generate Summary with better content extraction
    let summary = scraped?.ogDescription || scraped?.metaDescription || description || "";
    if (!summary && scraped?.bodyText) {
      // Extract meaningful content from body text
      const bodyText = scraped.bodyText;
      const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 20);
      summary = sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '...' : '');
    }

    // 2. Enhanced Keyword Extraction
    const textForKeywords = [
      title,
      description,
      scraped?.metaTitle,
      scraped?.metaDescription,
      scraped?.ogTitle,
      scraped?.ogDescription,
      scraped?.bodyText?.substring(0, 1000) // Limit body text for performance
    ].filter(Boolean).join(' ');

    const keywords = extractKeywords(textForKeywords, 10);

    // 3. Intelligent Category Suggestion with URL analysis
    const suggestedCategory = guessCategoryNameFromBookmark({
      url,
      title,
      description: summary,
      keywords
    });

    // 4. Add confidence scoring for category suggestions
    const categoryConfidence = calculateCategoryConfidence(url, title, description, keywords, suggestedCategory);

    return {
      keywords,
      summary,
      suggestedCategory,
      confidence: categoryConfidence
    };
  } catch (error) {
    console.warn(`Local analysis failed for ${url}:`, (error as Error).message);
    return null;
  }
}

// Calculate confidence score for category suggestion
function calculateCategoryConfidence(
  url: string,
  title: string,
  description: string | undefined,
  keywords: string[],
  category: string
): number {
  const text = `${title} ${url} ${description || ""} ${keywords.join(" ")}`.toLowerCase();
  let confidence = 0;

  // URL domain matching gives high confidence
  const domain = extractDomain(url);
  const highConfidenceDomains: Record<string, string[]> = {
    'github.com': ['Web Development', 'AI & Machine Learning'],
    'youtube.com': ['Video Streaming'],
    'spotify.com': ['Music'],
    'netflix.com': ['Video Streaming'],
    'coursera.org': ['Education'],
    'udemy.com': ['Education'],
    'figma.com': ['UI/UX Design'],
    'dribbble.com': ['UI/UX Design', 'Graphic Design'],
    'notion.so': ['Productivity'],
    'amazon.com': ['Shopping'],
    'reddit.com': ['Social'],
    'twitter.com': ['Social']
  };

  if (domain && highConfidenceDomains[domain]?.includes(category)) {
    confidence += 80;
  }

  // Keyword matches add confidence
  const categoryKeywords = getCategoryKeywords(category);
  let keywordMatches = 0;
  for (const keyword of categoryKeywords) {
    if (text.includes(keyword.toLowerCase())) {
      keywordMatches++;
    }
  }

  if (keywordMatches > 0) {
    confidence += Math.min(keywordMatches * 15, 60); // Cap at 60 for keywords
  }

  // Title relevance adds confidence
  if (title.toLowerCase().includes(category.toLowerCase().split(' ')[0])) {
    confidence += 20;
  }

  return Math.min(confidence, 100);
}

// Helper function to get keywords for a category
function getCategoryKeywords(categoryName: string): string[] {
  const category = CATEGORY_KEYWORDS.find(c => c.name === categoryName);
  return category?.keywords || [];
}

// Helper function to extract domain
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return null;
  }
}