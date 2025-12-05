#!/usr/bin/env node
// scripts/analyze-test-quality.mjs
// Analyze overnight test results for quality issues

import fs from 'fs';
import path from 'path';

const resultsPath = process.argv[2] || 'test-results/run-1764830453643/all-results.json';
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

console.log('');
console.log('='.repeat(60));
console.log('  SYNTHEX TEST QUALITY ANALYSIS');
console.log('='.repeat(60));
console.log('');

// ============================================
// 1. PERSPECTIVE ANALYSIS
// ============================================

console.log('1. PERSPECTIVE ANALYSIS');
console.log('-'.repeat(40));

const contentGen = results.filter(r => r.test_type === 'content_generation');
const wrongPerspective = [];
const correctPerspective = [];

for (const r of contentGen) {
  const response = r.response.toLowerCase();

  // Check if the content is selling Synthex services TO the business
  // Instead of creating content the business can use FOR their customers
  const sellingToPatterns = [
    'we connect',
    'we help',
    'we deliver',
    'our expert',
    'our team',
    'our service',
    'contact us',
    'we provide',
    'we offer',
    'our solutions'
  ];

  const isSellingSynthex = sellingToPatterns.some(p => response.includes(p));

  if (isSellingSynthex) {
    wrongPerspective.push(r);
  } else {
    correctPerspective.push(r);
  }
}

console.log(`Wrong perspective (selling TO business): ${wrongPerspective.length}/${contentGen.length} (${Math.round(wrongPerspective.length/contentGen.length*100)}%)`);
console.log(`Correct perspective (content FOR business): ${correctPerspective.length}/${contentGen.length} (${Math.round(correctPerspective.length/contentGen.length*100)}%)`);
console.log('');

console.log('Examples of WRONG perspective:');
wrongPerspective.slice(0, 3).forEach((r, i) => {
  console.log(`  ${i+1}. ${r.persona_id}:`);
  console.log(`     "${r.response.substring(0, 120)}..."`);
});
console.log('');

console.log('Examples of CORRECT perspective:');
correctPerspective.slice(0, 3).forEach((r, i) => {
  console.log(`  ${i+1}. ${r.persona_id}:`);
  console.log(`     "${r.response.substring(0, 120)}..."`);
});
console.log('');

// ============================================
// 2. GENERIC LANGUAGE ANALYSIS
// ============================================

console.log('2. GENERIC LANGUAGE ANALYSIS');
console.log('-'.repeat(40));

const genericWords = ['proven', 'tailored', 'solutions', 'seamless', 'cutting-edge', 'innovative', 'leverage', 'synergy', 'holistic', 'robust'];
const genericCounts = {};

for (const word of genericWords) {
  genericCounts[word] = 0;
}

for (const r of results) {
  const response = r.response.toLowerCase();
  for (const word of genericWords) {
    if (response.includes(word)) {
      genericCounts[word]++;
    }
  }
}

console.log('Overused generic words (across all 1000 responses):');
Object.entries(genericCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([word, count]) => {
    const bar = '#'.repeat(Math.round(count / 10));
    console.log(`  ${word.padEnd(15)} ${count.toString().padStart(4)} ${bar}`);
  });
console.log('');

// ============================================
// 3. LOCAL CONTEXT ANALYSIS
// ============================================

console.log('3. LOCAL/AUSTRALIAN CONTEXT ANALYSIS');
console.log('-'.repeat(40));

const localTerms = ['australia', 'australian', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'local', 'nsw', 'vic', 'qld'];
let withLocalContext = 0;
let withoutLocalContext = 0;

for (const r of results) {
  const response = r.response.toLowerCase();
  const hasLocal = localTerms.some(term => response.includes(term));
  if (hasLocal) {
    withLocalContext++;
  } else {
    withoutLocalContext++;
  }
}

console.log(`With local/Australian context: ${withLocalContext}/1000 (${Math.round(withLocalContext/10)}%)`);
console.log(`Without local context: ${withoutLocalContext}/1000 (${Math.round(withoutLocalContext/10)}%)`);
console.log('');

// ============================================
// 4. ACTIONABILITY ANALYSIS
// ============================================

console.log('4. ACTIONABILITY ANALYSIS');
console.log('-'.repeat(40));

const actionWords = ['step', 'action', 'implement', 'start', 'create', 'build', 'launch', 'setup', 'contact', 'call', 'visit', 'book'];
const campaigns = results.filter(r => r.test_type === 'campaign_strategy');
let actionable = 0;

for (const r of campaigns) {
  const response = r.response.toLowerCase();
  const hasAction = actionWords.some(word => response.includes(word));
  if (hasAction) actionable++;
}

console.log(`Campaign strategies with action words: ${actionable}/${campaigns.length} (${Math.round(actionable/campaigns.length*100)}%)`);
console.log('');

// ============================================
// 5. RESPONSE LENGTH ANALYSIS
// ============================================

console.log('5. RESPONSE LENGTH ANALYSIS');
console.log('-'.repeat(40));

const byType = {};
const testTypes = ['brand_analysis', 'content_generation', 'seo_audit', 'competitor_analysis', 'campaign_strategy'];

for (const type of testTypes) {
  const typeResults = results.filter(r => r.test_type === type);
  const lengths = typeResults.map(r => r.response.length);
  byType[type] = {
    min: Math.min(...lengths),
    max: Math.max(...lengths),
    avg: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
  };
}

console.log('Average response length by test type:');
for (const [type, stats] of Object.entries(byType)) {
  const bar = '█'.repeat(Math.round(stats.avg / 50));
  console.log(`  ${type.padEnd(22)} avg:${stats.avg.toString().padStart(5)} chars  ${bar}`);
}
console.log('');

// ============================================
// 6. QUALITY SCORE SUMMARY
// ============================================

console.log('='.repeat(60));
console.log('  QUALITY SCORE SUMMARY');
console.log('='.repeat(60));
console.log('');

const perspectiveScore = Math.round(correctPerspective.length / contentGen.length * 100);
const localScore = Math.round(withLocalContext / 10);
const actionScore = Math.round(actionable / campaigns.length * 100);
const genericScore = 100 - Math.round(genericCounts['solutions'] / 10); // Inverse

console.log(`Perspective Accuracy:  ${perspectiveScore}%  ${perspectiveScore >= 70 ? '✓' : '✗ NEEDS WORK'}`);
console.log(`Local Context:         ${localScore}%  ${localScore >= 50 ? '✓' : '✗ NEEDS WORK'}`);
console.log(`Actionability:         ${actionScore}%  ${actionScore >= 80 ? '✓' : '✗ NEEDS WORK'}`);
console.log(`Unique Language:       ${genericScore}%  ${genericScore >= 70 ? '✓' : '✗ NEEDS WORK'}`);
console.log('');

const overallScore = Math.round((perspectiveScore + localScore + actionScore + genericScore) / 4);
console.log(`OVERALL QUALITY SCORE: ${overallScore}%`);
console.log('');

// ============================================
// 7. RECOMMENDATIONS
// ============================================

console.log('='.repeat(60));
console.log('  RECOMMENDATIONS FOR IMPROVEMENT');
console.log('='.repeat(60));
console.log('');

if (perspectiveScore < 70) {
  console.log('🔧 PERSPECTIVE FIX:');
  console.log('   Update prompts to explicitly state:');
  console.log('   "Generate content that [BUSINESS_NAME] can use to market');
  console.log('   to THEIR customers, not content about helping them."');
  console.log('');
}

if (localScore < 50) {
  console.log('🔧 LOCAL CONTEXT FIX:');
  console.log('   Add to prompts: "Include Australian-specific references,');
  console.log('   local terminology, and mention the business location."');
  console.log('');
}

if (genericScore < 70) {
  console.log('🔧 GENERIC LANGUAGE FIX:');
  console.log('   Add to prompts: "Avoid generic marketing buzzwords like');
  console.log('   proven, solutions, seamless, innovative. Use specific,');
  console.log('   concrete language instead."');
  console.log('');
}

console.log('Done.');
