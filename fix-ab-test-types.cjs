// Fix A/B Testing test file to match actual interface
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'tests/integration/ab-testing/statistical-analysis.test.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace variant object patterns
content = content.replace(/variantId: '([^']+)',/g, (match, id) => {
  const name = id.charAt(0).toUpperCase() + id.slice(1);
  return `variantId: '${id}',\n        variantName: '${name}',`;
});

// Add conversionRate where missing
content = content.replace(/conversions: (\d+),\s*$/gm, (match, conversions) => {
  return match; // Keep as is, will add conversionRate separately
});

// More targeted fix: add conversionRate after conversions field
const lines = content.split('\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);

  // If line has conversions and next line doesn't have conversionRate
  if (lines[i].includes('conversions:') && !lines[i+1]?.includes('conversionRate')) {
    const indent = lines[i].match(/^\s*/)[0];
    const conversions = lines[i].match(/conversions:\s*(\d+)/)?.[1];

    // Look back to find sampleSize
    let sampleSize = null;
    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
      const match = lines[j].match(/sampleSize:\s*(\d+)/);
      if (match) {
        sampleSize = match[1];
        break;
      }
    }

    if (conversions && sampleSize) {
      const rate = (parseFloat(conversions) / parseFloat(sampleSize)).toFixed(2);
      newLines.push(`${indent}conversionRate: ${rate},`);
    }
  }
}

content = newLines.join('\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed A/B testing test file!');
