import { validateUrl } from '../src/lib/metadataScraper';

const testUrls = [
  // Sites that fail HEAD but work with GET
  'https://www.hackerrank.com/',
  'https://news.ycombinator.com/',
  'https://spring.io/guides/tutorials/bookmarks/',
  'https://medium.com/coderbyte/the-10-best-coding-challenge-websites-for-2018-12b57645b654',
  
  // Standard sites that should work
  'https://www.google.com/',
  'https://github.com/',
  
  // Localhost/internal URLs (should be accepted without validation)
  'http://localhost:3000/',
  'http://127.0.0.1:8080/',
  'http://192.168.1.1/',
  
  // URLs that are genuinely broken
  'https://definitely-not-a-real-domain-12345.com/',
];

async function testValidation() {
  console.log('Testing URL Validation...\n');
  
  for (const url of testUrls) {
    console.log(`Testing: ${url}`);
    const start = Date.now();
    const isValid = await validateUrl(url);
    const elapsed = Date.now() - start;
    console.log(`  Result: ${isValid ? '✅ VALID' : '❌ INVALID'} (${elapsed}ms)\n`);
  }
}

testValidation().catch(console.error);
