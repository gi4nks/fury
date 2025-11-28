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
  // Skip validation for localhost, internal, and chrome extension URLs
  if (url.startsWith('chrome-extension://') ||
      url.includes('localhost') ||
      url.includes('127.0.0.1') ||
      url.includes('192.168.') ||
      url.includes('10.0.') ||
      url.includes('.local') ||
      url.includes('.corp.') ||
      url.includes('.internal')) {
    // Accept these URLs without validation - they're likely internal/dev resources
    return true;
  }

  try {
    // First try HEAD request (faster, less bandwidth)
    const headResponse = await axios.head(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Accept redirects and client errors
    });
    
    if (headResponse.status >= 200 && headResponse.status < 400) {
      return true;
    }
  } catch {
    // HEAD request failed, try GET as fallback
  }

  try {
    // Fallback to GET request - many sites don't support HEAD properly
    const getResponse = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      maxRedirects: 5,
      // Only fetch headers, abort after receiving response headers
      responseType: 'stream',
      validateStatus: (status) => status < 500,
    });
    
    // Abort the request body download since we only need to validate
    if (getResponse.data && typeof getResponse.data.destroy === 'function') {
      getResponse.data.destroy();
    }
    
    return getResponse.status >= 200 && getResponse.status < 400;
  } catch {
    return false;
  }
}

export async function scrapeMetadata(url: string): Promise<ScrapedMetadata | null> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      maxRedirects: 5,
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
