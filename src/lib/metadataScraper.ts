import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedMetadata {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  bodyText?: string;
}

export async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarkImporter/1.0)',
      },
      maxRedirects: 5,
    });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

export async function scrapeMetadata(url: string): Promise<ScrapedMetadata | null> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarkImporter/1.0)',
      },
    });

    const $ = cheerio.load(response.data);

    // Remove scripts, styles, and other non-content elements
    $('script, style, nav, footer, header, aside, noscript, iframe, svg').remove();

    // Extract clean body text
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000); // Limit to 5k chars

    return {
      metaTitle: $('title').text().trim() || undefined,
      metaDescription: $('meta[name="description"]').attr('content')?.trim(),
      ogTitle: $('meta[property="og:title"]').attr('content')?.trim(),
      ogDescription: $('meta[property="og:description"]').attr('content')?.trim(),
      ogImage: $('meta[property="og:image"]').attr('content')?.trim(),
      bodyText: bodyText || undefined,
    };
  } catch (error) {
    console.warn(`Failed to scrape ${url}:`, (error as Error).message);
    return null;
  }
}
