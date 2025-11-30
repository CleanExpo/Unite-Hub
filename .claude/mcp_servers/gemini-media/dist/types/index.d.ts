/**
 * Type definitions for the MCP server
 */
import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
/**
 * Common parameters for all recognition tools
 */
export declare const RecognitionParamsSchema: z.ZodObject<{
    filepath: z.ZodString;
    prompt: z.ZodDefault<z.ZodString>;
    modelname: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    filepath: string;
    prompt: string;
    modelname: string;
}, {
    filepath: string;
    prompt?: string | undefined;
    modelname?: string | undefined;
}>;
export type RecognitionParams = z.infer<typeof RecognitionParamsSchema>;
/**
 * Video recognition specific types
 */
export declare const VideoRecognitionParamsSchema: z.ZodObject<{
    filepath: z.ZodString;
    prompt: z.ZodDefault<z.ZodString>;
    modelname: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    filepath: string;
    prompt: string;
    modelname: string;
}, {
    filepath: string;
    prompt?: string | undefined;
    modelname?: string | undefined;
}>;
export type VideoRecognitionParams = z.infer<typeof VideoRecognitionParamsSchema>;
/**
 * Image recognition specific types
 */
export declare const ImageRecognitionParamsSchema: z.ZodObject<{
    filepath: z.ZodString;
    prompt: z.ZodDefault<z.ZodString>;
    modelname: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    filepath: string;
    prompt: string;
    modelname: string;
}, {
    filepath: string;
    prompt?: string | undefined;
    modelname?: string | undefined;
}>;
export type ImageRecognitionParams = z.infer<typeof ImageRecognitionParamsSchema>;
/**
 * Audio recognition specific types
 */
export declare const AudioRecognitionParamsSchema: z.ZodObject<{
    filepath: z.ZodString;
    prompt: z.ZodDefault<z.ZodString>;
    modelname: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    filepath: string;
    prompt: string;
    modelname: string;
}, {
    filepath: string;
    prompt?: string | undefined;
    modelname?: string | undefined;
}>;
export type AudioRecognitionParams = z.infer<typeof AudioRecognitionParamsSchema>;
/**
 * Tool definitions
 */
export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: z.ZodObject<any>;
    callback: (args: any) => Promise<CallToolResult>;
}
/**
 * Gemini API types
 */
export interface GeminiConfig {
    apiKey: string;
}
export interface GeminiFile {
    uri: string;
    mimeType: string;
    name?: string;
    state?: string;
}
export interface ProcessedGeminiFile {
    uri: string;
    mimeType: string;
    name: string;
    state: string;
}
export interface CachedFile {
    fileId: string;
    checksum: string;
    uri: string;
    mimeType: string;
    name: string;
    state: string;
    timestamp: number;
}
export declare enum FileState {
    UNSPECIFIED = "STATE_UNSPECIFIED",
    PROCESSING = "PROCESSING",
    ACTIVE = "ACTIVE",
    FAILED = "FAILED"
}
export interface GeminiResponse {
    text: string;
    isError?: boolean;
}
