#!/usr/bin/env node

/**
 * SEO Intelligence CLI - Powered by Perplexity Sonar
 * Real-time SEO research with citations
 *
 * Usage:
 *   node scripts/seo-intelligence.mjs research "local SEO"
 *   node scripts/seo-intelligence.mjs eeat
 *   node scripts/seo-intelligence.mjs gmb
 *   node scripts/seo-intelligence.mjs geo-search
 *   node scripts/seo-intelligence.mjs backlinks
 *   node scripts/seo-intelligence.mjs comprehensive "e-commerce SEO"
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PerplexitySonar from '../src/lib/ai/perplexity-sonar.ts';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

dotenv.config({ path: envPath });

const args = process.argv.slice(2);
const command = args[0];
const topic = args.slice(1).join(' ') || 'general SEO';

if (!command || command === '--help' || command === '-h') {
  console.log(`
SEO Intelligence CLI - Powered by Perplexity Sonar
Real-time SEO research with verified citations

Usage:
  node scripts/seo-intelligence.mjs <command> [topic]

Commands:
  research <topic>      Get latest SEO trends for a specific topic
  eeat                  Research E-E-A-T guidelines and requirements
  gmb                   Get Google Business Profile optimization strategies
  geo-search            Research GEO search and voice search trends
  bing                  Get Bing SEO strategies and ranking factors
  backlinks             Research viable backlink building strategies
  comprehensive <topic> Full SEO report (all topics combined)
  --help, -h            Show this help message

Examples:
  # Latest local SEO trends
  node scripts/seo-intelligence.mjs research "local SEO"

  # E-E-A-T guidelines
  node scripts/seo-intelligence.mjs eeat

  # Comprehensive e-commerce SEO report
  node scripts/seo-intelligence.mjs comprehensive "e-commerce SEO"

  # Google Business Profile strategies
  node scripts/seo-intelligence.mjs gmb

Features:
  ✅ Real-time web data (not cached LLM knowledge)
  ✅ Verified citations from trusted sources
  ✅ Focuses on latest 2025 trends
  ✅ E-E-A-T, GEO search, GMB, Bing integration
  ✅ Automatic report generation
  `);
  process.exit(0);
}

// Initialize Perplexity Sonar
console.log('🚀 Initializing Perplexity Sonar API...\n');

const sonar = new PerplexitySonar();

async function displayResult(result, title) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 ${title}`);
  console.log('='.repeat(80));
  console.log(`\n${result.answer}\n`);

  if (result.citations && result.citations.length > 0) {
    console.log('📚 Citations:');
    result.citations.forEach((citation) => {
      console.log(`  ${citation.index}. ${citation.title}`);
      console.log(`     ${citation.url}\n`);
    });
  }

  console.log('='.repeat(80));
}

async function saveReport(content, filename) {
  const reportsDir = path.join(process.cwd(), 'reports', 'seo');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filepath = path.join(reportsDir, filename);
  fs.writeFileSync(filepath, content);

  console.log(`\n✅ Report saved to: ${filepath}`);
}

async function main() {
  try {
    switch (command) {
      case 'research':
      case 'trends':
        console.log(`🔍 Researching latest SEO trends for: ${topic}\n`);
        const trends = await sonar.getLatestSEOTrends(topic);
        await displayResult(trends, `Latest SEO Trends: ${topic}`);
        await saveReport(
          `# SEO Trends: ${topic}\n\n${trends.answer}\n\n## Citations\n${trends.citations.map((c) => `${c.index}. [${c.title}](${c.url})`).join('\n')}`,
          `SEO_Trends_${topic.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`
        );
        break;

      case 'eeat':
        console.log('🎯 Researching E-E-A-T guidelines...\n');
        const eeat = await sonar.researchEEAT();
        await displayResult(eeat, 'E-E-A-T Guidelines & Requirements');
        await saveReport(
          `# E-E-A-T Guidelines & Requirements\n\n${eeat.answer}\n\n## Citations\n${eeat.citations.map((c) => `${c.index}. [${c.title}](${c.url})`).join('\n')}`,
          `EEAT_Guidelines_${new Date().toISOString().split('T')[0]}.md`
        );
        break;

      case 'gmb':
      case 'google-business':
        console.log('🗺️ Researching Google Business Profile strategies...\n');
        const gmb = await sonar.getGMBStrategies();
        await displayResult(gmb, 'Google Business Profile Optimization');
        await saveReport(
          `# Google Business Profile Optimization\n\n${gmb.answer}\n\n## Citations\n${gmb.citations.map((c) => `${c.index}. [${c.title}](${c.url})`).join('\n')}`,
          `GMB_Strategies_${new Date().toISOString().split('T')[0]}.md`
        );
        break;

      case 'geo-search':
      case 'voice-search':
        console.log('🌍 Researching GEO search & voice search trends...\n');
        const geoSearch = await sonar.getGEOSearchTrends();
        await displayResult(geoSearch, 'GEO Search & Voice Search Trends');
        await saveReport(
          `# GEO Search & Voice Search Trends\n\n${geoSearch.answer}\n\n## Citations\n${geoSearch.citations.map((c) => `${c.index}. [${c.title}](${c.url})`).join('\n')}`,
          `GEO_Search_Trends_${new Date().toISOString().split('T')[0]}.md`
        );
        break;

      case 'bing':
        console.log('🔍 Researching Bing SEO strategies...\n');
        const bing = await sonar.getBingStrategies();
        await displayResult(bing, 'Bing SEO Strategies');
        await saveReport(
          `# Bing SEO Strategies\n\n${bing.answer}\n\n## Citations\n${bing.citations.map((c) => `${c.index}. [${c.title}](${c.url})`).join('\n')}`,
          `Bing_SEO_${new Date().toISOString().split('T')[0]}.md`
        );
        break;

      case 'backlinks':
        console.log('🔗 Researching backlink building strategies...\n');
        const backlinks = await sonar.getBacklinkStrategies();
        await displayResult(backlinks, 'Viable Backlink Building Strategies');
        await saveReport(
          `# Viable Backlink Building Strategies\n\n${backlinks.answer}\n\n## Citations\n${backlinks.citations.map((c) => `${c.index}. [${c.title}](${c.url})`).join('\n')}`,
          `Backlink_Strategies_${new Date().toISOString().split('T')[0]}.md`
        );
        break;

      case 'comprehensive':
      case 'full':
        console.log(`🔬 Generating comprehensive SEO report for: ${topic}\n`);
        console.log('This will take 30-60 seconds (6 parallel API calls)...\n');

        const report = await sonar.generateSEOReport(topic);

        console.log(report);

        const filename = `SEO_Comprehensive_Report_${topic.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
        await saveReport(report, filename);

        console.log(`\n📊 Report includes:`);
        console.log('  ✅ Latest SEO trends');
        console.log('  ✅ E-E-A-T guidelines');
        console.log('  ✅ Google Business Profile optimization');
        console.log('  ✅ GEO & voice search trends');
        console.log('  ✅ Bing SEO strategies');
        console.log('  ✅ Backlink building tactics');
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.error('Run with --help to see available commands');
        process.exit(1);
    }

    console.log('\n✨ Complete!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('PERPLEXITY_API_KEY')) {
      console.error('\n💡 Solution: Set your Perplexity API key');
      console.error('   1. Get API key from https://www.perplexity.ai/settings/api');
      console.error('   2. Add to .env.local:');
      console.error('      PERPLEXITY_API_KEY=pplx-xxx');
      console.error('   3. Re-run the command\n');
    }

    process.exit(1);
  }
}

main();
