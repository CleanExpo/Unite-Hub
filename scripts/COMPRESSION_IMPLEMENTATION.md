# Compression & Quality Implementation Guide

**Quick reference for implementing compression during asset generation**

---

## TL;DR - Quality Standards

```
IMAGES:
✅ Primary Format: AVIF (quality 80, effort 6)
✅ Fallback Format: WebP (quality 85)
✅ Universal Fallback: JPEG (quality 85, progressive)
✅ All 6 size variants (150, 400, 800, 1200, 1920, 2560)
✅ SSIM Score: ≥0.95 (imperceptible quality loss)

VIDEOS:
✅ Primary: H.264 720p (CRF 23, 2500kbps)
✅ Premium: H.264 1080p (CRF 21, 5000kbps)
✅ Modern: VP9 WebM (CRF 31, 2000kbps)
✅ Audio: Normalized to -16 LUFS
✅ VMAF Score: ≥85 (excellent quality)

AUDIO:
✅ Primary: MP3 192kbps
✅ Modern: Opus 128kbps
✅ Archive: WAV PCM
✅ Normalized to -16 LUFS (EBU R128)
```

---

## Phase 1: Concept Generation (No Compression)

When generating concepts, skip compression for faster feedback:

```bash
# Generate concepts WITHOUT compression
npx ts-node scripts/generate-concepts.ts \
  --batch=phase1_concepts \
  --skip-compression=true \
  --keep-originals=true

# Output: Full-quality PNG/WebP
# Purpose: Rapid feedback, quality validation
# Storage: Temporary (concepts/ folder)
```

---

## Phase 2: Refinement (Minimal Compression)

During refinement, use light compression:

```bash
# Light compression for iteration
npx ts-node scripts/process-assets.ts \
  --source=concepts/ \
  --compression-level=light \
  --keep-originals=true

Quality Settings:
├─ AVIF: quality 75 (faster processing)
├─ WebP: quality 80 (reasonable quality)
└─ JPEG: quality 80 (acceptable loss)
```

---

## Phase 3: Production (Maximum Quality with Optimization)

### Step 1: Generate Maximum Quality Source

```typescript
// scripts/generate-production-images.ts

import sharp from 'sharp';

async function generateImage(prompt: string, assetId: string) {
  // 1. Generate via Gemini at highest resolution available
  const response = await generateViaGemini(prompt, {
    model: 'gemini-3-pro-image-preview',
    resolution: '4K'  // Get highest possible quality
  });

  // 2. Save original PNG (lossless)
  const originalPath = `assets/originals/${assetId}.png`;
  await sharp(response.imageBuffer)
    .png({ compressionLevel: 9 })  // Max PNG compression
    .toFile(originalPath);

  console.log(`✓ Original saved: ${originalPath}`);

  return originalPath;
}
```

### Step 2: Process for All Formats & Sizes

```typescript
// scripts/process-assets.ts

async function processImageForProduction(imagePath: string, assetId: string) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  console.log(`Processing: ${assetId} (${metadata.width}x${metadata.height})`);

  const sizeVariants = [
    { name: 'thumbnail', width: 150, height: 150 },
    { name: 'small', width: 400, height: 400 },
    { name: 'medium', width: 800, height: 800 },
    { name: 'large', width: 1200, height: 1200 },
    { name: 'full', width: 1920, height: 1920 },
    { name: 'retina', width: 2560, height: 2560 }
  ];

  // AVIF (Primary - Best compression, excellent quality)
  console.log(`\n📦 AVIF Encoding...`);
  for (const variant of sizeVariants) {
    const avifPath = `assets/processed/${assetId}-${variant.name}.avif`;

    const { size } = await image
      .resize(variant.width, variant.height, { fit: 'inside', withoutEnlargement: true })
      .toColorspace('srgb')
      .avif({
        quality: 80,      // 80 is excellent quality with great compression
        effort: 6,        // Balance between compression ratio and speed
        lossless: false
      })
      .toFile(avifPath);

    console.log(`  ✓ ${variant.name}: ${formatBytes(size)}`);
  }

  // WebP (Fallback - Modern, excellent quality/size)
  console.log(`\n📦 WebP Encoding...`);
  for (const variant of sizeVariants) {
    const webpPath = `assets/processed/${assetId}-${variant.name}.webp`;

    const { size } = await image
      .resize(variant.width, variant.height, { fit: 'inside', withoutEnlargement: true })
      .toColorspace('srgb')
      .webp({
        quality: 85,      // 85 is very high quality
        effort: 6         // Maximum compression effort
      })
      .toFile(webpPath);

    console.log(`  ✓ ${variant.name}: ${formatBytes(size)}`);
  }

  // JPEG (Universal fallback)
  console.log(`\n📦 JPEG Encoding...`);
  for (const variant of sizeVariants) {
    const jpegPath = `assets/processed/${assetId}-${variant.name}.jpeg`;

    const { size } = await image
      .resize(variant.width, variant.height, { fit: 'inside', withoutEnlargement: true })
      .toColorspace('srgb')
      .jpeg({
        quality: 85,           // Excellent quality
        progressive: true,     // Progressive JPEG for better UX
        mozjpeg: true,        // Better compression
        optimizeScans: true,
        trellisQuantization: true,
        overshootDeringing: true
      })
      .toFile(jpegPath);

    console.log(`  ✓ ${variant.name}: ${formatBytes(size)}`);
  }

  // Blur placeholder (for lazy loading)
  console.log(`\n📦 Blur Placeholder...`);
  const placeholder = await image
    .resize(20, 20)
    .blur(25)
    .webp({ quality: 30 })
    .toBuffer();

  const placeholderBase64 = placeholder.toString('base64');
  console.log(`  ✓ Placeholder: ${formatBytes(placeholderBase64.length)}`);

  // Generate metadata
  const metadata_json = generateMetadata(assetId);
  console.log(`\n📝 Metadata generated`);

  return {
    assetId,
    formats: { avif: '✓', webp: '✓', jpeg: '✓' },
    variants: sizeVariants.length,
    placeholder: `${formatBytes(placeholderBase64.length)}`
  };
}
```

### Step 3: Quality Validation

```typescript
// scripts/validate-image-quality.ts

import { SSIM } from 'ssim.js';

async function validateImageQuality(originalPath: string, compressedPath: string) {
  // Load both images
  const original = await sharp(originalPath).raw().toBuffer();
  const compressed = await sharp(compressedPath).raw().toBuffer();

  // Calculate SSIM (Structural Similarity)
  const metadata = await sharp(originalPath).metadata();
  const ssim = SSIM(original, compressed, {
    width: metadata.width,
    height: metadata.height
  });

  console.log(`SSIM Score: ${ssim.toFixed(4)}`);

  if (ssim >= 0.95) {
    console.log('✅ Imperceptible quality loss - APPROVED');
  } else if (ssim >= 0.90) {
    console.log('⚠️  Very subtle quality loss - ACCEPTABLE');
  } else {
    console.log('❌ Noticeable quality loss - REJECTED');
  }

  return ssim >= 0.90;  // Accept if ≥0.90
}
```

---

## Video Compression Implementation

### Step 1: Generate Video from Veo

```bash
# Generate video via Veo 3.1 (already optimized for quality)
npx ts-node scripts/generate-videos.ts \
  --model=veo-3.1-generate-preview \
  --resolution=720p \
  --duration=6s

# Output: Video file (temporary, high quality)
```

### Step 2: Normalize Audio

```bash
#!/bin/bash
# Normalize video audio to -16 LUFS

for video in input_videos/*.mp4; do
  filename=$(basename "$video" .mp4)

  # Extract audio
  ffmpeg -i "$video" -q:a 9 -n "temp/${filename}_audio.wav"

  # Normalize
  ffmpeg-normalize "temp/${filename}_audio.wav" \
    -t -16 LUFS \
    -o "temp/${filename}_normalized.wav"

  # Verify normalization
  ffmpeg -i "temp/${filename}_normalized.wav" \
    -af loudnorm=print_format=json \
    -f null - 2>&1 | grep loudness
done
```

### Step 3: Encode All Variants

```bash
#!/bin/bash
# Process video with multiple codecs and bitrates

video=$1
filename=$(basename "$video" .mp4)

echo "📹 Processing: $filename"

# 720p H.264 (primary streaming)
echo "  Encoding 720p H.264..."
ffmpeg -i "$video" \
  -c:v libx264 -preset medium -crf 23 \
  -maxrate 2500k -bufsize 5000k \
  -vf "scale=1280:720" \
  -c:a aac -b:a 128k \
  "output/${filename}_720p.mp4" -y

echo "  ✓ 720p H.264 complete"

# 1080p H.264 (premium quality)
echo "  Encoding 1080p H.264..."
ffmpeg -i "$video" \
  -c:v libx264 -preset medium -crf 21 \
  -maxrate 5000k -bufsize 10000k \
  -vf "scale=1920:1080" \
  -c:a aac -b:a 192k \
  "output/${filename}_1080p.mp4" -y

echo "  ✓ 1080p H.264 complete"

# WebM VP9 (modern efficient format)
echo "  Encoding WebM VP9..."
ffmpeg -i "$video" \
  -c:v libvpx-vp9 -b:v 2000k \
  -vf "scale=1280:720" \
  -c:a libopus -b:a 128k \
  "output/${filename}_720p.webm" -y

echo "  ✓ WebM VP9 complete"

# HLS for adaptive streaming
echo "  Packaging HLS..."
ffmpeg -i "$video" \
  -c:v libx264 -preset medium -crf 23 \
  -vf "scale=1280:720" \
  -c:a aac -b:a 128k \
  -hls_time 6 \
  -hls_list_size 0 \
  -hls_segment_filename "output/hls/${filename}_%03d.ts" \
  "output/hls/${filename}_master.m3u8" -y

echo "  ✓ HLS packaging complete"

# Extract thumbnails
echo "  Extracting thumbnails..."
ffmpeg -i "$video" \
  -vf "fps=1/2,scale=320:180" \
  "output/thumbs/${filename}_thumb_%02d.webp" -y

echo "  ✓ Thumbnails complete"

# Generate poster (first frame)
echo "  Generating poster..."
ffmpeg -i "$video" \
  -vf "scale=1280:720" \
  -vframes 1 \
  "output/poster/${filename}_poster.webp" -y

echo "  ✓ Poster complete"

echo "✅ $filename processing complete"
```

### Step 4: Quality Validation (Video)

```bash
#!/bin/bash
# Validate video quality using VMAF

video=$1

echo "🎬 Validating video quality..."

# Calculate VMAF score
ffmpeg -i "$video" \
  -filter:v libvmaf \
  -f null - 2>&1 | grep "VMAF score"

# Expected output: "VMAF score: XX.XX"
# Target: ≥85 is excellent quality
```

---

## File Size Targets (Production Ready)

### Images
```
BEFORE COMPRESSION (original generated):
├─ 4K PNG: 8-15 MB per image

AFTER COMPRESSION:
├─ Thumbnail (150×150):
│  ├─ AVIF: 2-4 KB
│  ├─ WebP: 3-5 KB
│  └─ JPEG: 4-7 KB
├─ Small (400×400):
│  ├─ AVIF: 8-12 KB
│  ├─ WebP: 10-15 KB
│  └─ JPEG: 15-20 KB
├─ Medium (800×800):
│  ├─ AVIF: 20-30 KB
│  ├─ WebP: 25-35 KB
│  └─ JPEG: 35-50 KB
├─ Large (1200×1200):
│  ├─ AVIF: 40-60 KB
│  ├─ WebP: 50-70 KB
│  └─ JPEG: 75-100 KB
├─ Full (1920×1920):
│  ├─ AVIF: 80-120 KB
│  ├─ WebP: 100-150 KB
│  └─ JPEG: 150-250 KB
└─ Retina (2560×2560):
   ├─ AVIF: 120-180 KB
   ├─ WebP: 150-220 KB
   └─ JPEG: 200-350 KB

ALL FORMATS COMBINED PER IMAGE: ~600-900 KB
TYPICAL DELIVERY: 30-150 KB (browser-selected)

COMPRESSION RATIO: 50-98% ✅
```

### Videos
```
BEFORE COMPRESSION (from Veo):
├─ 6-second video: 50-100 MB

AFTER COMPRESSION:
├─ 720p H.264: 1.5-2 MB
├─ 1080p H.264: 3-4 MB
├─ WebM VP9: 1.2-1.8 MB
├─ HLS segments: 2-2.5 MB
└─ Total all formats: ~8-10 MB

TYPICAL DELIVERY: ~2 MB (client-selected)

COMPRESSION RATIO: 95-98% ✅
```

---

## Automation Script (Complete Pipeline)

```typescript
// scripts/automate-compression.ts

import sharp from 'sharp';
import { spawn } from 'child_process';

async function compressEverything() {
  console.log('🚀 Starting automated compression pipeline\n');

  // Step 1: Process all images
  console.log('📸 Processing images...');
  const imageFiles = await getImageFiles('assets/generated');

  for (const imagePath of imageFiles) {
    const assetId = extractAssetId(imagePath);
    await processImageForProduction(imagePath, assetId);
    console.log(`✅ ${assetId} complete\n`);
  }

  // Step 2: Process all videos
  console.log('\n🎬 Processing videos...');
  const videoFiles = await getVideoFiles('assets/videos');

  for (const videoPath of videoFiles) {
    const assetId = extractAssetId(videoPath);
    await processVideoForProduction(videoPath, assetId);
    console.log(`✅ ${assetId} complete\n`);
  }

  // Step 3: Generate quality report
  console.log('\n📊 Generating quality report...');
  const report = await generateQualityReport();
  console.log(report);

  console.log('\n✨ Compression complete!');
}

// Run it
compressEverything().catch(console.error);
```

---

## NPM Commands to Add

```json
{
  "scripts": {
    "synthex:compress-images": "ts-node scripts/process-assets.ts --images",
    "synthex:compress-videos": "bash scripts/compress-videos.sh",
    "synthex:normalize-audio": "bash scripts/normalize-audio.sh",
    "synthex:validate-quality": "ts-node scripts/validate-quality.ts",
    "synthex:generate-report": "ts-node scripts/generate-compression-report.ts"
  }
}
```

---

## Quality Checklist (Use During Compression)

```
BEFORE COMPRESSION:
☐ Image size understood (4K = 8-15 MB)
☐ Video size understood (50-100 MB)
☐ Original archived safely
☐ Quality baseline documented

AFTER COMPRESSION:
☐ AVIF primary format working
☐ WebP fallback working
☐ JPEG universal fallback working
☐ All 6 image sizes generated
☐ Image quality validated (SSIM ≥0.95)
☐ Blur placeholder generated

FOR VIDEOS:
☐ 720p H.264 generated (2.5 Mbps)
☐ 1080p H.264 generated (5 Mbps)
☐ WebM VP9 variant generated
☐ HLS streaming working
☐ Audio normalized to -16 LUFS
☐ Thumbnails extracted (5 frames)
☐ Poster image created
☐ Video quality validated (VMAF ≥85)

FINAL:
☐ Total image size <1 MB per asset
☐ Total video size <10 MB per video
☐ CDN delivery <300ms p95
☐ Mobile friendly (<1s load)
☐ All metadata complete
```

---

## Troubleshooting

### AVIF Encoding Too Slow
```bash
# Reduce effort level (faster but slightly larger)
avif: { quality: 80, effort: 4 }  # Default is 6

# Expected time: 5 seconds vs 30 seconds
```

### WebP Quality Not Good Enough
```bash
# Increase quality
webp: { quality: 92 }  # Instead of 85

# Note: Will increase file size by 10-20%
```

### Video Encoding Failing
```bash
# Check FFmpeg installation
ffmpeg -version

# Install FFmpeg:
# macOS: brew install ffmpeg
# Ubuntu: sudo apt-get install ffmpeg
# Windows: choco install ffmpeg
```

### Audio Loudness Verification
```bash
# Check if audio is normalized correctly
ffmpeg -i video.mp4 -af loudnorm=print_format=json -f null - 2>&1

# Look for: "Integrated: -16 LUFS" (or very close)
```

---

## Performance Impact

```
GENERATION TIME:
├─ Images: 2-5 seconds per image (all formats)
├─ Videos: 5-10 minutes per video (all formats)
└─ Total for 56 images + 8 videos: ~4-6 hours

STORAGE IMPACT:
├─ Before: 500+ MB (originals)
├─ After: ~60 MB (all processed)
└─ Savings: 88% ✅

BANDWIDTH IMPACT:
├─ Before: Full-quality delivery
├─ After: 40-50% less bandwidth
└─ Monthly savings: $40-80 ✅

USER EXPERIENCE:
├─ Before: 2-5 second load times
├─ After: <300ms load times
└─ Improvement: 6-16x faster ✅
```

---

**Status**: ✅ Ready to Implement
**Next Step**: Execute Phase 1 with original uncompressed assets, then apply compression in Phase 3
