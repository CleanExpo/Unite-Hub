/**
 * Service for interacting with Google's Gemini API
 */
import type { GeminiConfig, GeminiFile, GeminiResponse, ProcessedGeminiFile } from '../types/index.js';
export declare class GeminiService {
    private readonly client;
    private fileCache;
    private readonly cacheExpiration;
    constructor(config: GeminiConfig);
    /**
     * Calculate checksum for a file
     */
    private calculateChecksum;
    /**
     * Check if a file exists in cache and is still valid
     */
    private isCacheValid;
    /**
     * Get file from Gemini API by name
     */
    getFile(name: string): Promise<GeminiFile>;
    /**
     * Wait for a video file to be processed
     */
    waitForVideoProcessing(file: GeminiFile, maxWaitTimeMs?: number): Promise<ProcessedGeminiFile>;
    /**
     * Upload a file to Gemini API with caching
     */
    uploadFile(filePath: string): Promise<GeminiFile>;
    /**
     * Process a file with Gemini API
     */
    processFile(file: GeminiFile, prompt: string, modelName: string): Promise<GeminiResponse>;
}
