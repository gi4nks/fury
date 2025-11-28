/**
 * Text Processing Module for Semantic Keyword Extraction
 * 
 * Provides utilities for:
 * - Stop word removal (articles, prepositions, common verbs, etc.)
 * - Meaningful keyword extraction from text
 * - URL path analysis for semantic hints
 * - N-gram extraction for multi-word concepts
 * - Domain-specific term recognition
 */

// Comprehensive stop words list - common words that don't add semantic value
export const STOP_WORDS = new Set([
  // Articles
  "a", "an", "the",
  
  // Pronouns
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", 
  "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", 
  "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", 
  "theirs", "themselves", "what", "which", "who", "whom", "this", "that", 
  "these", "those",
  
  // Verbs (common/auxiliary)
  "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", 
  "had", "having", "do", "does", "did", "doing", "would", "should", "could", 
  "ought", "might", "must", "shall", "will", "can", "need", "dare", "may",
  "get", "got", "getting", "go", "goes", "going", "went", "gone", "make",
  "makes", "making", "made", "come", "comes", "coming", "came", "take",
  "takes", "taking", "took", "taken", "see", "sees", "seeing", "saw", "seen",
  "know", "knows", "knowing", "knew", "known", "think", "thinks", "thinking",
  "thought", "want", "wants", "wanting", "wanted", "use", "uses", "using", "used",
  "find", "finds", "finding", "found", "give", "gives", "giving", "gave", "given",
  "tell", "tells", "telling", "told", "work", "works", "working", "worked",
  "call", "calls", "calling", "called", "try", "tries", "trying", "tried",
  "ask", "asks", "asking", "asked", "put", "puts", "putting", "keep", "keeps",
  "keeping", "kept", "let", "lets", "letting", "begin", "begins", "beginning",
  "began", "begun", "seem", "seems", "seeming", "seemed", "help", "helps",
  "helping", "helped", "show", "shows", "showing", "showed", "shown",
  "hear", "hears", "hearing", "heard", "play", "plays", "playing", "played",
  "run", "runs", "running", "ran", "move", "moves", "moving", "moved",
  "live", "lives", "living", "lived", "believe", "believes", "believing", "believed",
  "bring", "brings", "bringing", "brought", "happen", "happens", "happening", "happened",
  "write", "writes", "writing", "wrote", "written", "provide", "provides", "providing", "provided",
  "sit", "sits", "sitting", "sat", "stand", "stands", "standing", "stood",
  "lose", "loses", "losing", "lost", "pay", "pays", "paying", "paid",
  "meet", "meets", "meeting", "met", "include", "includes", "including", "included",
  "continue", "continues", "continuing", "continued", "set", "sets", "setting",
  "learn", "learns", "learning", "learned", "change", "changes", "changing", "changed",
  "lead", "leads", "leading", "led", "understand", "understands", "understanding", "understood",
  "watch", "watches", "watching", "watched", "follow", "follows", "following", "followed",
  "stop", "stops", "stopping", "stopped", "create", "creates", "creating", "created",
  "speak", "speaks", "speaking", "spoke", "spoken", "read", "reads", "reading",
  "allow", "allows", "allowing", "allowed", "add", "adds", "adding", "added",
  "spend", "spends", "spending", "spent", "grow", "grows", "growing", "grew", "grown",
  "open", "opens", "opening", "opened", "walk", "walks", "walking", "walked",
  "win", "wins", "winning", "won", "offer", "offers", "offering", "offered",
  "remember", "remembers", "remembering", "remembered", "love", "loves", "loving", "loved",
  "consider", "considers", "considering", "considered", "appear", "appears", "appearing", "appeared",
  "buy", "buys", "buying", "bought", "wait", "waits", "waiting", "waited",
  "serve", "serves", "serving", "served", "die", "dies", "dying", "died",
  "send", "sends", "sending", "sent", "expect", "expects", "expecting", "expected",
  "build", "builds", "building", "built", "stay", "stays", "staying", "stayed",
  "fall", "falls", "falling", "fell", "fallen", "cut", "cuts", "cutting",
  "reach", "reaches", "reaching", "reached", "kill", "kills", "killing", "killed",
  "remain", "remains", "remaining", "remained",
  
  // Prepositions
  "about", "above", "across", "after", "against", "along", "among", "around",
  "at", "before", "behind", "below", "beneath", "beside", "between", "beyond",
  "by", "down", "during", "except", "for", "from", "in", "inside", "into",
  "like", "near", "of", "off", "on", "onto", "out", "outside", "over",
  "past", "since", "through", "throughout", "till", "to", "toward", "towards",
  "under", "underneath", "until", "up", "upon", "with", "within", "without",
  
  // Conjunctions
  "and", "but", "or", "nor", "for", "yet", "so", "although", "because",
  "since", "unless", "while", "whereas", "whether", "if", "then", "else",
  "when", "whenever", "where", "wherever", "however", "therefore", "thus",
  "hence", "moreover", "furthermore", "nevertheless", "nonetheless",
  
  // Adverbs (common)
  "very", "really", "quite", "rather", "too", "also", "just", "only",
  "even", "still", "already", "yet", "ever", "never", "always", "often",
  "sometimes", "usually", "generally", "typically", "actually", "basically",
  "certainly", "clearly", "completely", "currently", "definitely", "easily",
  "especially", "exactly", "finally", "frequently", "fully", "hardly",
  "immediately", "likely", "mostly", "nearly", "obviously", "perhaps",
  "possibly", "probably", "quickly", "simply", "slightly", "soon",
  "specifically", "suddenly", "surely", "together", "totally", "truly",
  
  // Numbers and time
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "first", "second", "third", "last", "next", "new", "old", "now", "then",
  "today", "yesterday", "tomorrow", "year", "years", "month", "months",
  "week", "weeks", "day", "days", "hour", "hours", "minute", "minutes",
  
  // Common adjectives that don't add semantic value
  "good", "great", "best", "better", "bad", "worse", "worst", "big", "small",
  "large", "little", "long", "short", "high", "low", "few", "many", "much",
  "more", "most", "less", "least", "other", "another", "same", "different",
  "own", "such", "certain", "sure", "right", "wrong", "true", "false",
  "real", "main", "major", "important", "special", "free", "full", "empty",
  
  // Web-specific noise words
  "home", "page", "homepage", "website", "site", "web", "online", "click",
  "here", "link", "links", "menu", "nav", "navigation", "header", "footer",
  "sidebar", "content", "main", "search", "login", "logout", "signup",
  "signin", "register", "subscribe", "newsletter", "email", "contact",
  "privacy", "policy", "terms", "conditions", "cookie", "cookies", "accept",
  "decline", "close", "back", "forward", "previous", "next", "submit",
  "cancel", "ok", "yes", "no", "loading", "please", "wait", "error",
  "success", "welcome", "hello", "hi", "thanks", "thank", "sorry",
  "copyright", "rights", "reserved", "powered", "built", "made",
  "official", "verified", "trusted", "secure", "safe",
  
  // Common URL path segments
  "www", "http", "https", "html", "htm", "php", "asp", "aspx", "jsp",
  "index", "default", "en", "us", "uk", "com", "org", "net", "io",
  
  // Contractions (expanded)
  "don't", "doesn't", "didn't", "won't", "wouldn't", "couldn't", "shouldn't",
  "haven't", "hasn't", "hadn't", "aren't", "isn't", "wasn't", "weren't",
  "can't", "cannot", "mustn't", "needn't", "shan't", "let's", "that's",
  "what's", "who's", "where's", "when's", "why's", "how's", "it's",
  "he's", "she's", "here's", "there's", "i'm", "i've", "i'd", "i'll",
  "you're", "you've", "you'd", "you'll", "we're", "we've", "we'd", "we'll",
  "they're", "they've", "they'd", "they'll",
]);

// Domain-specific high-value terms that should be boosted
export const DOMAIN_SPECIFIC_TERMS: Record<string, string[]> = {
  technology: [
    "api", "sdk", "framework", "library", "database", "server", "client",
    "frontend", "backend", "fullstack", "devops", "cloud", "kubernetes",
    "docker", "microservices", "serverless", "rest", "graphql", "websocket",
    "authentication", "authorization", "encryption", "cybersecurity",
    "algorithm", "data structure", "machine learning", "artificial intelligence",
    "neural network", "deep learning", "nlp", "computer vision",
    "blockchain", "cryptocurrency", "web3", "smart contract",
    "agile", "scrum", "kanban", "ci/cd", "git", "version control",
    "testing", "debugging", "deployment", "monitoring", "logging"
  ],
  programming: [
    "javascript", "typescript", "python", "java", "kotlin", "swift",
    "rust", "go", "golang", "ruby", "php", "csharp", "cpp", "scala",
    "react", "angular", "vue", "svelte", "nextjs", "nuxt", "remix",
    "nodejs", "express", "fastify", "django", "flask", "rails",
    "spring", "laravel", "dotnet", "flutter", "react native",
    "sql", "nosql", "mongodb", "postgresql", "mysql", "redis",
    "elasticsearch", "graphql", "prisma", "sequelize", "orm"
  ],
  design: [
    "ui", "ux", "user interface", "user experience", "wireframe",
    "prototype", "mockup", "design system", "component library",
    "typography", "color theory", "accessibility", "responsive",
    "figma", "sketch", "adobe xd", "invision", "zeplin",
    "illustration", "icon", "logo", "branding", "visual identity",
    "animation", "motion graphics", "3d", "rendering"
  ],
  business: [
    "startup", "entrepreneur", "venture capital", "investment",
    "revenue", "profit", "growth", "scaling", "acquisition",
    "marketing", "seo", "sem", "content marketing", "social media marketing",
    "analytics", "kpi", "metrics", "conversion", "funnel",
    "crm", "erp", "saas", "b2b", "b2c", "e-commerce",
    "productivity", "workflow", "automation", "integration"
  ],
  education: [
    "course", "tutorial", "lesson", "workshop", "bootcamp",
    "certification", "degree", "diploma", "curriculum",
    "learning", "training", "education", "academy", "university",
    "mooc", "e-learning", "online learning", "self-paced",
    "instructor", "student", "assignment", "quiz", "exam"
  ],
  healthcare: [
    "pharmaceutical", "biotech", "clinical", "medical", "healthcare",
    "drug", "medicine", "therapy", "treatment", "diagnosis",
    "patient", "hospital", "clinic", "physician", "doctor",
    "research", "trial", "fda", "ema", "regulatory",
    "genomics", "proteomics", "bioinformatics"
  ]
};

// Compound terms that should be kept together
export const COMPOUND_TERMS = [
  "machine learning", "deep learning", "artificial intelligence",
  "neural network", "natural language processing", "computer vision",
  "data science", "data engineering", "data analytics",
  "web development", "mobile development", "app development",
  "software engineering", "software development",
  "cloud computing", "edge computing", "quantum computing",
  "cyber security", "information security",
  "user interface", "user experience", "design system",
  "version control", "source control",
  "continuous integration", "continuous deployment",
  "test driven development", "behavior driven development",
  "object oriented", "functional programming",
  "front end", "back end", "full stack",
  "open source", "free software",
  "social media", "content marketing", "digital marketing",
  "search engine optimization", "pay per click",
  "customer relationship management", "enterprise resource planning",
  "virtual reality", "augmented reality", "mixed reality",
  "internet of things", "smart home", "smart city",
  "electric vehicle", "autonomous driving",
  "renewable energy", "climate change", "sustainability",
  "mental health", "physical fitness", "personal finance",
  "real estate", "stock market", "cryptocurrency"
];

/**
 * Configuration for text processing
 */
export interface TextProcessingConfig {
  minWordLength?: number;      // Minimum word length to keep (default: 2)
  maxKeywords?: number;        // Maximum keywords to extract (default: 15)
  includeNgrams?: boolean;     // Extract n-grams (default: true)
  boostDomainTerms?: boolean;  // Boost domain-specific terms (default: true)
  preserveCompounds?: boolean; // Keep compound terms together (default: true)
}

const DEFAULT_CONFIG: Required<TextProcessingConfig> = {
  minWordLength: 2,
  maxKeywords: 15,
  includeNgrams: true,
  boostDomainTerms: true,
  preserveCompounds: true
};

/**
 * Clean and normalize text for processing
 */
export function cleanText(text: string): string {
  if (!text) return "";
  
  return text
    // Normalize unicode
    .normalize('NFKD')
    // Remove HTML entities
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, ' ')
    // Remove email addresses
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, ' ')
    // Convert camelCase and PascalCase to spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Convert snake_case and kebab-case to spaces
    .replace(/[_-]+/g, ' ')
    // Remove special characters but keep apostrophes for contractions
    .replace(/[^\w\s']/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Extract meaningful words from URL path
 */
export function extractUrlKeywords(url: string): string[] {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    // Extract from hostname (minus common prefixes/suffixes)
    const hostname = urlObj.hostname.replace(/^www\./, '');
    const domainParts = hostname.split('.');
    const meaningfulDomain = domainParts.filter(part => 
      part.length > 2 && !['com', 'org', 'net', 'io', 'co', 'uk', 'de', 'fr', 'jp'].includes(part)
    );
    
    // Extract from pathname
    const pathParts = urlObj.pathname
      .split('/')
      .filter(part => part.length > 2)
      .map(part => part.replace(/[_-]/g, ' '))
      .flatMap(part => part.split(/\s+/))
      .filter(part => !STOP_WORDS.has(part.toLowerCase()) && !/^\d+$/.test(part));
    
    // Extract from search params (key names only, not values)
    const searchParams: string[] = [];
    urlObj.searchParams.forEach((_, key) => {
      if (key.length > 2 && !STOP_WORDS.has(key.toLowerCase())) {
        searchParams.push(key);
      }
    });
    
    return [...meaningfulDomain, ...pathParts, ...searchParams]
      .map(s => s.toLowerCase())
      .filter(s => s.length > 2 && !STOP_WORDS.has(s));
  } catch {
    return [];
  }
}

/**
 * Extract bigrams (2-word phrases) from text
 */
function extractBigrams(words: string[]): string[] {
  const bigrams: string[] = [];
  
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    // Check if this bigram is a known compound term
    if (COMPOUND_TERMS.some(term => term.toLowerCase() === bigram)) {
      bigrams.push(bigram);
    }
  }
  
  return bigrams;
}

/**
 * Calculate term frequency with domain boosting
 */
function calculateTermScores(
  words: string[],
  config: Required<TextProcessingConfig>
): Map<string, number> {
  const scores = new Map<string, number>();
  
  // Count frequency
  for (const word of words) {
    scores.set(word, (scores.get(word) || 0) + 1);
  }
  
  // Boost domain-specific terms
  if (config.boostDomainTerms) {
    for (const [, terms] of Object.entries(DOMAIN_SPECIFIC_TERMS)) {
      for (const term of terms) {
        const termLower = term.toLowerCase();
        if (scores.has(termLower)) {
          scores.set(termLower, (scores.get(termLower) || 0) * 2);
        }
      }
    }
  }
  
  return scores;
}

/**
 * Main function: Extract semantic keywords from text
 */
export function extractSemanticKeywords(
  text: string,
  config: Partial<TextProcessingConfig> = {}
): string[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  // Clean the text
  const cleanedText = cleanText(text);
  if (!cleanedText) return [];
  
  // Tokenize
  const words = cleanedText
    .split(/\s+/)
    .filter(word => 
      word.length >= cfg.minWordLength && 
      !STOP_WORDS.has(word) &&
      !/^\d+$/.test(word) // Remove pure numbers
    );
  
  if (words.length === 0) return [];
  
  // Extract compound terms first (if enabled)
  const compoundMatches: string[] = [];
  if (cfg.preserveCompounds) {
    for (const compound of COMPOUND_TERMS) {
      if (cleanedText.includes(compound.toLowerCase())) {
        compoundMatches.push(compound.toLowerCase());
      }
    }
  }
  
  // Extract bigrams
  const bigrams = cfg.includeNgrams ? extractBigrams(words) : [];
  
  // Calculate scores
  const termScores = calculateTermScores(words, cfg);
  
  // Combine and sort
  const allTerms = new Map<string, number>();
  
  // Add compound terms with high score
  for (const compound of compoundMatches) {
    allTerms.set(compound, 100);
  }
  
  // Add bigrams with boosted score
  for (const bigram of bigrams) {
    if (!compoundMatches.includes(bigram)) {
      allTerms.set(bigram, 50);
    }
  }
  
  // Add single words
  for (const [term, score] of termScores) {
    // Skip if this word is part of a compound term we already have
    const isPartOfCompound = compoundMatches.some(c => c.includes(term));
    if (!isPartOfCompound && !allTerms.has(term)) {
      allTerms.set(term, score);
    }
  }
  
  // Sort by score and return top keywords
  return Array.from(allTerms.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, cfg.maxKeywords)
    .map(([term]) => term);
}

/**
 * Process bookmark data and extract clean keywords
 */
export function processBookmarkText(
  url: string,
  title: string,
  description?: string,
  metadata?: {
    metaTitle?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
    bodyText?: string;
  }
): {
  cleanedTitle: string;
  cleanedDescription: string;
  keywords: string[];
  urlKeywords: string[];
} {
  // Combine all text sources
  const allText = [
    title,
    description,
    metadata?.metaTitle,
    metadata?.metaDescription,
    metadata?.ogTitle,
    metadata?.ogDescription,
    metadata?.bodyText?.substring(0, 2000) // Limit body text
  ].filter(Boolean).join(' ');
  
  // Extract URL keywords
  const urlKeywords = extractUrlKeywords(url);
  
  // Clean title and description
  const cleanedTitle = cleanText(title);
  const cleanedDescription = cleanText(description || metadata?.metaDescription || metadata?.ogDescription || '');
  
  // Extract semantic keywords from all text
  const keywords = extractSemanticKeywords(allText + ' ' + urlKeywords.join(' '), {
    maxKeywords: 15,
    includeNgrams: true,
    boostDomainTerms: true,
    preserveCompounds: true
  });
  
  return {
    cleanedTitle,
    cleanedDescription,
    keywords,
    urlKeywords
  };
}

/**
 * Get domain category hints based on URL structure
 */
export function getDomainHints(url: string): string[] {
  const hints: string[] = [];
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    
    // Check for common patterns
    const patterns: [RegExp, string][] = [
      [/github\.com|gitlab\.com|bitbucket\.org/, 'development'],
      [/stackoverflow\.com|stackexchange\.com/, 'programming'],
      [/docs\.|documentation|api\./, 'documentation'],
      [/blog\.|\/blog\//, 'blog'],
      [/news\.|\/news\//, 'news'],
      [/shop\.|store\.|\/shop\/|\/store\//, 'shopping'],
      [/learn\.|\/learn\/|\/courses?\/|\/tutorials?\//, 'education'],
      [/play\.|games?\.|\/games?\//, 'gaming'],
      [/music\.|\/music\//, 'music'],
      [/video\.|\/videos?\//, 'video'],
      [/health\.|medical\.|\/health\//, 'healthcare'],
      [/finance\.|\/finance\/|\/investing\//, 'finance'],
      [/travel\.|\/travel\/|\/destinations?\//, 'travel'],
      [/food\.|recipe\.|\/recipes?\//, 'food'],
      [/design\.|\/design\//, 'design'],
      [/cloud\.|aws\.|azure\.|gcp\./, 'cloud'],
    ];
    
    const fullUrl = hostname + pathname;
    for (const [pattern, hint] of patterns) {
      if (pattern.test(fullUrl)) {
        hints.push(hint);
      }
    }
  } catch {
    // Invalid URL, return empty hints
  }
  
  return hints;
}
