/**
 * Gemini AI Client for Fury
 * 
 * Uses Google's Gemini API for intelligent bookmark analysis and category discovery.
 * Falls back to local clustering when API is unavailable.
 */

export interface GeminiResponse {
  text: string;
  success: boolean;
  error?: string;
}

export interface CategorySuggestion {
  name: string;
  description: string;
  keywords: string[];
  parentName?: string;
  estimatedCount: number;
}

export interface HierarchySuggestion {
  categories: CategorySuggestion[];
  reasoning: string;
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Check if Gemini API is available
 */
export function isGeminiAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

/**
 * Call Gemini API with a prompt
 */
export async function callGemini(prompt: string): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return {
      text: '',
      success: false,
      error: 'GEMINI_API_KEY not configured'
    };
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 16384,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      console.error('Request URL:', `${GEMINI_API_URL}?key=***`);
      return {
        text: '',
        success: false,
        error: `API error: ${response.status} - ${errorText}`
      };
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('Gemini API returned no candidates:', JSON.stringify(data, null, 2));
      return {
        text: '',
        success: false,
        error: 'No candidates returned from API'
      };
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      console.error('Gemini API returned empty text. Full response:', JSON.stringify(data, null, 2));
      return {
        text: '',
        success: false,
        error: 'Empty response from API'
      };
    }
    
    return {
      text,
      success: true
    };
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return {
      text: '',
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Analyze bookmarks and suggest a category hierarchy using Gemini
 */
export async function analyzeBookmarksForCategories(
  bookmarks: Array<{ url: string; title: string; description?: string; sourceFolder?: string }>
): Promise<HierarchySuggestion | null> {
  // Prepare bookmark summary for analysis (limit to avoid token limits)
  const bookmarkSummary = bookmarks.slice(0, 200).map(b => {
    const domain = extractDomain(b.url);
    return `- ${b.title} (${domain})${b.sourceFolder ? ` [folder: ${b.sourceFolder}]` : ''}`;
  }).join('\n');

  const folderStructure = extractFolderStructure(bookmarks);
  const domainStats = extractDomainStats(bookmarks);

  const prompt = `You are a bookmark organization expert. Create a well-organized category hierarchy.

BOOKMARKS (${bookmarks.length} total, showing first 200):
${bookmarkSummary}

EXISTING FOLDER STRUCTURE FROM BROWSER:
${folderStructure}

TOP DOMAINS:
${domainStats}

=== CRITICAL CONSTRAINT ===
YOU MUST HAVE EXACTLY 6-10 ROOT CATEGORIES (where parentName is null).
COUNT YOUR ROOT CATEGORIES BEFORE RESPONDING!
If you have more than 10 root categories, MERGE THEM into broader ones.

MANDATORY ROOT CATEGORY LIMIT:
- Minimum: 6 root categories
- Maximum: 10 root categories
- If you see 50+ bookmarks about code/programming/tech, they ALL go under ONE "Technology" root
- If you see business/work/enterprise bookmarks, they ALL go under ONE "Business" root

ALLOWED ROOT CATEGORIES (choose 6-10 from these or similar):
Technology, Business, Entertainment, Education, News & Media, Shopping, Social, Finance, Health & Wellness, Travel, Reference, Lifestyle, Personal

EVERYTHING ELSE MUST BE A SUBCATEGORY:
- Programming → Technology > Development
- Cloud Computing → Technology > Cloud & DevOps
- Work Resources → Business > Work
- Project Management → Business > Productivity
- Music → Entertainment > Music
- Video Streaming → Entertainment > Video

RULES:
1. Each root category should have 2-8 subcategories
2. Subcategories can have their own children (max 4 levels total)
3. Short names (2-4 words), brief descriptions (under 10 words)
4. 3-5 keywords per category

RESPOND WITH VALID JSON ONLY (no markdown):
{
  "categories": [
    {"name": "Technology", "description": "Tech and development", "keywords": ["tech", "software", "code"], "parentName": null, "estimatedCount": 150},
    {"name": "Development", "description": "Programming resources", "keywords": ["code", "programming"], "parentName": "Technology", "estimatedCount": 80},
    {"name": "Frontend", "description": "UI and web development", "keywords": ["react", "css", "javascript"], "parentName": "Development", "estimatedCount": 30}
  ],
  "reasoning": "Created X root categories: [list them]. Total Y categories."
}`;

  const response = await callGemini(prompt);
  
  if (!response.success) {
    console.error('Gemini analysis failed:', response.error);
    return null;
  }

  try {
    // Extract JSON from response (handle potential markdown wrapping)
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const parsed = JSON.parse(jsonText) as HierarchySuggestion;
    return parsed;
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    console.error('Raw response:', response.text);
    return null;
  }
}

/**
 * Generate keywords for a specific category based on bookmarks
 */
export async function generateCategoryKeywords(
  categoryName: string,
  bookmarks: Array<{ url: string; title: string; description?: string }>
): Promise<string[] | null> {
  const bookmarkSummary = bookmarks.slice(0, 50).map(b => {
    const domain = extractDomain(b.url);
    return `- ${b.title} (${domain})`;
  }).join('\n');

  const prompt = `Generate relevant keywords for categorizing bookmarks into the category "${categoryName}".

SAMPLE BOOKMARKS IN THIS CATEGORY:
${bookmarkSummary}

TASK: Generate 15-25 keywords/phrases that would help identify bookmarks belonging to this category.
Include:
- Common domain patterns
- Topic-specific terms
- Related technologies or concepts
- Action words commonly found in titles

RESPOND WITH VALID JSON ONLY:
{
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

  const response = await callGemini(prompt);
  
  if (!response.success) {
    return null;
  }

  try {
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
    if (jsonText.startsWith('```')) jsonText = jsonText.slice(3);
    if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3);
    jsonText = jsonText.trim();

    const parsed = JSON.parse(jsonText);
    return parsed.keywords || [];
  } catch {
    return null;
  }
}

/**
 * Refine category suggestions based on user feedback
 */
export async function refineCategorySuggestions(
  currentCategories: CategorySuggestion[],
  userFeedback: string,
  bookmarks: Array<{ url: string; title: string }>
): Promise<HierarchySuggestion | null> {
  const currentHierarchy = currentCategories.map(c => 
    `- ${c.name}${c.parentName ? ` (under ${c.parentName})` : ''}: ${c.keywords.slice(0, 5).join(', ')}`
  ).join('\n');

  const prompt = `Refine this bookmark category hierarchy based on user feedback.

CURRENT HIERARCHY:
${currentHierarchy}

USER FEEDBACK:
${userFeedback}

TOTAL BOOKMARKS: ${bookmarks.length}

TASK: Modify the hierarchy according to the feedback while maintaining:
1. Maximum 4 levels of depth
2. Clear, logical organization
3. Appropriate keywords for each category

RESPOND WITH VALID JSON ONLY:
{
  "categories": [
    {
      "name": "Category Name",
      "description": "Brief description",
      "keywords": ["keyword1", "keyword2"],
      "parentName": null,
      "estimatedCount": 50
    }
  ],
  "reasoning": "Explanation of changes made"
}`;

  const response = await callGemini(prompt);
  
  if (!response.success) {
    return null;
  }

  try {
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
    if (jsonText.startsWith('```')) jsonText = jsonText.slice(3);
    if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3);
    jsonText = jsonText.trim();

    return JSON.parse(jsonText) as HierarchySuggestion;
  } catch {
    return null;
  }
}

// Helper functions

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

function extractFolderStructure(
  bookmarks: Array<{ sourceFolder?: string }>
): string {
  const folders = new Map<string, number>();
  
  for (const bookmark of bookmarks) {
    if (bookmark.sourceFolder) {
      const count = folders.get(bookmark.sourceFolder) || 0;
      folders.set(bookmark.sourceFolder, count + 1);
    }
  }

  const sortedFolders = [...folders.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  if (sortedFolders.length === 0) {
    return 'No folder structure available';
  }

  return sortedFolders
    .map(([folder, count]) => `- ${folder}: ${count} bookmarks`)
    .join('\n');
}

function extractDomainStats(
  bookmarks: Array<{ url: string }>
): string {
  const domains = new Map<string, number>();
  
  for (const bookmark of bookmarks) {
    const domain = extractDomain(bookmark.url);
    const count = domains.get(domain) || 0;
    domains.set(domain, count + 1);
  }

  const sortedDomains = [...domains.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  return sortedDomains
    .map(([domain, count]) => `- ${domain}: ${count}`)
    .join('\n');
}

/**
 * Batch assign bookmarks to categories using AI
 * Returns a map of bookmark index to category name
 */
export interface BookmarkAssignment {
  index: number;
  category: string;
}

export interface BatchAssignmentResult {
  assignments: BookmarkAssignment[];
  unassigned: number[];
}

export async function batchAssignBookmarksToCategories(
  bookmarks: Array<{ url: string; title: string; description?: string; sourceFolder?: string }>,
  categories: Array<{ name: string; keywords: string[]; parentName?: string | null }>,
  batchSize: number = 50, // Reduced from 100 to avoid truncation
  onProgress?: (processed: number, total: number) => void
): Promise<BatchAssignmentResult> {
  const allAssignments: BookmarkAssignment[] = [];
  const allUnassigned: number[] = [];

  // Build compact category list for prompt (just names)
  const categoryNames = categories.map(c => c.name);
  const categoryList = categoryNames.map((name, idx) => `${idx}:${name}`).join('|');

  // Process in batches to avoid token limits
  for (let i = 0; i < bookmarks.length; i += batchSize) {
    const batch = bookmarks.slice(i, i + batchSize);
    
    // Report progress
    if (onProgress) {
      onProgress(i, bookmarks.length);
    }
    
    const batchResult = await assignBatch(batch, categoryList, categoryNames, i);
    
    if (batchResult) {
      allAssignments.push(...batchResult.assignments);
      allUnassigned.push(...batchResult.unassigned);
    } else {
      // If AI fails, mark all in batch as unassigned
      for (let j = 0; j < batch.length; j++) {
        allUnassigned.push(i + j);
      }
    }
  }
  
  // Final progress
  if (onProgress) {
    onProgress(bookmarks.length, bookmarks.length);
  }

  return {
    assignments: allAssignments,
    unassigned: allUnassigned
  };
}

async function assignBatch(
  bookmarks: Array<{ url: string; title: string; description?: string; sourceFolder?: string }>,
  categoryList: string,
  categoryNames: string[],
  startIndex: number
): Promise<BatchAssignmentResult | null> {
  // Build compact bookmark list - just index and essential info
  const bookmarkList = bookmarks.map((b, idx) => {
    const domain = extractDomain(b.url);
    // Truncate title to save tokens
    const title = (b.title || '').substring(0, 50);
    return `${startIndex + idx}:"${title}"(${domain})`;
  }).join('\n');

  const prompt = `Assign bookmarks to categories. Output ONLY a JSON array of [index,categoryIndex] pairs.

CATEGORIES (index:name):
${categoryList}

BOOKMARKS (index:"title"(domain)):
${bookmarkList}

OUTPUT FORMAT - JSON array only, no other text:
[[0,2],[1,5],[2,0]]

Where first number is bookmark index, second is category index from the list above.
Include ALL ${bookmarks.length} bookmarks. Be concise.`;

  const response = await callGemini(prompt);
  
  if (!response.success) {
    console.error('Batch assignment failed:', response.error);
    return null;
  }

  try {
    let jsonText = response.text.trim();
    // Remove markdown if present
    if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
    if (jsonText.startsWith('```')) jsonText = jsonText.slice(3);
    if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3);
    jsonText = jsonText.trim();
    
    // Try to fix truncated JSON by finding the last complete pair
    if (!jsonText.endsWith(']]')) {
      const lastComplete = jsonText.lastIndexOf(']');
      if (lastComplete > 0) {
        jsonText = jsonText.substring(0, lastComplete + 1) + ']';
      }
    }

    const parsed = JSON.parse(jsonText) as number[][];
    
    // Convert to assignments
    const assignments: BookmarkAssignment[] = [];
    const assignedIndices = new Set<number>();
    
    for (const pair of parsed) {
      if (Array.isArray(pair) && pair.length >= 2) {
        const [bookmarkIdx, categoryIdx] = pair;
        if (typeof bookmarkIdx === 'number' && typeof categoryIdx === 'number' && categoryIdx < categoryNames.length) {
          assignments.push({
            index: bookmarkIdx,
            category: categoryNames[categoryIdx]
          });
          assignedIndices.add(bookmarkIdx);
        }
      }
    }
    
    // Find unassigned
    const unassigned: number[] = [];
    for (let i = 0; i < bookmarks.length; i++) {
      const actualIndex = startIndex + i;
      if (!assignedIndices.has(actualIndex)) {
        unassigned.push(actualIndex);
      }
    }

    return {
      assignments,
      unassigned
    };
  } catch (error) {
    console.error('Failed to parse batch assignment response:', error);
    return null;
  }
}
