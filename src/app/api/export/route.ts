import { NextRequest, NextResponse } from 'next/server';
import prisma from '@lib/db';

type ExportFormat = 'chrome' | 'firefox' | 'safari';

// Chrome bookmark format types
interface ChromeBookmarkItem {
  date_added: string;
  id: string;
  name: string;
  type: 'url' | 'folder';
  url?: string;
  children?: ChromeBookmarkItem[];
  date_modified?: string;
}

interface BookmarkExport {
  id: string;
  url: string;
  title: string;
  category?: {
    id: string;
    name: string;
    parentId?: string;
    parent?: {
      id: string;
      name: string;
    };
  };
  createdAt: Date;
}

// Helper function to build hierarchical category tree
async function buildCategoryTree(bookmarks: BookmarkExport[]): Promise<Record<string, ChromeBookmarkItem>> {
  const categoryMap = new Map<string, ChromeBookmarkItem>();
  const rootCategories = new Map<string, ChromeBookmarkItem>();

  // Get only categories that have bookmarks in the current set
  const categoryIdsWithBookmarks = new Set(bookmarks.filter(b => b.category).map(b => b.category!.id));
  const relevantCategoryIds = new Set<string>();

  // Find all ancestor categories for categories with bookmarks
  const allCategories = await prisma.category.findMany();
  const categoryLookup = new Map(allCategories.map(c => [c.id, c]));

  categoryIdsWithBookmarks.forEach(categoryId => {
    let currentId = categoryId;
    while (currentId) {
      relevantCategoryIds.add(currentId);
      const category = categoryLookup.get(currentId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentId = category ? (category as any).parentId : null;
    }
  });

  // Filter categories to only include relevant ones
  const relevantCategories = allCategories.filter(c => relevantCategoryIds.has(c.id));

  // First pass: create folders only for relevant categories
  relevantCategories.forEach(category => {
    const categoryId = category.id;

    if (!categoryMap.has(categoryId)) {
      const folder: ChromeBookmarkItem = {
        children: [],
        date_added: Math.floor(Date.now() / 1000).toString(),
        date_modified: '0',
        id: `folder_${categoryId}`,
        name: category.name,
        type: 'folder' as const
      };
      categoryMap.set(categoryId, folder);

      // If this is a root category (no parent), add to root categories
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(category as any).parentId) {
        rootCategories.set(categoryId, folder);
      }
    }
  });

  // Second pass: build hierarchy
  relevantCategories.forEach(category => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cat = category as any;
    if (cat.parentId && relevantCategoryIds.has(cat.parentId)) {
      const parentFolder = categoryMap.get(cat.parentId);
      const childFolder = categoryMap.get(category.id);
      if (parentFolder && childFolder && parentFolder.children) {
        parentFolder.children.push(childFolder);
      }
    }
  });

  // Third pass: add bookmarks to their respective folders
  bookmarks.forEach(bookmark => {
    if (!bookmark.category) return;

    const categoryId = bookmark.category.id;
    const folder = categoryMap.get(categoryId);

    if (folder && folder.children) {
      folder.children.push({
        date_added: Math.floor(bookmark.createdAt.getTime() / 1000).toString(),
        id: bookmark.id,
        name: bookmark.title,
        type: 'url' as const,
        url: bookmark.url
      });
    }
  });

  return Object.fromEntries(rootCategories);
}

// Chrome JSON format
async function exportToChromeFormat(bookmarks: BookmarkExport[]): Promise<string> {
  const chromeBookmarks = {
    checksum: '',
    roots: {
      bookmark_bar: {
        children: [] as ChromeBookmarkItem[],
        date_added: Math.floor(Date.now() / 1000).toString(),
        date_modified: '0',
        id: '1',
        name: 'Bookmarks bar',
        type: 'folder' as const
      },
      other: {
        children: [] as ChromeBookmarkItem[],
        date_added: Math.floor(Date.now() / 1000).toString(),
        date_modified: '0',
        id: '2',
        name: 'Other bookmarks',
        type: 'folder' as const
      }
    },
    version: 1
  };

  // Group bookmarks by category hierarchy
  const categoryTree = await buildCategoryTree(bookmarks);

  // Add categorized bookmarks to "other" folder
  Object.values(categoryTree).forEach(categoryFolder => {
    chromeBookmarks.roots.other.children.push(categoryFolder);
  });

  // Add uncategorized bookmarks to bookmark bar
  const uncategorizedBookmarks = bookmarks.filter(b => !b.category);
  if (uncategorizedBookmarks.length > 0) {
    chromeBookmarks.roots.bookmark_bar.children = uncategorizedBookmarks.map(bookmark => ({
      date_added: Math.floor(bookmark.createdAt.getTime() / 1000).toString(),
      id: bookmark.id,
      name: bookmark.title,
      type: 'url' as const,
      url: bookmark.url
    }));
  }

  return JSON.stringify(chromeBookmarks, null, 2);
}

// Firefox/Safari HTML format (Netscape bookmark format)
async function exportToHTMLFormat(bookmarks: BookmarkExport[], title: string): Promise<string> {
  const now = new Date();

  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>${title}</H1>
<DL><p>
`;

  // Build hierarchical structure
  const categoryTree = await buildCategoryTree(bookmarks);
  const uncategorizedBookmarks = bookmarks.filter(b => !b.category);

  // Add uncategorized bookmarks first
  if (uncategorizedBookmarks.length > 0) {
    html += `    <DT><H3 ADD_DATE="${Math.floor(now.getTime() / 1000)}" LAST_MODIFIED="${Math.floor(now.getTime() / 1000)}">Uncategorized</H3>\n`;
    html += '    <DL><p>\n';

    uncategorizedBookmarks.forEach(bookmark => {
      const addDate = Math.floor(bookmark.createdAt.getTime() / 1000);
      html += `        <DT><A HREF="${bookmark.url}" ADD_DATE="${addDate}">${bookmark.title}</A>\n`;
    });

    html += '    </DL><p>\n';
  }

  // Add hierarchical categories
  Object.values(categoryTree).forEach(categoryFolder => {
    html += generateHTMLFolder(categoryFolder);
  });

  html += '</DL><p>\n';

  return html;
}

// Helper function to generate HTML folder structure recursively
function generateHTMLFolder(folder: ChromeBookmarkItem, indent: string = '    '): string {
  const now = Math.floor(Date.now() / 1000);
  let html = `${indent}<DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">${folder.name}</H3>\n`;
  html += `${indent}<DL><p>\n`;

  if (folder.children) {
    folder.children.forEach(child => {
      if (child.type === 'folder') {
        html += generateHTMLFolder(child, indent + '    ');
      } else if (child.type === 'url') {
        html += `${indent}    <DT><A HREF="${child.url}" ADD_DATE="${child.date_added}">${child.name}</A>\n`;
      }
    });
  }

  html += `${indent}</DL><p>\n`;
  return html;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') as ExportFormat;
    const categoryId = searchParams.get('categoryId');

    if (!format || !['chrome', 'firefox', 'safari'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: chrome, firefox, safari' },
        { status: 400 }
      );
    }

    // Build where clause for filtering
    const where: { categoryId?: string } = {};
    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    // Fetch bookmarks with categories and parent relationships
    const bookmarks = await prisma.bookmark.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { category: { name: 'asc' } },
        { createdAt: 'desc' }
      ],
    });

    const bookmarkExports: BookmarkExport[] = bookmarks.map(bookmark => ({
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      category: bookmark.category ? {
        id: bookmark.category.id,
        name: bookmark.category.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parentId: (bookmark.category as any).parentId || undefined,
        parent: undefined, // We'll handle this in the tree building
      } : undefined,
      createdAt: bookmark.createdAt,
    }));

    let content: string;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'chrome':
        content = await exportToChromeFormat(bookmarkExports);
        filename = `fury_bookmarks_chrome_${new Date().toISOString().split('T')[0]}.json`;
        contentType = 'application/json';
        break;

      case 'firefox':
        content = await exportToHTMLFormat(bookmarkExports, 'Fury Bookmarks - Firefox Export');
        filename = `fury_bookmarks_firefox_${new Date().toISOString().split('T')[0]}.html`;
        contentType = 'text/html';
        break;

      case 'safari':
        content = await exportToHTMLFormat(bookmarkExports, 'Fury Bookmarks - Safari Export');
        filename = `fury_bookmarks_safari_${new Date().toISOString().split('T')[0]}.html`;
        contentType = 'text/html';
        break;

      default:
        throw new Error('Unsupported format');
    }

    // Return file download
    const response = new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

    return response;

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export bookmarks' },
      { status: 500 }
    );
  }
}