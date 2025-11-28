/**
 * API Route: /api/categories/merge
 * 
 * Merge two categories together.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export interface MergeRequest {
  sourceId: string;  // Category to merge from (will be deleted)
  targetId: string;  // Category to merge into (will be kept)
}

export interface MergeResponse {
  success: boolean;
  error?: string;
  mergedBookmarks: number;
  mergedKeywords: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse<MergeResponse>> {
  try {
    const body = await request.json() as MergeRequest;
    
    if (!body.sourceId || !body.targetId) {
      return NextResponse.json({
        success: false,
        error: 'Both sourceId and targetId are required',
        mergedBookmarks: 0,
        mergedKeywords: []
      }, { status: 400 });
    }

    if (body.sourceId === body.targetId) {
      return NextResponse.json({
        success: false,
        error: 'Cannot merge a category with itself',
        mergedBookmarks: 0,
        mergedKeywords: []
      }, { status: 400 });
    }

    // Get source and target categories
    const [source, target] = await Promise.all([
      prisma.category.findUnique({
        where: { id: body.sourceId },
        include: { bookmarks: true, children: true }
      }),
      prisma.category.findUnique({
        where: { id: body.targetId }
      })
    ]);

    if (!source) {
      return NextResponse.json({
        success: false,
        error: 'Source category not found',
        mergedBookmarks: 0,
        mergedKeywords: []
      }, { status: 404 });
    }

    if (!target) {
      return NextResponse.json({
        success: false,
        error: 'Target category not found',
        mergedBookmarks: 0,
        mergedKeywords: []
      }, { status: 404 });
    }

    // Merge keywords
    const sourceKeywords: string[] = source.keywords ? JSON.parse(source.keywords) : [];
    const targetKeywords: string[] = target.keywords ? JSON.parse(target.keywords) : [];
    const mergedKeywords = [...new Set([...targetKeywords, ...sourceKeywords])];

    // Move all bookmarks from source to target
    const movedBookmarks = await prisma.bookmark.updateMany({
      where: { categoryId: body.sourceId },
      data: { categoryId: body.targetId }
    });

    // Move all child categories from source to target
    await prisma.category.updateMany({
      where: { parentId: body.sourceId },
      data: { parentId: body.targetId }
    });

    // Update target with merged keywords
    await prisma.category.update({
      where: { id: body.targetId },
      data: { keywords: JSON.stringify(mergedKeywords) }
    });

    // Delete source category
    await prisma.category.delete({
      where: { id: body.sourceId }
    });

    return NextResponse.json({
      success: true,
      mergedBookmarks: movedBookmarks.count,
      mergedKeywords
    });
  } catch (error) {
    console.error('Error merging categories:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      mergedBookmarks: 0,
      mergedKeywords: []
    }, { status: 500 });
  }
}
