/**
 * Type definitions for the MCP server
 */
import { z } from 'zod';
/**
 * Common parameters for all recognition tools
 */
export const RecognitionParamsSchema = z.object({
    filepath: z.string().describe('Path to the media file to analyze'),
    prompt: z.string().default('Describe this content').describe('Custom prompt for the recognition'),
    modelname: z.string().default('gemini-2.5-flash').describe('Gemini model to use for recognition')
});
/**
 * Video recognition specific types
 */
export const VideoRecognitionParamsSchema = RecognitionParamsSchema.extend({});
/**
 * Image recognition specific types
 */
export const ImageRecognitionParamsSchema = RecognitionParamsSchema.extend({});
/**
 * Audio recognition specific types
 */
export const AudioRecognitionParamsSchema = RecognitionParamsSchema.extend({});
// File states from Gemini API
export var FileState;
(function (FileState) {
    FileState["UNSPECIFIED"] = "STATE_UNSPECIFIED";
    FileState["PROCESSING"] = "PROCESSING";
    FileState["ACTIVE"] = "ACTIVE";
    FileState["FAILED"] = "FAILED";
})(FileState || (FileState = {}));
//# sourceMappingURL=index.js.map