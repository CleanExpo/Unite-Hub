import { execa } from 'execa';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
// All your prompts and file paths are defined here for easy management.

const CLI_TOOLS = {
  image: 'your_image_cli', // <-- IMPORTANT: Replace with your actual image generation CLI
  video: 'your_video_cli', // <-- IMPORTANT: Replace with your actual video generation CLI
};

const PROMPTS = {
  heroImage: `Australian small business owner in a modern charcoal workspace, orange accent glow (#ea580c), viewing an autonomous marketing dashboard. UI shows rising line charts and a GBP map-pack inset with Sydney and Brisbane pins. Glassmorphism cards, backlit rim lighting, dynamic composition, cinematic framing, high clarity. No performance numbers, no text overlays.`,
  industriesImage: `Grid of Australian SMB scenes—office/pro services, clinic, café, retail shop, warehouse, workshop, e-commerce packing, classroom, non-profit office. Each tile has a translucent orange label bar and a location pin. Clean minimal layout, soft lighting, consistent brand accent (#ea580c). No metrics, no text overlays beyond the label bars.`,
  video: `Scenes: 1) Owner enables “Autonomous mode” in Synthex UI (desktop dashboard view). 2) Dashboard shows SEO/GBP/social tasks running; progress bars visible. 3) GBP post published; map pack highlight with Sydney pin; review auto-response shown. 4) AI Search Visibility panel shows citation/mention (no numbers). 5) CTA bumper: “Start Free Trial”. Audio: Soft, professional music bed; no voiceover required. Captions present.`,
};

const OUTPUT_PATHS = {
  heroImage: 'public/placeholders/synthex-hero.png',
  industriesImage: 'public/placeholders/synthex-industries.png',
  video: 'public/videos/synthex-hero.mp4',
};

// --- Helper Function ---
// A reusable function to run a command and log its output.
async function runCommand(command, args) {
  try {
    console.log(`🚀 Executing: ${command} ${args.join(' ')}`);
    // Use 'inherit' to stream stdout/stderr directly, which is better for long-running processes.
    await execa(command, args, { stdio: 'inherit' });
    console.log('✅ Command finished successfully.');
  } catch (error) {
    console.error(`❌ Error executing command: ${command}`);
    console.error(error.shortMessage); // Log a concise error message
    throw error; // Stop the script if a command fails
  }
}

// --- Generation Functions ---

async function generateHeroImage() {
  console.log('\n--- Generating Hero Image ---');
  await runCommand(CLI_TOOLS.image, [
    '--model', 'gemini-3-pro',
    '--aspect', '16:9',
    '--style', 'cinematic, clean UI overlay, no performance numbers',
    '--prompt', PROMPTS.heroImage,
    '--output', path.resolve(OUTPUT_PATHS.heroImage),
  ]);
}

async function generateIndustriesImage() {
  console.log('\n--- Generating Industries Collage ---');
  await runCommand(CLI_TOOLS.image, [
    '--model', 'gemini-3-pro',
    '--aspect', '16:9',
    '--style', 'minimal, clean grid, no performance numbers',
    '--prompt', PROMPTS.industriesImage,
    '--output', path.resolve(OUTPUT_PATHS.industriesImage),
  ]);
}

async function generateVideo() {
  console.log('\n--- Generating Hero Video ---');
  await runCommand(CLI_TOOLS.video, [
    '--model', 'veo-2-pro',
    '--duration', '40',
    '--aspect', '16:9',
    '--style', 'cinematic teal-orange grade, clean UI overlays, captions on, no performance numbers',
    '--prompt', PROMPTS.video,
    '--output', path.resolve(OUTPUT_PATHS.video),
  ]);
}


// --- Main Execution ---

function printHelp() {
  const scriptName = path.basename(fileURLToPath(import.meta.url));
  console.log(`
Usage: node ${scriptName} [options]

Options:
  --hero        Generate the hero image.
  --video       Generate the hero video.
  --industries  Generate the industries collage image.
  --all         Generate all assets (default if no options are provided).
  --help        Show this help message.
  `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    printHelp();
    return;
  }

  const runAll = args.length === 0 || args.includes('--all');
  const runHero = runAll || args.includes('--hero');
  const runVideo = runAll || args.includes('--video');
  const runIndustries = runAll || args.includes('--industries');

  if (!runHero && !runVideo && !runIndustries) {
    console.log('No assets selected to generate. Use --help for options.');
    return;
  }

  console.log('Starting Synthex asset generation process...');

  if (runHero) {
    await generateHeroImage();
  }
  if (runVideo) {
    await generateVideo();
  }
  if (runIndustries) {
    await generateIndustriesImage();
  }

  console.log('\n🎉 Asset generation complete!');
}

main().catch(() => {
  console.error('\n🔥 The asset generation script failed.');
  process.exit(1);
});