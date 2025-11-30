/**
 * Image recognition tool for MCP server
 */
import { z } from 'zod';
import { GeminiService } from '../services/gemini.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ImageRecognitionParams } from '../types/index.js';
export declare const createImageRecognitionTool: (geminiService: GeminiService) => {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
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
    callback: (args: ImageRecognitionParams) => Promise<CallToolResult>;
};
