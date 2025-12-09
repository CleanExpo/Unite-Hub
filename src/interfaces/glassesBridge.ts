/**
 * Smart Glasses Bridge
 *
 * Hardware-agnostic interface for Ray-Ban Meta, Solos, XREAL, VITURE, and Android XR.
 * Provides audio commands, camera streaming, notifications, and wake-word detection.
 */

export type GlassesHardware = 'rayban-meta' | 'solos' | 'xreal' | 'viture' | 'android-xr' | 'generic';
export type InputMode = 'audio' | 'touch' | 'gesture' | 'gaze' | 'voice-command';
export type OutputMode = 'audio' | 'visual-overlay' | 'haptic' | 'combined';

export interface GlassesSession {
  id: string;
  hardware: GlassesHardware;
  owner: string; // 'phill'
  startedAt: string;
  isActive: boolean;
  connectedAt?: string;
  batteryPercent?: number;
  signalStrength?: number; // 0-100
}

export interface VoiceCommand {
  id: string;
  timestamp: string;
  transcript: string;
  confidence: number; // 0-1
  intent: 'query' | 'action' | 'navigation' | 'briefing' | 'advisor';
  parameters?: Record<string, string>;
}

export interface NotificationOverlay {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  duration: number; // seconds
  action?: {
    label: string;
    command: string;
  };
}

export interface AudioOutput {
  id: string;
  type: 'briefing' | 'alert' | 'notification' | 'response' | 'reading';
  text: string;
  rate: number; // words per minute, 100-180
  voice: 'default' | 'phill-custom'; // Custom voice profile option
  priority: number; // 0-10, higher = interrupts current
}

// Session management
let activeSessions: GlassesSession[] = [];

/**
 * Initialize glasses connection
 */
export function initializeGlassesConnection(owner: string, hardware: GlassesHardware): GlassesSession {
  const session: GlassesSession = {
    id: crypto.randomUUID(),
    hardware,
    owner,
    startedAt: new Date().toISOString(),
    isActive: true,
    connectedAt: new Date().toISOString(),
    batteryPercent: 85,
    signalStrength: 95
  };

  activeSessions.push(session);
  return session;
}

/**
 * Disconnect glasses
 */
export function disconnectGlasses(sessionId: string): GlassesSession | null {
  const session = activeSessions.find(s => s.id === sessionId);
  if (!session) {
return null;
}

  session.isActive = false;
  return session;
}

/**
 * Get active session
 */
export function getActiveSession(owner: string): GlassesSession | null {
  return activeSessions.find(s => s.owner === owner && s.isActive) || null;
}

/**
 * Process voice command
 */
export async function processVoiceCommand(sessionId: string, transcript: string): Promise<VoiceCommand> {
  const command: VoiceCommand = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    transcript,
    confidence: 0.92, // Simulated
    intent: inferIntent(transcript),
    parameters: parseParameters(transcript)
  };

  return command;
}

/**
 * Infer voice command intent
 */
function inferIntent(transcript: string): VoiceCommand['intent'] {
  const lower = transcript.toLowerCase();

  if (
    lower.includes('briefing') ||
    lower.includes('morning') ||
    lower.includes('status') ||
    lower.includes('what') + 's'
  ) {
    return 'query';
  }

  if (lower.includes('do') || lower.includes('send') || lower.includes('create')) {
    return 'action';
  }

  if (lower.includes('go to') || lower.includes('navigate') || lower.includes('open')) {
    return 'navigation';
  }

  if (lower.includes('advisor') || lower.includes('idea') || lower.includes('advice')) {
    return 'advisor';
  }

  return 'query';
}

/**
 * Parse parameters from voice command
 */
function parseParameters(transcript: string): Record<string, string> {
  const params: Record<string, string> = {};

  // Simple parameter extraction
  const timeMatch = transcript.match(/\b(morning|midday|evening|today|tomorrow)\b/i);
  if (timeMatch) {
params.timeOfDay = timeMatch[1];
}

  const domainMatch = transcript.match(/\b(leads|revenue|profit|operations|risk|crypto|market)\b/i);
  if (domainMatch) {
params.domain = domainMatch[1];
}

  return params;
}

/**
 * Send audio output to glasses
 */
export async function sendAudioOutput(sessionId: string, audio: AudioOutput): Promise<boolean> {
  const session = activeSessions.find(s => s.id === sessionId);
  if (!session || !session.isActive) {
return false;
}

  // Would integrate with glasses hardware API here
  // Example: Ray-Ban Meta uses Meta's audio API
  // Example: Solos uses Solos SDK
  // Example: XREAL uses XREAL Unity Plugin

  console.log(`[${session.hardware}] Playing audio (${audio.type}): ${audio.text.slice(0, 50)}...`);
  return true;
}

/**
 * Display notification overlay
 */
export async function displayNotificationOverlay(sessionId: string, notification: NotificationOverlay): Promise<boolean> {
  const session = activeSessions.find(s => s.id === sessionId);
  if (!session || !session.isActive) {
return false;
}

  console.log(`[${session.hardware}] Displaying overlay: ${notification.message}`);
  return true;
}

/**
 * Stream camera feed (for object detection, AR, analysis)
 */
export async function startCameraStream(sessionId: string, purpose: 'ar' | 'analysis' | 'recording'): Promise<string> {
  const session = activeSessions.find(s => s.id === sessionId);
  if (!session || !session.isActive) {
throw new Error('Session not active');
}

  const streamId = crypto.randomUUID();
  console.log(`[${session.hardware}] Starting camera stream for ${purpose}`);
  return streamId;
}

/**
 * Stop camera stream
 */
export async function stopCameraStream(sessionId: string, streamId: string): Promise<boolean> {
  const session = activeSessions.find(s => s.id === sessionId);
  if (!session) {
return false;
}

  console.log(`[${session.hardware}] Stopping camera stream`);
  return true;
}

/**
 * Enable wake word detection
 */
export function enableWakeWord(sessionId: string, wakeWord: string = 'hey phill'): boolean {
  const session = activeSessions.find(s => s.id === sessionId);
  if (!session || !session.isActive) {
return false;
}

  console.log(`[${session.hardware}] Wake word enabled: "${wakeWord}"`);
  return true;
}

/**
 * Get glasses capabilities
 */
export function getGlassesCapabilities(hardware: GlassesHardware): {
  inputModes: InputMode[];
  outputModes: OutputMode[];
  batteryLife: number; // hours
  refreshRate: number; // Hz
  fieldOfView: string;
  audioQuality: string;
} {
  const capabilities: Record<GlassesHardware, any> = {
    'rayban-meta': {
      inputModes: ['voice-command', 'touch', 'gesture'],
      outputModes: ['audio', 'visual-overlay'],
      batteryLife: 8,
      refreshRate: 30,
      fieldOfView: '50°',
      audioQuality: 'stereo with spatial audio'
    },
    solos: {
      inputModes: ['voice-command', 'gesture'],
      outputModes: ['audio', 'visual-overlay', 'haptic'],
      batteryLife: 4,
      refreshRate: 60,
      fieldOfView: '40°',
      audioQuality: 'mono with bone conduction'
    },
    xreal: {
      inputModes: ['touch', 'gesture', 'gaze'],
      outputModes: ['audio', 'visual-overlay'],
      batteryLife: 10,
      refreshRate: 90,
      fieldOfView: '75°',
      audioQuality: 'stereo'
    },
    viture: {
      inputModes: ['touch', 'gesture'],
      outputModes: ['audio', 'visual-overlay'],
      batteryLife: 6,
      refreshRate: 120,
      fieldOfView: '70°',
      audioQuality: 'stereo'
    },
    'android-xr': {
      inputModes: ['voice-command', 'gesture', 'gaze'],
      outputModes: ['audio', 'visual-overlay', 'haptic'],
      batteryLife: 8,
      refreshRate: 120,
      fieldOfView: '80°',
      audioQuality: 'stereo with spatial audio'
    },
    generic: {
      inputModes: ['voice-command'],
      outputModes: ['audio'],
      batteryLife: 4,
      refreshRate: 30,
      fieldOfView: 'variable',
      audioQuality: 'mono'
    }
  };

  return capabilities[hardware] || capabilities.generic;
}

/**
 * Format briefing for glasses delivery
 */
export function formatBriefingForGlasses(briefingText: string, format: 'audio' | 'visual'): string {
  if (format === 'audio') {
    // Convert to natural speech format
    return briefingText
      .replace(/###/g, '') // Remove markdown headers
      .replace(/\n\n/g, ' ') // Collapse paragraphs for continuous speech
      .replace(/[-•]/g, 'item') // Convert bullets to words
      .slice(0, 500); // Limit to reasonable audio length
  }

  // Visual format (overlay)
  return briefingText
    .split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, 5) // Show top 5 lines
    .join('\n');
}

/**
 * Handle gesture input
 */
export async function handleGestureInput(sessionId: string, gesture: 'swipe-up' | 'swipe-down' | 'double-tap' | 'pinch'): Promise<string> {
  const session = activeSessions.find(s => s.id === sessionId);
  if (!session || !session.isActive) {
return '';
}

  const actions: Record<string, string> = {
    'swipe-up': 'scroll_up',
    'swipe-down': 'scroll_down',
    'double-tap': 'select_item',
    pinch: 'zoom_in'
  };

  return actions[gesture] || 'unknown';
}

/**
 * Get all active sessions
 */
export function getActiveSessions(): GlassesSession[] {
  return activeSessions.filter(s => s.isActive);
}

/**
 * Clear sessions (for testing)
 */
export function clearSessions(): void {
  activeSessions = [];
}
