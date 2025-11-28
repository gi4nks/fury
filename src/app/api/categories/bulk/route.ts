/**
 * API Route: /api/categories/bulk
 * 
 * Bulk create/update categories with keywords.
 * Used when applying custom category hierarchies.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { DiscoveredCategory } from '@/lib/categoryDiscovery';
import { flattenHierarchy } from '@/lib/hierarchyBuilder';

export interface BulkCategoryInput {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  keywords: string[];
  parentId?: string;
  parentName?: string;
  level: number;
}

export interface BulkCreateRequest {
  categories: DiscoveredCategory[];
  replaceExisting?: boolean;
  saveAsTemplate?: boolean;
  templateName?: string;
}

export interface BulkCreateResponse {
  success: boolean;
  error?: string;
  created: number;
  updated: number;
  categoryMap: Record<string, string>; // temp ID -> real ID
}

export async function POST(request: NextRequest): Promise<NextResponse<BulkCreateResponse>> {
  try {
    const body = await request.json() as BulkCreateRequest;
    
    if (!body.categories || body.categories.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No categories provided',
        created: 0,
        updated: 0,
        categoryMap: {}
      }, { status: 400 });
    }

    // Flatten hierarchy for processing
    const flatCategories = flattenHierarchy(body.categories);
    
    // Map to track temp IDs to real IDs
    const categoryMap: Record<string, string> = {};
    let created = 0;
    let updated = 0;

    // If replacing existing, clear current categories (but keep bookmarks)
    if (body.replaceExisting) {
      // First, unlink all bookmarks from categories
      await prisma.bookmark.updateMany({
        where: { categoryId: { not: null } },
        data: { categoryId: null }
      });
      
      // Delete all categories
      await prisma.category.deleteMany({});
    }

    // Process categories in order (parents first)
    const sortedCategories = flatCategories.sort((a, b) => a.level - b.level);
    
    for (const cat of sortedCategories) {
      // Resolve parent ID if exists
      let resolvedParentId: string | null = null;
      if (cat.parentId && categoryMap[cat.parentId]) {
        resolvedParentId = categoryMap[cat.parentId];
      }

      // Check if category exists by slug
      const existing = await prisma.category.findUnique({
        where: { slug: cat.slug }
      });

      if (existing) {
        // Update existing
        await prisma.category.update({
          where: { id: existing.id },
          data: {
            name: cat.name,
            description: cat.description,
            keywords: JSON.stringify(cat.keywords),
            parentId: resolvedParentId
          }
        });
        categoryMap[cat.id] = existing.id;
        updated++;
      } else {
        // Create new
        const newCategory = await prisma.category.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            keywords: JSON.stringify(cat.keywords),
            parentId: resolvedParentId
          }
        });
        categoryMap[cat.id] = newCategory.id;
        created++;
      }
    }

    // Save as template if requested
    if (body.saveAsTemplate && body.templateName) {
      await saveAsTemplate(body.categories, body.templateName);
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      categoryMap
    });
  } catch (error) {
    console.error('Error in bulk category operation:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      created: 0,
      updated: 0,
      categoryMap: {}
    }, { status: 500 });
  }
}

/**
 * Save category hierarchy as a reusable template
 */
async function saveAsTemplate(
  categories: DiscoveredCategory[],
  templateName: string
): Promise<void> {
  // Create template set
  const templateSet = await prisma.categoryTemplateSet.create({
    data: {
      name: templateName,
      description: `Custom category hierarchy created on ${new Date().toLocaleDateString()}`
    }
  });

  // Flatten for processing
  const flatCategories = flattenHierarchy(categories);
  const templateMap: Record<string, string> = {};

  // Create templates in order
  const sortedCategories = flatCategories.sort((a, b) => a.level - b.level);
  
  for (const cat of sortedCategories) {
    let resolvedParentId: string | null = null;
    if (cat.parentId && templateMap[cat.parentId]) {
      resolvedParentId = templateMap[cat.parentId];
    }

    const template = await prisma.categoryTemplate.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        keywords: JSON.stringify(cat.keywords),
        parentId: resolvedParentId,
        level: cat.level,
        isCustom: true,
        templateSetId: templateSet.id
      }
    });

    templateMap[cat.id] = template.id;
  }
}

/**
 * GET: List all saved category template sets
 */
export async function GET(): Promise<NextResponse> {
  try {
    const templateSets = await prisma.categoryTemplateSet.findMany({
      include: {
        categories: {
          orderBy: { level: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      templateSets
    });
  } catch (error) {
    console.error('Error fetching template sets:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
