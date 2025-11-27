import prisma from "@lib/db";

type CategoryDefinition = {
  name: string;
  slug: string;
  description: string;
  parent?: string; // For hierarchical categories
};

const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  // Main Categories (8 core categories)
  { name: "Technology & Development", slug: "technology-development", description: "Programming, software development, and technical tools" },
  { name: "Design & Creative", slug: "design-creative", description: "UI/UX design, graphics, and creative tools" },
  { name: "Business & Productivity", slug: "business-productivity", description: "Work tools, project management, and productivity apps" },
  { name: "Education & Learning", slug: "education-learning", description: "Courses, tutorials, and educational resources" },
  { name: "Entertainment & Media", slug: "entertainment-media", description: "Streaming, gaming, and media content" },
  { name: "News & Information", slug: "news-information", description: "Current events, blogs, and informational content" },
  { name: "Shopping & Commerce", slug: "shopping-commerce", description: "E-commerce, deals, and online shopping" },
  { name: "Personal & Lifestyle", slug: "personal-lifestyle", description: "Health, travel, hobbies, and personal interests" },

  // Technology & Development Subcategories
  { name: "Web Development", slug: "web-development", description: "Frontend, backend, and full-stack development", parent: "Technology & Development" },
  { name: "Mobile Development", slug: "mobile-development", description: "iOS, Android, and mobile app development", parent: "Technology & Development" },
  { name: "AI & Machine Learning", slug: "ai-machine-learning", description: "Artificial intelligence and data science", parent: "Technology & Development" },
  { name: "Cloud & DevOps", slug: "cloud-devops", description: "Cloud computing, infrastructure, and deployment", parent: "Technology & Development" },
  { name: "Programming Tools", slug: "programming-tools", description: "IDEs, editors, and development utilities", parent: "Technology & Development" },

  // Design & Creative Subcategories
  { name: "UI/UX Design", slug: "ui-ux-design", description: "User interface and user experience design", parent: "Design & Creative" },
  { name: "Graphic Design", slug: "graphic-design", description: "Visual design, branding, and graphics", parent: "Design & Creative" },
  { name: "Photography", slug: "photography", description: "Photography tools and resources", parent: "Design & Creative" },
  { name: "Video & Animation", slug: "video-animation", description: "Video editing, animation, and motion graphics", parent: "Design & Creative" },

  // Business & Productivity Subcategories
  { name: "Project Management", slug: "project-management", description: "Team collaboration and project tools", parent: "Business & Productivity" },
  { name: "Productivity Tools", slug: "productivity-tools", description: "Task management, organization, and workflow", parent: "Business & Productivity" },
  { name: "Marketing & Sales", slug: "marketing-sales", description: "Digital marketing, SEO, and sales tools", parent: "Business & Productivity" },
  { name: "Communication", slug: "communication", description: "Team communication and collaboration platforms", parent: "Business & Productivity" },

  // Education & Learning Subcategories
  { name: "Online Courses", slug: "online-courses", description: "Educational platforms and course providers", parent: "Education & Learning" },
  { name: "Programming Tutorials", slug: "programming-tutorials", description: "Coding tutorials and learning resources", parent: "Education & Learning" },
  { name: "Academic Research", slug: "academic-research", description: "Research papers, journals, and academic resources", parent: "Education & Learning" },
  { name: "Skill Development", slug: "skill-development", description: "Professional development and skill building", parent: "Education & Learning" },

  // Entertainment & Media Subcategories
  { name: "Video Streaming", slug: "video-streaming", description: "Video platforms and streaming services", parent: "Entertainment & Media" },
  { name: "Music & Audio", slug: "music-audio", description: "Music streaming, podcasts, and audio content", parent: "Entertainment & Media" },
  { name: "Gaming", slug: "gaming", description: "Video games, gaming platforms, and esports", parent: "Entertainment & Media" },
  { name: "Content Creation", slug: "content-creation", description: "Social media, blogging, and content tools", parent: "Entertainment & Media" },

  // News & Information Subcategories
  { name: "Technology News", slug: "technology-news", description: "Tech industry news and updates", parent: "News & Information" },
  { name: "Business News", slug: "business-news", description: "Business, finance, and industry news", parent: "News & Information" },
  { name: "Science & Research", slug: "science-research", description: "Scientific discoveries and research news", parent: "News & Information" },
  { name: "General News", slug: "general-news", description: "Current events and general news sources", parent: "News & Information" },

  // Shopping & Commerce Subcategories
  { name: "E-commerce", slug: "e-commerce", description: "Online shopping and retail platforms", parent: "Shopping & Commerce" },
  { name: "Deals & Discounts", slug: "deals-discounts", description: "Discounts, coupons, and deal websites", parent: "Shopping & Commerce" },
  { name: "Marketplaces", slug: "marketplaces", description: "Online marketplaces and auction sites", parent: "Shopping & Commerce" },
  { name: "Product Reviews", slug: "product-reviews", description: "Product reviews and comparison sites", parent: "Shopping & Commerce" },

  // Personal & Lifestyle Subcategories
  { name: "Health & Fitness", slug: "health-fitness", description: "Health, wellness, and fitness resources", parent: "Personal & Lifestyle" },
  { name: "Travel & Leisure", slug: "travel-leisure", description: "Travel planning, booking, and destinations", parent: "Personal & Lifestyle" },
  { name: "Food & Cooking", slug: "food-cooking", description: "Recipes, cooking, and culinary resources", parent: "Personal & Lifestyle" },
  { name: "Home & Garden", slug: "home-garden", description: "Home improvement, gardening, and lifestyle", parent: "Personal & Lifestyle" },
  { name: "Personal Finance", slug: "personal-finance", description: "Budgeting, investing, and financial planning", parent: "Personal & Lifestyle" },
];

export const CATEGORY_KEYWORDS: {
  name: string;
  keywords: string[];
  urlPatterns?: RegExp[];
  contentIndicators?: string[];
  weight: number;
}[] = [
  // Technology & Development
  {
    name: "Web Development",
    keywords: ["react", "vue", "angular", "next.js", "nuxt", "svelte", "javascript", "typescript", "html", "css", "sass", "webpack", "vite", "babel", "eslint", "prettier", "frontend", "backend", "fullstack", "api", "rest", "graphql", "web", "browser", "dom"],
    urlPatterns: [/\.js$/, /\.ts$/, /github\.com/, /npmjs\.com/, /vercel\.com/, /netlify\.com/],
    contentIndicators: ["tutorial", "documentation", "framework", "library", "component"],
    weight: 3
  },
  {
    name: "Mobile Development",
    keywords: ["ios", "android", "mobile", "app", "swift", "kotlin", "react native", "flutter", "xamarin", "cordova", "phonegap", "pwa", "responsive", "smartphone", "tablet"],
    urlPatterns: [/play\.google\.com/, /apps\.apple\.com/, /flutter\.dev/, /reactnative\.dev/],
    contentIndicators: ["mobile app", "app store", "smartphone", "tablet"],
    weight: 3
  },
  {
    name: "AI & Machine Learning",
    keywords: ["ai", "artificial intelligence", "machine learning", "ml", "deep learning", "neural network", "gpt", "openai", "tensorflow", "pytorch", "huggingface", "llm", "chatbot", "nlp", "computer vision", "data science"],
    urlPatterns: [/openai\.com/, /huggingface\.co/, /kaggle\.com/, /paperswithcode\.com/],
    contentIndicators: ["model", "training", "inference", "dataset", "algorithm"],
    weight: 4
  },
  {
    name: "Cloud & DevOps",
    keywords: ["aws", "azure", "gcp", "google cloud", "cloud", "serverless", "lambda", "ec2", "s3", "docker", "kubernetes", "k8s", "terraform", "infrastructure", "devops", "ci/cd", "jenkins", "github actions"],
    urlPatterns: [/aws\.amazon\.com/, /azure\.microsoft\.com/, /cloud\.google\.com/, /docker\.com/, /kubernetes\.io/],
    contentIndicators: ["deployment", "scaling", "infrastructure", "container", "orchestration"],
    weight: 3
  },
  {
    name: "Programming Tools",
    keywords: ["vscode", "vim", "emacs", "intellij", "pycharm", "webstorm", "sublime", "atom", "ide", "editor", "git", "github", "gitlab", "bitbucket", "terminal", "command line", "cli"],
    urlPatterns: [/github\.com/, /gitlab\.com/, /code\.visualstudio\.com/],
    contentIndicators: ["editor", "ide", "tool", "utility", "development"],
    weight: 2
  },

  // Design & Creative
  {
    name: "UI/UX Design",
    keywords: ["ui", "ux", "user interface", "user experience", "design system", "figma", "sketch", "adobe xd", "prototyping", "wireframe", "mockup", "usability", "accessibility", "design thinking"],
    urlPatterns: [/figma\.com/, /dribbble\.com/, /behance\.net/, /adobe\.com/],
    contentIndicators: ["design", "interface", "user experience", "prototype", "wireframe"],
    weight: 3
  },
  {
    name: "Graphic Design",
    keywords: ["photoshop", "illustrator", "indesign", "graphic design", "branding", "logo", "typography", "color theory", "layout", "print design", "vector", "raster"],
    urlPatterns: [/adobe\.com/, /canva\.com/, /dribbble\.com/],
    contentIndicators: ["design", "graphic", "visual", "brand", "logo"],
    weight: 2
  },
  {
    name: "Photography",
    keywords: ["photography", "camera", "lens", "lightroom", "photoshop", "dslr", "mirrorless", "composition", "editing", "retouching", "portfolio"],
    urlPatterns: [/unsplash\.com/, /pexels\.com/, /flickr\.com/],
    contentIndicators: ["photo", "camera", "image", "gallery", "portfolio"],
    weight: 2
  },
  {
    name: "Video & Animation",
    keywords: ["video", "animation", "motion graphics", "after effects", "premiere", "final cut", "davinci resolve", "blender", "maya", "cinema 4d", "3d", "rendering"],
    urlPatterns: [/adobe\.com/, /blender\.org/, /autodesk\.com/],
    contentIndicators: ["video", "animation", "motion", "3d", "render"],
    weight: 2
  },

  // Business & Productivity
  {
    name: "Project Management",
    keywords: ["project management", "agile", "scrum", "kanban", "jira", "confluence", "teamwork", "collaboration", "sprint", "backlog", "trello", "asana", "monday.com"],
    urlPatterns: [/atlassian\.com/, /jira\.com/, /basecamp\.com/, /trello\.com/, /asana\.com/],
    contentIndicators: ["project", "team", "collaboration", "management", "workflow"],
    weight: 2
  },
  {
    name: "Productivity Tools",
    keywords: ["todo", "task", "productivity", "organization", "calendar", "schedule", "time management", "notion", "evernote", "workflow", "automation", "efficiency"],
    urlPatterns: [/notion\.so/, /evernote\.com/, /todoist\.com/],
    contentIndicators: ["task", "productivity", "workflow", "organization", "efficiency"],
    weight: 2
  },
  {
    name: "Marketing & Sales",
    keywords: ["marketing", "seo", "sem", "social media marketing", "content marketing", "email marketing", "sales", "crm", "lead generation", "analytics", "advertising"],
    urlPatterns: [/hubspot\.com/, /mailchimp\.com/, /google\.com\/analytics/],
    contentIndicators: ["marketing", "sales", "campaign", "conversion", "analytics"],
    weight: 2
  },
  {
    name: "Communication",
    keywords: ["slack", "microsoft teams", "zoom", "discord", "whatsapp", "telegram", "communication", "chat", "video call", "collaboration", "remote work"],
    urlPatterns: [/slack\.com/, /teams\.microsoft\.com/, /zoom\.us/, /discord\.com/],
    contentIndicators: ["communication", "chat", "collaboration", "remote", "meeting"],
    weight: 2
  },

  // Education & Learning
  {
    name: "Online Courses",
    keywords: ["course", "udemy", "coursera", "edx", "udacity", "masterclass", "skillshare", "lynda", "linkedin learning", "certification", "online learning"],
    urlPatterns: [/coursera\.org/, /udemy\.com/, /edx\.org/, /udacity\.com/],
    contentIndicators: ["course", "learn", "certification", "education", "training"],
    weight: 3
  },
  {
    name: "Programming Tutorials",
    keywords: ["tutorial", "learn programming", "coding tutorial", "javascript tutorial", "python tutorial", "web development tutorial", "free code camp", "codecademy"],
    urlPatterns: [/freecodecamp\.org/, /codecademy\.com/, /tutorialspoint\.com/],
    contentIndicators: ["tutorial", "learn", "guide", "how to", "programming"],
    weight: 3
  },
  {
    name: "Academic Research",
    keywords: ["research", "academic", "paper", "journal", "scholar", "google scholar", "pubmed", "arxiv", "thesis", "dissertation"],
    urlPatterns: [/scholar\.google\.com/, /pubmed\.ncbi\.nlm\.nih\.gov/, /arxiv\.org/],
    contentIndicators: ["research", "academic", "paper", "journal", "study"],
    weight: 2
  },
  {
    name: "Skill Development",
    keywords: ["skill", "professional development", "career", "job skills", "training", "workshop", "webinar", "conference", "certification"],
    urlPatterns: [/linkedin\.com\/learning/, /pluralsight\.com/],
    contentIndicators: ["skill", "development", "career", "professional", "training"],
    weight: 2
  },

  // Entertainment & Media
  {
    name: "Video Streaming",
    keywords: ["youtube", "vimeo", "twitch", "netflix", "hulu", "disney+", "amazon prime", "hbo", "streaming", "video", "watch", "stream"],
    urlPatterns: [/youtube\.com/, /vimeo\.com/, /twitch\.tv/, /netflix\.com/, /hulu\.com/],
    contentIndicators: ["video", "streaming", "watch", "entertainment"],
    weight: 4
  },
  {
    name: "Music & Audio",
    keywords: ["spotify", "apple music", "youtube music", "soundcloud", "bandcamp", "music", "song", "album", "artist", "playlist", "audio", "podcast"],
    urlPatterns: [/spotify\.com/, /soundcloud\.com/, /bandcamp\.com/, /music\.apple\.com/],
    contentIndicators: ["music", "song", "album", "artist", "audio"],
    weight: 3
  },
  {
    name: "Gaming",
    keywords: ["game", "gaming", "steam", "epic games", "ubisoft", "ea", "nintendo", "playstation", "xbox", "pc gaming", "console", "esports", "twitch"],
    urlPatterns: [/steam\.com/, /epicgames\.com/, /twitch\.tv/, /ign\.com/],
    contentIndicators: ["game", "gaming", "player", "level", "achievement"],
    weight: 3
  },
  {
    name: "Content Creation",
    keywords: ["content creation", "blogging", "youtube", "tiktok", "instagram", "social media", "influencer", "content marketing", "seo", "wordpress", "medium"],
    urlPatterns: [/wordpress\.com/, /medium\.com/, /substack\.com/],
    contentIndicators: ["content", "blog", "social media", "creator", "influencer"],
    weight: 2
  },

  // News & Information
  {
    name: "Technology News",
    keywords: ["tech news", "technology news", "gadgets", "innovation", "tech review", "product launch", "silicon valley", "startup", "venture capital"],
    urlPatterns: [/techcrunch\.com/, /theverge\.com/, /wired\.com/, /arstechnica\.com/],
    contentIndicators: ["tech", "technology", "innovation", "startup", "gadget"],
    weight: 2
  },
  {
    name: "Business News",
    keywords: ["business news", "finance", "economy", "market", "stock", "investment", "corporate", "industry", "bloomberg", "wsj", "forbes"],
    urlPatterns: [/bloomberg\.com/, /wsj\.com/, /forbes\.com/, /businessinsider\.com/],
    contentIndicators: ["business", "finance", "market", "economy", "corporate"],
    weight: 2
  },
  {
    name: "Science & Research",
    keywords: ["science", "research", "physics", "chemistry", "biology", "space", "nasa", "astronomy", "climate", "environment", "academic", "paper"],
    urlPatterns: [/nasa\.gov/, /nature\.com/, /science\.org/, /scientificamerican\.com/],
    contentIndicators: ["research", "science", "study", "academic", "discovery"],
    weight: 2
  },
  {
    name: "General News",
    keywords: ["news", "breaking", "headline", "article", "blog", "journalism", "media", "press", "cnn", "bbc", "reuters", "nyt", "washington post"],
    urlPatterns: [/cnn\.com/, /bbc\.com/, /nytimes\.com/, /reuters\.com/],
    contentIndicators: ["news", "article", "breaking", "headline", "journalism"],
    weight: 2
  },

  // Shopping & Commerce
  {
    name: "E-commerce",
    keywords: ["amazon", "ebay", "shop", "store", "buy", "price", "deal", "discount", "cart", "checkout", "marketplace", "retail", "purchase"],
    urlPatterns: [/amazon\.com/, /ebay\.com/, /etsy\.com/, /shopify\.com/],
    contentIndicators: ["buy", "price", "cart", "checkout", "shopping"],
    weight: 3
  },
  {
    name: "Deals & Discounts",
    keywords: ["deal", "discount", "coupon", "promo", "sale", "clearance", "black friday", "cyber monday", "flash sale", "bargain"],
    urlPatterns: [/slickdeals\.net/, /deals\.reddit\.com/, /retailmenot\.com/],
    contentIndicators: ["deal", "discount", "coupon", "sale", "bargain"],
    weight: 3
  },
  {
    name: "Marketplaces",
    keywords: ["marketplace", "auction", "bid", "sell", "trade", "craigslist", "facebook marketplace", "offerup", "letgo"],
    urlPatterns: [/craigslist\.org/, /facebook\.com\/marketplace/, /offerup\.com/],
    contentIndicators: ["marketplace", "auction", "sell", "trade", "bid"],
    weight: 2
  },
  {
    name: "Product Reviews",
    keywords: ["review", "rating", "comparison", "best", "top", "versus", "vs", "comparison", "unboxing", "product test"],
    urlPatterns: [/cnet\.com/, /pcmag\.com/, /wirecutter\.com/],
    contentIndicators: ["review", "rating", "comparison", "best", "versus"],
    weight: 2
  },

  // Personal & Lifestyle
  {
    name: "Health & Fitness",
    keywords: ["health", "fitness", "workout", "exercise", "nutrition", "diet", "wellness", "mental health", "medical", "doctor", "hospital", "gym"],
    urlPatterns: [/webmd\.com/, /mayoclinic\.org/, /nih\.gov/, /healthline\.com/],
    contentIndicators: ["health", "fitness", "wellness", "medical", "exercise"],
    weight: 2
  },
  {
    name: "Travel & Leisure",
    keywords: ["travel", "trip", "vacation", "hotel", "flight", "booking", "airbnb", "tripadvisor", "destination", "tour", "guide", "map"],
    urlPatterns: [/booking\.com/, /airbnb\.com/, /tripadvisor\.com/, /expedia\.com/],
    contentIndicators: ["travel", "trip", "destination", "accommodation", "booking"],
    weight: 2
  },
  {
    name: "Food & Cooking",
    keywords: ["recipe", "cooking", "food", "baking", "cuisine", "restaurant", "chef", "ingredient", "meal", "dinner", "breakfast", "lunch"],
    urlPatterns: [/allrecipes\.com/, /foodnetwork\.com/, /epicurious\.com/],
    contentIndicators: ["recipe", "cooking", "food", "baking", "cuisine"],
    weight: 2
  },
  {
    name: "Home & Garden",
    keywords: ["home", "garden", "gardening", "interior design", "diy", "home improvement", "decor", "furniture", "plant", "landscaping"],
    urlPatterns: [/pinterest\.com/, /houzz\.com/, /thisoldhouse\.com/],
    contentIndicators: ["home", "garden", "diy", "decor", "improvement"],
    weight: 2
  },
  {
    name: "Personal Finance",
    keywords: ["finance", "budget", "saving", "investment", "retirement", "debt", "credit", "banking", "money management", "financial planning"],
    urlPatterns: [/nerdwallet\.com/, /investopedia\.com/, /bankrate\.com/],
    contentIndicators: ["finance", "budget", "saving", "investment", "money"],
    weight: 2
  }
];

export function guessCategoryNameFromBookmark(bookmark: {
  url: string;
  title: string;
  description?: string;
  keywords?: string[];
}): string {
  const text = `${bookmark.title} ${bookmark.url} ${bookmark.description || ""} ${bookmark.keywords?.join(" ") || ""}`.toLowerCase();
  const url = bookmark.url.toLowerCase();

  const categoryScores: Record<string, number> = {};

  for (const category of CATEGORY_KEYWORDS) {
    let score = 0;

    // URL pattern matching (highest weight)
    if (category.urlPatterns) {
      for (const pattern of category.urlPatterns) {
        if (pattern.test(url)) {
          score += 10 * category.weight;
        }
      }
    }

    // Keyword matching
    for (const keyword of category.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (text.includes(keywordLower)) {
        score += category.weight;
      }
    }

    // Content indicators (medium weight)
    if (category.contentIndicators) {
      for (const indicator of category.contentIndicators) {
        if (text.includes(indicator)) {
          score += 2 * category.weight;
        }
      }
    }

    // Domain-based scoring for known platforms
    const domain = extractDomain(url);
    if (domain) {
      // Boost scores for well-known domains
      const knownDomains: Record<string, string> = {
        'github.com': 'Web Development',
        'npmjs.com': 'Web Development',
        'vercel.com': 'Web Development',
        'netlify.com': 'Web Development',
        'openai.com': 'AI & Machine Learning',
        'huggingface.co': 'AI & Machine Learning',
        'kaggle.com': 'AI & Machine Learning',
        'paperswithcode.com': 'AI & Machine Learning',
        'aws.amazon.com': 'Cloud & DevOps',
        'azure.microsoft.com': 'Cloud & DevOps',
        'cloud.google.com': 'Cloud & DevOps',
        'docker.com': 'Cloud & DevOps',
        'kubernetes.io': 'Cloud & DevOps',
        'play.google.com': 'Mobile Development',
        'apps.apple.com': 'Mobile Development',
        'flutter.dev': 'Mobile Development',
        'reactnative.dev': 'Mobile Development',
        'figma.com': 'UI/UX Design',
        'dribbble.com': 'UI/UX Design',
        'behance.net': 'UI/UX Design',
        'adobe.com': 'Graphic Design',
        'canva.com': 'Graphic Design',
        'unsplash.com': 'Photography',
        'pexels.com': 'Photography',
        'flickr.com': 'Photography',
        'youtube.com': 'Video Streaming',
        'vimeo.com': 'Video Streaming',
        'twitch.tv': 'Video Streaming',
        'netflix.com': 'Video Streaming',
        'hulu.com': 'Video Streaming',
        'spotify.com': 'Music & Audio',
        'soundcloud.com': 'Music & Audio',
        'bandcamp.com': 'Music & Audio',
        'music.apple.com': 'Music & Audio',
        'steam.com': 'Gaming',
        'epicgames.com': 'Gaming',
        'ign.com': 'Gaming',
        'notion.so': 'Productivity Tools',
        'evernote.com': 'Productivity Tools',
        'todoist.com': 'Productivity Tools',
        'atlassian.com': 'Project Management',
        'jira.com': 'Project Management',
        'basecamp.com': 'Project Management',
        'trello.com': 'Project Management',
        'asana.com': 'Project Management',
        'slack.com': 'Communication',
        'teams.microsoft.com': 'Communication',
        'zoom.us': 'Communication',
        'discord.com': 'Communication',
        'coursera.org': 'Online Courses',
        'udemy.com': 'Online Courses',
        'edx.org': 'Online Courses',
        'udacity.com': 'Online Courses',
        'freecodecamp.org': 'Programming Tutorials',
        'codecademy.com': 'Programming Tutorials',
        'tutorialspoint.com': 'Programming Tutorials',
        'scholar.google.com': 'Academic Research',
        'pubmed.ncbi.nlm.nih.gov': 'Academic Research',
        'arxiv.org': 'Academic Research',
        'amazon.com': 'E-commerce',
        'ebay.com': 'E-commerce',
        'etsy.com': 'E-commerce',
        'shopify.com': 'E-commerce',
        'slickdeals.net': 'Deals & Discounts',
        'retailmenot.com': 'Deals & Discounts',
        'craigslist.org': 'Marketplaces',
        'facebook.com': 'Marketplaces',
        'offerup.com': 'Marketplaces',
        'cnet.com': 'Product Reviews',
        'pcmag.com': 'Product Reviews',
        'wirecutter.com': 'Product Reviews',
        'webmd.com': 'Health & Fitness',
        'mayoclinic.org': 'Health & Fitness',
        'nih.gov': 'Health & Fitness',
        'healthline.com': 'Health & Fitness',
        'booking.com': 'Travel & Leisure',
        'airbnb.com': 'Travel & Leisure',
        'tripadvisor.com': 'Travel & Leisure',
        'expedia.com': 'Travel & Leisure',
        'allrecipes.com': 'Food & Cooking',
        'foodnetwork.com': 'Food & Cooking',
        'epicurious.com': 'Food & Cooking',
        'pinterest.com': 'Home & Garden',
        'houzz.com': 'Home & Garden',
        'thisoldhouse.com': 'Home & Garden',
        'nerdwallet.com': 'Personal Finance',
        'investopedia.com': 'Personal Finance',
        'bankrate.com': 'Personal Finance',
        'techcrunch.com': 'Technology News',
        'theverge.com': 'Technology News',
        'wired.com': 'Technology News',
        'arstechnica.com': 'Technology News',
        'bloomberg.com': 'Business News',
        'wsj.com': 'Business News',
        'forbes.com': 'Business News',
        'businessinsider.com': 'Business News',
        'nasa.gov': 'Science & Research',
        'nature.com': 'Science & Research',
        'science.org': 'Science & Research',
        'scientificamerican.com': 'Science & Research',
        'cnn.com': 'General News',
        'bbc.com': 'General News',
        'nytimes.com': 'General News',
        'reuters.com': 'General News'
      };

      if (knownDomains[domain] === category.name) {
        score += 15;
      }
    }

    if (score > 0) {
      categoryScores[category.name] = (categoryScores[category.name] || 0) + score;
    }
  }

  // Find the category with the highest score
  let bestCategory = "Other";
  let maxScore = 0;

  for (const [categoryName, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = categoryName;
    }
  }

  return bestCategory;
}

// Helper function to extract domain from URL
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureCategoryByName(name: string): Promise<any> {
  const normalized = name.trim() || "Other";
  const preset = DEFAULT_CATEGORIES.find((presetCategory) => presetCategory.name === normalized);
  const slug = preset?.slug ?? slugify(normalized);

  // Handle parent relationship first
  let parentId: string | undefined;
  if (preset?.parent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parentCategory: any = await ensureCategoryByName(preset.parent);
    parentId = parentCategory.id;
  }

  // Check if category already exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (prisma as any).category.findUnique({ where: { slug } });
  if (existing) {
    // Update if parent relationship changed
    if (existing.parentId !== parentId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).category.update({
        where: { slug },
        data: { parentId },
      });
    }
    return existing;
  }

  // Create new category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any).category.create({
    data: {
      name: normalized,
      slug,
      description: preset?.description,
      parentId,
    },
  });
}

export async function ensureDefaultCategories() {
  // Check if we already have categories (indicating default categories were created)
  const existingCount = await prisma.category.count();
  if (existingCount > 0) {
    return; // Default categories already exist
  }

  // Create default categories one by one to handle parent relationships properly
  for (const category of DEFAULT_CATEGORIES) {
    await ensureCategoryByName(category.name);
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
