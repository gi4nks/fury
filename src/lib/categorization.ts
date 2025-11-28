import prisma from "@lib/db";

type CategoryDefinition = {
  name: string;
  slug: string;
  description: string;
  parent?: string; // For hierarchical categories
};

const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  // Main Categories (9 core categories)
  { name: "Technology & Development", slug: "technology-development", description: "Programming, software development, and technical tools" },
  { name: "Design & Creative", slug: "design-creative", description: "UI/UX design, graphics, and creative tools" },
  { name: "Business & Productivity", slug: "business-productivity", description: "Work tools, project management, and productivity apps" },
  { name: "Education & Learning", slug: "education-learning", description: "Courses, tutorials, and educational resources" },
  { name: "Entertainment & Media", slug: "entertainment-media", description: "Streaming, gaming, and media content" },
  { name: "News & Information", slug: "news-information", description: "Current events, blogs, and informational content" },
  { name: "Shopping & Commerce", slug: "shopping-commerce", description: "E-commerce, deals, and online shopping" },
  { name: "Personal & Lifestyle", slug: "personal-lifestyle", description: "Health, travel, hobbies, and personal interests" },
  { name: "Healthcare & Pharma", slug: "healthcare-pharma", description: "Pharmaceutical companies, healthcare providers, and medical industry" },

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

  // Healthcare & Pharma Subcategories
  { name: "Pharmaceutical Companies", slug: "pharmaceutical-companies", description: "Drug manufacturers and biotech companies", parent: "Healthcare & Pharma" },
  { name: "Healthcare Providers", slug: "healthcare-providers", description: "Hospitals, clinics, and medical services", parent: "Healthcare & Pharma" },
  { name: "Medical Devices", slug: "medical-devices", description: "Medical equipment and device manufacturers", parent: "Healthcare & Pharma" },
  { name: "Biotech & Research", slug: "biotech-research", description: "Biotechnology and medical research companies", parent: "Healthcare & Pharma" },
];

export const CATEGORY_KEYWORDS: {
  name: string;
  keywords: string[];
  urlPatterns?: RegExp[];
  contentIndicators?: string[];
  exclusionPatterns?: string[];  // Words that should NOT trigger this category
  requireWordBoundary?: boolean; // If true, keywords must match as whole words
  weight: number;
}[] = [
  // Technology & Development
  {
    name: "Web Development",
    keywords: ["react", "vue", "angular", "next.js", "nuxt", "svelte", "javascript", "typescript", "html5", "css3", "sass", "webpack", "vite", "babel", "eslint", "prettier", "frontend", "backend", "fullstack", "rest api", "graphql", "web developer", "web development", "nodejs", "node.js", "express", "npm", "yarn"],
    urlPatterns: [/github\.com/, /npmjs\.com/, /vercel\.com/, /netlify\.com/, /stackoverflow\.com/, /developer\.mozilla\.org/],
    contentIndicators: ["documentation", "framework", "library", "component", "developer"],
    exclusionPatterns: ["web browser", "browse the web"],
    weight: 3
  },
  {
    name: "Mobile Development",
    keywords: ["ios development", "android development", "mobile app", "swift programming", "kotlin programming", "react native", "flutter", "xamarin", "cordova", "phonegap", "progressive web app", "pwa", "ios sdk", "android sdk", "xcode", "android studio"],
    urlPatterns: [/play\.google\.com/, /apps\.apple\.com/, /flutter\.dev/, /reactnative\.dev/, /developer\.apple\.com/, /developer\.android\.com/],
    contentIndicators: ["mobile app", "app store", "play store", "ios app", "android app"],
    weight: 3
  },
  {
    name: "AI & Machine Learning",
    keywords: ["artificial intelligence", "machine learning", "deep learning", "neural network", "gpt", "openai", "tensorflow", "pytorch", "huggingface", "llm", "large language model", "chatbot", "nlp", "natural language processing", "computer vision", "data science", "scikit-learn", "keras"],
    urlPatterns: [/openai\.com/, /huggingface\.co/, /kaggle\.com/, /paperswithcode\.com/, /anthropic\.com/, /cohere\.com/],
    contentIndicators: ["machine learning", "training model", "inference", "dataset", "neural"],
    weight: 4
  },
  {
    name: "Cloud & DevOps",
    keywords: ["aws", "azure", "gcp", "google cloud platform", "cloud computing", "serverless", "lambda", "ec2", "s3", "docker", "kubernetes", "k8s", "terraform", "infrastructure as code", "devops", "ci/cd", "jenkins", "github actions", "cloudformation", "ansible", "puppet", "chef"],
    urlPatterns: [/aws\.amazon\.com/, /azure\.microsoft\.com/, /cloud\.google\.com/, /docker\.com/, /kubernetes\.io/, /terraform\.io/, /hashicorp\.com/],
    contentIndicators: ["deployment", "scaling", "container", "orchestration", "infrastructure"],
    weight: 3
  },
  {
    name: "Programming Tools",
    keywords: ["vscode", "visual studio code", "vim editor", "emacs", "intellij idea", "pycharm", "webstorm", "sublime text", "atom editor", "ide", "code editor", "version control", "source control", "debugging", "linter", "formatter"],
    urlPatterns: [/code\.visualstudio\.com/, /jetbrains\.com/, /sublimetext\.com/],
    contentIndicators: ["code editor", "ide", "debugging", "development environment"],
    weight: 2
  },

  // Design & Creative
  {
    name: "UI/UX Design",
    keywords: ["ui design", "ux design", "user interface", "user experience", "design system", "figma", "sketch app", "adobe xd", "prototyping", "wireframe", "mockup", "usability testing", "accessibility", "design thinking", "interaction design"],
    urlPatterns: [/figma\.com/, /dribbble\.com/, /behance\.net/, /sketch\.com/, /invisionapp\.com/],
    contentIndicators: ["ui design", "ux design", "user interface", "prototype", "wireframe"],
    weight: 3
  },
  {
    name: "Graphic Design",
    keywords: ["photoshop", "illustrator", "indesign", "graphic design", "branding design", "logo design", "typography", "color theory", "print design", "vector graphics", "raster graphics", "visual design"],
    urlPatterns: [/adobe\.com\/products/, /canva\.com/, /99designs\.com/],
    contentIndicators: ["graphic design", "visual design", "branding", "logo design"],
    weight: 2
  },
  {
    name: "Photography",
    keywords: ["photography", "camera gear", "camera lens", "lightroom", "dslr camera", "mirrorless camera", "photo editing", "retouching", "photo portfolio", "aperture", "shutter speed", "iso", "raw photos"],
    urlPatterns: [/unsplash\.com/, /pexels\.com/, /flickr\.com/, /500px\.com/, /smugmug\.com/],
    contentIndicators: ["photography", "photographer", "camera", "photo editing"],
    weight: 2
  },
  {
    name: "Video & Animation",
    keywords: ["video editing", "animation", "motion graphics", "after effects", "premiere pro", "final cut pro", "davinci resolve", "blender 3d", "maya 3d", "cinema 4d", "3d modeling", "3d rendering", "vfx", "visual effects"],
    urlPatterns: [/blender\.org/, /autodesk\.com/, /maxon\.net/],
    contentIndicators: ["video editing", "animation", "motion graphics", "3d modeling", "rendering"],
    exclusionPatterns: ["video streaming", "watch video", "youtube"],
    weight: 2
  },

  // Business & Productivity
  {
    name: "Project Management",
    keywords: ["project management", "agile methodology", "scrum master", "kanban board", "jira", "confluence", "sprint planning", "backlog", "trello", "asana", "monday.com", "gantt chart", "project timeline", "milestone"],
    urlPatterns: [/atlassian\.com/, /jira\.com/, /basecamp\.com/, /trello\.com/, /asana\.com/, /monday\.com/, /clickup\.com/],
    contentIndicators: ["project management", "sprint", "backlog", "agile", "scrum"],
    weight: 2
  },
  {
    name: "Productivity Tools",
    keywords: ["todo app", "task manager", "productivity app", "note taking", "calendar app", "time tracking", "notion", "evernote", "obsidian", "roam research", "automation tool", "zapier", "ifttt"],
    urlPatterns: [/notion\.so/, /evernote\.com/, /todoist\.com/, /obsidian\.md/, /zapier\.com/, /airtable\.com/],
    contentIndicators: ["productivity app", "note taking", "task management", "time tracking"],
    weight: 2
  },
  {
    name: "Marketing & Sales",
    keywords: ["digital marketing", "seo optimization", "sem campaign", "social media marketing", "content marketing", "email marketing", "crm software", "lead generation", "marketing automation", "ppc advertising", "google ads", "facebook ads"],
    urlPatterns: [/hubspot\.com/, /mailchimp\.com/, /marketo\.com/, /salesforce\.com/, /semrush\.com/, /ahrefs\.com/, /moz\.com/],
    contentIndicators: ["digital marketing", "seo", "marketing campaign", "lead generation", "crm"],
    weight: 2
  },
  {
    name: "Communication",
    keywords: ["slack", "microsoft teams", "zoom meeting", "discord server", "team chat", "video conferencing", "webex", "google meet", "team collaboration"],
    urlPatterns: [/slack\.com/, /teams\.microsoft\.com/, /zoom\.us/, /discord\.com/, /webex\.com/, /meet\.google\.com/],
    contentIndicators: ["team chat", "video call", "video conferencing", "team collaboration"],
    weight: 2
  },

  // Education & Learning
  {
    name: "Online Courses",
    keywords: ["online course", "udemy", "coursera", "edx", "udacity", "masterclass", "skillshare", "linkedin learning", "certification program", "mooc", "online class", "e-learning"],
    urlPatterns: [/coursera\.org/, /udemy\.com/, /edx\.org/, /udacity\.com/, /skillshare\.com/, /masterclass\.com/, /pluralsight\.com/],
    contentIndicators: ["online course", "certification", "e-learning", "mooc"],
    weight: 3
  },
  {
    name: "Programming Tutorials",
    keywords: ["coding tutorial", "programming tutorial", "learn to code", "javascript tutorial", "python tutorial", "web development tutorial", "freecodecamp", "codecademy", "coding bootcamp", "learn programming"],
    urlPatterns: [/freecodecamp\.org/, /codecademy\.com/, /tutorialspoint\.com/, /w3schools\.com/, /learnpython\.org/],
    contentIndicators: ["coding tutorial", "programming tutorial", "learn to code", "code example"],
    weight: 3
  },
  {
    name: "Academic Research",
    keywords: ["academic research", "research paper", "scientific journal", "google scholar", "pubmed", "arxiv", "thesis", "dissertation", "peer review", "citation", "doi"],
    urlPatterns: [/scholar\.google\.com/, /pubmed\.ncbi\.nlm\.nih\.gov/, /arxiv\.org/, /researchgate\.net/, /jstor\.org/, /sciencedirect\.com/],
    contentIndicators: ["academic paper", "research paper", "scientific journal", "peer review"],
    weight: 2
  },
  {
    name: "Skill Development",
    keywords: ["professional development", "career development", "job skills", "upskilling", "reskilling", "professional certification", "soft skills", "leadership training"],
    urlPatterns: [/linkedin\.com\/learning/],
    contentIndicators: ["professional development", "career growth", "upskilling", "soft skills"],
    weight: 2
  },

  // Entertainment & Media
  {
    name: "Video Streaming",
    keywords: ["youtube", "vimeo", "twitch", "netflix", "hulu", "disney plus", "amazon prime video", "hbo max", "streaming service", "watch movies", "watch shows", "live stream"],
    urlPatterns: [/youtube\.com/, /vimeo\.com/, /twitch\.tv/, /netflix\.com/, /hulu\.com/, /disneyplus\.com/, /hbomax\.com/, /primevideo\.com/],
    contentIndicators: ["streaming service", "watch online", "live stream", "tv shows"],
    weight: 4
  },
  {
    name: "Music & Audio",
    keywords: ["spotify", "apple music", "youtube music", "soundcloud", "bandcamp", "music streaming", "playlist", "podcast app", "audiobook", "tidal", "deezer", "pandora"],
    urlPatterns: [/spotify\.com/, /soundcloud\.com/, /bandcamp\.com/, /music\.apple\.com/, /tidal\.com/, /deezer\.com/, /podcasts\.apple\.com/],
    contentIndicators: ["music streaming", "playlist", "podcast", "audiobook"],
    weight: 3
  },
  {
    name: "Gaming",
    keywords: ["video game", "pc gaming", "steam", "epic games", "ubisoft", "ea games", "nintendo", "playstation", "xbox", "console gaming", "esports", "game review", "gaming news"],
    urlPatterns: [/steampowered\.com/, /store\.steampowered\.com/, /epicgames\.com/, /ign\.com/, /gamespot\.com/, /kotaku\.com/, /polygon\.com/],
    contentIndicators: ["video game", "pc gaming", "console gaming", "esports", "game review"],
    weight: 3
  },
  {
    name: "Content Creation",
    keywords: ["content creator", "blogging platform", "youtuber", "tiktok creator", "influencer marketing", "wordpress blog", "medium blog", "substack newsletter", "podcast hosting", "video creator"],
    urlPatterns: [/wordpress\.com/, /medium\.com/, /substack\.com/, /anchor\.fm/, /buzzsprout\.com/],
    contentIndicators: ["content creator", "blogging", "newsletter", "podcast hosting"],
    weight: 2
  },

  // News & Information
  {
    name: "Technology News",
    keywords: ["tech news", "technology news", "gadget review", "product launch", "silicon valley", "startup news", "venture capital", "tech industry"],
    urlPatterns: [/techcrunch\.com/, /theverge\.com/, /wired\.com/, /arstechnica\.com/, /engadget\.com/, /gizmodo\.com/, /cnet\.com\/news/],
    contentIndicators: ["tech news", "technology news", "product launch", "tech review"],
    weight: 2
  },
  {
    name: "Business News",
    keywords: ["business news", "financial news", "stock market", "wall street", "bloomberg", "wsj", "forbes", "financial times", "economist", "market analysis"],
    urlPatterns: [/bloomberg\.com/, /wsj\.com/, /forbes\.com/, /businessinsider\.com/, /ft\.com/, /economist\.com/, /cnbc\.com/],
    contentIndicators: ["business news", "financial news", "stock market", "market analysis"],
    weight: 2
  },
  {
    name: "Science & Research",
    keywords: ["science news", "scientific discovery", "physics research", "chemistry research", "biology research", "space exploration", "nasa", "astronomy", "climate science", "environmental science"],
    urlPatterns: [/nasa\.gov/, /nature\.com/, /science\.org/, /scientificamerican\.com/, /newscientist\.com/, /phys\.org/],
    contentIndicators: ["science news", "scientific discovery", "space exploration", "climate science"],
    weight: 2
  },
  {
    name: "General News",
    keywords: ["breaking news", "world news", "cnn", "bbc news", "reuters", "new york times", "washington post", "associated press", "news outlet"],
    urlPatterns: [/cnn\.com/, /bbc\.com/, /bbc\.co\.uk/, /nytimes\.com/, /reuters\.com/, /apnews\.com/, /washingtonpost\.com/, /theguardian\.com/],
    contentIndicators: ["breaking news", "world news", "news report", "current events"],
    weight: 2
  },

  // Shopping & Commerce
  {
    name: "E-commerce",
    keywords: ["online shopping", "online store", "buy online", "shopping cart", "checkout", "e-commerce", "shopify store", "aliexpress", "walmart online", "target online"],
    urlPatterns: [/amazon\.com(?!.*aws)/, /shopify\.com/, /aliexpress\.com/, /walmart\.com/, /target\.com/],
    contentIndicators: ["online shopping", "add to cart", "buy now", "e-commerce"],
    exclusionPatterns: ["aws", "amazon web services", "cloud computing", "ec2", "s3 bucket", "lambda function"],
    weight: 3
  },
  {
    name: "Deals & Discounts",
    keywords: ["discount code", "coupon code", "promo code", "black friday deals", "cyber monday deals", "flash sale", "clearance sale", "daily deals", "slickdeals", "retailmenot"],
    urlPatterns: [/slickdeals\.net/, /retailmenot\.com/, /groupon\.com/, /honey\.com/, /rakuten\.com/],
    contentIndicators: ["coupon code", "promo code", "discount code", "daily deals"],
    weight: 3
  },
  {
    name: "Marketplaces",
    keywords: ["online marketplace", "auction site", "classified ads", "craigslist", "facebook marketplace", "offerup", "letgo", "mercari", "poshmark", "ebay auction", "etsy handmade", "buy and sell online", "peer to peer marketplace"],
    urlPatterns: [/ebay\.com/, /etsy\.com/, /craigslist\.org/, /facebook\.com\/marketplace/, /offerup\.com/, /mercari\.com/, /poshmark\.com/],
    contentIndicators: ["online marketplace", "classified ads", "buy and sell", "local deals", "auction", "bid now", "handmade", "vintage"],
    weight: 3
  },
  {
    name: "Product Reviews",
    keywords: ["product review", "product comparison", "best products", "top rated", "product test", "unboxing", "wirecutter", "consumer reports", "buyer guide"],
    urlPatterns: [/cnet\.com\/reviews/, /pcmag\.com\/reviews/, /wirecutter\.com/, /consumerreports\.org/, /rtings\.com/, /tomsguide\.com/],
    contentIndicators: ["product review", "product comparison", "buyer guide", "top rated"],
    weight: 2
  },

  // Healthcare & Pharma (HIGH PRIORITY - check before Personal & Lifestyle)
  {
    name: "Pharmaceutical Companies",
    keywords: ["pharma", "pharmaceutical", "drug", "medicine", "therapeutics", "clinical trials", "fda", "ema", "pipeline", "oncology", "immunology", "neurology", "cardiology", "vaccines", "biosimilar"],
    urlPatterns: [/novartis\.com/, /pfizer\.com/, /roche\.com/, /merck\.com/, /johnson.*johnson/, /abbvie\.com/, /bristol.*myers/, /astrazeneca\.com/, /sanofi\.com/, /gsk\.com/, /glaxosmithkline/, /eli.*lilly/, /lilly\.com/, /bayer\.com/, /takeda\.com/, /amgen\.com/, /gilead\.com/, /biogen\.com/, /regeneron\.com/, /moderna\.com/],
    contentIndicators: ["pharmaceutical", "drug development", "clinical trial", "therapy", "treatment", "patients"],
    weight: 5
  },
  {
    name: "Healthcare Providers",
    keywords: ["hospital", "clinic", "medical center", "healthcare system", "patient care", "emergency", "surgery", "specialist"],
    urlPatterns: [/mayo\.edu/, /clevelandclinic\.org/, /hopkinsmedicine\.org/, /stanfordhealthcare\.org/],
    contentIndicators: ["patient", "appointment", "specialist", "treatment", "care"],
    weight: 4
  },
  {
    name: "Biotech & Research",
    keywords: ["biotech", "biotechnology", "genomics", "gene therapy", "crispr", "molecular", "cell therapy", "research", "r&d"],
    urlPatterns: [/genentech\.com/, /illumina\.com/, /thermofisher\.com/],
    contentIndicators: ["research", "science", "discovery", "innovation", "clinical"],
    weight: 4
  },

  // Personal & Lifestyle
  {
    name: "Health & Fitness",
    keywords: ["fitness", "workout", "exercise", "nutrition", "diet", "wellness", "mental health", "gym", "yoga", "meditation", "weight loss"],
    urlPatterns: [/webmd\.com/, /mayoclinic\.org/, /healthline\.com/, /myfitnesspal\.com/, /fitbit\.com/],
    contentIndicators: ["fitness", "wellness", "exercise", "healthy", "workout"],
    exclusionPatterns: ["pharmaceutical", "pharma", "drug", "clinical trial", "pipeline"],
    weight: 2
  },
  {
    name: "Travel & Leisure",
    keywords: ["travel booking", "vacation planning", "hotel booking", "flight booking", "airbnb", "tripadvisor", "travel destination", "travel guide", "travel tips", "expedia", "kayak"],
    urlPatterns: [/booking\.com/, /airbnb\.com/, /tripadvisor\.com/, /expedia\.com/, /kayak\.com/, /hotels\.com/, /vrbo\.com/, /skyscanner\.com/],
    contentIndicators: ["travel booking", "vacation planning", "hotel booking", "flight deals"],
    weight: 2
  },
  {
    name: "Food & Cooking",
    keywords: ["recipe website", "cooking recipes", "baking recipes", "food blog", "cooking tips", "meal prep", "allrecipes", "food network", "epicurious", "bon appetit", "serious eats"],
    urlPatterns: [/allrecipes\.com/, /foodnetwork\.com/, /epicurious\.com/, /bonappetit\.com/, /seriouseats\.com/, /tasty\.co/, /delish\.com/],
    contentIndicators: ["recipe", "cooking tips", "meal prep", "food blog"],
    weight: 2
  },
  {
    name: "Home & Garden",
    keywords: ["gardening", "interior design", "diy project", "home improvement", "home decor", "furniture", "landscaping", "lawn care", "renovation", "remodel"],
    urlPatterns: [/houzz\.com/, /thisoldhouse\.com/, /hgtv\.com/, /lowes\.com/, /homedepot\.com/, /ikea\.com/, /wayfair\.com/],
    contentIndicators: ["garden", "diy", "decor", "renovation", "furniture", "landscaping"],
    exclusionPatterns: ["homepage", "home page", ".com/home", "go home", "work from home", "pharmaceutical", "pharma"],
    requireWordBoundary: true,
    weight: 2
  },
  {
    name: "Personal Finance",
    keywords: ["personal finance", "budgeting app", "savings account", "investment portfolio", "retirement planning", "debt management", "credit score", "financial planning", "money management", "nerdwallet", "mint app"],
    urlPatterns: [/nerdwallet\.com/, /investopedia\.com/, /bankrate\.com/, /mint\.com/, /personalcapital\.com/, /creditkarma\.com/],
    contentIndicators: ["personal finance", "budgeting", "savings", "retirement planning"],
    weight: 2
  }
];

// Minimum score threshold to avoid weak matches
const MIN_CATEGORY_SCORE = 4;

export function guessCategoryNameFromBookmark(bookmark: {
  url: string;
  title: string;
  description?: string;
  keywords?: string[];
}): string {
  const text = `${bookmark.title} ${bookmark.url} ${bookmark.description || ""} ${bookmark.keywords?.join(" ") || ""}`.toLowerCase();
  const url = bookmark.url.toLowerCase();
  const providedKeywords = bookmark.keywords || [];

  const categoryScores: Record<string, number> = {};

  for (const category of CATEGORY_KEYWORDS) {
    let score = 0;

    // Check exclusion patterns first - if any match, skip this category
    if (category.exclusionPatterns) {
      let excluded = false;
      for (const exclusion of category.exclusionPatterns) {
        if (text.includes(exclusion.toLowerCase())) {
          excluded = true;
          break;
        }
      }
      if (excluded) continue;
    }

    // URL pattern matching (highest weight)
    if (category.urlPatterns) {
      for (const pattern of category.urlPatterns) {
        if (pattern.test(url)) {
          score += 10 * category.weight;
        }
      }
    }

    // Keyword matching with optional word boundary
    for (const keyword of category.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (category.requireWordBoundary) {
        // Use word boundary matching
        const wordBoundaryRegex = new RegExp(`\\b${escapeRegExp(keywordLower)}\\b`, 'i');
        if (wordBoundaryRegex.test(text)) {
          score += category.weight;
        }
      } else {
        if (text.includes(keywordLower)) {
          score += category.weight;
        }
      }
    }

    // SEMANTIC KEYWORD BOOST: Extra weight for provided semantic keywords
    // These are pre-processed keywords with stop words removed
    if (providedKeywords.length > 0) {
      for (const providedKeyword of providedKeywords) {
        const pkLower = providedKeyword.toLowerCase();
        // Check if provided keyword matches category keywords
        for (const catKeyword of category.keywords) {
          if (catKeyword.toLowerCase().includes(pkLower) || 
              pkLower.includes(catKeyword.toLowerCase())) {
            score += 3 * category.weight; // Higher weight for semantic matches
          }
        }
        // Check if provided keyword matches content indicators
        if (category.contentIndicators) {
          for (const indicator of category.contentIndicators) {
            if (indicator.toLowerCase().includes(pkLower) ||
                pkLower.includes(indicator.toLowerCase())) {
              score += 2 * category.weight;
            }
          }
        }
      }
    }

    // Content indicators (medium weight)
    if (category.contentIndicators) {
      for (const indicator of category.contentIndicators) {
        if (text.includes(indicator.toLowerCase())) {
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
        'steampowered.com': 'Gaming',
        'store.steampowered.com': 'Gaming',
        'epicgames.com': 'Gaming',
        'ign.com': 'Gaming',
        'playstation.com': 'Gaming',
        'xbox.com': 'Gaming',
        'nintendo.com': 'Gaming',
        'ea.com': 'Gaming',
        'ubisoft.com': 'Gaming',
        'blizzard.com': 'Gaming',
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
        'shopify.com': 'E-commerce',
        'walmart.com': 'E-commerce',
        'target.com': 'E-commerce',
        'ebay.com': 'Marketplaces',
        'etsy.com': 'Marketplaces',
        'craigslist.org': 'Marketplaces',
        'mercari.com': 'Marketplaces',
        'poshmark.com': 'Marketplaces',
        'offerup.com': 'Marketplaces',
        'slickdeals.net': 'Deals & Discounts',
        'retailmenot.com': 'Deals & Discounts',
        'groupon.com': 'Deals & Discounts',
        'honey.com': 'Deals & Discounts',
        'cnet.com': 'Product Reviews',
        'pcmag.com': 'Product Reviews',
        'wirecutter.com': 'Product Reviews',
        'webmd.com': 'Health & Fitness',
        'healthline.com': 'Health & Fitness',
        'myfitnesspal.com': 'Health & Fitness',
        'fitbit.com': 'Health & Fitness',
        // Healthcare & Pharma
        'novartis.com': 'Pharmaceutical Companies',
        'pfizer.com': 'Pharmaceutical Companies',
        'roche.com': 'Pharmaceutical Companies',
        'merck.com': 'Pharmaceutical Companies',
        'abbvie.com': 'Pharmaceutical Companies',
        'astrazeneca.com': 'Pharmaceutical Companies',
        'sanofi.com': 'Pharmaceutical Companies',
        'gsk.com': 'Pharmaceutical Companies',
        'lilly.com': 'Pharmaceutical Companies',
        'bayer.com': 'Pharmaceutical Companies',
        'takeda.com': 'Pharmaceutical Companies',
        'amgen.com': 'Pharmaceutical Companies',
        'gilead.com': 'Pharmaceutical Companies',
        'biogen.com': 'Pharmaceutical Companies',
        'regeneron.com': 'Pharmaceutical Companies',
        'moderna.com': 'Pharmaceutical Companies',
        'mayoclinic.org': 'Healthcare Providers',
        'clevelandclinic.org': 'Healthcare Providers',
        'hopkinsmedicine.org': 'Healthcare Providers',
        'nih.gov': 'Biotech & Research',
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

  // Find the category with the highest score (must exceed minimum threshold)
  let bestCategory = "Other";
  let maxScore = 0;

  for (const [categoryName, score] of Object.entries(categoryScores)) {
    if (score > maxScore && score >= MIN_CATEGORY_SCORE) {
      maxScore = score;
      bestCategory = categoryName;
    }
  }

  return bestCategory;
}

// Helper function to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to extract domain from URL (strips www. prefix)
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    let hostname = urlObj.hostname;
    // Strip www. prefix for consistent matching
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname;
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
