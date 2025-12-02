# Feature Video Carousel - Integration & Usage Guide

## Quick Start

### 1. Import Components

```typescript
import { FeatureVideoCarousel } from '@/components/landing/FeatureVideoCarousel';
import { featureVideos } from '@/data/feature-videos-data';
```

### 2. Add to Page

```tsx
<section className="py-24 bg-gradient-to-b from-white to-[#f4f7fa]">
  <div className="max-w-[1400px] mx-auto px-5">
    <div className="text-center mb-16">
      <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">
        See Features in Action
      </h2>
      <p className="text-xl text-[#404040] max-w-[700px] mx-auto">
        30-second walkthroughs of Synthex's most powerful features
      </p>
    </div>
    <FeatureVideoCarousel videos={featureVideos} />
  </div>
</section>
```

### 3. Done!

The carousel will:
- Display 6 feature videos with category filtering
- Support keyboard navigation (arrows, space, M, F)
- Auto-advance on video completion
- Work responsively on all devices

## Components

### FeatureVideoCarousel

**Props**:
```typescript
interface FeatureVideoCarouselProps {
  videos: FeatureVideoCardProps[];
}
```

**Features**:
- Category filtering (All, AI, Publishing, Analytics, Setup)
- Large video player with controls
- Thumbnail carousel with navigation arrows
- Keyboard shortcuts
- Auto-play next video
- Mobile-responsive

**Usage**:
```tsx
<FeatureVideoCarousel videos={featureVideos} />
```

### FeatureVideoCard

**Props**:
```typescript
interface FeatureVideoCardProps {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: string;
  duration: string;
  category: 'AI' | 'Publishing' | 'Analytics' | 'Setup';
  featured?: boolean;
  onClick: () => void;
  isActive?: boolean;
}
```

**Features**:
- Thumbnail preview
- Play button overlay
- Duration badge (top-right)
- Category badge (top-left)
- Featured badge (bottom-left, if `featured: true`)
- Hover effects (scale 1.05x, shadow increase)
- Active state indicator

**Usage** (internal, used by carousel):
```tsx
<FeatureVideoCard
  {...video}
  onClick={() => setCurrentIndex(index)}
  isActive={index === currentIndex}
/>
```

### VideoPlayer

**Props**:
```typescript
interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onPlay?: () => void;
  onComplete?: () => void;
  autoPlay?: boolean;
  className?: string;
}
```

**Features**:
- Vimeo and YouTube support
- Custom controls (play/pause, volume, fullscreen)
- Keyboard shortcuts (Space, M, F)
- Auto-hide controls after 3 seconds
- Completion tracking

**Usage**:
```tsx
<VideoPlayer
  videoUrl="https://player.vimeo.com/video/76979871"
  title="AI Writes Better Copy"
  onComplete={() => handleNext()}
  className="w-full shadow-2xl"
/>
```

## Data Structure

### Adding New Videos

Edit `src/data/feature-videos-data.ts`:

```typescript
export const featureVideos: FeatureVideoCardProps[] = [
  {
    id: 'unique-video-id',
    title: 'Video Title',
    description: 'Video description (1-2 sentences)',
    videoUrl: 'https://player.vimeo.com/video/[VIDEO_ID]',
    videoThumbnail: 'https://images.unsplash.com/[IMAGE_URL]', // or /thumbnails/image.jpg
    duration: '0:30',
    category: 'AI', // AI | Publishing | Analytics | Setup
    featured: true, // Optional: Shows "Featured" badge
    veoPrompt: `Complete VEO generation prompt here...`,
  },
  // ... more videos
];
```

### Video Categories

```typescript
export const videoCategories = [
  { id: 'all', label: 'All Features', icon: '🎯' },
  { id: 'AI', label: 'AI Intelligence', icon: '🤖' },
  { id: 'Publishing', label: 'Multi-Platform', icon: '📱' },
  { id: 'Analytics', label: 'Analytics', icon: '📊' },
  { id: 'Setup', label: 'Setup & Workflow', icon: '⚙️' },
];
```

To add a new category:
1. Add to `videoCategories` array
2. Update `category` type in `FeatureVideoCardProps`
3. Add category color to `FeatureVideoCard.tsx` (categoryColors object)

## Customization

### Styling

**Category Colors**:

Edit `src/components/landing/FeatureVideoCard.tsx`:

```typescript
const categoryColors = {
  AI: {
    bg: 'bg-[#8b5cf6]', // Purple
    text: 'text-white',
    border: 'border-[#8b5cf6]',
  },
  Publishing: {
    bg: 'bg-[#10b981]', // Green
    text: 'text-white',
    border: 'border-[#10b981]',
  },
  // Add more...
};
```

**Layout**:

Desktop layout (edit `FeatureVideoCarousel.tsx`):
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Video player: 2 columns */}
  <div className="lg:col-span-2">
    <VideoPlayer />
  </div>

  {/* Info panel: 1 column */}
  <div className="flex flex-col justify-center">
    {/* Video info */}
  </div>
</div>
```

### Auto-Play Behavior

**Disable auto-advance**:

Edit `FeatureVideoCarousel.tsx`:

```typescript
const handleVideoComplete = useCallback(() => {
  // Comment out or remove this line:
  // handleNext();
  console.log('Video completed');
}, []);
```

**Change auto-advance delay**:

```typescript
const handleVideoComplete = useCallback(() => {
  setTimeout(() => {
    handleNext();
  }, 2000); // Wait 2 seconds before advancing
}, [handleNext]);
```

### Keyboard Controls

**Current shortcuts** (edit `VideoPlayer.tsx`):
- **Space**: Play/pause
- **M**: Mute/unmute
- **F**: Fullscreen
- **Arrow Left**: Previous video (carousel)
- **Arrow Right**: Next video (carousel)

**Add custom shortcuts**:

```typescript
useEffect(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.code === 'KeyN') {
      // Custom: N = Next video
      handleNext();
    } else if (e.code === 'KeyP') {
      // Custom: P = Previous video
      handlePrevious();
    }
  };

  window.addEventListener('keydown', handleKeyboard);
  return () => window.removeEventListener('keydown', handleKeyboard);
}, [togglePlay, handleNext, handlePrevious]);
```

## Analytics

### Track Video Plays

Add to `VideoPlayer.tsx`:

```typescript
const handlePlay = () => {
  setIsPlaying(true);

  if (onPlay) {
    onPlay();
  }

  // Track play event
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'video_play', {
      event_category: 'engagement',
      event_label: title,
      video_url: videoUrl,
    });
  }
};
```

### Track Video Completion

Already implemented in `VideoPlayer.tsx`:

```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (provider === 'vimeo' && event.origin.includes('vimeo.com')) {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'ended' && onComplete) {
          onComplete();

          // Track completion
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'video_complete', {
              event_category: 'engagement',
              event_label: title,
            });
          }
        }
      } catch (e) {
        // Ignore
      }
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [provider, onComplete, title]);
```

### Track Category Filters

Add to `FeatureVideoCarousel.tsx`:

```typescript
const handleCategoryChange = (category: string) => {
  setSelectedCategory(category);

  // Track filter usage
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'filter_category', {
      event_category: 'engagement',
      event_label: category,
    });
  }
};
```

## Performance

### Lazy Loading

Thumbnails use Next.js Image component (automatic lazy loading):

```tsx
<Image
  src={videoThumbnail}
  alt={title}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy" // Explicit lazy loading
/>
```

### Video Preloading

**Preload next video** (optional):

```typescript
useEffect(() => {
  const nextIndex = (currentIndex + 1) % filteredVideos.length;
  const nextVideo = filteredVideos[nextIndex];

  // Preload next video in background
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = new URL(nextVideo.videoUrl).origin;
  document.head.appendChild(link);

  return () => {
    document.head.removeChild(link);
  };
}, [currentIndex, filteredVideos]);
```

### Optimize Thumbnails

**Before upload**:
```bash
npm install -g sharp-cli
sharp -i input.jpg -o output.jpg -q 80 -w 1920
```

**Target**: <100KB per thumbnail

## Accessibility

### ARIA Labels

Already implemented:

```tsx
<button
  onClick={togglePlay}
  aria-label={isPlaying ? 'Pause video' : 'Play video'}
>
  {/* Play/Pause icon */}
</button>

<button
  onClick={handleNext}
  aria-label="Next video"
>
  <ChevronRight />
</button>
```

### Keyboard Navigation

Fully implemented:
- Tab to focus controls
- Space to play/pause
- Arrows to navigate videos
- Enter to activate buttons

### Screen Readers

Video titles and descriptions are announced:

```tsx
<h3 className="text-2xl font-bold">
  {currentVideo.title}
</h3>
<p className="text-base">
  {currentVideo.description}
</p>
```

### Captions

Add `.vtt` caption files (when production videos ready):

```tsx
<video>
  <track
    src="/captions/ai-copy.vtt"
    kind="captions"
    srcLang="en"
    label="English"
    default
  />
</video>
```

## Troubleshooting

### Videos Not Loading

1. **Check Vimeo privacy settings**:
   - Go to Vimeo video settings
   - Set "Who can watch" to "Anyone"
   - Enable "Allow embedding"

2. **Verify video URL**:
   ```typescript
   // Correct format
   videoUrl: 'https://player.vimeo.com/video/76979871'

   // NOT
   videoUrl: 'https://vimeo.com/76979871'
   ```

3. **Check browser console**:
   - Open DevTools (F12)
   - Look for CORS errors
   - Check network tab for failed requests

### Thumbnails Not Showing

1. **Verify file path**:
   ```typescript
   // If using local files
   videoThumbnail: '/thumbnails/ai-copy.jpg'

   // If using Unsplash
   videoThumbnail: 'https://images.unsplash.com/...'
   ```

2. **Check file exists**:
   ```bash
   ls public/thumbnails/
   ```

3. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Category Filter Not Working

1. **Check category value** (case-sensitive):
   ```typescript
   category: 'AI' // Correct
   category: 'ai' // Wrong
   ```

2. **Verify category exists in `videoCategories`**

3. **Check component state** (React DevTools)

### Mobile Layout Issues

1. **Test different viewports**:
   - Open DevTools (F12)
   - Click "Toggle device toolbar"
   - Test iPhone, iPad, Android

2. **Check responsive classes**:
   ```tsx
   className="grid grid-cols-1 lg:grid-cols-3"
   //         Mobile: 1 col    Desktop: 3 cols
   ```

## Best Practices

### Video Content

- **Hook (0-3s)**: Grab attention immediately
- **Demo (3-27s)**: Show the feature in action
- **CTA (27-30s)**: Clear call-to-action
- **Duration**: Keep at exactly 30 seconds
- **Text overlays**: Large, readable font (min 24px)
- **Pacing**: Fast enough to maintain interest, slow enough to follow

### Thumbnails

- **Consistency**: Use same style across all videos
- **Text**: Large, bold, high contrast
- **Action shot**: Show key moment from video
- **File size**: <100KB for fast loading
- **Resolution**: 1920x1080 minimum

### Performance

- **Lazy load**: Use Next.js Image component
- **Compress**: Optimize thumbnails before upload
- **CDN**: Use Vimeo or YouTube for video hosting
- **Preconnect**: Add `<link rel="preconnect">` for video domains

### UX

- **Auto-advance**: Enable by default (users expect it)
- **Keyboard controls**: Always include
- **Mobile swipe**: Support touch gestures
- **Loading states**: Show while video loads
- **Error handling**: Graceful fallback if video fails

## Support

**Issues**: Create GitHub issue with:
- Browser and OS version
- Console errors (if any)
- Steps to reproduce
- Expected vs actual behavior

**Questions**: Check:
1. This README
2. `docs/PHASE_2_P2C_FEATURE_VIDEOS.md`
3. `docs/VIDEO_PRODUCTION_GUIDE.md`
4. Component source code (JSDoc comments)

---

**Ready to customize? Start by editing `src/data/feature-videos-data.ts`**
