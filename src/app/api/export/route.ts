import { NextRequest, NextResponse } from 'next/server';
import prisma from '@lib/db';

type ExportFormat = 'chrome' | 'firefox' | 'safari';

interface BookmarkExport {
  id: string;
  url: string;
  title: string;
  category?: {
    id: string;
    name: string;
  };
  createdAt: Date;
}

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

// Chrome JSON format
function exportToChromeFormat(bookmarks: BookmarkExport[]): string {
  const chromeBookmarks = {
    checksum: '',
    roots: {
      bookmark_bar: {
        children: bookmarks
          .filter(b => !b.category) // Root level bookmarks
          .map(bookmark => ({
            date_added: Math.floor(bookmark.createdAt.getTime() / 1000).toString(),
            id: bookmark.id,
            name: bookmark.title,
            type: 'url' as const,
            url: bookmark.url
          })),
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

  // Group bookmarks by category
  const categories = bookmarks.reduce((acc, bookmark) => {
    const categoryName = bookmark.category?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(bookmark);
    return acc;
  }, {} as Record<string, BookmarkExport[]>);

  // Add categorized bookmarks to "other" folder
  Object.entries(categories).forEach(([categoryName, categoryBookmarks]) => {
    const folder: ChromeBookmarkItem = {
      children: categoryBookmarks.map(bookmark => ({
        date_added: Math.floor(bookmark.createdAt.getTime() / 1000).toString(),
        id: bookmark.id,
        name: bookmark.title,
        type: 'url' as const,
        url: bookmark.url
      })),
      date_added: Math.floor(Date.now() / 1000).toString(),
      date_modified: '0',
      id: `folder_${categoryName.replace(/\s+/g, '_')}`,
      name: categoryName,
      type: 'folder' as const
    };
    chromeBookmarks.roots.other.children.push(folder);
  });

  return JSON.stringify(chromeBookmarks, null, 2);
}

// Firefox/Safari HTML format (Netscape bookmark format)
function exportToHTMLFormat(bookmarks: BookmarkExport[], title: string): string {
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

  // Group bookmarks by category
  const categories = bookmarks.reduce((acc, bookmark) => {
    const categoryName = bookmark.category?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(bookmark);
    return acc;
  }, {} as Record<string, BookmarkExport[]>);

  // Add each category as a folder
  Object.entries(categories).forEach(([categoryName, categoryBookmarks]) => {
    html += `    <DT><H3 ADD_DATE="${Math.floor(now.getTime() / 1000)}" LAST_MODIFIED="${Math.floor(now.getTime() / 1000)}">${categoryName}</H3>\n`;
    html += '    <DL><p>\n';

    categoryBookmarks.forEach(bookmark => {
      const addDate = Math.floor(bookmark.createdAt.getTime() / 1000);
      html += `        <DT><A HREF="${bookmark.url}" ADD_DATE="${addDate}">${bookmark.title}</A>\n`;
    });

    html += '    </DL><p>\n';
  });

  html += '</DL><p>\n';

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

    // Fetch bookmarks with categories
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
      } : undefined,
      createdAt: bookmark.createdAt,
    }));

    let content: string;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'chrome':
        content = exportToChromeFormat(bookmarkExports);
        filename = `fury_bookmarks_chrome_${new Date().toISOString().split('T')[0]}.json`;
        contentType = 'application/json';
        break;

      case 'firefox':
        content = exportToHTMLFormat(bookmarkExports, 'Fury Bookmarks - Firefox Export');
        filename = `fury_bookmarks_firefox_${new Date().toISOString().split('T')[0]}.html`;
        contentType = 'text/html';
        break;

      case 'safari':
        content = exportToHTMLFormat(bookmarkExports, 'Fury Bookmarks - Safari Export');
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