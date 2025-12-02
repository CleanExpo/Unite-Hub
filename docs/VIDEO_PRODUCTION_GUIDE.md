# Video Production Guide - VEO to Synthex Landing Page

## Overview

Step-by-step guide for producing 6 × 30-second feature videos using Google VEO (or alternative video generation tools) and deploying them to the Synthex landing page.

## Production Workflow

### Phase 1: Video Generation (Week 1, Days 1-3)

**Tools**:
- Google VEO (preferred)
- Runway Gen-3 (alternative)
- Pika Labs (alternative)
- Manual filming + editing (fallback)

**Process**:

1. **Use VEO Prompts** from `src/data/feature-videos-data.ts`
   - Each video has a complete `veoPrompt` field
   - Prompts include timing, visuals, text overlays, colors, pacing

2. **Generate Videos**
   ```
   Video 1: AI Writes Better Copy (AI category)
   Video 2: 8 Platforms, One Dashboard (Publishing category)
   Video 3: Lead Scoring Magic (Analytics category)
   Video 4: Real-Time Analytics (Analytics category)
   Video 5: Mobile-First Approval (Setup category)
   Video 6: Zero Setup Required (Setup category)
   ```

3. **Export Settings**
   - **Resolution**: 1920x1080 (16:9 aspect ratio)
   - **Duration**: Exactly 30 seconds
   - **Frame Rate**: 30 fps
   - **Codec**: H.264
   - **Bitrate**: 12 Mbps (landing page quality)
   - **Audio**: Optional music bed (low volume, no voiceover)
   - **Format**: MP4

### Phase 2: Thumbnail Creation (Week 1, Days 4-5)

**Process**:

1. **Extract Key Frames**
   - Use video frame at 5-10 second mark (peak action moment)
   - Export as JPEG or PNG

2. **Add Text Overlays** (Canva or Figma)
   - **Top text**: Feature title (e.g., "AI Writes Better Copy")
   - **Bottom text**: Key benefit (e.g., "Save 27 Minutes Per Email")
   - **Font**: Bold, sans-serif (Montserrat or Inter)
   - **Color**: White text with dark overlay or gradient background

3. **Optimize Images**
   ```bash
   # Install sharp-cli
   npm install -g sharp-cli

   # Compress thumbnails
   sharp -i ai-copy-raw.jpg -o ai-copy.jpg -q 80 -w 1920
   ```

4. **Target**: <100KB per thumbnail

### Phase 3: Video Hosting (Week 1, Day 6)

**Recommended**: Vimeo Pro ($20/month)
- Better player customization
- No YouTube branding/suggestions
- Privacy controls
- Analytics

**Alternative**: YouTube (unlisted)
- Free hosting
- Good player performance
- YouTube branding visible

**Process**:

1. **Create Vimeo Pro Account**
   - Sign up at vimeo.com/pro
   - $20/month subscription

2. **Upload Videos**
   - Upload all 6 videos
   - Set privacy to "Anyone" (embeddable)
   - Enable domain whitelist (synthex.social only)
   - Disable Vimeo branding (Pro feature)

3. **Copy Video IDs**
   - Example URL: `https://vimeo.com/1234567890`
   - Video ID: `1234567890`
   - Embed URL: `https://player.vimeo.com/video/1234567890`

4. **Update Data File**
   ```typescript
   // src/data/feature-videos-data.ts
   {
     id: 'ai-writes-copy',
     videoUrl: 'https://player.vimeo.com/video/1234567890',
     videoThumbnail: 'https://images.unsplash.com/...',
   }
   ```

### Phase 4: Thumbnail Upload (Week 1, Day 6)

**Options**:

**Option A**: Use Unsplash URLs (temporary, current approach)
```typescript
videoThumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&h=1080&fit=crop&q=80'
```

**Option B**: Upload to `/public/thumbnails/` (production approach)
```bash
# Copy thumbnails
cp ai-copy.jpg /public/thumbnails/
cp platforms.jpg /public/thumbnails/
# ... etc
```

```typescript
videoThumbnail: '/thumbnails/ai-copy.jpg'
```

**Option C**: Use CDN (Cloudflare R2 or AWS S3)
```typescript
videoThumbnail: 'https://cdn.synthex.social/thumbnails/ai-copy.jpg'
```

### Phase 5: Testing (Week 1, Day 7)

1. **Local Testing**
   ```bash
   npm run dev
   # Open http://localhost:3008
   # Navigate to Feature Videos section
   ```

2. **Test Checklist**
   - [ ] All 6 videos load correctly
   - [ ] Thumbnails display properly
   - [ ] Play button works
   - [ ] Video plays in player
   - [ ] Controls (play/pause, volume, fullscreen) work
   - [ ] Category filtering works
   - [ ] Navigation arrows work
   - [ ] Keyboard controls work (Space, Arrows)
   - [ ] Auto-advance on completion works
   - [ ] Mobile responsive layout works

3. **Performance Testing**
   - [ ] Lighthouse score >90
   - [ ] Video starts <1s after click
   - [ ] Thumbnails load <500ms
   - [ ] No layout shift on load

### Phase 6: Social Media Exports (Week 2, Days 1-3)

**Purpose**: Repurpose feature videos for social media marketing

**Platforms**:
- YouTube Shorts (9:16, 0:30)
- TikTok (9:16, 0:30)
- Instagram Reels (9:16, 0:30)
- LinkedIn Video (16:9, 0:30)
- X/Twitter (16:9, 0:30)

**Export Settings**:

**Vertical (YouTube Shorts, TikTok, Instagram)**:
```
Resolution: 1080x1920 (9:16)
Duration: 0:30
FPS: 30
Codec: H.264
Bitrate: 8 Mbps
Audio: Same as original (low music bed)
Format: MP4
```

**Horizontal (LinkedIn, X)**:
```
Resolution: 1920x1080 (16:9)
Duration: 0:30
FPS: 30
Codec: H.264
Bitrate: 10 Mbps
Audio: Same as original
Format: MP4
```

**Captions**: Add burned-in captions for social (80% of viewers watch muted)

**Process**:

1. **Re-export from VEO** (preferred)
   - Generate vertical (9:16) versions using same prompts
   - Adjust composition for vertical framing

2. **Crop Existing Videos** (alternative)
   - Use video editing software (DaVinci Resolve, Premiere)
   - Crop center 1080x1920 area
   - Ensure key action stays in frame

3. **Add Captions**
   - Use Kapwing, VEED, or Descript
   - Add text overlays matching dialogue/narration
   - Position at bottom 1/3 of frame

### Phase 7: Deployment (Week 2, Day 4)

1. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: Add Phase 2 P2c - Feature Video Carousel with 6 videos"
   git push origin main
   ```

2. **Vercel Deployment**
   - Automatic deployment on push to main
   - Monitor build logs for errors
   - Verify production URL: https://unite-hub.vercel.app

3. **Post-Deployment Testing**
   - Test all videos on production
   - Check mobile rendering
   - Verify analytics tracking

### Phase 8: Analytics Setup (Week 2, Days 5-7)

**Google Analytics 4 Events**:

```typescript
// Add to VideoPlayer component
const trackVideoPlay = (videoId: string, title: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'video_play', {
      event_category: 'engagement',
      event_label: title,
      video_id: videoId,
    });
  }
};

const trackVideoComplete = (videoId: string, title: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'video_complete', {
      event_category: 'engagement',
      event_label: title,
      video_id: videoId,
    });
  }
};
```

**Metrics to Track**:
- Video plays (by video ID)
- Completion rate
- Average watch time
- Category filter usage
- Click-through to signup

## VEO Prompt Best Practices

### Structure
1. **Opening (0-5s)**: Establish context
2. **Middle (5-25s)**: Show transformation/demo
3. **Closing (25-30s)**: CTA and logo

### Visual Direction
- Specify camera angles
- Define color palette
- Set pacing (fast cuts vs smooth transitions)
- Include text overlay timing

### Example VEO Prompt Breakdown

```
VIDEO: "AI Writes Better Copy"

Opening (0-8s):
- "A busy business owner at desk, grimacing while writing marketing copy"
- Text overlay: "Manual email writing: 30 minutes"
- Camera: Over-shoulder, medium shot
- Color: Office lighting, natural tones

Transformation (8-18s):
- "Same owner, AI interface on screen, email generating with progress bar"
- Text overlay: "AI generation: 3 minutes"
- Camera: Screen recording + owner reaction
- Color: Modern tech blues and teals
- Animation: Progress bar filling, text appearing

Resolution (18-27s):
- "Owner reviewing AI email, making one small edit, clicking 'Approve & Send' with satisfied smile"
- Text overlay: "Approved & sent in seconds"
- Camera: Close-up on screen, then owner's face
- Color: Success green highlights

Closing (27-30s):
- "Synthex logo with text 'Save 27 minutes per email'"
- Camera: Full screen logo
- Color: Brand colors
```

## Alternative Tools

### If VEO Not Available

**Runway Gen-3** ($12/month):
- Text-to-video generation
- Good quality, similar to VEO
- Supports 16:9 and 9:16
- Pricing: $12/mo for 125 credits (~30 videos)

**Pika Labs** (Free tier):
- Text-to-video + image-to-video
- Free tier: 250 credits/month
- Quality: Good for explainer content
- Export: MP4, adjustable resolution

**Manual Filming** (Fallback):
- Hire videographer ($500-1000 per day)
- Film all 6 videos in one session
- Use screen recording + b-roll
- Edit in DaVinci Resolve (free)

## Cost Breakdown

### Option 1: VEO + Vimeo Pro
- VEO access: $20/month (Google AI Studio)
- Vimeo Pro: $20/month
- Thumbnails: $0 (DIY with Canva)
- **Total**: $40/month

### Option 2: Runway + YouTube
- Runway Gen-3: $12/month
- YouTube: Free
- Thumbnails: $0 (DIY)
- **Total**: $12/month

### Option 3: Manual Production
- Videographer: $800 (1 day)
- Editor: $300 (3 hours)
- Vimeo Pro: $20/month
- **Total**: $1,100 one-time + $20/month

## Timeline

**Week 1**:
- Days 1-3: Generate videos with VEO
- Days 4-5: Create thumbnails
- Day 6: Upload to Vimeo, update code
- Day 7: Test and fix issues

**Week 2**:
- Days 1-3: Export social media versions
- Day 4: Deploy to production
- Days 5-7: Set up analytics, monitor

**Total Time**: 2 weeks (part-time, ~20 hours)

## Quality Checklist

### Video Quality
- [ ] Resolution: 1920x1080 minimum
- [ ] Duration: Exactly 30 seconds
- [ ] No stuttering or artifacts
- [ ] Text overlays legible
- [ ] Colors consistent across videos
- [ ] Audio levels normalized

### Thumbnail Quality
- [ ] Resolution: 1920x1080
- [ ] File size: <100KB
- [ ] Text clearly readable
- [ ] Consistent style across all 6
- [ ] High contrast (text vs background)

### Code Quality
- [ ] All video URLs updated
- [ ] All thumbnail URLs updated
- [ ] TypeScript errors: 0
- [ ] ESLint warnings: 0
- [ ] Build succeeds
- [ ] Tests pass

## Maintenance

### Monthly
- Review video analytics
- Update CTAs if needed
- A/B test different videos
- Refresh thumbnails seasonally

### Quarterly
- Generate new videos for new features
- Replace low-performing videos
- Update platform export specs

### Annually
- Full video refresh
- Rebrand if needed
- New platform exports

## Troubleshooting

### Video Won't Play
1. Check Vimeo privacy settings (set to "Anyone")
2. Verify video URL in data file
3. Check browser console for errors
4. Test in incognito mode

### Thumbnail Not Loading
1. Verify file exists in `/public/thumbnails/`
2. Check file extension (.jpg not .jpeg)
3. Clear Next.js cache: `rm -rf .next`
4. Rebuild: `npm run build`

### Category Filter Not Working
1. Check category value matches data (case-sensitive)
2. Verify `videoCategories` array in data file
3. Check component state in React DevTools

---

**Ready to start? Begin with Phase 1: Generate videos using VEO prompts from `src/data/feature-videos-data.ts`**
