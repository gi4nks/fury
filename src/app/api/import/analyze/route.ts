/**
 * API Route: /api/import/analyze
 * 
 * Analyzes uploaded bookmarks and suggests a category hierarchy.
 * Uses Gemini AI when available, falls back to local clustering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseBookmarksFromHtml, ParsedBookmark } from '@/lib/bookmarkParser';
import { discoverCategories, DiscoveryResult } from '@/lib/categoryDiscovery';
import { validateHierarchy, getHierarchyStats } from '@/lib/hierarchyBuilder';

export interface AnalyzeRequest {
  bookmarksHtml?: string;
  bookmarks?: Array<{
    url: string;
    title: string;
    description?: string;
    sourceFolder?: string;
  }>;
}

export interface AnalyzeResponse {
  success: boolean;
  error?: string;
  result?: {
    discoveryResult: DiscoveryResult;
    validation: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
    stats: {
      totalCategories: number;
      maxDepth: number;
      categoriesPerLevel: number[];
      totalKeywords: number;
      totalEstimatedBookmarks: number;
    };
    bookmarkCount: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body = await request.json() as AnalyzeRequest;
    
    let bookmarks: ParsedBookmark[];
    
    // Parse bookmarks from HTML or use provided array
    if (body.bookmarksHtml) {
      bookmarks = parseBookmarksFromHtml(body.bookmarksHtml);
    } else if (body.bookmarks && body.bookmarks.length > 0) {
      bookmarks = body.bookmarks.map(b => ({
        url: b.url,
        title: b.title,
        description: b.description,
        sourceFolder: b.sourceFolder,
        addDate: new Date()
      }));
    } else {
      return NextResponse.json({
        success: false,
        error: 'No bookmarks provided. Send either bookmarksHtml or bookmarks array.'
      }, { status: 400 });
    }

    if (bookmarks.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid bookmarks found in the provided data.'
      }, { status: 400 });
    }

    // Discover categories
    const discoveryResult = await discoverCategories(
      bookmarks.map(b => ({
        url: b.url,
        title: b.title,
        description: b.description,
        sourceFolder: b.sourceFolder
      }))
    );

    // Validate the hierarchy
    const validation = validateHierarchy(discoveryResult.categories);

    // Get stats
    const stats = getHierarchyStats(discoveryResult.categories);

    return NextResponse.json({
      success: true,
      result: {
        discoveryResult,
        validation,
        stats,
        bookmarkCount: bookmarks.length
      }
    });
  } catch (error) {
    console.error('Error analyzing bookmarks:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
