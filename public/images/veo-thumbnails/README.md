# Video Thumbnails

This directory should contain thumbnail images for video content.

## Missing Thumbnails

The following thumbnail images are referenced in the codebase but not yet generated:

- `5-minute-rule-thumb.jpg`
- `lead-scoring-thumb.jpg`
- `approval-bottleneck-thumb.jpg`
- `scattered-leads-thumb.jpg`
- `setup-tax-thumb.jpg`

## How to Generate

Run the thumbnail generation scripts:

```bash
npm run generate:thumbnails
npm run generate:thumbnails:overlay
# Or combined:
npm run generate:thumbnails:full
```

These scripts will create thumbnails from video files and add text overlays.

## Manual Upload

If videos don't exist locally, thumbnails can be:
1. Created manually using design tools
2. Extracted from video files using FFmpeg
3. Uploaded directly to this directory

Recommended size: 1280x720px (16:9 aspect ratio)
Format: JPG or PNG
