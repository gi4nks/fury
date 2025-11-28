import { 
  extractSemanticKeywords, 
  processBookmarkText, 
  getDomainHints,
  extractUrlKeywords,
  cleanText,
  STOP_WORDS
} from '../src/lib/textProcessor';

console.log('=== Text Processing Demo ===\n');

// Test 1: Clean text and remove noise
console.log('1. Text Cleaning Demo:');
const dirtyText = "Welcome to Our AMAZING Website! Click Here to Learn More... https://example.com contact@email.com";
console.log(`   Input: "${dirtyText}"`);
console.log(`   Cleaned: "${cleanText(dirtyText)}"`);

// Test 2: Extract keywords from URL
console.log('\n2. URL Keyword Extraction:');
const urls = [
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  'https://www.coursera.org/learn/machine-learning',
  'https://github.com/facebook/react/issues/12345'
];
for (const url of urls) {
  console.log(`   ${url}`);
  console.log(`   Keywords: ${extractUrlKeywords(url).join(', ')}`);
}

// Test 3: Domain hints
console.log('\n3. Domain Hints:');
const hintUrls = [
  'https://docs.github.com/en/actions',
  'https://blog.medium.com/technology',
  'https://shop.nike.com/running-shoes',
  'https://learn.microsoft.com/azure'
];
for (const url of hintUrls) {
  console.log(`   ${url}`);
  console.log(`   Hints: ${getDomainHints(url).join(', ') || '(none)'}`);
}

// Test 4: Semantic keyword extraction
console.log('\n4. Semantic Keyword Extraction:');
const texts = [
  "React is a JavaScript library for building user interfaces. It uses a virtual DOM for efficient rendering.",
  "Machine learning models trained on large datasets can achieve state-of-the-art performance in natural language processing tasks.",
  "Buy the best deals on electronics! Save up to 50% on TVs, laptops, and more during our annual sale event."
];
for (const text of texts) {
  console.log(`   Input: "${text.substring(0, 60)}..."`);
  console.log(`   Keywords: ${extractSemanticKeywords(text).slice(0, 8).join(', ')}`);
}

// Test 5: Full bookmark processing
console.log('\n5. Full Bookmark Processing:');
const bookmarks = [
  {
    url: 'https://www.tensorflow.org/tutorials/keras/classification',
    title: 'Basic classification: Classify images of clothing | TensorFlow Core',
    description: 'Learn how to train a neural network model to classify images of clothing, like sneakers and shirts.'
  },
  {
    url: 'https://www.allrecipes.com/recipe/24002/famous-butter-chicken/',
    title: 'Famous Butter Chicken Recipe',
    description: 'This is an easy recipe for butter chicken - a classic Indian dish with tender chicken in a mildly spiced tomato sauce.'
  },
  {
    url: 'https://www.novartis.com/research-development/pipeline',
    title: 'Research & Development Pipeline | Novartis',
    description: 'Explore our innovative R&D pipeline with promising drug candidates in oncology, immunology, and cardiovascular diseases.'
  }
];

for (const bm of bookmarks) {
  console.log(`\n   URL: ${bm.url}`);
  console.log(`   Title: ${bm.title}`);
  const result = processBookmarkText(bm.url, bm.title, bm.description);
  console.log(`   Extracted Keywords: ${result.keywords.slice(0, 10).join(', ')}`);
  console.log(`   URL Keywords: ${result.urlKeywords.join(', ')}`);
}

// Test 6: Stop word count
console.log('\n6. Stop Words Statistics:');
console.log(`   Total stop words in dictionary: ${STOP_WORDS.size}`);

console.log('\n=== Demo Complete ===');
