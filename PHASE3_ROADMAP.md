# Phase 3: Frontend Components - Implementation Roadmap

**Status**: 📋 PLANNED
**Depends On**: Phase 2 (✅ COMPLETE)
**Estimated Duration**: 2-3 days
**Target Completion**: TBD

---

## 🎯 Objectives

Build React components to provide a complete user interface for the multimedia input system, allowing users to upload, browse, search, and analyze media files through the Unite-Hub dashboard.

---

## 📦 Components to Build

### 1. MediaUploader Component 📤

**Priority**: HIGH (Core functionality)
**Estimated Time**: 4-6 hours

**Features**:
- Drag & drop file upload interface
- File type auto-detection
- Multiple file upload support
- Progress bars for each file
- Real-time status updates (uploading → processing → transcribing → analyzing → completed)
- File size validation with visual feedback
- Extension validation per file type
- Error handling with retry mechanism
- Cancel upload functionality

**Technical Requirements**:
- Use shadcn/ui components (Card, Button, Progress, Badge)
- React dropzone for drag & drop
- WebSocket or polling for real-time progress updates
- Integration with POST `/api/media/upload`
- Workspace context from AuthContext

**File Location**: `src/components/media/MediaUploader.tsx`

**Key Props**:
```typescript
interface MediaUploaderProps {
  workspaceId: string;
  orgId: string;
  projectId?: string;
  onUploadComplete?: (media: MediaFile) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  acceptedFileTypes?: FileType[];
}
```

---

### 2. MediaGallery Component 🖼️

**Priority**: HIGH (Core functionality)
**Estimated Time**: 6-8 hours

**Features**:
- Grid layout with responsive columns (1-4 columns based on screen size)
- Thumbnail previews for images/videos
- File type icons for documents/audio
- Status badges (processing, completed, failed)
- Metadata display (filename, size, upload date)
- Hover preview with AI summary
- Click to open detail view
- Filter by file type, status, date range
- Sort by date, name, size
- Pagination or infinite scroll
- Search integration
- Bulk actions (delete, download, tag)

**Technical Requirements**:
- Use shadcn/ui components (Card, Badge, Dropdown, Pagination)
- Lazy loading for thumbnails
- Integration with GET `/api/media/search`
- Virtual scrolling for large lists (react-window or similar)
- Optimistic UI updates

**File Location**: `src/components/media/MediaGallery.tsx`

**Key Props**:
```typescript
interface MediaGalleryProps {
  workspaceId: string;
  filterType?: FileType | 'all';
  filterStatus?: MediaStatus | 'all';
  searchQuery?: string;
  layout?: 'grid' | 'list';
  onMediaSelect?: (media: MediaFile) => void;
}
```

---

### 3. VideoPlayer Component 🎥

**Priority**: MEDIUM (Enhanced UX)
**Estimated Time**: 6-8 hours

**Features**:
- HTML5 video player with custom controls
- Transcript overlay with auto-scroll
- Clickable transcript segments (jump to timestamp)
- Highlight current segment as video plays
- Playback speed control
- Full-screen mode
- Download transcript as TXT
- Copy transcript to clipboard
- Keyboard shortcuts (space = play/pause, arrow keys = seek)
- Timestamp links for sharing

**Technical Requirements**:
- Use video.js or react-player
- Sync transcript with video currentTime
- Parse transcript JSONB segments
- Responsive design (mobile-friendly)
- Accessibility (ARIA labels, keyboard navigation)

**File Location**: `src/components/media/VideoPlayer.tsx`

**Key Props**:
```typescript
interface VideoPlayerProps {
  media: MediaFile;
  autoplay?: boolean;
  showTranscript?: boolean;
  onTimestampClick?: (timestamp: number) => void;
}
```

---

### 4. AIInsightsPanel Component 🤖

**Priority**: MEDIUM (Enhanced UX)
**Estimated Time**: 4-6 hours

**Features**:
- Display AI analysis results
- Formatted sections (Summary, Key Points, Entities, Sentiment, Topics, Action Items)
- Collapsible sections
- Copy to clipboard functionality
- Export as PDF/Markdown
- Sentiment indicator (positive, neutral, negative) with color coding
- Entity highlighting with tooltips
- Action items as checkboxes
- Topic tags with color coding
- Confidence scores (if available)

**Technical Requirements**:
- Use shadcn/ui components (Card, Accordion, Badge, Tooltip)
- Markdown rendering for formatted content
- jsPDF or similar for PDF export
- Parse ai_analysis JSONB structure

**File Location**: `src/components/media/AIInsightsPanel.tsx`

**Key Props**:
```typescript
interface AIInsightsPanelProps {
  analysis: AIAnalysis;
  mediaFile: MediaFile;
  collapsible?: boolean;
  showExport?: boolean;
}
```

---

### 5. MediaSearch Component 🔍

**Priority**: MEDIUM (Enhanced UX)
**Estimated Time**: 4-6 hours

**Features**:
- Search input with autocomplete
- Real-time search results
- Filter chips (file type, date range, status)
- Search within transcripts toggle
- Search within AI analysis toggle
- Result highlighting (matched keywords)
- Recent searches
- Saved searches
- Advanced search builder (boolean operators)
- Search analytics (most searched terms)

**Technical Requirements**:
- Debounced search input (300ms delay)
- Integration with GET `/api/media/search`
- Use shadcn/ui components (Input, Command, Popover)
- Highlight matched terms in results
- LocalStorage for recent/saved searches

**File Location**: `src/components/media/MediaSearch.tsx`

**Key Props**:
```typescript
interface MediaSearchProps {
  workspaceId: string;
  placeholder?: string;
  onResultClick?: (media: MediaFile) => void;
  filters?: SearchFilters;
  showFilters?: boolean;
}
```

---

### 6. MediaDetailModal Component 🔎

**Priority**: LOW (Nice to have)
**Estimated Time**: 3-4 hours

**Features**:
- Modal overlay with media preview
- Tabbed interface (Overview, Transcript, AI Analysis, Metadata)
- Edit filename/tags
- Delete file with confirmation
- Share link generation
- Download file
- View full resolution (images)
- Audio waveform visualization (audio files)
- Related files suggestions

**Technical Requirements**:
- Use shadcn/ui components (Dialog, Tabs, Button)
- Integration with all API endpoints
- Optimistic UI updates
- Confirmation dialogs for destructive actions

**File Location**: `src/components/media/MediaDetailModal.tsx`

**Key Props**:
```typescript
interface MediaDetailModalProps {
  media: MediaFile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updated: MediaFile) => void;
  onDelete?: (mediaId: string) => void;
}
```

---

## 🗂️ File Structure

```
src/
├── components/
│   ├── media/
│   │   ├── MediaUploader.tsx          # Priority 1
│   │   ├── MediaGallery.tsx           # Priority 1
│   │   ├── VideoPlayer.tsx            # Priority 2
│   │   ├── AIInsightsPanel.tsx        # Priority 2
│   │   ├── MediaSearch.tsx            # Priority 2
│   │   ├── MediaDetailModal.tsx       # Priority 3
│   │   ├── MediaCard.tsx              # Gallery item
│   │   ├── MediaFilters.tsx           # Filter controls
│   │   ├── TranscriptViewer.tsx       # Standalone transcript
│   │   └── types.ts                   # Shared TypeScript types
│   │
│   └── ui/
│       └── ... (existing shadcn/ui components)
│
├── app/
│   └── dashboard/
│       └── media/
│           ├── page.tsx               # Main media dashboard
│           ├── upload/
│           │   └── page.tsx           # Upload page
│           └── [id]/
│               └── page.tsx           # Media detail page
│
├── lib/
│   ├── hooks/
│   │   ├── useMediaUpload.ts          # Upload hook with progress
│   │   ├── useMediaSearch.ts          # Search hook with debounce
│   │   └── useMediaPolling.ts         # Polling hook for status
│   │
│   └── utils/
│       ├── media-utils.ts             # File type detection, formatting
│       └── transcript-utils.ts        # Timestamp parsing, formatting
│
└── types/
    └── media.ts                        # Media-related TypeScript types
```

---

## 🔧 Technical Stack

### Required Dependencies
```bash
# Already installed
- @radix-ui/* (shadcn/ui primitives)
- tailwindcss
- lucide-react (icons)

# To install
npm install react-dropzone           # Drag & drop
npm install react-player              # Video/audio player
npm install @tanstack/react-query     # Data fetching/caching
npm install date-fns                  # Date formatting
npm install jspdf jspdf-autotable     # PDF export
npm install react-markdown            # Markdown rendering
npm install react-window              # Virtual scrolling
```

### Optional Dependencies
```bash
npm install wavesurfer.js             # Audio waveform
npm install react-virtualized         # Alternative virtual scrolling
npm install framer-motion             # Animations
```

---

## 🎨 Design System

### Color Palette
```typescript
// File type colors
const FILE_TYPE_COLORS = {
  video: 'bg-purple-100 text-purple-700',
  audio: 'bg-blue-100 text-blue-700',
  document: 'bg-yellow-100 text-yellow-700',
  image: 'bg-green-100 text-green-700',
  sketch: 'bg-pink-100 text-pink-700',
};

// Status colors
const STATUS_COLORS = {
  uploading: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  transcribing: 'bg-indigo-100 text-indigo-700',
  analyzing: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

// Sentiment colors
const SENTIMENT_COLORS = {
  positive: 'bg-green-100 text-green-700',
  neutral: 'bg-gray-100 text-gray-700',
  negative: 'bg-red-100 text-red-700',
};
```

### Typography
- Headings: font-semibold
- Body: font-normal
- Metadata: text-sm text-muted-foreground
- Timestamps: font-mono text-xs

### Spacing
- Component padding: p-6
- Card spacing: gap-4
- Grid gap: gap-4 md:gap-6
- Section margin: mb-6

---

## 📋 Implementation Checklist

### Phase 3.1: Core Upload & Browse (Priority 1)
- [ ] Create TypeScript types (`src/types/media.ts`)
- [ ] Create MediaUploader component
  - [ ] Drag & drop UI
  - [ ] File validation
  - [ ] Progress tracking
  - [ ] Error handling
- [ ] Create MediaGallery component
  - [ ] Grid layout
  - [ ] Thumbnail rendering
  - [ ] Status badges
  - [ ] Pagination
- [ ] Create media dashboard page (`/dashboard/media`)
- [ ] Create upload page (`/dashboard/media/upload`)
- [ ] Create useMediaUpload hook
- [ ] Create useMediaSearch hook
- [ ] Test upload workflow end-to-end
- [ ] Test filtering and sorting

### Phase 3.2: Enhanced Viewing (Priority 2)
- [ ] Create VideoPlayer component
  - [ ] Video controls
  - [ ] Transcript overlay
  - [ ] Sync with timestamps
  - [ ] Keyboard shortcuts
- [ ] Create AIInsightsPanel component
  - [ ] Formatted sections
  - [ ] Copy/export functionality
  - [ ] Sentiment display
- [ ] Create MediaSearch component
  - [ ] Search input with debounce
  - [ ] Filter chips
  - [ ] Result highlighting
- [ ] Create TranscriptViewer component
- [ ] Test video playback with transcript
- [ ] Test AI insights display
- [ ] Test search functionality

### Phase 3.3: Detail View & Extras (Priority 3)
- [ ] Create MediaDetailModal component
  - [ ] Tabbed interface
  - [ ] Edit functionality
  - [ ] Delete confirmation
  - [ ] Share link
- [ ] Create MediaCard component
- [ ] Create MediaFilters component
- [ ] Create useMediaPolling hook (real-time updates)
- [ ] Add animations (optional)
- [ ] Add waveform visualization (optional)
- [ ] Test complete user flow
- [ ] Performance optimization

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] MediaUploader validation logic
- [ ] File type detection utilities
- [ ] Timestamp parsing utilities
- [ ] Search query formatting

### Integration Tests
- [ ] Upload → Database record creation
- [ ] Upload → Storage file creation
- [ ] Search → Correct results returned
- [ ] Polling → Status updates reflected

### E2E Tests (Playwright)
- [ ] Complete upload workflow
- [ ] Video playback with transcript
- [ ] Search and filter workflow
- [ ] Delete file workflow

### Manual Testing
- [ ] Upload various file types
- [ ] Test on mobile devices
- [ ] Test with slow network
- [ ] Test with large files (100MB)
- [ ] Test error scenarios

---

## 🚀 Deployment Steps

1. **Complete Phase 3.1** (Core functionality)
2. **User Acceptance Testing** (Internal team)
3. **Bug Fixes & Refinements**
4. **Complete Phase 3.2** (Enhanced features)
5. **Beta Testing** (Select users)
6. **Complete Phase 3.3** (Polish)
7. **Production Deployment**

---

## 📊 Success Metrics

### User Experience
- Upload success rate > 99%
- Average upload time < 15 seconds (10MB file)
- Search response time < 500ms
- Gallery render time < 2 seconds (100 files)

### Feature Adoption
- % of users uploading media weekly
- Average files uploaded per user
- Most popular file types
- Search usage frequency

### Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1

---

## 🔄 Future Enhancements (Phase 4+)

- Real-time collaboration (multiple users viewing same file)
- Comments and annotations on media
- Version history for edited files
- Advanced AI features (object detection in images, speaker diarization)
- Integrations (YouTube upload, Vimeo sync)
- Mobile app (React Native)
- Offline support (PWA)
- Advanced analytics dashboard

---

## 📞 Support & Resources

### Reference Implementations
- Upload UI: [test-media-upload.html](public/test-media-upload.html)
- API Docs: [PHASE2_COMPLETE_SUMMARY.md](PHASE2_COMPLETE_SUMMARY.md)
- Database Schema: [029_media_files.sql](supabase/migrations/029_media_files.sql)

### Design Inspiration
- Dropbox file manager
- Google Drive media viewer
- Notion file uploads
- Linear file attachments

### shadcn/ui Components to Use
- Dialog, Card, Button, Input, Badge
- Dropdown, Popover, Tabs, Accordion
- Progress, Skeleton, Avatar, Tooltip
- Command (for search autocomplete)

---

**Phase 3 Ready to Start!** 🚀

**Next Step**: Begin with Phase 3.1 (MediaUploader + MediaGallery components)

**Estimated Timeline**:
- Phase 3.1: 1-2 days
- Phase 3.2: 1 day
- Phase 3.3: 0.5 day
- **Total**: 2.5-3.5 days

**Prerequisites**:
- ✅ Phase 2 complete
- ✅ All health checks passing
- ✅ Database migrations applied
- ✅ API routes tested
