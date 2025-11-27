import Link from "next/link";
import MetadataHighlights from "@components/MetadataHighlights";
import prisma from "@lib/db";
import {
  collectTopKeywords,
  metadataWhereClause,
  topAiCategory,
} from "@lib/metadataUtils";
import { type BookmarkFilters } from "@lib/filterUtils";

export default async function MetadataExplorerPage() {
  const [totalBookmarks, metadataBookmarks, highlightedBookmarks, allBookmarks] =
    await Promise.all([
      prisma.bookmark.count(),
      prisma.bookmark.count({
        where: metadataWhereClause,
      }),
      prisma.bookmark.findMany({
        orderBy: { updatedAt: "desc" },
        take: 80,
        select: {
          keywords: true,
          aiCategory: true,
        },
      }),
      prisma.bookmark.findMany({
        include: {
          category: true,
        },
      }),
    ]);

  const coverage = totalBookmarks
    ? Math.round((metadataBookmarks / totalBookmarks) * 100)
    : 0;
  const metadataHighlights = collectTopKeywords(highlightedBookmarks, 8);
  const aiCategory = topAiCategory(highlightedBookmarks);
  const filters: BookmarkFilters = {
    hasMetadata: "true",
  };

  // Calculate metadata field distribution
  const metadataFieldStats = {
    metaTitle: allBookmarks.filter(b => b.metaTitle).length,
    metaDescription: allBookmarks.filter(b => b.metaDescription).length,
    ogTitle: allBookmarks.filter(b => b.ogTitle).length,
    ogDescription: allBookmarks.filter(b => b.ogDescription).length,
    ogImage: allBookmarks.filter(b => b.ogImage).length,
    keywords: allBookmarks.filter(b => b.keywords).length,
    summary: allBookmarks.filter(b => b.summary).length,
    aiCategory: allBookmarks.filter(b => b.aiCategory).length,
  };

  // Calculate category-based metadata analysis
  const categoryStats = allBookmarks.reduce((acc, bookmark) => {
    const categoryName = bookmark.category?.name || "Uncategorized";
    if (!acc[categoryName]) {
      acc[categoryName] = {
        total: 0,
        withMetadata: 0,
        fields: {
          metaTitle: 0,
          metaDescription: 0,
          ogTitle: 0,
          ogDescription: 0,
          ogImage: 0,
          keywords: 0,
          summary: 0,
          aiCategory: 0,
        },
      };
    }
    acc[categoryName].total++;
    const hasMetadata = bookmark.metaTitle || bookmark.metaDescription ||
                       bookmark.keywords || bookmark.summary;
    if (hasMetadata) {
      acc[categoryName].withMetadata++;
    }
    if (bookmark.metaTitle) acc[categoryName].fields.metaTitle++;
    if (bookmark.metaDescription) acc[categoryName].fields.metaDescription++;
    if (bookmark.ogTitle) acc[categoryName].fields.ogTitle++;
    if (bookmark.ogDescription) acc[categoryName].fields.ogDescription++;
    if (bookmark.ogImage) acc[categoryName].fields.ogImage++;
    if (bookmark.keywords) acc[categoryName].fields.keywords++;
    if (bookmark.summary) acc[categoryName].fields.summary++;
    if (bookmark.aiCategory) acc[categoryName].fields.aiCategory++;
    return acc;
  }, {} as Record<string, {
    total: number;
    withMetadata: number;
    fields: Record<string, number>;
  }>);

  const sortedCategoryStats = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b.total - a.total);

  // Stop words list - common words that are not useful for keyword analysis
  const stopWords = new Set([
    // Articles
    'a', 'an', 'the',
    // Prepositions
    'in', 'on', 'at', 'to', 'from', 'by', 'with', 'about', 'for', 'of', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'over', 'under', 'behind', 'beside', 'near', 'across', 'around', 'against', 'along', 'amid', 'amongst', 'anti', 'besides', 'beyond', 'circa', 'concerning', 'considering', 'despite', 'down', 'except', 'excluding', 'following', 'inside', 'minus', 'onto', 'outside', 'per', 'plus', 'regarding', 'round', 'save', 'since', 'than', 'till', 'toward', 'towards', 'underneath', 'unlike', 'until', 'unto', 'upon', 'versus', 'via', 'within', 'without',
    // Conjunctions
    'and', 'or', 'but', 'nor', 'so', 'for', 'yet', 'after', 'although', 'as', 'because', 'before', 'even', 'if', 'lest', 'once', 'only', 'provided', 'rather', 'since', 'supposing', 'than', 'that', 'though', 'till', 'unless', 'until', 'when', 'whenever', 'where', 'whereas', 'wherever', 'whether', 'while',
    // Pronouns
    'i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what', 'whoever', 'whomever', 'whichever', 'whatever',
    // Common verbs (base forms and common variations)
    'be', 'is', 'am', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'get', 'got', 'make', 'made', 'go', 'went', 'gone', 'come', 'came', 'take', 'took', 'taken', 'see', 'saw', 'seen', 'know', 'knew', 'known', 'think', 'thought', 'say', 'said', 'tell', 'told', 'work', 'use', 'used', 'find', 'found', 'give', 'gave', 'given', 'need', 'want', 'look', 'help', 'try', 'call', 'ask', 'turn', 'run', 'move', 'live', 'believe', 'bring', 'happen', 'write', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise', 'pass', 'sell', 'require', 'report', 'decide', 'pull', 'return', 'explain', 'hope', 'develop', 'carry', 'break', 'receive', 'agree', 'support', 'hit', 'produce', 'eat', 'cover', 'catch', 'draw', 'choose', 'wear', 'hold', 'hear', 'throw', 'pick', 'join', 'wear', 'lie', 'hang', 'shoot', 'become', 'leave', 'let', 'begin', 'seem', 'help', 'talk', 'turn', 'start', 'show', 'hear', 'play', 'run', 'move', 'like', 'live', 'feel', 'put', 'bring', 'begin', 'keep', 'hold', 'write', 'stand', 'hear', 'let', 'move', 'need', 'look', 'want', 'give', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call',
    // Common adjectives
    'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same', 'able', 'free', 'full', 'special', 'easy', 'strong', 'sure', 'clear', 'recent', 'certain', 'personal', 'open', 'red', 'difficult', 'available', 'likely', 'short', 'single', 'medical', 'current', 'wrong', 'private', 'past', 'foreign', 'fine', 'common', 'poor', 'natural', 'significant', 'similar', 'hot', 'dead', 'central', 'happy', 'serious', 'ready', 'simple', 'left', 'physical', 'general', 'environmental', 'financial', 'blue', 'democratic', 'dark', 'various', 'entire', 'close', 'legal', 'religious', 'cold', 'final', 'main', 'green', 'nice', 'huge', 'popular', 'traditional', 'cultural',
    // Common adverbs
    'very', 'really', 'quite', 'so', 'too', 'also', 'even', 'well', 'just', 'only', 'still', 'then', 'now', 'here', 'there', 'all', 'not', 'no', 'yes', 'maybe', 'perhaps', 'probably', 'always', 'never', 'sometimes', 'often', 'usually', 'sometimes', 'already', 'yet', 'soon', 'later', 'today', 'tomorrow', 'yesterday', 'ago', 'before', 'after', 'again', 'once', 'twice', 'ever', 'never', 'almost', 'nearly', 'quite', 'rather', 'somewhat', 'enough', 'indeed', 'certainly', 'surely', 'actually', 'really', 'literally', 'basically', 'simply', 'clearly', 'obviously', 'apparently', 'evidently', 'fortunately', 'unfortunately', 'hopefully', 'sadly', 'happily', 'luckily', 'unluckily', 'surprisingly', 'interestingly', 'importantly', 'significantly', 'noticeably', 'remarkably', 'particularly', 'especially', 'specifically', 'generally', 'typically', 'usually', 'normally', 'commonly', 'frequently', 'occasionally', 'sometimes', 'rarely', 'seldom', 'hardly', 'scarcely', 'barely', 'merely', 'simply', 'just', 'only', 'solely', 'purely', 'entirely', 'completely', 'totally', 'absolutely', 'utterly', 'wholly', 'fully', 'thoroughly', 'perfectly', 'exactly', 'precisely', 'directly', 'immediately', 'instantly', 'quickly', 'slowly', 'fast', 'rapidly', 'gradually', 'suddenly', 'abruptly', 'finally', 'eventually', 'ultimately', 'consequently', 'therefore', 'thus', 'hence', 'accordingly', 'subsequently', 'meanwhile', 'simultaneously', 'previously', 'formerly', 'lately', 'recently', 'currently', 'presently', 'nowadays', 'today', 'tomorrow', 'yesterday',
    // Numbers and quantifiers
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'many', 'much', 'few', 'little', 'some', 'any', 'all', 'every', 'each', 'both', 'several', 'multiple', 'numerous', 'countless', 'innumerable', 'plenty', 'lots', 'tons', 'heaps', 'loads', 'oodles', 'scads', 'several', 'various', 'diverse', 'different', 'distinct', 'separate', 'individual', 'particular', 'specific', 'certain', 'various', 'sundry', 'assorted', 'mixed', 'diverse', 'varied', 'manifold', 'multifarious',
    // Other common words
    'yes', 'no', 'ok', 'okay', 'alright', 'sure', 'fine', 'well', 'oh', 'ah', 'hey', 'hi', 'hello', 'goodbye', 'bye', 'please', 'thank', 'thanks', 'sorry', 'excuse', 'pardon', 'welcome', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'way', 'part', 'kind', 'type', 'sort', 'form', 'manner', 'means', 'method', 'process', 'procedure', 'approach', 'technique', 'system', 'structure', 'organization', 'group', 'set', 'series', 'sequence', 'order', 'pattern', 'design', 'plan', 'program', 'project', 'task', 'job', 'work', 'activity', 'action', 'operation', 'function', 'purpose', 'goal', 'objective', 'target', 'aim', 'intent', 'intention', 'plan', 'scheme', 'strategy', 'tactic', 'method', 'technique', 'approach', 'way', 'manner', 'mode', 'style', 'fashion', 'form', 'shape', 'size', 'scale', 'level', 'degree', 'extent', 'amount', 'quantity', 'number', 'volume', 'mass', 'weight', 'length', 'width', 'height', 'depth', 'area', 'space', 'time', 'period', 'duration', 'interval', 'span', 'range', 'scope', 'field', 'area', 'domain', 'realm', 'sphere', 'province', 'territory', 'region', 'zone', 'sector', 'department', 'division', 'section', 'part', 'portion', 'segment', 'piece', 'bit', 'item', 'element', 'component', 'unit', 'module', 'block', 'piece', 'fragment', 'particle', 'atom', 'molecule', 'cell', 'organism', 'being', 'creature', 'animal', 'plant', 'human', 'person', 'man', 'woman', 'child', 'baby', 'adult', 'senior', 'youth', 'teen', 'boy', 'girl', 'male', 'female', 'parent', 'child', 'sibling', 'brother', 'sister', 'family', 'relative', 'friend', 'colleague', 'partner', 'spouse', 'husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandparent', 'grandchild', 'uncle', 'aunt', 'cousin', 'nephew', 'niece'
  ]);

  // Calculate keyword statistics
  const keywordStats = allBookmarks.reduce((acc, bookmark) => {
    if (bookmark.keywords) {
      const keywords = bookmark.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
      keywords.forEach(keyword => {
        acc.frequency[keyword] = (acc.frequency[keyword] || 0) + 1;
        acc.totalCount++;
      });
    }
    return acc;
  }, {
    frequency: {} as Record<string, number>,
    totalCount: 0
  });

  const uniqueKeywords = Object.keys(keywordStats.frequency);
  const filteredKeywords = uniqueKeywords.filter(keyword => !stopWords.has(keyword));
  const filteredKeywordStats = filteredKeywords.reduce((acc, keyword) => {
    acc.frequency[keyword] = keywordStats.frequency[keyword];
    acc.totalCount += keywordStats.frequency[keyword];
    return acc;
  }, {
    frequency: {} as Record<string, number>,
    totalCount: 0
  });

  const topKeywords = Object.entries(filteredKeywordStats.frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 50); // Top 50 filtered keywords

  // Group keywords by frequency ranges for better visualization (filtered)
  const keywordFrequencyRanges = {
    '1 mention': filteredKeywords.filter(k => filteredKeywordStats.frequency[k] === 1).length,
    '2-5 mentions': filteredKeywords.filter(k => filteredKeywordStats.frequency[k] >= 2 && filteredKeywordStats.frequency[k] <= 5).length,
    '6-10 mentions': filteredKeywords.filter(k => filteredKeywordStats.frequency[k] >= 6 && filteredKeywordStats.frequency[k] <= 10).length,
    '11-50 mentions': filteredKeywords.filter(k => filteredKeywordStats.frequency[k] >= 11 && filteredKeywordStats.frequency[k] <= 50).length,
    '50+ mentions': filteredKeywords.filter(k => filteredKeywordStats.frequency[k] > 50).length,
  };

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-3">
          <div>
            <h1 className="text-2xl font-bold">Metadata Explorer</h1>
            <p className="text-base-content/70">
              Comprehensive analysis of all metadata in your bookmark collection
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
              <div className="stat-title">Total bookmarks</div>
              <div className="stat-value">{totalBookmarks}</div>
              <div className="stat-desc">Entire library</div>
            </div>
            <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
              <div className="stat-title">Metadata enriched</div>
              <div className="stat-value">{metadataBookmarks}</div>
              <div className="stat-desc">{coverage}% coverage</div>
            </div>
            <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
              <div className="stat-title">Top AI category</div>
              <div className="stat-value">
                {aiCategory ? aiCategory.name : "Awaiting AI"}
              </div>
              {aiCategory && (
                <div className="stat-desc">
                  {aiCategory.count} bookmarks tagged
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/bookmarks?hasMetadata=true" className="btn btn-primary">
              View enriched bookmarks
            </Link>
            <Link href="/bookmarks" className="btn btn-outline">
              View all bookmarks
            </Link>
          </div>
        </div>
      </div>

      {/* Metadata Field Distribution */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Metadata Field Distribution</h2>
          <p className="text-sm text-base-content/70 mb-4">
            How many bookmarks have each type of metadata
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(metadataFieldStats).map(([field, count]) => (
              <div key={field} className="stat rounded border border-base-200 bg-base-100 shadow-sm">
                <div className="stat-title text-sm">{field.replace(/([A-Z])/g, ' $1').toLowerCase()}</div>
                <div className="stat-value text-lg">{count}</div>
                <div className="stat-desc">
                  {totalBookmarks ? Math.round((count / totalBookmarks) * 100) : 0}% coverage
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keyword Statistics */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Keyword Statistics</h2>
          <p className="text-sm text-base-content/70 mb-4">
            Analysis of AI-extracted keywords across your bookmarks (filtered to remove common stop words)
          </p>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
              <div className="stat-title">Total keywords</div>
              <div className="stat-value">{uniqueKeywords.length}</div>
              <div className="stat-desc">All extracted</div>
            </div>
            <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
              <div className="stat-title">Filtered keywords</div>
              <div className="stat-value">{filteredKeywords.length}</div>
              <div className="stat-desc">
                {uniqueKeywords.length ? Math.round((filteredKeywords.length / uniqueKeywords.length) * 100) : 0}% useful
              </div>
            </div>
            <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
              <div className="stat-title">Total mentions</div>
              <div className="stat-value">{keywordStats.totalCount}</div>
              <div className="stat-desc">All occurrences</div>
            </div>
            <div className="stat rounded border border-base-200 bg-base-100 shadow-sm">
              <div className="stat-title">Avg per bookmark</div>
              <div className="stat-value">
                {metadataBookmarks ? (filteredKeywordStats.totalCount / metadataBookmarks).toFixed(1) : 0}
              </div>
              <div className="stat-desc">Useful keywords per enriched bookmark</div>
            </div>
          </div>

          {/* Keyword Quality Info */}
          <div className="alert alert-info mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 className="font-bold">Keyword Filtering Active</h3>
              <div className="text-xs">
                Filtered out {uniqueKeywords.length - filteredKeywords.length} common words (articles, prepositions, pronouns, basic verbs, etc.) to focus on meaningful keywords that help categorize and find your bookmarks.
              </div>
            </div>
          </div>

          {/* Keyword Frequency Distribution */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Keyword Frequency Distribution</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              {Object.entries(keywordFrequencyRanges).map(([range, count]) => (
                <div key={range} className="stat rounded border border-base-200 bg-base-100 shadow-sm">
                  <div className="stat-title text-sm">{range}</div>
                  <div className="stat-value text-lg">{count}</div>
                  <div className="stat-desc">
                    {filteredKeywords.length ? Math.round((count / filteredKeywords.length) * 100) : 0}% of keywords
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Keywords */}
          {topKeywords.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Top Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {topKeywords.slice(0, 30).map(([keyword, count]) => (
                  <Link
                    key={keyword}
                    href={`/bookmarks?metadata=${encodeURIComponent(keyword)}`}
                    className="badge badge-primary badge-lg cursor-pointer hover:badge-primary-focus transition-colors"
                    title={`Click to filter bookmarks with "${keyword}" (${count} mentions)`}
                  >
                    {keyword} ({count})
                  </Link>
                ))}
              </div>
              {topKeywords.length > 30 && (
                <p className="text-sm text-base-content/70 mt-2">
                  Showing top 30 of {topKeywords.length} keywords
                </p>
              )}
            </div>
          )}

          {/* All Keywords */}
          {filteredKeywords.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">All Keywords ({filteredKeywords.length})</h3>
              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto border rounded-lg p-4 bg-base-200/20">
                {filteredKeywords
                  .sort()
                  .map(keyword => (
                    <Link
                      key={keyword}
                      href={`/bookmarks?metadata=${encodeURIComponent(keyword)}`}
                      className="badge badge-outline badge-sm cursor-pointer hover:badge-primary transition-colors"
                      title={`Click to filter bookmarks with "${keyword}" (${filteredKeywordStats.frequency[keyword]} mentions)`}
                    >
                      {keyword}
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category-based Analysis */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Metadata Analysis by Category</h2>
          <p className="text-sm text-base-content/70 mb-4">
            Metadata coverage and field distribution across categories
          </p>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total</th>
                  <th>Enriched</th>
                  <th>Coverage</th>
                  <th>Meta Title</th>
                  <th>Meta Desc</th>
                  <th>Keywords</th>
                  <th>Summary</th>
                  <th>AI Category</th>
                </tr>
              </thead>
              <tbody>
                {sortedCategoryStats.map(([categoryName, stats]) => (
                  <tr key={categoryName}>
                    <td className="font-medium">{categoryName}</td>
                    <td>{stats.total}</td>
                    <td>{stats.withMetadata}</td>
                    <td>
                      {stats.total ? Math.round((stats.withMetadata / stats.total) * 100) : 0}%
                    </td>
                    <td>{stats.fields.metaTitle}</td>
                    <td>{stats.fields.metaDescription}</td>
                    <td>{stats.fields.keywords}</td>
                    <td>{stats.fields.summary}</td>
                    <td>{stats.fields.aiCategory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {metadataBookmarks === 0 && (
        <div className="card border border-dashed border-base-200 bg-base-100 shadow-sm">
          <div className="card-body space-y-3">
            <h2 className="card-title text-lg">No metadata yet?</h2>
            <p className="text-sm text-base-content/70">
              Fury only shows metadata once it has scraped the original pages and
              enriched them with AI keywords, summaries and suggested categories.
            </p>
            <ul className="text-sm text-base-content/70 list-inside list-disc space-y-1">
              <li>
                Import bookmarks through <Link href="/import" className="link link-primary">/import</Link>;
                Fury simultaneously scrapes meta/OG tags and runs the AI analyzer.
              </li>
              <li>
                If you see imports without metadata, ensure the OpenAI API key is set in <code className="rounded bg-base-200 px-1 py-0.5 text-xs font-mono">.env.local</code> or the environment.
              </li>
              <li>
                You can refresh the metadata explorer after the import completes or re-run the same import file so the stats update immediately.
              </li>
            </ul>
          </div>
        </div>
      )}

      <MetadataHighlights
        highlights={metadataHighlights}
        filters={filters}
        title="Trending metadata"
        description="Click a tag to filter by keywords or AI tags."
      />
    </div>
  );
}
