# VEO Video Integration - Complete Guide

**Status**: ✅ Components Complete | 🎬 Video Production In Progress
**Last Updated**: 2025-12-02
**Phase**: Landing Page Video Integration

---

## Overview

This document describes the VEO video integration system for Unite-Hub/Synthex, including React components, data structures, and production workflows for displaying professional 4K marketing videos generated using Gemini VEO.

## Architecture

### Component Structure

```
src/
├── components/
│   └── video/
│       ├── VeoVideoPlayer.tsx       # Professional video player with custom controls
│       ├── VeoVideoCard.tsx         # Video thumbnail card for grids
│       ├── VeoVideoShowcase.tsx     # Carousel/grid showcase component
│       └── index.ts                  # Barrel export
├── data/
│   └── veo-videos-data.ts           # Video metadata and helper functions
└── app/
    └── page.tsx                      # Landing page integration

public/
├── images/
│   └── veo-thumbnails/              # Video thumbnail images
└── videos/
    └── veo/                          # Actual video files (MP4)
```

---

## Data Structure

### VeoVideo Interface

```typescript
interface VeoVideo {
  id: string;                        // Unique video identifier
  title: string;                     // Video title (60 chars max)
  description: string;               // Video description (160 chars max)
  thumbnail: string;                 // Path to thumbnail image
  thumbnailUrl?: string;             // Alternative thumbnail URL
  videoUrl: string;                  // Path to video file or Vimeo URL
  vimeoId?: string;                  // Vimeo video ID (if hosted on Vimeo)
  duration: number;                  // Duration in seconds
  category: VideoCategory;           // Video category
  tags: string[];                    // Searchable tags
  resolution: '4K' | '1080p' | '720p';
  aspectRatio: '16:9' | '9:16' | '1:1';
  watermark: {
    position: string;                // Synthex logo position
    opacity: number;                 // Logo opacity (0-1)
    size: string;                    // Logo size
  };
  metadata: {
    uploadDate: string;              // ISO date string
    views?: number;                  // View count
    likes?: number;                  // Like count
    approvalStatus: ApprovalStatus;  // Approval workflow status
  };
  scenes: Scene[];                   // Video scene breakdown
}
```

### Video Categories

- `lead-management` - Lead consolidation and organization
- `sales-automation` - Speed-to-lead and conversion optimization
- `analytics` - Real-time data and dashboard features
- `workflow` - Approval processes and team collaboration
- `onboarding` - Quick start and setup features

---

## React Components

### 1. VeoVideoPlayer

**Purpose**: Professional video player with custom controls, accessibility, and analytics.

**Features**:
- ✅ Custom play/pause controls
- ✅ Progress bar with seek functionality
- ✅ Mute/unmute toggle
- ✅ Fullscreen support
- ✅ Auto-hide controls (3-second timeout)
- ✅ Keyboard navigation
- ✅ ARIA labels for accessibility
- ✅ VideoObject schema markup for SEO

**Usage**:
```tsx
import { VeoVideoPlayer } from '@/components/video';
import { veoVideos } from '@/data/veo-videos-data';

<VeoVideoPlayer
  video={veoVideos[0]}
  autoPlay={false}
  muted={false}
  controls={true}
  loop={false}
  onPlay={() => console.log('Video started')}
  onPause={() => console.log('Video paused')}
  onEnded={() => console.log('Video ended')}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| video | VeoVideo | required | Video data object |
| autoPlay | boolean | false | Auto-play on load |
| muted | boolean | false | Start muted |
| controls | boolean | true | Show custom controls |
| loop | boolean | false | Loop video |
| className | string | '' | Additional CSS classes |
| onPlay | function | - | Play event callback |
| onPause | function | - | Pause event callback |
| onEnded | function | - | End event callback |

---

### 2. VeoVideoCard

**Purpose**: Thumbnail card for displaying videos in grid layouts.

**Features**:
- ✅ Hover effects with scale animation
- ✅ Category badge with color coding
- ✅ Duration display
- ✅ Resolution badge (4K)
- ✅ Tag display (optional)
- ✅ View count
- ✅ Approval status indicator

**Usage**:
```tsx
import { VeoVideoCard } from '@/components/video';

<VeoVideoCard
  video={video}
  onClick={(video) => setSelectedVideo(video)}
  showCategory={true}
  showTags={true}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| video | VeoVideo | required | Video data object |
| onClick | function | - | Click handler |
| showCategory | boolean | true | Show category badge |
| showTags | boolean | false | Show tag list |
| className | string | '' | Additional CSS classes |

---

### 3. VeoVideoShowcase

**Purpose**: Main showcase component with carousel/grid views and filtering.

**Features**:
- ✅ Carousel mode with thumbnail navigation
- ✅ Grid mode with responsive layout
- ✅ Category filtering
- ✅ View mode toggle (carousel/grid)
- ✅ Auto-play carousel (optional)
- ✅ Full-screen video modal
- ✅ Progress indicators
- ✅ Navigation arrows
- ✅ Responsive design (mobile-first)

**Usage**:
```tsx
import { VeoVideoShowcase } from '@/components/video';
import { getFeaturedVideos } from '@/data/veo-videos-data';

<VeoVideoShowcase
  videos={getFeaturedVideos()}
  title="Real Problems. Real Solutions."
  subtitle="30-second videos showing Synthex in action"
  defaultView="carousel"
  showFilters={true}
  autoPlay={false}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| videos | VeoVideo[] | required | Array of videos |
| title | string | 'See Synthex In Action' | Section title |
| subtitle | string | '...' | Section subtitle |
| defaultView | 'carousel' \| 'grid' | 'carousel' | Initial view mode |
| showFilters | boolean | true | Show category filters |
| autoPlay | boolean | false | Auto-play carousel |
| className | string | '' | Additional CSS classes |

---

## Landing Page Integration

### Section Placement

The VEO Video Showcase is placed **between the Feature Video Carousel and FAQ sections** on the landing page.

**Order**:
1. Hero Section
2. Who We Help
3. Case Studies
4. Trusted By
5. The Problem
6. How It Works
7. What You Get
8. Integrations
9. Pricing
10. Synthex in Action (3D Carousel)
11. **Feature Video Carousel** ← Existing
12. **VEO Video Showcase** ← NEW
13. FAQ
14. Footer

### Code Example

```tsx
{/* VEO Video Showcase Section */}
<section className="py-24 bg-gradient-to-b from-[#f4f7fa] to-white">
  <div className="max-w-[1400px] mx-auto px-5">
    <ScrollReveal>
      <VeoVideoShowcase
        videos={getFeaturedVideos()}
        title="Real Problems. Real Solutions."
        subtitle="Watch how Synthex solves the biggest marketing challenges facing small businesses today. Each video is 30 seconds."
        defaultView="carousel"
        showFilters={true}
        autoPlay={false}
      />
    </ScrollReveal>
  </div>
</section>
```

---

## Video Production Workflow

### 1. Script Generation

Videos are defined in `scripts/generate-veo-videos.mjs` with detailed scene-by-scene specifications.

**6 Core Videos**:
1. **Scattered Leads** - Lead consolidation problem
2. **5-Minute Rule** - Speed-to-lead conversion
3. **Lead Scoring** - AI prioritization benefits
4. **Real-time Data** - Dashboard monitoring value
5. **Approval Bottleneck** - Workflow optimization
6. **Setup Tax** - Fast onboarding advantage

### 2. VEO Generation

**Model**: `gemini-3-pro-image-preview` (Nano Banana 2)
**Environment**: `GEMINI_API_KEY` required

**Run generation**:
```bash
node scripts/generate-veo-videos.mjs
```

This generates production specifications saved to:
```
public/video-specs/
├── video-scattered-leads-spec.json
├── video-5-minute-rule-spec.json
├── video-lead-scoring-spec.json
├── video-realtime-data-spec.json
├── video-approval-bottleneck-spec.json
├── video-setup-tax-spec.json
└── all-specs.json
```

### 3. Video Rendering

**Manual Process** (for now):
1. Review generated specs in `public/video-specs/`
2. Submit to VEO video generation service
3. Download rendered MP4 files (4K, H.264)
4. Place in `public/videos/veo/`
5. Generate thumbnails (1920x1080)
6. Place in `public/images/veo-thumbnails/`

### 4. Vimeo Upload (Recommended)

For production deployment:
1. Upload MP4 files to Vimeo Pro account
2. Extract Vimeo video IDs
3. Update `veoVideos` data in `src/data/veo-videos-data.ts`
4. Replace placeholder URLs with Vimeo IDs

**Benefits**:
- CDN distribution
- Adaptive bitrate streaming
- Analytics tracking
- Embed player customization

---

## Video Specifications

### Technical Requirements

| Specification | Value |
|---------------|-------|
| Resolution | 4K (3840 x 2160) |
| Frame Rate | 30 fps |
| Codec | H.264 |
| Audio | AAC, 48kHz stereo |
| Bitrate | 20-40 Mbps (video), 192 kbps (audio) |
| Aspect Ratio | 16:9 |
| Duration | 30 seconds |
| Max File Size | 150 MB per video |

### Watermark Specifications

- **Logo**: Synthex brand logo (white with glow)
- **Position**: Bottom-right corner
- **Size**: 120px x 120px (main), 200px x 200px (final frame)
- **Opacity**: 40-50% (visible but non-intrusive)
- **Duration**: Visible from scene 4 onwards, prominent 2-3s hold at end

### Thumbnail Requirements

- **Resolution**: 1920 x 1080 (Full HD)
- **Format**: JPG (high quality, 85% compression)
- **File Size**: < 200 KB per thumbnail
- **Naming**: `{video-id}-thumb.jpg`
- **Content**: Representative frame from key scene (usually scene 4)

---

## Helper Functions

### Data Access Functions

```typescript
// Get all approved videos
const featuredVideos = getFeaturedVideos();

// Get videos by category
const leadVideos = getVideosByCategory('lead-management');

// Get single video by ID
const video = getVideoById('video-scattered-leads');
```

### Category Display

```typescript
import { veoVideoCategories } from '@/data/veo-videos-data';

// All categories with labels
veoVideoCategories.map(cat => (
  <button key={cat.id}>{cat.label}</button>
));
```

---

## Accessibility Features

### ARIA Labels

All interactive elements include proper ARIA labels:
- Play/Pause buttons
- Mute/Unmute toggles
- Fullscreen controls
- Progress bar (seekable)
- Video element (title as label)

### Keyboard Navigation

- **Space**: Play/Pause
- **M**: Mute/Unmute
- **F**: Fullscreen
- **Arrow Left/Right**: Seek backward/forward
- **Arrow Up/Down**: Volume control

### Screen Reader Support

- Video metadata announced on load
- Control state changes announced
- Progress updates at key milestones
- Scene descriptions available (future)

---

## Performance Optimization

### Lazy Loading

Videos are loaded on demand:
- Thumbnail images loaded immediately
- Video sources loaded on user interaction
- Poster images used as placeholders

### Progressive Enhancement

1. **Thumbnail view** - All users (< 100 KB)
2. **Low-res preview** - Click to play (< 5 MB)
3. **Full 4K video** - Fullscreen mode (< 150 MB)

### CDN Recommendations

For production:
- Use Vimeo or Cloudflare Stream
- Enable adaptive bitrate streaming
- Set up geographic CDN distribution
- Implement video preloading for next/previous

---

## SEO Optimization

### VideoObject Schema

Each video includes structured data:
```json
{
  "@context": "https://schema.org/",
  "@type": "VideoObject",
  "name": "Video Title",
  "description": "Video Description",
  "thumbnailUrl": "https://...",
  "uploadDate": "2025-12-02",
  "duration": "PT30S",
  "contentUrl": "https://..."
}
```

### Video Sitemap

Generate video sitemap at `/video-sitemap.xml`:
```xml
<url>
  <loc>https://unite-hub.com/videos/scattered-leads</loc>
  <video:video>
    <video:thumbnail_loc>...</video:thumbnail_loc>
    <video:title>...</video:title>
    <video:description>...</video:description>
    <video:duration>30</video:duration>
  </video:video>
</url>
```

---

## Analytics Integration

### Event Tracking

Track these video events:
- `video_play` - User starts video
- `video_pause` - User pauses video
- `video_complete` - User watches to end
- `video_seek` - User seeks to position
- `video_fullscreen` - User enters fullscreen

### Custom Dimensions

- Video ID
- Video category
- Video position in carousel
- View mode (carousel/grid)
- Device type (mobile/desktop)

---

## Testing Checklist

### Component Testing

- [ ] VeoVideoPlayer renders correctly
- [ ] Custom controls work (play, pause, mute, fullscreen)
- [ ] Progress bar seeks correctly
- [ ] Auto-hide controls work
- [ ] Keyboard shortcuts work
- [ ] Video ends trigger onEnded callback

- [ ] VeoVideoCard displays correctly
- [ ] Hover effects work
- [ ] Click triggers onClick handler
- [ ] Category badge shows correct color
- [ ] Tags display correctly

- [ ] VeoVideoShowcase switches between carousel/grid
- [ ] Category filters work
- [ ] Navigation arrows work
- [ ] Thumbnail navigation works
- [ ] Modal opens/closes correctly
- [ ] Progress indicators update

### Cross-Browser Testing

- [ ] Chrome (desktop/mobile)
- [ ] Firefox (desktop/mobile)
- [ ] Safari (desktop/mobile)
- [ ] Edge (desktop)

### Responsive Testing

- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px+)
- [ ] 4K displays (2560px+)

### Performance Testing

- [ ] Thumbnails load < 2s
- [ ] Video starts playing < 3s
- [ ] No layout shift (CLS)
- [ ] Smooth animations (60fps)
- [ ] No memory leaks

---

## Troubleshooting

### Videos Not Playing

**Issue**: Video element shows black screen
**Solution**: Check video codec (must be H.264), check file path, ensure CORS headers

### Controls Not Responding

**Issue**: Play button doesn't work
**Solution**: Check `controls` prop is true, verify video ref is attached, check browser console for errors

### Thumbnails Not Loading

**Issue**: Broken image icons
**Solution**: Verify thumbnail path, check file exists in `/public/images/veo-thumbnails/`, check image format (JPG/PNG)

### Fullscreen Not Working

**Issue**: Fullscreen button does nothing
**Solution**: Check browser permissions, verify container ref, try different browser

---

## Future Enhancements

### Phase 2 - Analytics Dashboard

- [ ] Video performance dashboard
- [ ] Heatmap showing drop-off points
- [ ] A/B testing for thumbnails
- [ ] Engagement metrics by category

### Phase 3 - Interactive Features

- [ ] Chapter markers (scene navigation)
- [ ] Interactive CTAs in video
- [ ] Branching video paths
- [ ] Personalized video recommendations

### Phase 4 - Advanced Production

- [ ] Automated VEO generation pipeline
- [ ] Multi-language support
- [ ] Dynamic personalization (name, company)
- [ ] Real-time video updates

---

## Related Files

- **Components**: `src/components/video/*.tsx`
- **Data**: `src/data/veo-videos-data.ts`
- **Scripts**: `scripts/generate-veo-videos.mjs`
- **Landing Page**: `src/app/page.tsx` (lines 1061-1075)
- **Feature Videos**: `src/data/feature-videos-data.ts` (legacy)
- **Video Specs**: `public/video-specs/` (generated)

---

## Support

For questions or issues:
- Check this documentation
- Review component source code
- Consult `scripts/generate-veo-videos.mjs` for video specs
- Review VEO API documentation (Google)

---

**Last Updated**: 2025-12-02
**Maintained By**: Synthex Engineering Team
**Status**: ✅ Production Ready (Components) | 🎬 Video Production In Progress
