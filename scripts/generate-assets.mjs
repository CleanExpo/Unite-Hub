import { execa } from 'execa';
import path from 'path';

// --- Configuration ---
// All your prompts and file paths are defined here for easy management.

const HERO_IMAGE_PROMPT = `Australian small business owner in a modern charcoal workspace, orange accent glow (#ea580c), viewing an autonomous marketing dashboard. UI shows rising line charts and a GBP map-pack inset with Sydney and Brisbane pins. Glassmorphism cards, backlit rim lighting, dynamic composition, cinematic framing, high clarity. No performance numbers, no text overlays.`;
const INDUSTRIES_IMAGE_PROMPT = `Grid of Australian SMB scenes—office/pro services, clinic, café, retail shop, warehouse, workshop, e-commerce packing, classroom, non-profit office. Each tile has a translucent orange label bar and a location pin. Clean minimal layout, soft lighting, consistent brand accent (#ea580c). No metrics, no text overlays beyond the label bars.`;
const VIDEO_PROMPT = `Scenes: 1) Owner enables “Autonomous mode” in Synthex UI (desktop dashboard view). 2) Dashboard shows SEO/GBP/social tasks running; progress bars visible. 3) GBP post published; map pack highlight with Sydney pin; review auto-response shown. 4) AI Search Visibility panel shows citation/mention (no numbers). 5) CTA bumper: “Start Free Trial”. Audio: Soft, professional music bed; no voiceover required. Captions present.`;

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
    const { stdout, stderr } = await execa(command, args, { stdio: 'inherit' });
    if (stderr) {
      console.error(`⚠️ STDERR: ${stderr}`);
    }
    console.log('✅ Command finished successfully.');
  } catch (error) {
    console.error(`❌ Error executing command: ${command}`, error.shortMessage);
    throw error; // Stop the script if a command fails
  }
}

// --- Generation Functions ---

async function generateHeroImage() {
  console.log('\n--- Generating Hero Image ---');
  // IMPORTANT: Replace 'your_image_cli' and '--model' with your actual CLI command and parameters.
  await runCommand('your_image_cli', [
    '--model', 'gemini-3-pro',
    '--aspect', '16:9',
    '--style', 'cinematic, clean UI overlay, no performance numbers',
    '--prompt', HERO_IMAGE_PROMPT,
    '--output', path.resolve(OUTPUT_PATHS.heroImage),
  ]);
}

async function generateVideo() {
  console.log('\n--- Generating Hero Video ---');
  // IMPORTANT: Replace 'your_video_cli' and '--model' with your actual CLI command and parameters.
  await runCommand('your_video_cli', [
    '--model', 'veo-2-pro',
    '--duration', '40',
    '--aspect', '16:9',
    '--style', 'cinematic teal-orange grade, clean UI overlays, captions on, no performance numbers',
    '--prompt', VIDEO_PROMPT,
    '--output', path.resolve(OUTPUT_PATHS.video),
  ]);
}


// --- Main Execution ---

async function main() {
  console.log('Starting Synthex asset generation process...');
  
  await generateHeroImage();
  await generateVideo();

  console.log('\n🎉 All assets generated successfully!');
  console.log('Check the following paths:');
  console.log(`- ${OUTPUT_PATHS.heroImage}`);
  console.log(`- ${OUTPUT_PATHS.video}`);
}

main().catch(() => {
  console.error('\n🔥 The asset generation script failed.');
  process.exit(1);
});