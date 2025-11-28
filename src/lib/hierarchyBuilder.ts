/**
 * Hierarchy Builder Module
 * 
 * Builds, validates, and manipulates category hierarchies.
 * Enforces max depth of 4 levels and provides tree manipulation utilities.
 */

import { DiscoveredCategory } from './categoryDiscovery';

export const MAX_HIERARCHY_DEPTH = 4;

export interface HierarchyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FlatCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  keywords: string[];
  parentId?: string;
  level: number;
  estimatedCount: number;
}

/**
 * Validate a category hierarchy
 */
export function validateHierarchy(categories: DiscoveredCategory[]): HierarchyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const slugs = new Set<string>();
  const names = new Set<string>();

  function validateCategory(category: DiscoveredCategory, depth: number): void {
    // Check depth
    if (depth >= MAX_HIERARCHY_DEPTH) {
      errors.push(`Category "${category.name}" exceeds maximum depth of ${MAX_HIERARCHY_DEPTH}`);
    }

    // Check for duplicate slugs
    if (slugs.has(category.slug)) {
      errors.push(`Duplicate slug: "${category.slug}"`);
    }
    slugs.add(category.slug);

    // Check for duplicate names at same level
    const nameKey = `${depth}:${category.name.toLowerCase()}`;
    if (names.has(nameKey)) {
      warnings.push(`Duplicate category name at level ${depth}: "${category.name}"`);
    }
    names.add(nameKey);

    // Check for empty name
    if (!category.name.trim()) {
      errors.push('Category name cannot be empty');
    }

    // Check for very short names
    if (category.name.trim().length < 2) {
      warnings.push(`Category name "${category.name}" is very short`);
    }

    // Check keywords
    if (category.keywords.length === 0) {
      warnings.push(`Category "${category.name}" has no keywords`);
    }

    // Recursively validate children
    for (const child of category.children) {
      validateCategory(child, depth + 1);
    }
  }

  for (const category of categories) {
    validateCategory(category, 0);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Flatten hierarchy to array of categories with parent references
 */
export function flattenHierarchy(categories: DiscoveredCategory[]): FlatCategory[] {
  const result: FlatCategory[] = [];

  function flatten(category: DiscoveredCategory, parentId?: string): void {
    result.push({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      keywords: category.keywords,
      parentId: parentId,
      level: category.level,
      estimatedCount: category.estimatedCount
    });

    for (const child of category.children) {
      flatten(child, category.id);
    }
  }

  for (const category of categories) {
    flatten(category);
  }

  return result;
}

/**
 * Rebuild hierarchy from flat array
 */
export function buildHierarchyFromFlat(flatCategories: FlatCategory[]): DiscoveredCategory[] {
  const categoryMap = new Map<string, DiscoveredCategory>();
  const rootCategories: DiscoveredCategory[] = [];

  // First pass: create all categories
  for (const flat of flatCategories) {
    const category: DiscoveredCategory = {
      id: flat.id,
      name: flat.name,
      slug: flat.slug,
      description: flat.description,
      keywords: flat.keywords,
      parentId: flat.parentId,
      estimatedCount: flat.estimatedCount,
      level: flat.level,
      children: []
    };
    categoryMap.set(flat.id, category);
  }

  // Second pass: build hierarchy
  for (const flat of flatCategories) {
    const category = categoryMap.get(flat.id)!;
    if (flat.parentId && categoryMap.has(flat.parentId)) {
      const parent = categoryMap.get(flat.parentId)!;
      category.parentName = parent.name;
      parent.children.push(category);
    } else {
      rootCategories.push(category);
    }
  }

  // Update levels
  updateLevels(rootCategories, 0);

  return rootCategories;
}

/**
 * Update levels recursively
 */
function updateLevels(categories: DiscoveredCategory[], level: number): void {
  for (const category of categories) {
    category.level = level;
    updateLevels(category.children, level + 1);
  }
}

/**
 * Move a category to a new parent
 */
export function moveCategory(
  categories: DiscoveredCategory[],
  categoryId: string,
  newParentId: string | null
): DiscoveredCategory[] {
  const flat = flattenHierarchy(categories);
  
  // Find and update the category
  const category = flat.find(c => c.id === categoryId);
  if (!category) {
    throw new Error(`Category ${categoryId} not found`);
  }

  // Check if move would exceed max depth
  if (newParentId) {
    const newParent = flat.find(c => c.id === newParentId);
    if (newParent && newParent.level >= MAX_HIERARCHY_DEPTH - 1) {
      throw new Error(`Cannot move category: would exceed maximum depth of ${MAX_HIERARCHY_DEPTH}`);
    }
    
    // Check for circular reference
    let current: string | undefined = newParentId;
    while (current) {
      if (current === categoryId) {
        throw new Error('Cannot move category: would create circular reference');
      }
      const parent = flat.find(c => c.id === current);
      current = parent?.parentId;
    }
  }

  category.parentId = newParentId || undefined;
  
  return buildHierarchyFromFlat(flat);
}

/**
 * Merge two categories
 */
export function mergeCategories(
  categories: DiscoveredCategory[],
  sourceId: string,
  targetId: string
): DiscoveredCategory[] {
  const flat = flattenHierarchy(categories);
  
  const source = flat.find(c => c.id === sourceId);
  const target = flat.find(c => c.id === targetId);
  
  if (!source || !target) {
    throw new Error('Source or target category not found');
  }

  // Merge keywords
  target.keywords = [...new Set([...target.keywords, ...source.keywords])];
  
  // Merge estimated counts
  target.estimatedCount += source.estimatedCount;
  
  // Move source's children to target
  const sourceChildren = flat.filter(c => c.parentId === sourceId);
  for (const child of sourceChildren) {
    child.parentId = targetId;
  }
  
  // Remove source
  const filtered = flat.filter(c => c.id !== sourceId);
  
  return buildHierarchyFromFlat(filtered);
}

/**
 * Split a category into multiple categories
 */
export function splitCategory(
  categories: DiscoveredCategory[],
  categoryId: string,
  newCategories: Array<{ name: string; keywords: string[]; estimatedCount: number }>
): DiscoveredCategory[] {
  const flat = flattenHierarchy(categories);
  
  const original = flat.find(c => c.id === categoryId);
  if (!original) {
    throw new Error(`Category ${categoryId} not found`);
  }

  // Create new categories as children of the original's parent
  const newFlat: FlatCategory[] = newCategories.map((nc, idx) => ({
    id: `split_${Date.now()}_${idx}`,
    name: nc.name,
    slug: slugify(nc.name),
    description: `Split from ${original.name}`,
    keywords: nc.keywords,
    parentId: original.parentId,
    level: original.level,
    estimatedCount: nc.estimatedCount
  }));

  // Move original's children to first new category
  const originalChildren = flat.filter(c => c.parentId === categoryId);
  for (const child of originalChildren) {
    child.parentId = newFlat[0].id;
  }

  // Remove original and add new categories
  const filtered = flat.filter(c => c.id !== categoryId);
  
  return buildHierarchyFromFlat([...filtered, ...newFlat]);
}

/**
 * Add a new category
 */
export function addCategory(
  categories: DiscoveredCategory[],
  newCategory: {
    name: string;
    description?: string;
    keywords?: string[];
    parentId?: string;
  }
): DiscoveredCategory[] {
  const flat = flattenHierarchy(categories);
  
  // Check parent level
  if (newCategory.parentId) {
    const parent = flat.find(c => c.id === newCategory.parentId);
    if (parent && parent.level >= MAX_HIERARCHY_DEPTH - 1) {
      throw new Error(`Cannot add category: would exceed maximum depth of ${MAX_HIERARCHY_DEPTH}`);
    }
  }

  const category: FlatCategory = {
    id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: newCategory.name,
    slug: slugify(newCategory.name),
    description: newCategory.description || '',
    keywords: newCategory.keywords || [],
    parentId: newCategory.parentId,
    level: 0,
    estimatedCount: 0
  };

  return buildHierarchyFromFlat([...flat, category]);
}

/**
 * Remove a category (children become orphans at same level)
 */
export function removeCategory(
  categories: DiscoveredCategory[],
  categoryId: string,
  moveChildrenUp = true
): DiscoveredCategory[] {
  const flat = flattenHierarchy(categories);
  
  const toRemove = flat.find(c => c.id === categoryId);
  if (!toRemove) {
    throw new Error(`Category ${categoryId} not found`);
  }

  if (moveChildrenUp) {
    // Move children to removed category's parent
    const children = flat.filter(c => c.parentId === categoryId);
    for (const child of children) {
      child.parentId = toRemove.parentId;
    }
  } else {
    // Remove children recursively
    const toRemoveIds = new Set<string>();
    function collectChildren(id: string): void {
      toRemoveIds.add(id);
      const children = flat.filter(c => c.parentId === id);
      for (const child of children) {
        collectChildren(child.id);
      }
    }
    collectChildren(categoryId);
    
    return buildHierarchyFromFlat(flat.filter(c => !toRemoveIds.has(c.id)));
  }

  return buildHierarchyFromFlat(flat.filter(c => c.id !== categoryId));
}

/**
 * Update category properties
 */
export function updateCategory(
  categories: DiscoveredCategory[],
  categoryId: string,
  updates: Partial<{
    name: string;
    description: string;
    keywords: string[];
  }>
): DiscoveredCategory[] {
  const flat = flattenHierarchy(categories);
  
  const category = flat.find(c => c.id === categoryId);
  if (!category) {
    throw new Error(`Category ${categoryId} not found`);
  }

  if (updates.name !== undefined) {
    category.name = updates.name;
    category.slug = slugify(updates.name);
  }
  if (updates.description !== undefined) {
    category.description = updates.description;
  }
  if (updates.keywords !== undefined) {
    category.keywords = updates.keywords;
  }

  return buildHierarchyFromFlat(flat);
}

/**
 * Get category statistics
 */
export function getHierarchyStats(categories: DiscoveredCategory[]): {
  totalCategories: number;
  maxDepth: number;
  categoriesPerLevel: number[];
  totalKeywords: number;
  totalEstimatedBookmarks: number;
} {
  const flat = flattenHierarchy(categories);
  const categoriesPerLevel: number[] = [];
  let maxDepth = 0;
  let totalKeywords = 0;
  let totalEstimatedBookmarks = 0;

  for (const category of flat) {
    maxDepth = Math.max(maxDepth, category.level + 1);
    categoriesPerLevel[category.level] = (categoriesPerLevel[category.level] || 0) + 1;
    totalKeywords += category.keywords.length;
    totalEstimatedBookmarks += category.estimatedCount;
  }

  return {
    totalCategories: flat.length,
    maxDepth,
    categoriesPerLevel,
    totalKeywords,
    totalEstimatedBookmarks
  };
}

/**
 * Find a category by ID in the hierarchy
 */
export function findCategory(
  categories: DiscoveredCategory[],
  categoryId: string
): DiscoveredCategory | null {
  for (const category of categories) {
    if (category.id === categoryId) {
      return category;
    }
    const found = findCategory(category.children, categoryId);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * Get path to a category (breadcrumb)
 */
export function getCategoryPath(
  categories: DiscoveredCategory[],
  categoryId: string
): DiscoveredCategory[] {
  const flat = flattenHierarchy(categories);
  const path: DiscoveredCategory[] = [];
  
  let current = flat.find(c => c.id === categoryId);
  while (current) {
    const fullCategory = findCategory(categories, current.id);
    if (fullCategory) {
      path.unshift(fullCategory);
    }
    current = current.parentId ? flat.find(c => c.id === current!.parentId) : undefined;
  }
  
  return path;
}

// Helper function
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
