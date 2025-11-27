import prisma from "@lib/db";
import AnalyticsCharts from "@components/AnalyticsCharts";

export default async function AnalyticsPage() {
    const bookmarks = await prisma.bookmark.findMany({
        select: {
            aiCategory: true,
            keywords: true,
            metaTitle: true,
            metaDescription: true,
            summary: true,
            title: true,
            url: true,
        },
        where: {
            OR: [
                { metaTitle: { not: null } },
                { metaDescription: { not: null } },
                { keywords: { not: null } },
                { summary: { not: null } },
            ],
        },
        take: 5, // Show 5 examples
    });

    // Process AI Categories
    const categoryCount: Record<string, number> = {};
    bookmarks.forEach((b) => {
        const cat = b.aiCategory || "Uncategorized";
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const categoryData = Object.entries(categoryCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Process Keywords
    const keywordCount: Record<string, number> = {};
    bookmarks.forEach((b) => {
        if (b.keywords) {
            b.keywords.split(",").forEach((k) => {
                const keyword = k.trim();
                if (keyword) {
                    keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
                }
            });
        }
    });

    const keywordData = Object.entries(keywordCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20); // Top 20 keywords

    // Metadata Status
    const withMetadata = bookmarks.filter(
        (b) => b.metaTitle || b.metaDescription || b.keywords
    ).length;
    const withoutMetadata = bookmarks.length - withMetadata;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Analytics</h1>
            </div>
            <AnalyticsCharts
                categoryData={categoryData}
                keywordData={keywordData}
                metadataStatus={{ withMetadata, withoutMetadata }}
            />

            {bookmarks.length > 0 && (
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h2 className="card-title">Sample Bookmarks with Metadata</h2>
                        <div className="space-y-4">
                            {bookmarks.map((bookmark, index) => (
                                <div key={index} className="border rounded-lg p-4">
                                    <h3 className="font-semibold">{bookmark.title}</h3>
                                    <p className="text-sm text-base-content/70 break-all">{bookmark.url}</p>
                                    {bookmark.metaTitle && (
                                        <p className="text-sm"><strong>Meta Title:</strong> {bookmark.metaTitle}</p>
                                    )}
                                    {bookmark.metaDescription && (
                                        <p className="text-sm"><strong>Meta Description:</strong> {bookmark.metaDescription}</p>
                                    )}
                                    {bookmark.summary && (
                                        <p className="text-sm italic"><strong>AI Summary:</strong> {bookmark.summary}</p>
                                    )}
                                    {bookmark.keywords && (
                                        <p className="text-sm"><strong>Keywords:</strong> {bookmark.keywords}</p>
                                    )}
                                    {bookmark.aiCategory && (
                                        <p className="text-sm"><strong>AI Category:</strong> {bookmark.aiCategory}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
