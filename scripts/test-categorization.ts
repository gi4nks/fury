import { guessCategoryNameFromBookmark } from '../src/lib/categorization';

const testCases = [
  // Healthcare & Pharma
  { url: 'https://www.novartis.com/', title: 'Novartis | Home', expected: ['Pharmaceutical', 'Healthcare', 'Medical'], desc: 'Pharmaceutical company' },
  { url: 'https://www.pfizer.com/', title: 'Pfizer | Homepage', expected: ['Pharmaceutical', 'Healthcare', 'Medical'], desc: 'Pharmaceutical company' },
  
  // Home & Garden - should NOT match pharmaceutical
  { url: 'https://www.homedepot.com/', title: 'The Home Depot', expected: ['Home', 'Garden', 'DIY'], desc: 'Home improvement store' },
  { url: 'https://www.ikea.com/', title: 'IKEA - Furniture', expected: ['Home', 'Furniture', 'Interior'], desc: 'Furniture store' },
  
  // Mobile Development
  { url: 'https://developer.apple.com/ios/', title: 'iOS Development', expected: ['Mobile', 'iOS', 'Development'], desc: 'iOS development' },
  { url: 'https://developer.android.com/', title: 'Android Developers', expected: ['Android', 'Mobile', 'Development'], desc: 'Android development' },
  
  // Cloud & DevOps
  { url: 'https://aws.amazon.com/', title: 'Amazon Web Services', expected: ['Cloud', 'AWS', 'Infrastructure'], desc: 'Cloud platform' },
  { url: 'https://kubernetes.io/', title: 'Kubernetes', expected: ['Kubernetes', 'Container', 'DevOps'], desc: 'Container orchestration' },
  
  // Photography
  { url: 'https://www.nationalgeographic.com/photography/', title: 'National Geographic Photography', expected: ['Photography', 'Photo'], desc: 'Photography' },
  
  // Gaming
  { url: 'https://store.steampowered.com/', title: 'Steam Store', expected: ['Gaming', 'Steam', 'Game'], desc: 'Gaming platform' },
  { url: 'https://www.playstation.com/', title: 'PlayStation', expected: ['Gaming', 'PlayStation', 'Console'], desc: 'Gaming console' },
  
  // Marketing
  { url: 'https://www.hubspot.com/', title: 'HubSpot | Marketing Platform', expected: ['Marketing', 'CRM', 'Digital'], desc: 'Marketing platform' },
  
  // Travel
  { url: 'https://www.booking.com/', title: 'Booking.com | Hotels', expected: ['Travel', 'Hotel', 'Booking'], desc: 'Travel booking' },
  { url: 'https://www.tripadvisor.com/', title: 'Tripadvisor', expected: ['Travel', 'Trip', 'Review'], desc: 'Travel reviews' },
  
  // Food & Cooking
  { url: 'https://www.allrecipes.com/', title: 'Allrecipes | Recipes', expected: ['Recipe', 'Cooking', 'Food'], desc: 'Recipe site' },
  
  // Product Reviews
  { url: 'https://www.cnet.com/reviews/', title: 'CNET Reviews', expected: ['Review', 'Tech', 'Product'], desc: 'Tech reviews' },
  { url: 'https://www.wirecutter.com/', title: 'Wirecutter', expected: ['Review', 'Best', 'Product'], desc: 'Product reviews' },
  
  // Graphic Design
  { url: 'https://www.figma.com/', title: 'Figma: Design Tool', expected: ['Design', 'Figma', 'UI'], desc: 'Design tool' },
  { url: 'https://www.canva.com/', title: 'Canva', expected: ['Design', 'Graphic', 'Canva'], desc: 'Graphic design' },
  
  // Deals
  { url: 'https://www.groupon.com/', title: 'Groupon Deals', expected: ['Deal', 'Coupon', 'Discount'], desc: 'Deals site' },
  { url: 'https://slickdeals.net/', title: 'Slickdeals', expected: ['Deal', 'Discount', 'Bargain'], desc: 'Deals forum' },
  
  // Marketplaces
  { url: 'https://www.ebay.com/', title: 'eBay', expected: ['eBay', 'Marketplace', 'Auction'], desc: 'Marketplace' },
  { url: 'https://www.etsy.com/', title: 'Etsy', expected: ['Etsy', 'Marketplace', 'Handmade'], desc: 'Handmade marketplace' },
];

function runTests() {
  console.log('Running comprehensive categorization tests...\n');
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    const result = guessCategoryNameFromBookmark({ url: test.url, title: test.title, description: '' });
    const resultLower = result.toLowerCase();
    const matchesAny = test.expected.some(exp => resultLower.includes(exp.toLowerCase()));
    
    if (matchesAny) {
      console.log(`✅ PASS: ${test.desc}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   Result: "${result}"`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.desc}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   Title: ${test.title}`);
      console.log(`   Expected to contain one of: ${test.expected.join(', ')}`);
      console.log(`   Got: "${result}"`);
      failed++;
    }
    console.log('');
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
