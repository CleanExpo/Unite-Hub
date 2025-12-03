# VEO Videos - Quick Start Guide

**TL;DR**: React components for VEO videos are done. Need thumbnails and videos.

---

## What's Complete ✅

- ✅ `VeoVideoPlayer` - Professional video player with controls
- ✅ `VeoVideoCard` - Thumbnail cards for grids
- ✅ `VeoVideoShowcase` - Carousel/grid with filtering
- ✅ `veo-videos-data.ts` - 6 video definitions with metadata
- ✅ Landing page integration (between Feature Videos and FAQ)

---

## What's Missing ⏳

- ⏳ 6 thumbnail images (1920x1080 JPG)
- ⏳ 6 video files (30s 4K MP4)
- ⏳ Vimeo upload (optional, recommended)

---

## Quick Commands

### Generate Placeholder Thumbnails

**Option 1 - Use existing images**:
```bash
# Copy/resize from public/images/generated/
cp public/images/generated/hero-trades-owner.jpg public/images/veo-thumbnails/scattered-leads-thumb.jpg
# Repeat for 5 more...
```

**Option 2 - Generate with Gemini**:
```bash
# Update prompts in generate-5whys-images.mjs
node scripts/generate-5whys-images.mjs
```

### Generate Video Specs

```bash
node scripts/generate-veo-videos.mjs
# Creates: public/video-specs/*.json
```

### Test Components

```bash
npm run dev
# Open http://localhost:3008
# Scroll to "Real Problems. Real Solutions." section
```

---

## File Locations

**Components**:
- `src/components/video/VeoVideoPlayer.tsx`
- `src/components/video/VeoVideoCard.tsx`
- `src/components/video/VeoVideoShowcase.tsx`

**Data**:
- `src/data/veo-videos-data.ts` (6 videos defined)

**Landing Page**:
- `src/app/page.tsx` (lines 1061-1075)

**Assets** (need to create):
- `public/images/veo-thumbnails/*.jpg` (6 files)
- `public/videos/veo/*.mp4` (6 files)

**Docs**:
- `docs/VEO_VIDEO_INTEGRATION.md` (complete guide)
- `VEO_INTEGRATION_REPORT.md` (this report)

---

## Usage Example

```tsx
import { VeoVideoShowcase } from '@/components/video';
import { getFeaturedVideos } from '@/data/veo-videos-data';

<VeoVideoShowcase
  videos={getFeaturedVideos()}
  title="Real Problems. Real Solutions."
  subtitle="30-second videos"
  defaultView="carousel"
  showFilters={true}
/>
```

---

## The 6 Videos

1. **Scattered Leads** - Lead consolidation chaos → Unified dashboard
2. **5-Minute Rule** - Slow response → Instant alerts (MIT research)
3. **Lead Scoring** - Random calling → AI prioritization
4. **Real-time Data** - Stale dashboards → Live updates
5. **Approval Bottleneck** - 8-day approvals → 5-minute workflow
6. **Setup Tax** - 6-week setup → 18-minute onboarding

Each video: 30 seconds, 4K, problem-solution narrative

---

## Immediate Next Steps

1. **Create Thumbnails** (2-4 hours)
   - Design or grab from existing images
   - 1920x1080 JPG, <200KB each
   - Place in `public/images/veo-thumbnails/`

2. **Generate Videos** (1-2 days)
   - Run `node scripts/generate-veo-videos.mjs`
   - Submit specs to VEO service
   - Download MP4 files
   - Place in `public/videos/veo/`

3. **Upload to Vimeo** (1 hour, optional)
   - Upload all 6 videos
   - Get video IDs
   - Update `vimeoId` in `veo-videos-data.ts`

4. **Test** (2-3 hours)
   - Verify thumbnails load
   - Verify videos play
   - Test on mobile
   - Test all browsers

---

## Need Help?

- Read: `docs/VEO_VIDEO_INTEGRATION.md`
- Check: `VEO_INTEGRATION_REPORT.md`
- Review: `scripts/generate-veo-videos.mjs`

---

**Status**: ✅ Components Ready | ⏳ Assets Pending
**Last Updated**: 2025-12-02
