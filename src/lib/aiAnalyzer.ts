import { ScrapedMetadata } from './metadataScraper';
import { guessCategoryNameFromBookmark } from './categorization';

export interface AIAnalysis {
  keywords: string[];
  summary: string;
  suggestedCategory: string;
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
    // 1. Generate Summary
    let summary = scraped?.ogDescription || scraped?.metaDescription || description || "";
    if (!summary && scraped?.bodyText) {
      summary = scraped.bodyText.substring(0, 200).trim() + "...";
    }

    // 2. Extract Keywords
    const textForKeywords = [
      title,
      description,
      scraped?.metaTitle,
      scraped?.metaDescription,
      scraped?.ogTitle,
      scraped?.ogDescription,
      scraped?.bodyText
    ].filter(Boolean).join(' ');
    
    const keywords = extractKeywords(textForKeywords);

    // 3. Suggest Category
    const suggestedCategory = guessCategoryNameFromBookmark({
      url,
      title,
      description: summary,
      keywords
    });

    return {
      keywords,
      summary,
      suggestedCategory,
    };
  } catch (error) {
    console.warn(`Local analysis failed for ${url}:`, (error as Error).message);
    return null;
  }
}