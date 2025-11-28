import { ScrapedMetadata } from './metadataScraper';
import { guessCategoryNameFromBookmark, CATEGORY_KEYWORDS } from './categorization';
import { 
  processBookmarkText, 
  getDomainHints,
  STOP_WORDS 
} from './textProcessor';

export interface AIAnalysis {
  keywords: string[];
  summary: string;
  suggestedCategory: string;
  confidence?: number;
  cleanedKeywords?: string[];  // Keywords after stop word removal
  domainHints?: string[];      // Hints from URL structure
}

// Re-export STOP_WORDS for backward compatibility
export { STOP_WORDS };

export async function analyzeBookmark(
  url: string,
  title: string,
  description: string | undefined,
  scraped: ScrapedMetadata | null
): Promise<AIAnalysis | null> {
  try {
    // 1. Process bookmark text with semantic extraction
    const processed = processBookmarkText(url, title, description, {
      metaTitle: scraped?.metaTitle,
      metaDescription: scraped?.metaDescription,
      ogTitle: scraped?.ogTitle,
      ogDescription: scraped?.ogDescription,
      bodyText: scraped?.bodyText
    });

    // 2. Generate Summary with better content extraction
    let summary = scraped?.ogDescription || scraped?.metaDescription || description || "";
    if (!summary && scraped?.bodyText) {
      // Extract meaningful content from body text
      const bodyText = scraped.bodyText;
      const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 20);
      summary = sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '...' : '');
    }

    // 3. Get domain hints from URL structure
    const domainHints = getDomainHints(url);

    // 4. Combine keywords from various sources
    const combinedKeywords = [
      ...processed.keywords,
      ...processed.urlKeywords
    ];
    
    // Deduplicate and limit
    const uniqueKeywords = [...new Set(combinedKeywords)].slice(0, 15);

    // 5. Intelligent Category Suggestion with enhanced semantic understanding
    const suggestedCategory = guessCategoryNameFromBookmark({
      url,
      title: processed.cleanedTitle || title,
      description: processed.cleanedDescription || summary,
      keywords: uniqueKeywords
    });

    // 6. Add confidence scoring for category suggestions
    const categoryConfidence = calculateCategoryConfidence(
      url, 
      title, 
      description, 
      uniqueKeywords, 
      suggestedCategory,
      domainHints
    );

    return {
      keywords: uniqueKeywords,
      summary,
      suggestedCategory,
      confidence: categoryConfidence,
      cleanedKeywords: processed.keywords,
      domainHints
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
  category: string,
  domainHints: string[] = []
): number {
  const text = `${title} ${url} ${description || ""} ${keywords.join(" ")}`.toLowerCase();
  let confidence = 0;

  // URL domain matching gives high confidence
  const domain = extractDomain(url);
  const highConfidenceDomains: Record<string, string[]> = {
    'github.com': ['Web Development', 'AI & Machine Learning', 'Programming Tools'],
    'gitlab.com': ['Web Development', 'Programming Tools'],
    'bitbucket.org': ['Web Development', 'Programming Tools'],
    'youtube.com': ['Video Streaming'],
    'spotify.com': ['Music & Audio'],
    'netflix.com': ['Video Streaming'],
    'coursera.org': ['Online Courses', 'Education & Learning'],
    'udemy.com': ['Online Courses', 'Education & Learning'],
    'figma.com': ['UI/UX Design'],
    'dribbble.com': ['UI/UX Design', 'Graphic Design'],
    'behance.net': ['Graphic Design', 'Design & Creative'],
    'notion.so': ['Productivity Tools'],
    'amazon.com': ['E-commerce', 'Shopping & Commerce'],
    'reddit.com': ['Content Creation', 'Entertainment & Media'],
    'twitter.com': ['Content Creation', 'Entertainment & Media'],
    'linkedin.com': ['Business & Productivity', 'Communication'],
    'medium.com': ['Content Creation', 'News & Information'],
    'stackoverflow.com': ['Programming Tutorials', 'Web Development'],
    'aws.amazon.com': ['Cloud & DevOps'],
    'azure.microsoft.com': ['Cloud & DevOps'],
    'cloud.google.com': ['Cloud & DevOps'],
    'novartis.com': ['Pharmaceutical Companies', 'Healthcare & Pharma'],
    'pfizer.com': ['Pharmaceutical Companies', 'Healthcare & Pharma'],
    'webmd.com': ['Health & Fitness'],
    'mayoclinic.org': ['Healthcare Providers', 'Health & Fitness']
  };

  if (domain && highConfidenceDomains[domain]?.includes(category)) {
    confidence += 80;
  }

  // Domain hints boost confidence
  const categoryHintMap: Record<string, string[]> = {
    'development': ['Web Development', 'Mobile Development', 'Programming Tools'],
    'programming': ['Web Development', 'Programming Tutorials', 'Technology & Development'],
    'documentation': ['Web Development', 'Programming Tutorials'],
    'blog': ['Content Creation', 'News & Information'],
    'news': ['General News', 'Technology News', 'News & Information'],
    'shopping': ['E-commerce', 'Shopping & Commerce', 'Deals & Discounts'],
    'education': ['Online Courses', 'Education & Learning', 'Programming Tutorials'],
    'gaming': ['Gaming', 'Entertainment & Media'],
    'music': ['Music & Audio', 'Entertainment & Media'],
    'video': ['Video Streaming', 'Video & Animation'],
    'healthcare': ['Healthcare & Pharma', 'Health & Fitness', 'Pharmaceutical Companies'],
    'finance': ['Personal Finance', 'Business & Productivity'],
    'travel': ['Travel & Leisure', 'Personal & Lifestyle'],
    'food': ['Food & Cooking', 'Personal & Lifestyle'],
    'design': ['UI/UX Design', 'Graphic Design', 'Design & Creative'],
    'cloud': ['Cloud & DevOps', 'Technology & Development']
  };

  for (const hint of domainHints) {
    if (categoryHintMap[hint]?.includes(category)) {
      confidence += 25;
    }
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

  // Extracted keywords matching category keywords boost confidence
  for (const extractedKeyword of keywords) {
    if (categoryKeywords.some(ck => ck.toLowerCase().includes(extractedKeyword.toLowerCase()))) {
      confidence += 10;
    }
  }

  // Title relevance adds confidence
  const categoryFirstWord = category.toLowerCase().split(' ')[0];
  if (title.toLowerCase().includes(categoryFirstWord) || 
      keywords.some(k => k.toLowerCase().includes(categoryFirstWord))) {
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