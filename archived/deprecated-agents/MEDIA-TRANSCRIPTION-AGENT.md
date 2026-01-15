# MEDIA TRANSCRIPTION AGENT SPECIFICATION

**Agent Name**: Media Transcription Agent
**Agent Type**: Tier 1 - Input Processing Agent
**Priority**: P1 - Critical (Build First)
**Status**: Active Development
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---

## 1. AGENT OVERVIEW

### Primary Database Tables
- `media_files` - Uploaded video/audio files with transcription data
- `contacts` - Link media to CRM contacts (read-only)
- `projects` - Link media to projects (read-only)

### Agent Purpose
The Media Transcription Agent is the **audio/video processing layer** for the Client Intelligence System. It transcribes video and audio recordings from the client dashboard using OpenAI Whisper or AssemblyAI, extracts speaker diarization (who said what), generates timestamped transcripts, and produces exportable subtitle files (SRT/VTT). This agent enables Unite-Hub to convert Duncan's client call recordings into searchable, analyzable text data.

### Agent Responsibilities
1. **Audio/Video Transcription**: Convert media files to text using OpenAI Whisper or AssemblyAI
2. **Speaker Diarization**: Identify different speakers in the conversation (client vs. team member)
3. **Timestamp Extraction**: Generate timestamped segments (start time, end time, text)
4. **Subtitle Generation**: Export transcripts as SRT/VTT files for video playback
5. **Language Detection**: Auto-detect spoken language (English, Spanish, Mandarin, etc.)
6. **Confidence Scoring**: Track transcription accuracy/confidence per segment
7. **Processing Pipeline**: Manage async transcription jobs with progress tracking

---

## 2. PURPOSE & SCOPE

### Core Responsibilities

#### IN SCOPE ✅
- OpenAI Whisper API integration (transcription)
- AssemblyAI integration (transcription + speaker diarization)
- Support for video formats: MP4, MOV, AVI, WebM
- Support for audio formats: MP3, WAV, M4A, AAC, OGG
- Automatic language detection (100+ languages)
- Speaker diarization (up to 10 speakers)
- Timestamped transcript segments (start/end times)
- SRT subtitle file export
- VTT subtitle file export
- Confidence scoring per segment
- Processing status tracking (queued, processing, completed, failed)
- Retry logic for failed transcriptions
- Cost tracking (Whisper: $0.006/minute, AssemblyAI: $0.00025/second)

#### OUT OF SCOPE ❌
- Video/audio editing (trimming, merging, filters)
- Real-time transcription (live streaming transcription)
- Video compression or format conversion
- Audio enhancement or noise reduction
- Custom voice training or fine-tuning
- Emotion detection (handled by AI Intelligence Extraction Agent)
- Sentiment analysis (handled by AI Intelligence Extraction Agent)
- Translation to other languages (Phase 2)

### Integration Touchpoints
- **AI Intelligence Extraction Agent**: Provides raw transcripts for analysis
- **Email Integration Agent**: Can transcribe audio attachments from emails
- **Contact Agent**: Links media files to contacts
- **Analytics Agent**: Provides media metrics (total recordings, average duration, transcription success rate)
- **Workflow Agent**: Triggers workflows on transcription completion

---

## 3. DATABASE SCHEMA MAPPING

### media_files Table
```typescript
interface MediaFile {
  id: string; // UUID
  workspace_id: string; // UUID - References workspaces.id
  org_id: string; // UUID - References organizations.id
  uploaded_by: string; // UUID - References auth.users.id
  project_id?: string | null; // UUID - References projects.id

  // File Metadata
  filename: string; // Stored filename (e.g., "abc123.mp4")
  original_filename: string; // User's original filename (e.g., "Client Call - Duncan.mp4")
  file_type: 'video' | 'audio' | 'document' | 'image' | 'sketch'; // File type
  mime_type: string; // MIME type (e.g., "video/mp4", "audio/mpeg")
  file_size_bytes: number; // File size in bytes

  // Storage
  storage_path: string; // Supabase Storage path (UNIQUE)
  storage_bucket: string; // Storage bucket name (default: 'media-uploads')
  public_url?: string | null; // Public URL for file access

  // Processing Status
  status: 'uploading' | 'processing' | 'transcribing' | 'analyzing' | 'completed' | 'failed';
  progress: number; // 0-100 (percentage complete)
  error_message?: string | null; // Error details if failed

  // Media Metadata (for video/audio)
  duration_seconds?: number | null; // Duration in seconds (e.g., 1847.32)
  width?: number | null; // Video width (e.g., 1920)
  height?: number | null; // Video height (e.g., 1080)
  fps?: number | null; // Frames per second (e.g., 30.0)
  bitrate?: number | null; // Bitrate in kbps (e.g., 5000)
  codec?: string | null; // Codec (e.g., "h264", "aac")

  // Transcription (for video/audio)
  transcript?: TranscriptData | null; // JSONB - Full transcript data
  transcript_language?: string | null; // Detected language (e.g., "en", "es")
  transcript_confidence?: number | null; // Overall confidence (0.0-1.0)
  transcribed_at?: Date | null; // TIMESTAMPTZ - When transcription completed

  // AI Analysis (set by AI Intelligence Extraction Agent)
  ai_analysis?: AIAnalysis | null; // JSONB - AI-generated insights
  ai_analyzed_at?: Date | null; // TIMESTAMPTZ
  ai_model_used?: string | null; // AI model (e.g., "claude-3-5-sonnet-20241022")

  // Search & Tags
  tags: string[]; // Array of tags (e.g., ["client-call", "q4-strategy"])
  full_text_search?: any; // TSVECTOR - Generated search vector

  // Timestamps
  created_at: Date; // TIMESTAMPTZ
  updated_at: Date; // TIMESTAMPTZ
  deleted_at?: Date | null; // TIMESTAMPTZ - Soft delete
}

interface TranscriptData {
  segments: TranscriptSegment[]; // Array of timestamped segments
  speakers?: Speaker[]; // Speaker diarization data (if available)
  language: string; // Detected language code (e.g., "en")
  full_text: string; // Complete transcript as plain text
  word_count: number; // Total word count
  provider: 'whisper' | 'assemblyai'; // Which API was used
}

interface TranscriptSegment {
  id: number; // Segment index (0, 1, 2, ...)
  start: number; // Start time in seconds (e.g., 12.45)
  end: number; // End time in seconds (e.g., 18.92)
  text: string; // Segment text (e.g., "So we're looking at a Q4 launch for this campaign.")
  confidence: number; // Confidence score (0.0-1.0)
  speaker?: string | null; // Speaker ID (e.g., "SPEAKER_00", "SPEAKER_01")
  words?: Word[]; // Word-level timestamps (AssemblyAI only)
}

interface Word {
  text: string; // Word text
  start: number; // Start time in seconds
  end: number; // End time in seconds
  confidence: number; // Confidence score
}

interface Speaker {
  id: string; // Speaker ID (e.g., "SPEAKER_00")
  label?: string | null; // User-assigned label (e.g., "Duncan", "John")
  segment_ids: number[]; // Which segments this speaker spoke in
  total_speaking_time: number; // Total seconds spoken
}

interface AIAnalysis {
  summary: string; // AI-generated summary
  key_points: string[]; // Key points extracted
  entities: string[]; // Named entities (people, companies, products)
  sentiment: string; // Overall sentiment
  topics: string[]; // Main topics discussed
  action_items: string[]; // Action items mentioned
}

// Indexes:
// - idx_media_files_workspace_id ON media_files(workspace_id)
// - idx_media_files_org_id ON media_files(org_id)
// - idx_media_files_uploaded_by ON media_files(uploaded_by)
// - idx_media_files_project_id ON media_files(project_id)
// - idx_media_files_file_type ON media_files(file_type)
// - idx_media_files_status ON media_files(status)
// - idx_media_files_created_at ON media_files(created_at DESC)
// - idx_media_files_full_text_search ON media_files USING GIN(full_text_search)
```

---

## 4. CORE FUNCTIONS

### 4.1 transcribeVideo()
**Purpose**: Transcribe a video file using OpenAI Whisper or AssemblyAI.

**Input**:
```typescript
interface TranscribeVideoRequest {
  media_file_id: string; // UUID - media_files.id
  provider?: 'whisper' | 'assemblyai'; // Transcription provider (default: 'assemblyai')
  enable_speaker_diarization?: boolean; // Enable speaker detection (default: true)
  language?: string; // Force language (e.g., "en"), or auto-detect if not provided
}
```

**Output**:
```typescript
interface TranscribeVideoResult {
  success: boolean;
  media_file_id: string; // UUID
  transcript: TranscriptData; // Full transcript data
  duration_seconds: number; // Total duration
  word_count: number; // Total words transcribed
  cost_usd: number; // Transcription cost
  processing_time_ms: number; // Total processing time
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Fetch media file**: Get media_files record by ID
2. **Verify file type**: Ensure file_type = 'video'
3. **Extract audio**: Use `ffmpeg` to extract audio track from video
   - Convert to WAV format (required for Whisper)
   - Sample rate: 16kHz (optimal for speech)
   - Channels: 1 (mono)
4. **Update status**: Set status='transcribing', progress=10
5. **Call transcription API**:
   - **Whisper**: Upload audio file to OpenAI API
   - **AssemblyAI**: Upload to AssemblyAI, enable speaker_labels
6. **Poll for completion**:
   - AssemblyAI: Poll `/v2/transcript/{id}` every 5 seconds
   - Whisper: Synchronous response (no polling)
7. **Parse transcript**: Extract segments, speakers, timestamps
8. **Calculate confidence**: Average confidence across all segments
9. **Update media_files**:
   - Set transcript, transcript_language, transcript_confidence
   - Set status='completed', progress=100, transcribed_at=NOW()
10. **Calculate cost**:
    - Whisper: $0.006/minute ($0.36 for 60-minute video)
    - AssemblyAI: $0.00025/second ($0.015/minute = $0.90 for 60-minute video)
11. **Return result**: Return transcript data and cost

**API Integration - OpenAI Whisper**:
```typescript
import OpenAI from 'openai';

async function transcribeWithWhisper(audioFilePath: string): Promise<TranscriptData> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: 'whisper-1',
    language: 'en', // or auto-detect
    response_format: 'verbose_json', // Get timestamps
    timestamp_granularities: ['segment'], // Segment-level timestamps
  });

  // Parse response
  const segments: TranscriptSegment[] = transcription.segments.map((seg, i) => ({
    id: i,
    start: seg.start,
    end: seg.end,
    text: seg.text,
    confidence: seg.confidence || 0.95, // Whisper doesn't provide confidence, estimate
  }));

  return {
    segments,
    language: transcription.language,
    full_text: transcription.text,
    word_count: transcription.text.split(' ').length,
    provider: 'whisper',
  };
}
```

**API Integration - AssemblyAI**:
```typescript
import { AssemblyAI } from 'assemblyai';

async function transcribeWithAssemblyAI(audioUrl: string): Promise<TranscriptData> {
  const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

  const transcript = await client.transcripts.transcribe({
    audio_url: audioUrl,
    speaker_labels: true, // Enable speaker diarization
    language_detection: true, // Auto-detect language
  });

  // Wait for completion (polling)
  while (transcript.status !== 'completed' && transcript.status !== 'error') {
    await sleep(5000);
    transcript = await client.transcripts.get(transcript.id);
  }

  if (transcript.status === 'error') {
    throw new Error(`Transcription failed: ${transcript.error}`);
  }

  // Parse response
  const segments: TranscriptSegment[] = transcript.utterances.map((utt, i) => ({
    id: i,
    start: utt.start / 1000, // Convert ms to seconds
    end: utt.end / 1000,
    text: utt.text,
    confidence: utt.confidence,
    speaker: utt.speaker,
    words: utt.words.map(w => ({
      text: w.text,
      start: w.start / 1000,
      end: w.end / 1000,
      confidence: w.confidence,
    })),
  }));

  // Extract speaker metadata
  const speakers: Speaker[] = extractSpeakers(segments);

  return {
    segments,
    speakers,
    language: transcript.language_code,
    full_text: transcript.text,
    word_count: transcript.words.length,
    provider: 'assemblyai',
  };
}

function extractSpeakers(segments: TranscriptSegment[]): Speaker[] {
  const speakerMap = new Map<string, Speaker>();

  segments.forEach((seg) => {
    if (!seg.speaker) return;

    if (!speakerMap.has(seg.speaker)) {
      speakerMap.set(seg.speaker, {
        id: seg.speaker,
        segment_ids: [],
        total_speaking_time: 0,
      });
    }

    const speaker = speakerMap.get(seg.speaker)!;
    speaker.segment_ids.push(seg.id);
    speaker.total_speaking_time += seg.end - seg.start;
  });

  return Array.from(speakerMap.values());
}
```

**Performance Requirements**:
- Processing time: ~1/10 of video duration (60-minute video = 6 minutes processing)
- Max file size: 500MB (larger files need chunking)
- Concurrent transcriptions: Support 10 simultaneous jobs

**Error Codes**:
- `MEDIA_TRANS_001`: Media file not found
- `MEDIA_TRANS_002`: Invalid file type (not video/audio)
- `MEDIA_TRANS_003`: Audio extraction failed (ffmpeg error)
- `MEDIA_TRANS_004`: Transcription API error (Whisper/AssemblyAI)
- `MEDIA_TRANS_005`: Transcription timeout (> 30 minutes)
- `MEDIA_TRANS_006`: File size exceeds limit (> 500MB)

---

### 4.2 transcribeAudio()
**Purpose**: Transcribe an audio file (same logic as video, skip audio extraction).

**Input**:
```typescript
interface TranscribeAudioRequest {
  media_file_id: string; // UUID
  provider?: 'whisper' | 'assemblyai'; // Default: 'assemblyai'
  enable_speaker_diarization?: boolean; // Default: true
  language?: string; // Optional language code
}
```

**Output**: Same as `transcribeVideo()`

**Business Logic**:
1. **Fetch media file**: Get media_files record
2. **Verify file type**: Ensure file_type = 'audio'
3. **Skip audio extraction**: Use file directly (already audio)
4. **Call transcription API**: Same as video transcription
5. **Update media_files**: Set transcript data
6. **Return result**: Return transcript and cost

**Performance Requirements**:
- Processing time: ~1/10 of audio duration
- Max file size: 500MB

---

### 4.3 processMediaUpload()
**Purpose**: Automatically transcribe media after upload (triggered by file upload event).

**Input**:
```typescript
interface ProcessMediaUploadRequest {
  media_file_id: string; // UUID
  auto_transcribe?: boolean; // Default: true
  auto_analyze?: boolean; // Default: true (trigger AI analysis after transcription)
}
```

**Output**:
```typescript
interface ProcessMediaUploadResult {
  success: boolean;
  media_file_id: string; // UUID
  transcription_triggered: boolean; // Whether transcription started
  analysis_triggered: boolean; // Whether AI analysis will run after transcription
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Fetch media file**: Get media_files record
2. **Check file type**: If file_type = 'video' or 'audio', proceed to transcription
3. **Update status**: Set status='processing'
4. **Extract metadata**:
   - Video: Use `ffprobe` to get duration, width, height, fps, bitrate, codec
   - Audio: Use `ffprobe` to get duration, bitrate, codec
5. **Store metadata**: Update media_files with duration_seconds, width, height, etc.
6. **Trigger transcription**: Call `transcribeVideo()` or `transcribeAudio()`
7. **If auto_analyze=true**: After transcription completes, trigger AI Intelligence Extraction Agent
8. **Return result**: Return success status

**Metadata Extraction with ffprobe**:
```typescript
import { execSync } from 'child_process';

function extractVideoMetadata(filePath: string): VideoMetadata {
  const ffprobeCmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
  const output = execSync(ffprobeCmd).toString();
  const data = JSON.parse(output);

  const videoStream = data.streams.find((s: any) => s.codec_type === 'video');
  const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');

  return {
    duration_seconds: parseFloat(data.format.duration),
    width: videoStream?.width,
    height: videoStream?.height,
    fps: eval(videoStream?.r_frame_rate), // e.g., "30/1" → 30
    bitrate: parseInt(data.format.bit_rate) / 1000, // Convert to kbps
    codec: videoStream?.codec_name,
  };
}
```

**Performance Requirements**:
- Metadata extraction: < 5 seconds
- Total processing: Metadata (5s) + Transcription (video_duration / 10)

**Error Codes**:
- `MEDIA_TRANS_007`: Metadata extraction failed
- `MEDIA_TRANS_008`: Auto-transcribe disabled for this file

---

### 4.4 getTranscription()
**Purpose**: Retrieve transcription data for a media file.

**Input**:
```typescript
interface GetTranscriptionRequest {
  media_file_id: string; // UUID
  include_words?: boolean; // Include word-level timestamps (default: false)
}
```

**Output**:
```typescript
interface GetTranscriptionResult {
  success: boolean;
  media_file_id: string; // UUID
  transcript: TranscriptData; // Full transcript data
  status: string; // Current status (completed, transcribing, failed)
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Fetch media file**: Get media_files record
2. **Check if transcribed**: If transcript is null, return error "Not yet transcribed"
3. **Return transcript**: Return transcript data from database

**Performance Requirements**:
- Query time: < 50ms (indexed lookup)

**Error Codes**:
- `MEDIA_TRANS_009`: Media file not found
- `MEDIA_TRANS_010`: Transcription not yet complete

---

### 4.5 exportSRT()
**Purpose**: Export transcript as SRT subtitle file.

**Input**:
```typescript
interface ExportSRTRequest {
  media_file_id: string; // UUID
}
```

**Output**:
```typescript
interface ExportSRTResult {
  success: boolean;
  srt_content: string; // SRT file content as string
  file_url?: string; // Optional: URL to download SRT file
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Fetch transcript**: Get transcript from media_files
2. **Generate SRT format**:
   ```
   1
   00:00:12,450 --> 00:00:18,920
   So we're looking at a Q4 launch for this campaign.

   2
   00:00:19,100 --> 00:00:24,300
   That sounds great. What's the budget we're working with?
   ```
3. **Format timestamps**: Convert seconds to SRT format (HH:MM:SS,mmm)
4. **Return SRT content**: Return as string or upload to storage

**SRT Generation Function**:
```typescript
function generateSRT(segments: TranscriptSegment[]): string {
  let srt = '';

  segments.forEach((seg, i) => {
    const startTime = formatSRTTimestamp(seg.start);
    const endTime = formatSRTTimestamp(seg.end);

    srt += `${i + 1}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    srt += `${seg.text.trim()}\n\n`;
  });

  return srt;
}

function formatSRTTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

function pad(num: number, size: number = 2): string {
  return String(num).padStart(size, '0');
}
```

**Performance Requirements**:
- SRT generation: < 1 second (even for 2-hour videos)

**Error Codes**:
- `MEDIA_TRANS_011`: Transcript not available
- `MEDIA_TRANS_012`: SRT generation failed

---

### 4.6 exportVTT()
**Purpose**: Export transcript as VTT (WebVTT) subtitle file.

**Input**:
```typescript
interface ExportVTTRequest {
  media_file_id: string; // UUID
}
```

**Output**:
```typescript
interface ExportVTTResult {
  success: boolean;
  vtt_content: string; // VTT file content as string
  file_url?: string; // Optional: URL to download VTT file
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Fetch transcript**: Get transcript from media_files
2. **Generate VTT format**:
   ```
   WEBVTT

   00:00:12.450 --> 00:00:18.920
   So we're looking at a Q4 launch for this campaign.

   00:00:19.100 --> 00:00:24.300
   That sounds great. What's the budget we're working with?
   ```
3. **Format timestamps**: Convert seconds to VTT format (HH:MM:SS.mmm)
4. **Return VTT content**: Return as string or upload to storage

**VTT Generation Function**:
```typescript
function generateVTT(segments: TranscriptSegment[]): string {
  let vtt = 'WEBVTT\n\n';

  segments.forEach((seg) => {
    const startTime = formatVTTTimestamp(seg.start);
    const endTime = formatVTTTimestamp(seg.end);

    vtt += `${startTime} --> ${endTime}\n`;
    vtt += `${seg.text.trim()}\n\n`;
  });

  return vtt;
}

function formatVTTTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(millis, 3)}`;
}
```

**Performance Requirements**:
- VTT generation: < 1 second

**Error Codes**:
- `MEDIA_TRANS_013`: Transcript not available
- `MEDIA_TRANS_014`: VTT generation failed

---

### 4.7 identifySpeakers()
**Purpose**: Identify and label speakers in the transcript (manual labeling or AI-assisted).

**Input**:
```typescript
interface IdentifySpeakersRequest {
  media_file_id: string; // UUID
  speaker_labels?: { [speaker_id: string]: string }; // Manual labels (e.g., { "SPEAKER_00": "Duncan", "SPEAKER_01": "John" })
}
```

**Output**:
```typescript
interface IdentifySpeakersResult {
  success: boolean;
  speakers: Speaker[]; // Updated speaker data with labels
  error?: string; // Error message if failed
}
```

**Business Logic**:
1. **Fetch transcript**: Get transcript from media_files
2. **If speaker_labels provided**: Apply manual labels to speakers
3. **Update transcript**: Replace speaker IDs with labels in segments
4. **Store updated transcript**: Update media_files.transcript
5. **Return speakers**: Return updated speaker data

**Example Speaker Labeling**:
```typescript
// Before labeling
{
  "segments": [
    { "speaker": "SPEAKER_00", "text": "So what's our budget?" },
    { "speaker": "SPEAKER_01", "text": "Around $50,000 for Q4." }
  ]
}

// After labeling
{
  "segments": [
    { "speaker": "Duncan (Client)", "text": "So what's our budget?" },
    { "speaker": "John (Account Manager)", "text": "Around $50,000 for Q4." }
  ]
}
```

**Performance Requirements**:
- Speaker labeling: < 200ms (database update)

**Error Codes**:
- `MEDIA_TRANS_015`: Invalid speaker ID
- `MEDIA_TRANS_016`: Speaker labeling failed

---

### 4.8 retryFailedTranscription()
**Purpose**: Retry a failed transcription job.

**Input**:
```typescript
interface RetryFailedTranscriptionRequest {
  media_file_id: string; // UUID
  provider?: 'whisper' | 'assemblyai'; // Try different provider
}
```

**Output**:
```typescript
interface RetryFailedTranscriptionResult {
  success: boolean;
  retry_attempt: number; // Retry attempt number (1, 2, 3)
  error?: string; // Error message if retry failed
}
```

**Business Logic**:
1. **Fetch media file**: Get media_files record
2. **Check status**: Ensure status = 'failed'
3. **Increment retry count**: Track retry attempts in metadata
4. **Reset status**: Set status='processing', error_message=null
5. **Call transcription**: Call `transcribeVideo()` or `transcribeAudio()`
6. **Return result**: Return success status and retry attempt number

**Retry Limits**:
- Max retries: 3 attempts
- Retry delay: Exponential backoff (1min, 5min, 15min)

**Performance Requirements**:
- Same as initial transcription

**Error Codes**:
- `MEDIA_TRANS_017`: Retry limit exceeded (> 3 attempts)
- `MEDIA_TRANS_018`: Media file not in failed status

---

## 5. API ENDPOINTS

### POST /api/media/transcribe
**Description**: Transcribe a video or audio file.

**Request**:
```json
{
  "media_file_id": "550e8400-e29b-41d4-a716-446655440000",
  "provider": "assemblyai",
  "enable_speaker_diarization": true,
  "language": "en"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "media_file_id": "550e8400-e29b-41d4-a716-446655440000",
  "transcript": {
    "segments": [
      {
        "id": 0,
        "start": 12.45,
        "end": 18.92,
        "text": "So we're looking at a Q4 launch for this campaign.",
        "confidence": 0.94,
        "speaker": "SPEAKER_00"
      },
      {
        "id": 1,
        "start": 19.10,
        "end": 24.30,
        "text": "That sounds great. What's the budget we're working with?",
        "confidence": 0.96,
        "speaker": "SPEAKER_01"
      }
    ],
    "speakers": [
      {
        "id": "SPEAKER_00",
        "segment_ids": [0, 2, 4],
        "total_speaking_time": 42.5
      },
      {
        "id": "SPEAKER_01",
        "segment_ids": [1, 3, 5],
        "total_speaking_time": 38.2
      }
    ],
    "language": "en",
    "full_text": "So we're looking at a Q4 launch for this campaign. That sounds great. What's the budget we're working with?",
    "word_count": 18,
    "provider": "assemblyai"
  },
  "duration_seconds": 1847.32,
  "word_count": 18,
  "cost_usd": 0.46,
  "processing_time_ms": 12350
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "MEDIA_TRANS_002",
  "message": "Invalid file type: Expected video or audio, got 'document'"
}
```

---

### GET /api/media/:media_file_id/transcript
**Description**: Get transcript for a media file.

**Response** (200 OK):
```json
{
  "success": true,
  "media_file_id": "550e8400-e29b-41d4-a716-446655440000",
  "transcript": {
    "segments": [...],
    "speakers": [...],
    "language": "en",
    "full_text": "...",
    "word_count": 1847,
    "provider": "assemblyai"
  },
  "status": "completed"
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": "MEDIA_TRANS_010",
  "message": "Transcription not yet complete. Current status: transcribing"
}
```

---

### GET /api/media/:media_file_id/export/srt
**Description**: Export transcript as SRT subtitle file.

**Response** (200 OK):
```
Content-Type: text/plain
Content-Disposition: attachment; filename="Client_Call_Duncan.srt"

1
00:00:12,450 --> 00:00:18,920
So we're looking at a Q4 launch for this campaign.

2
00:00:19,100 --> 00:00:24,300
That sounds great. What's the budget we're working with?
```

---

### GET /api/media/:media_file_id/export/vtt
**Description**: Export transcript as VTT subtitle file.

**Response** (200 OK):
```
Content-Type: text/vtt
Content-Disposition: attachment; filename="Client_Call_Duncan.vtt"

WEBVTT

00:00:12.450 --> 00:00:18.920
So we're looking at a Q4 launch for this campaign.

00:00:19.100 --> 00:00:24.300
That sounds great. What's the budget we're working with?
```

---

### POST /api/media/:media_file_id/speakers/label
**Description**: Label speakers in transcript.

**Request**:
```json
{
  "speaker_labels": {
    "SPEAKER_00": "Duncan (Client)",
    "SPEAKER_01": "John (Account Manager)"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "speakers": [
    {
      "id": "SPEAKER_00",
      "label": "Duncan (Client)",
      "segment_ids": [0, 2, 4],
      "total_speaking_time": 42.5
    },
    {
      "id": "SPEAKER_01",
      "label": "John (Account Manager)",
      "segment_ids": [1, 3, 5],
      "total_speaking_time": 38.2
    }
  ]
}
```

---

## 6. INTEGRATION POINTS

### Inputs (What This Agent Receives)

1. **From User** (via Dashboard):
   - Video/audio file uploads
   - Manual speaker labels
   - Re-transcribe requests (if initial transcription failed or had errors)

2. **From Email Integration Agent**:
   - Audio attachments from emails (voicemails, audio notes)

3. **From Workflow Agent**:
   - Automatic transcription triggers on file upload

### Outputs (What This Agent Provides)

1. **To AI Intelligence Extraction Agent**:
   - Raw transcript text (full_text field)
   - Timestamped segments for context-aware analysis
   - Speaker-separated content (analyze client vs. team separately)

2. **To Analytics Agent**:
   - Media metrics (total videos transcribed, average duration, transcription success rate)
   - Speaker analytics (speaking time distribution, interruption patterns)

3. **To Workflow Agent**:
   - Transcription completion events (trigger AI analysis workflow)
   - Transcription failure events (trigger retry or alert)

4. **To Contact Agent**:
   - Link media files to contacts (via project_id or manual linking)

---

## 7. BUSINESS RULES

### Transcription Provider Selection

1. **Use AssemblyAI by Default**:
   - **Pros**: Speaker diarization, word-level timestamps, higher accuracy
   - **Cons**: 6x more expensive than Whisper ($0.015/min vs $0.006/min)
   - **Use for**: Client calls, important recordings, multi-speaker conversations

2. **Use Whisper for Cost Savings**:
   - **Pros**: Cheaper, faster processing, good accuracy
   - **Cons**: No speaker diarization, segment-level timestamps only
   - **Use for**: Single-speaker recordings, internal notes, less critical content

3. **Automatic Fallback**:
   - If AssemblyAI fails, retry with Whisper
   - If Whisper fails, retry with AssemblyAI (different provider might succeed)

### File Size Limits

1. **Max File Size**: 500MB per file
2. **If file > 500MB**: Split into chunks, transcribe separately, merge transcripts
3. **Chunking Strategy**:
   - Split at silence points (avoid cutting mid-word)
   - 10-minute chunks (optimal for API limits)
   - Overlap chunks by 5 seconds (ensure continuity)

### Language Detection

1. **Auto-detect by default**: Let AssemblyAI/Whisper detect language
2. **Support 100+ languages**: English, Spanish, French, German, Mandarin, Japanese, etc.
3. **Confidence threshold**: If language detection confidence < 0.7, flag for manual review

### Cost Tracking

1. **Track cost per transcription**:
   - Whisper: duration_seconds * $0.0001/second ($0.006/minute)
   - AssemblyAI: duration_seconds * $0.00025/second ($0.015/minute)
2. **Store in media_files.metadata**: `{ transcription_cost_usd: 0.46 }`
3. **Monthly cost reporting**: Aggregate transcription costs per workspace

---

## 8. PERFORMANCE REQUIREMENTS

### Response Time Targets

| Function | Target | Maximum | Notes |
|----------|--------|---------|-------|
| transcribeVideo() | video_duration/10 | video_duration/5 | 60-min video = 6 min processing |
| transcribeAudio() | audio_duration/10 | audio_duration/5 | 60-min audio = 6 min processing |
| processMediaUpload() | 5s + transcription | 30s + transcription | Metadata extraction + queue |
| getTranscription() | < 50ms | 200ms | Database query |
| exportSRT() | < 1s | 3s | Format conversion |
| exportVTT() | < 1s | 3s | Format conversion |
| identifySpeakers() | < 200ms | 500ms | Database update |
| retryFailedTranscription() | Same as initial | Same as initial | Retry with different provider |

### Scalability Targets

1. **Concurrent Transcriptions**:
   - Support 10 simultaneous transcription jobs
   - Queue overflow jobs for background processing
   - Max queue depth: 100 pending jobs

2. **File Processing Throughput**:
   - Process 100 videos per day (10 hours of content)
   - Average video duration: 30 minutes
   - Total daily processing time: 50 hours (parallelized across 10 workers)

3. **Storage Requirements**:
   - Average video size: 100MB (30-minute video)
   - Average transcript size: 50KB (JSON)
   - 100 videos/day = 10GB/day video storage + 5MB/day transcript storage

### Database Indexes (Critical for Performance)

**media_files**:
- `idx_media_files_workspace_id` ON `workspace_id` (workspace filtering)
- `idx_media_files_file_type` ON `file_type` (filter video/audio)
- `idx_media_files_status` ON `status` (find pending/failed transcriptions)
- `idx_media_files_created_at` ON `created_at DESC` (recent files first)
- `idx_media_files_full_text_search` ON `full_text_search` USING GIN (search transcripts)

---

## 9. TESTING STRATEGY

### Unit Tests

**Test File**: `tests/agents/media-transcription.test.ts`

```typescript
describe('Media Transcription Agent', () => {
  describe('transcribeVideo()', () => {
    it('should transcribe video file with AssemblyAI', async () => {
      const mediaFile = await uploadTestVideo('test-video.mp4');

      const result = await transcribeVideo({
        media_file_id: mediaFile.id,
        provider: 'assemblyai',
        enable_speaker_diarization: true,
      });

      expect(result.success).toBe(true);
      expect(result.transcript.segments.length).toBeGreaterThan(0);
      expect(result.transcript.speakers.length).toBeGreaterThan(0);
      expect(result.word_count).toBeGreaterThan(0);
    });

    it('should handle transcription with Whisper', async () => {
      const result = await transcribeVideo({
        media_file_id: testMediaFile.id,
        provider: 'whisper',
      });

      expect(result.success).toBe(true);
      expect(result.transcript.provider).toBe('whisper');
    });

    it('should fail for invalid file type', async () => {
      const docFile = await uploadTestDocument('test.pdf');

      const result = await transcribeVideo({
        media_file_id: docFile.id,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('MEDIA_TRANS_002');
    });
  });

  describe('exportSRT()', () => {
    it('should export transcript as SRT format', async () => {
      const result = await exportSRT({
        media_file_id: transcribedMediaFile.id,
      });

      expect(result.success).toBe(true);
      expect(result.srt_content).toContain('-->');
      expect(result.srt_content).toMatch(/\d{2}:\d{2}:\d{2},\d{3}/);
    });
  });

  describe('identifySpeakers()', () => {
    it('should label speakers correctly', async () => {
      const result = await identifySpeakers({
        media_file_id: transcribedMediaFile.id,
        speaker_labels: {
          'SPEAKER_00': 'Duncan (Client)',
          'SPEAKER_01': 'John (Account Manager)',
        },
      });

      expect(result.success).toBe(true);
      expect(result.speakers[0].label).toBe('Duncan (Client)');
      expect(result.speakers[1].label).toBe('John (Account Manager)');
    });
  });
});
```

### Integration Tests

**Test File**: `tests/integration/media-transcription-assemblyai.test.ts`

```typescript
describe('AssemblyAI Integration', () => {
  it('should transcribe video end-to-end', async () => {
    // 1. Upload video
    const mediaFile = await uploadVideo('sample-call.mp4');

    // 2. Trigger transcription
    const transcription = await transcribeVideo({
      media_file_id: mediaFile.id,
      provider: 'assemblyai',
      enable_speaker_diarization: true,
    });

    expect(transcription.success).toBe(true);

    // 3. Verify transcript stored
    const storedFile = await getMediaFile(mediaFile.id);
    expect(storedFile.transcript).toBeDefined();
    expect(storedFile.status).toBe('completed');

    // 4. Export SRT
    const srt = await exportSRT({ media_file_id: mediaFile.id });
    expect(srt.srt_content).toBeDefined();
  });
});
```

---

## 10. ERROR CODES

| Error Code | Description | HTTP Status | Retry? |
|-----------|-------------|-------------|--------|
| MEDIA_TRANS_001 | Media file not found | 404 | No |
| MEDIA_TRANS_002 | Invalid file type (not video/audio) | 400 | No |
| MEDIA_TRANS_003 | Audio extraction failed (ffmpeg error) | 500 | Yes |
| MEDIA_TRANS_004 | Transcription API error (Whisper/AssemblyAI) | 500 | Yes |
| MEDIA_TRANS_005 | Transcription timeout (> 30 minutes) | 504 | Yes |
| MEDIA_TRANS_006 | File size exceeds limit (> 500MB) | 413 | No |
| MEDIA_TRANS_007 | Metadata extraction failed | 500 | Yes |
| MEDIA_TRANS_008 | Auto-transcribe disabled for this file | 400 | No |
| MEDIA_TRANS_009 | Media file not found | 404 | No |
| MEDIA_TRANS_010 | Transcription not yet complete | 202 | Yes (poll) |
| MEDIA_TRANS_011 | Transcript not available | 404 | No |
| MEDIA_TRANS_012 | SRT generation failed | 500 | Yes |
| MEDIA_TRANS_013 | Transcript not available | 404 | No |
| MEDIA_TRANS_014 | VTT generation failed | 500 | Yes |
| MEDIA_TRANS_015 | Invalid speaker ID | 400 | No |
| MEDIA_TRANS_016 | Speaker labeling failed | 500 | Yes |
| MEDIA_TRANS_017 | Retry limit exceeded (> 3 attempts) | 429 | No |
| MEDIA_TRANS_018 | Media file not in failed status | 400 | No |

---

## 11. AUSTRALIAN COMPLIANCE

### Timezone Handling (AEST/AEDT)

1. **Media Upload Timestamps**:
   - Store created_at in UTC (database TIMESTAMPTZ)
   - Display in AEST/AEDT in dashboard
   - Example: "Uploaded 18 Nov 2025, 2:45 PM AEDT"

2. **Transcription Completion**:
   - Display transcribed_at in AEST/AEDT
   - Example: "Transcribed 18 Nov 2025, 3:15 PM AEDT"

### Phone Number Parsing

1. **Transcript Phone Number Detection**:
   - Detect phone numbers in transcript text
   - Format as +61 format
   - Example: "Call me on 0400 123 456" → Detect and format as "+61 400 123 456"

---

## 12. SECURITY

### Row Level Security (RLS) Policies

**media_files** (RLS Enabled):
```sql
-- Users can view media files in their workspace
CREATE POLICY "Users can view media files in their workspace"
  ON media_files
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Users can upload media files to their workspace
CREATE POLICY "Users can insert media files in their workspace"
  ON media_files
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Service role can manage media files
CREATE POLICY "Service role can manage media files"
  ON media_files
  FOR ALL
  USING (true);
```

### API Key Security

1. **OpenAI API Key**:
   - Store in environment variable `OPENAI_API_KEY`
   - NEVER log or expose in error messages
   - Rotate every 90 days

2. **AssemblyAI API Key**:
   - Store in environment variable `ASSEMBLYAI_API_KEY`
   - NEVER log or expose in error messages
   - Rotate every 90 days

### Transcript Data Security

1. **Sensitive Content Redaction**:
   - Detect and redact credit card numbers, SSNs, passwords in transcripts
   - Use regex patterns to identify sensitive data
   - Replace with `[REDACTED]` in stored transcript

2. **Encryption at Rest**:
   - Encrypt transcript JSONB field in database
   - Use Supabase encryption (pgcrypto extension)

---

## 13. MONITORING & METRICS

### Key Performance Indicators (KPIs)

1. **Transcription Metrics**:
   - Total media files transcribed (daily, weekly, monthly)
   - Average transcription time (processing_time_ms)
   - Transcription success rate (completed / total attempted)
   - Average confidence score (transcript_confidence)

2. **Cost Metrics**:
   - Total transcription cost (USD per day/week/month)
   - Cost per provider (Whisper vs AssemblyAI)
   - Average cost per minute of media

3. **Quality Metrics**:
   - Average word count per transcript
   - Average speakers per media file
   - Language distribution (English, Spanish, etc.)

### Prometheus Metrics

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

// Transcription counter
const transcriptionsTotal = new Counter({
  name: 'transcriptions_total',
  help: 'Total number of transcriptions',
  labelNames: ['provider', 'status'], // status: success, failed
});

// Transcription duration histogram
const transcriptionDuration = new Histogram({
  name: 'transcription_duration_seconds',
  help: 'Transcription processing time in seconds',
  labelNames: ['provider', 'file_type'],
  buckets: [10, 30, 60, 120, 300, 600, 1800],
});

// Transcription cost gauge
const transcriptionCost = new Gauge({
  name: 'transcription_cost_usd',
  help: 'Total transcription cost in USD',
  labelNames: ['provider', 'workspace_id'],
});

// Active transcriptions gauge
const activeTranscriptions = new Gauge({
  name: 'active_transcriptions',
  help: 'Number of transcriptions currently processing',
});
```

### Alerts

1. **Transcription Failure Alert**:
   - Trigger: Transcription failure rate > 10% over 1 hour
   - Action: Send Slack alert to #engineering-alerts
   - Severity: Warning

2. **Cost Alert**:
   - Trigger: Daily transcription cost > $50
   - Action: Send email to billing team
   - Severity: Info

3. **Processing Timeout Alert**:
   - Trigger: Transcription taking > 30 minutes
   - Action: Send PagerDuty alert to on-call engineer
   - Severity: Critical

---

## 14. FUTURE ENHANCEMENTS

### Phase 2 (Q2 2026)

1. **Real-time Transcription**:
   - Live transcription during video calls (WebRTC integration)
   - Display transcript as conversation happens
   - Use AssemblyAI real-time API or Deepgram

2. **Translation**:
   - Translate transcripts to other languages
   - Support 50+ languages (Google Translate API)
   - Store original + translated version

3. **Emotion Detection**:
   - Detect emotions in speaker's voice (happy, frustrated, excited)
   - Use AssemblyAI sentiment detection or custom model
   - Useful for sales call analysis

### Phase 3 (Q3-Q4 2026)

1. **Custom Vocabulary**:
   - Add industry-specific terms (e.g., "Supabase", "Next.js", "RLS")
   - Improve transcription accuracy for technical content
   - Use AssemblyAI word boost feature

2. **Automatic Meeting Notes**:
   - Generate structured meeting notes from transcript
   - Extract action items, decisions, attendees
   - Use Claude AI for note generation

3. **Video Summarization**:
   - Generate video chapter markers (0:00 Intro, 5:30 Product Demo)
   - Create timestamped summaries (TL;DR for 60-minute calls)
   - Use Claude AI for summarization

---

## AGENT METADATA

**Created**: 2025-11-18
**Last Updated**: 2025-11-18
**Version**: 1.0.0
**Status**: Active Development
**Owner**: Client Intelligence Team
**Dependencies**: AI Intelligence Extraction Agent, Contact Agent, Workflow Agent
**Related Docs**:
- `supabase/migrations/029_media_files.sql` - Media files table schema
- `docs/openai-whisper-api.md` - OpenAI Whisper API documentation
- `docs/assemblyai-api.md` - AssemblyAI API documentation
- `docs/ffmpeg-usage.md` - FFmpeg usage guide

---

**END OF MEDIA TRANSCRIPTION AGENT SPECIFICATION**
