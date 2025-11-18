#!/usr/bin/env node

/**
 * MEDIA TRANSCRIPTION AGENT
 *
 * Purpose: Audio/video transcription using OpenAI Whisper
 *
 * Task Types:
 * - media_transcription: Transcribe video/audio files
 * - export_subtitles: Export transcripts as SRT/VTT
 *
 * Database Tables:
 * - media_files (read/write): Media files with transcription data
 *
 * AI Model: OpenAI Whisper (whisper-1)
 * Concurrency: 5 (medium volume processing)
 */

import * as amqp from 'amqplib';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

dotenv.config({ path: '.env.local' });

const execAsync = promisify(exec);

// =====================================================
// CONFIGURATION
// =====================================================

const AGENT_NAME = 'media-transcription-agent';
const QUEUE_NAME = 'media_transcription_queue';
const PREFETCH_COUNT = 5; // Medium concurrency
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://unite_hub:unite_hub_pass@localhost:5672';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

// =====================================================
// VALIDATION
// =====================================================

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!openaiKey) {
  console.error('❌ Missing OpenAI API key');
  process.exit(1);
}

// =====================================================
// CLIENTS
// =====================================================

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

let connection = null;
let channel = null;

// =====================================================
// TRANSCRIPTION FUNCTIONS
// =====================================================

/**
 * Extract audio from video using ffmpeg
 */
async function extractAudioFromVideo(videoPath) {
  const audioPath = videoPath.replace(path.extname(videoPath), '.wav');

  console.log(`🎵 Extracting audio from video: ${videoPath}`);

  try {
    // Extract audio as 16kHz mono WAV (optimal for Whisper)
    await execAsync(
      `ffmpeg -i "${videoPath}" -ar 16000 -ac 1 -vn "${audioPath}" -y`,
      { maxBuffer: 50 * 1024 * 1024 } // 50MB buffer
    );

    console.log(`✅ Audio extracted: ${audioPath}`);
    return audioPath;
  } catch (error) {
    console.error('❌ Audio extraction failed:', error.message);
    throw new Error(`MEDIA_TRANS_003: Audio extraction failed - ${error.message}`);
  }
}

/**
 * Extract metadata from media file using ffprobe
 */
async function extractMediaMetadata(filePath) {
  console.log(`📊 Extracting metadata from: ${filePath}`);

  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    );

    const data = JSON.parse(stdout);
    const videoStream = data.streams?.find((s) => s.codec_type === 'video');
    const audioStream = data.streams?.find((s) => s.codec_type === 'audio');

    const metadata = {
      duration_seconds: parseFloat(data.format?.duration) || null,
      bitrate: data.format?.bit_rate ? parseInt(data.format.bit_rate) / 1000 : null,
    };

    if (videoStream) {
      metadata.width = videoStream.width;
      metadata.height = videoStream.height;
      metadata.codec = videoStream.codec_name;

      // Parse frame rate (e.g., "30/1" → 30)
      if (videoStream.r_frame_rate) {
        const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
        metadata.fps = den > 0 ? num / den : null;
      }
    }

    if (audioStream && !videoStream) {
      metadata.codec = audioStream.codec_name;
    }

    console.log(`✅ Metadata extracted:`, metadata);
    return metadata;
  } catch (error) {
    console.error('❌ Metadata extraction failed:', error.message);
    throw new Error(`MEDIA_TRANS_007: Metadata extraction failed - ${error.message}`);
  }
}

/**
 * Transcribe audio file using OpenAI Whisper
 */
async function transcribeWithWhisper(audioPath, language = null) {
  console.log(`🎙️ Transcribing with Whisper: ${audioPath}`);

  const startTime = Date.now();

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      language: language || undefined, // Auto-detect if not specified
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    const duration = Date.now() - startTime;

    // Parse segments
    const segments = transcription.segments.map((seg, i) => ({
      id: i,
      start: seg.start,
      end: seg.end,
      text: seg.text,
      confidence: 0.95, // Whisper doesn't provide confidence, estimate high
      speaker: null, // Whisper doesn't do speaker diarization
    }));

    const wordCount = transcription.text.split(/\s+/).length;

    const transcriptData = {
      segments,
      language: transcription.language,
      full_text: transcription.text,
      word_count: wordCount,
      provider: 'whisper',
    };

    console.log(`✅ Transcription complete in ${duration}ms`);
    console.log(`   Language: ${transcription.language}`);
    console.log(`   Segments: ${segments.length}`);
    console.log(`   Words: ${wordCount}`);

    return {
      transcript: transcriptData,
      processing_time_ms: duration,
    };
  } catch (error) {
    console.error('❌ Whisper transcription failed:', error.message);
    throw new Error(`MEDIA_TRANS_004: Whisper API error - ${error.message}`);
  }
}

/**
 * Calculate transcription cost
 * Whisper: $0.006 per minute
 */
function calculateTranscriptionCost(durationSeconds, provider = 'whisper') {
  const minutes = durationSeconds / 60;

  if (provider === 'whisper') {
    return minutes * 0.006;
  }

  return 0;
}

/**
 * Download media file from Supabase Storage
 */
async function downloadMediaFile(storagePath, bucket = 'media-uploads') {
  console.log(`📥 Downloading file from storage: ${storagePath}`);

  try {
    const { data, error } = await supabase.storage.from(bucket).download(storagePath);

    if (error) {
      throw error;
    }

    // Save to temp directory
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, path.basename(storagePath));

    // Convert blob to buffer and write to file
    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);

    console.log(`✅ File downloaded to: ${tempPath}`);
    return tempPath;
  } catch (error) {
    console.error('❌ File download failed:', error.message);
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

/**
 * Main transcription function
 */
async function transcribeMedia(mediaFileId, workspaceId) {
  console.log(`\n🎬 Starting transcription for media file: ${mediaFileId}`);

  const overallStart = Date.now();

  // 1. Fetch media file
  const { data: mediaFile, error: fetchError } = await supabase
    .from('media_files')
    .select('*')
    .eq('id', mediaFileId)
    .eq('workspace_id', workspaceId)
    .single();

  if (fetchError || !mediaFile) {
    throw new Error(`MEDIA_TRANS_001: Media file not found - ${fetchError?.message}`);
  }

  // 2. Verify file type
  if (!['video', 'audio'].includes(mediaFile.file_type)) {
    throw new Error(
      `MEDIA_TRANS_002: Invalid file type - Expected video or audio, got '${mediaFile.file_type}'`
    );
  }

  // 3. Update status to transcribing
  await supabase
    .from('media_files')
    .update({
      status: 'transcribing',
      progress: 10,
    })
    .eq('id', mediaFileId);

  let tempFilePath = null;
  let audioPath = null;

  try {
    // 4. Download file from storage
    tempFilePath = await downloadMediaFile(mediaFile.storage_path, mediaFile.storage_bucket);

    // 5. Extract metadata if not already done
    let metadata = {};
    if (!mediaFile.duration_seconds) {
      metadata = await extractMediaMetadata(tempFilePath);
      await supabase.from('media_files').update(metadata).eq('id', mediaFileId);
    } else {
      metadata.duration_seconds = mediaFile.duration_seconds;
    }

    await supabase
      .from('media_files')
      .update({ progress: 30 })
      .eq('id', mediaFileId);

    // 6. Extract audio from video (if video)
    if (mediaFile.file_type === 'video') {
      audioPath = await extractAudioFromVideo(tempFilePath);
    } else {
      audioPath = tempFilePath;
    }

    await supabase
      .from('media_files')
      .update({ progress: 50 })
      .eq('id', mediaFileId);

    // 7. Transcribe with Whisper
    const { transcript, processing_time_ms } = await transcribeWithWhisper(audioPath);

    await supabase
      .from('media_files')
      .update({ progress: 90 })
      .eq('id', mediaFileId);

    // 8. Calculate cost
    const costUsd = calculateTranscriptionCost(metadata.duration_seconds);

    // 9. Calculate average confidence
    const avgConfidence =
      transcript.segments.reduce((sum, seg) => sum + seg.confidence, 0) /
      transcript.segments.length;

    // 10. Update media file with transcript
    const { error: updateError } = await supabase
      .from('media_files')
      .update({
        transcript,
        transcript_language: transcript.language,
        transcript_confidence: avgConfidence,
        transcribed_at: new Date().toISOString(),
        status: 'completed',
        progress: 100,
        error_message: null,
      })
      .eq('id', mediaFileId);

    if (updateError) {
      throw new Error(`Failed to update media file: ${updateError.message}`);
    }

    const overallDuration = Date.now() - overallStart;

    console.log(`\n✅ Transcription complete!`);
    console.log(`   Total time: ${overallDuration}ms`);
    console.log(`   Cost: $${costUsd.toFixed(4)}`);

    return {
      success: true,
      media_file_id: mediaFileId,
      transcript,
      duration_seconds: metadata.duration_seconds,
      word_count: transcript.word_count,
      cost_usd: costUsd,
      processing_time_ms: overallDuration,
    };
  } catch (error) {
    // Update status to failed
    await supabase
      .from('media_files')
      .update({
        status: 'failed',
        error_message: error.message,
      })
      .eq('id', mediaFileId);

    throw error;
  } finally {
    // Cleanup temp files
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    if (audioPath && audioPath !== tempFilePath && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
  }
}

/**
 * Export transcript as SRT format
 */
function generateSRT(segments) {
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

function formatSRTTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

/**
 * Export transcript as VTT format
 */
function generateVTT(segments) {
  let vtt = 'WEBVTT\n\n';

  segments.forEach((seg) => {
    const startTime = formatVTTTimestamp(seg.start);
    const endTime = formatVTTTimestamp(seg.end);

    vtt += `${startTime} --> ${endTime}\n`;
    vtt += `${seg.text.trim()}\n\n`;
  });

  return vtt;
}

function formatVTTTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(millis, 3)}`;
}

function pad(num, size = 2) {
  return String(num).padStart(size, '0');
}

/**
 * Export subtitles
 */
async function exportSubtitles(mediaFileId, workspaceId, format = 'srt') {
  console.log(`📄 Exporting ${format.toUpperCase()} for media file: ${mediaFileId}`);

  // Fetch media file with transcript
  const { data: mediaFile, error: fetchError } = await supabase
    .from('media_files')
    .select('transcript, original_filename')
    .eq('id', mediaFileId)
    .eq('workspace_id', workspaceId)
    .single();

  if (fetchError || !mediaFile) {
    throw new Error(`MEDIA_TRANS_009: Media file not found`);
  }

  if (!mediaFile.transcript) {
    throw new Error(`MEDIA_TRANS_011: Transcript not available`);
  }

  const segments = mediaFile.transcript.segments;

  let content;
  if (format === 'srt') {
    content = generateSRT(segments);
  } else if (format === 'vtt') {
    content = generateVTT(segments);
  } else {
    throw new Error(`Invalid format: ${format}`);
  }

  console.log(`✅ ${format.toUpperCase()} generated (${content.length} bytes)`);

  return {
    success: true,
    format,
    content,
    filename: mediaFile.original_filename?.replace(/\.[^.]+$/, `.${format}`) || `transcript.${format}`,
  };
}

// =====================================================
// TASK PROCESSING
// =====================================================

async function processTask(task) {
  const { task_type, payload } = task;

  console.log(`\n🔄 Processing task: ${task_type}`);

  let result;
  const startTime = Date.now();

  try {
    switch (task_type) {
      case 'media_transcription':
        result = await transcribeMedia(payload.media_file_id, payload.workspace_id);
        break;

      case 'export_subtitles':
        result = await exportSubtitles(
          payload.media_file_id,
          payload.workspace_id,
          payload.format || 'srt'
        );
        break;

      default:
        throw new Error(`Unknown task type: ${task_type}`);
    }

    const duration = Date.now() - startTime;

    // Update task status
    if (task.id) {
      await supabase.rpc('update_task_status', {
        task_id: task.id,
        new_status: 'completed',
        result_data: result,
      });
    }

    // Record execution
    await supabase.from('agent_executions').insert({
      task_id: task.id,
      agent_name: AGENT_NAME,
      model_used: 'whisper-1',
      duration_ms: duration,
      status: 'success',
      input_data: payload,
      output_data: result,
    });

    console.log(`✅ Task ${task.id} completed in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Update task status to failed
    if (task.id) {
      await supabase.rpc('update_task_status', {
        task_id: task.id,
        new_status: 'failed',
        result_data: { error: error.message },
      });
    }

    // Record failed execution
    await supabase.from('agent_executions').insert({
      task_id: task.id,
      agent_name: AGENT_NAME,
      model_used: 'whisper-1',
      duration_ms: duration,
      status: 'failed',
      input_data: payload,
      error_message: error.message,
    });

    throw error;
  }
}

// =====================================================
// AGENT LIFECYCLE
// =====================================================

async function start() {
  try {
    console.log(`🚀 Starting ${AGENT_NAME}...`);

    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    console.log(`✅ ${AGENT_NAME} connected to RabbitMQ`);

    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-message-ttl': 3600000, // 1 hour
        'x-max-priority': 10,
      },
    });

    console.log(`📥 Listening on queue: ${QUEUE_NAME}`);
    console.log(`⚙️  Concurrency: ${PREFETCH_COUNT}`);

    await channel.prefetch(PREFETCH_COUNT);

    // Health heartbeat
    const heartbeatInterval = setInterval(async () => {
      try {
        await supabase.rpc('record_agent_heartbeat', {
          agent_name: AGENT_NAME,
          current_status: 'healthy',
          metadata: { version: '1.0.0', queue: QUEUE_NAME },
        });
      } catch (err) {
        console.error('⚠️  Heartbeat failed:', err.message);
      }
    }, HEARTBEAT_INTERVAL);

    console.log(`⏰ Health heartbeat: every ${HEARTBEAT_INTERVAL / 1000}s`);

    // Consume messages
    await channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) return;

      try {
        const task = JSON.parse(msg.content.toString());
        await processTask(task);
        channel.ack(msg);
      } catch (error) {
        console.error('❌ Task processing failed:', error.message);

        const task = JSON.parse(msg.content.toString());
        if (task.retry_count < (task.max_retries || 3)) {
          console.log(`🔄 Requeuing task (retry ${task.retry_count + 1})`);
          task.retry_count++;
          channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(task)), {
            persistent: true,
          });
        }

        channel.ack(msg);
      }
    });

    console.log(`✅ ${AGENT_NAME} is running\n`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n⚠️  Received SIGTERM, shutting down...');
      clearInterval(heartbeatInterval);
      await channel.close();
      await connection.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('\n⚠️  Received SIGINT, shutting down...');
      clearInterval(heartbeatInterval);
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start agent:', error.message);
    process.exit(1);
  }
}

start();
