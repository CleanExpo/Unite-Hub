#!/usr/bin/env node

/**
 * CLI Script: Competitor Website Scraper
 * Usage: node scripts/scraping/scrape-competitor.mjs <url> [options]
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Competitor Website Scraper CLI

Usage:
  node scripts/scraping/scrape-competitor.mjs <url> [options]

Arguments:
  url                Target website URL to analyze

Options:
  --type <type>      Analysis type: basic, seo, full, competitor (default: competitor)
  --safe             Use safe mode (extended delays, caching, request limits - NO VPN REQUIRED)
  --save             Save results to file
  --output <path>    Output file path (default: ./competitor-analysis.json)
  --help, -h         Show this help message

Examples:
  # Full competitor analysis
  node scripts/scraping/scrape-competitor.mjs https://competitor.com

  # SEO-only analysis
  node scripts/scraping/scrape-competitor.mjs https://competitor.com --type seo

  # Save results to file
  node scripts/scraping/scrape-competitor.mjs https://competitor.com --save --output results.json

  # Safe mode (no VPN required - extended delays, caching, request limits)
  node scripts/scraping/scrape-competitor.mjs https://competitor.com --safe --type competitor

Features:
  - Basic website scraping (metadata, links, images, content)
  - SEO analysis (title, description, headings, structured data)
  - Competitor intelligence (pricing, features, technologies)
  - Change monitoring (compare with previous analysis)
  - Safe mode (5-10s delays, 24h caching, request limits - no VPN needed)
  `);
  process.exit(0);
}

const url = args[0];
const typeIndex = args.indexOf('--type');
const analysisType = typeIndex !== -1 ? args[typeIndex + 1] : 'competitor';
const safeMode = args.includes('--safe');
const saveResults = args.includes('--save');
const outputIndex = args.indexOf('--output');
const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : './competitor-analysis.json';

// Validate URL
try {
  new URL(url);
} catch {
  console.error('Error: Invalid URL format');
  process.exit(1);
}

// Determine which Python script to run
let scriptPath;
let scriptArgs = [url];

if (safeMode) {
  // Use safe-scraper.py for all types when --safe is enabled
  scriptPath = path.join(__dirname, '..', '..', 'src', 'lib', 'scraping', 'safe-scraper.py');

  if (analysisType === 'competitor' || analysisType === 'full') {
    scriptArgs.push('--competitor');
  }

  console.log(`\n🛡️ SAFE MODE ENABLED - No VPN required`);
  console.log(`   ✅ Extended delays (5-10 seconds)`);
  console.log(`   ✅ Request caching (24 hours)`);
  console.log(`   ✅ Request limits (${analysisType === 'competitor' ? '10 max' : '50 max'})`);
  console.log(`   ✅ Realistic user agents\n`);
} else {
  switch (analysisType) {
    case 'basic':
      scriptPath = path.join(__dirname, '..', '..', 'src', 'lib', 'scraping', 'web-scraper.py');
      break;
    case 'seo':
      scriptPath = path.join(__dirname, '..', '..', 'src', 'lib', 'scraping', 'advanced-scraper.py');
      break;
    case 'full':
    case 'competitor':
      scriptPath = path.join(__dirname, '..', '..', 'src', 'lib', 'scraping', 'competitor-intelligence.py');
      break;
    default:
      console.error(`Error: Invalid analysis type: ${analysisType}`);
      console.error('Valid types: basic, seo, full, competitor');
      process.exit(1);
  }
}

console.log(`🔍 Analyzing: ${url}`);
console.log(`📊 Analysis type: ${analysisType}\n`);

// Run Python scraper
const pythonProcess = spawn('python', [scriptPath, ...scriptArgs]);

let stdout = '';
let stderr = '';

pythonProcess.stdout.on('data', (data) => {
  const output = data.toString();
  stdout += output;
  // Show progress logs
  if (output.includes('INFO')) {
    console.log(output.trim());
  }
});

pythonProcess.stderr.on('data', (data) => {
  stderr += data.toString();
  console.error(data.toString());
});

pythonProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Scraping failed with code ${code}`);
    if (stderr) {
      console.error('Error details:', stderr);
    }
    process.exit(code);
  }

  try {
    // Parse and display results
    const result = JSON.parse(stdout);

    console.log('\n✅ Analysis Complete!\n');

    // Display summary based on analysis type
    if (result.basic_analysis) {
      console.log('📄 Basic Info:');
      console.log(`  Title: ${result.basic_analysis.basic_info?.title || 'N/A'}`);
      console.log(`  Description: ${result.basic_analysis.basic_info?.description?.substring(0, 100) || 'N/A'}...`);
    }

    if (result.seo_analysis) {
      console.log('\n🔍 SEO Analysis:');
      console.log(`  Title: ${result.seo_analysis.title?.text || 'N/A'} (${result.seo_analysis.title?.optimal ? '✅ Optimal' : '⚠️ Needs work'})`);
      console.log(`  Meta Description: ${result.seo_analysis.description?.optimal ? '✅ Optimal' : '⚠️ Needs work'}`);
      console.log(`  Word Count: ${result.seo_analysis.content?.word_count || 'N/A'}`);
    }

    if (result.pricing_info) {
      console.log('\n💰 Pricing:');
      console.log(`  Has Pricing Page: ${result.pricing_info.has_pricing_page ? '✅ Yes' : '❌ No'}`);
      if (result.pricing_info.detected_plans?.length > 0) {
        console.log(`  Plans Found: ${result.pricing_info.detected_plans.length}`);
      }
    }

    if (result.technologies) {
      console.log('\n🛠️ Technologies:');
      const techs = [
        ...result.technologies.frontend || [],
        ...result.technologies.frameworks || []
      ];
      if (techs.length > 0) {
        console.log(`  ${techs.join(', ')}`);
      } else {
        console.log('  None detected');
      }
    }

    if (result.insights) {
      console.log('\n💡 Insights:');
      if (result.insights.strengths?.length > 0) {
        console.log('  Strengths:');
        result.insights.strengths.forEach(s => console.log(`    ✅ ${s}`));
      }
      if (result.insights.weaknesses?.length > 0) {
        console.log('  Weaknesses:');
        result.insights.weaknesses.forEach(w => console.log(`    ⚠️ ${w}`));
      }
      if (result.insights.recommendations?.length > 0) {
        console.log('  Recommendations:');
        result.insights.recommendations.forEach(r => console.log(`    💡 ${r}`));
      }
    }

    // Save to file if requested
    if (saveResults) {
      import('fs').then(fs => {
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`\n💾 Results saved to: ${outputPath}`);
      });
    }

    console.log('\n');

  } catch (error) {
    console.error('\n❌ Failed to parse results:', error.message);
    console.log('\nRaw output:', stdout);
    process.exit(1);
  }
});
