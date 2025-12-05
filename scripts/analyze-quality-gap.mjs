import { readFileSync } from 'fs';

const results = JSON.parse(readFileSync('./test-results/v2-run-1764880070264/all-results.json', 'utf8'));

// Classify by score: excellent >= 85, good 70-84, needs_work < 70
const excellent = results.filter(r => r.quality_score >= 85);
const goods = results.filter(r => r.quality_score >= 70 && r.quality_score < 85);
const needsWork = results.filter(r => r.quality_score < 70);
const nonExcellent = results.filter(r => r.quality_score < 85);

console.log('=== NON-EXCELLENT PATTERN ANALYSIS ===');
console.log('Total non-excellent:', nonExcellent.length);
console.log('  Good:', goods.length);
console.log('  Needs Work:', needsWork.length);

// Group by test type
const byTestType = {};
nonExcellent.forEach(r => {
  const type = r.test_type || 'unknown';
  byTestType[type] = (byTestType[type] || 0) + 1;
});
console.log('\nBy Test Type:');
Object.entries(byTestType).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
  console.log('  ' + k + ': ' + v);
});

// Group by persona (industry proxy)
const byPersona = {};
nonExcellent.forEach(r => {
  // Extract industry from persona_id like "trades-001" -> "trades"
  const ind = r.persona_id ? r.persona_id.split('-')[0] : 'unknown';
  byPersona[ind] = (byPersona[ind] || 0) + 1;
});
console.log('\nBy Persona Type (top 8):');
Object.entries(byPersona).sort((a,b) => b[1]-a[1]).slice(0,8).forEach(([k,v]) => {
  console.log('  ' + k + ': ' + v);
});

// Analyze score patterns
const scores = nonExcellent.map(r => r.score || r.quality_score || 0).filter(s => s > 0);
if (scores.length > 0) {
  console.log('\nScore Distribution:');
  console.log('  Min:', Math.min(...scores));
  console.log('  Max:', Math.max(...scores));
  console.log('  Avg:', (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1));
}

// Analyze scoring breakdown patterns if available
console.log('\n=== SAMPLE NEEDS_WORK RESULTS ===');
needsWork.slice(0, 3).forEach((r, i) => {
  console.log('\nNeeds Work Sample', i+1 + ':');
  console.log('  Section:', r.sectionType || r.section_type);
  console.log('  Industry:', r.industry);
  console.log('  Score:', r.score || r.quality_score);
  if (r.issues && r.issues.length > 0) console.log('  Issues:', r.issues.join(', '));
  if (r.scoring_breakdown) console.log('  Breakdown:', JSON.stringify(r.scoring_breakdown));
});

console.log('\n=== SAMPLE GOOD (70-85 range) RESULTS ===');
const goodsWithScores = goods.filter(r => {
  const s = r.score || r.quality_score || 0;
  return s >= 70 && s < 85;
}).slice(0, 3);

goodsWithScores.forEach((r, i) => {
  console.log('\nGood Sample', i+1 + ':');
  console.log('  Section:', r.sectionType || r.section_type);
  console.log('  Industry:', r.industry);
  console.log('  Score:', r.score || r.quality_score);
  if (r.issues && r.issues.length > 0) console.log('  Issues:', r.issues.join(', '));
  if (r.scoring_breakdown) console.log('  Breakdown:', JSON.stringify(r.scoring_breakdown));
});

// Identify most common failing checks
const failingChecks = {};
nonExcellent.forEach(r => {
  if (r.quality_checks) {
    r.quality_checks.filter(c => !c.passed).forEach(c => {
      failingChecks[c.check] = (failingChecks[c.check] || 0) + 1;
    });
  }
});

console.log('\n=== MOST COMMON FAILING CHECKS ===');
Object.entries(failingChecks).sort((a,b) => b[1]-a[1]).slice(0, 10).forEach(([check, count]) => {
  const pct = ((count / nonExcellent.length) * 100).toFixed(1);
  console.log('  ' + count + 'x (' + pct + '%) - ' + check);
});

// Check for brand rule violations in responses
console.log('\n=== BRAND VIOLATIONS CHECK ===');
const brandViolations = {
  phoneNumbers: 0,
  bookACall: 0,
  wrongCTA: 0,
  weLanguage: 0
};

results.forEach(r => {
  const resp = r.response || '';
  if (/\d{10}|\d{4}[\s-]\d{3}[\s-]\d{3}/.test(resp)) brandViolations.phoneNumbers++;
  if (/book a call|schedule a call|call us/i.test(resp)) brandViolations.bookACall++;
  if (/book a free|schedule/i.test(resp) && !/start free trial/i.test(resp)) brandViolations.wrongCTA++;
  if (/\bwe\b.*\bour\b|\bour\b.*\bwe\b/i.test(resp)) brandViolations.weLanguage++;
});

Object.entries(brandViolations).forEach(([k, v]) => {
  console.log('  ' + k + ': ' + v + ' violations');
});

// Summary recommendation
console.log('\n=== RECOMMENDATION ===');
const topIssue = Object.entries(failingChecks).sort((a,b) => b[1]-a[1])[0];
if (topIssue) {
  console.log('Top issue to fix: "' + topIssue[0] + '" (' + topIssue[1] + ' occurrences)');
}
