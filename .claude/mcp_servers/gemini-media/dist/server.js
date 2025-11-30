/**
 * MCP server implementation
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import { createLogger } from './utils/logger.js';
import { GeminiService } from './services/gemini.js';
import { createImageRecognitionTool } from './tools/image-recognition.js';
import { createAudioRecognitionTool } from './tools/audio-recognition.js';
import { createVideoRecognitionTool } from './tools/video-recognition.js';
const log = createLogger('Server');
export class Server {
    mcpServer;
    geminiService;
    config;
    constructor(config) {
        this.config = config;
        // Initialize Gemini service
        this.geminiService = new GeminiService(config.gemini);
        // Create MCP server
        this.mcpServer = new McpServer({
            name: 'mcp-video-recognition',
            version: '1.0.0'
        });
        // Register tools
        this.registerTools();
        log.info('MCP server initialized');
    }
    /**
     * Register all tools with the MCP server
     */
    registerTools() {
        // Create tools
        const imageRecognitionTool = createImageRecognitionTool(this.geminiService);
        const audioRecognitionTool = createAudioRecognitionTool(this.geminiService);
        const videoRecognitionTool = createVideoRecognitionTool(this.geminiService);
        // Register tools with MCP server
        this.mcpServer.tool(imageRecognitionTool.name, imageRecognitionTool.description, imageRecognitionTool.inputSchema.shape, imageRecognitionTool.callback);
        this.mcpServer.tool(audioRecognitionTool.name, audioRecognitionTool.description, audioRecognitionTool.inputSchema.shape, audioRecognitionTool.callback);
        this.mcpServer.tool(videoRecognitionTool.name, videoRecognitionTool.description, videoRecognitionTool.inputSchema.shape, videoRecognitionTool.callback);
        log.info('All tools registered with MCP server');
    }
    /**
     * Start the server with the configured transport
     */
    async start() {
        try {
            if (this.config.transport === 'stdio') {
                await this.startWithStdio();
            }
            else if (this.config.transport === 'sse') {
                await this.startWithSSE();
            }
            else {
                throw new Error(`Unsupported transport: ${this.config.transport}`);
            }
        }
        catch (error) {
            log.error('Failed to start server', error);
            throw error;
        }
    }
    /**
     * Start the server with stdio transport
     */
    async startWithStdio() {
        log.info('Starting server with stdio transport');
        const transport = new StdioServerTransport();
        transport.onclose = () => {
            log.info('Stdio transport closed');
        };
        transport.onerror = (error) => {
            log.error('Stdio transport error', error);
        };
        await this.mcpServer.connect(transport);
        log.info('Server started with stdio transport');
    }
    /**
     * Start the server with SSE transport
     */
    async startWithSSE() {
        log.info('Starting server with SSE transport');
        // Import express dynamically to avoid loading it when using stdio
        const express = await import('express');
        const app = express.default();
        const port = this.config.port || 3000;
        app.use(express.json());
        // Map to store transports by session ID
        const transports = {};
        // Handle POST requests for client-to-server communication
        app.post('/mcp', async (req, res) => {
            try {
                // Check for existing session ID
                const sessionId = req.headers['mcp-session-id'];
                let transport;
                if (sessionId && transports[sessionId]) {
                    // Reuse existing transport
                    transport = transports[sessionId];
                    log.debug(`Using existing transport for session: ${sessionId}`);
                }
                else {
                    log.error('No valid session ID provided');
                    res.status(400).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32000,
                            message: 'Bad Request: No valid session ID provided',
                        },
                        id: null,
                    });
                    return;
                }
                // Handle the request
                await transport.handleRequest(req, res, req.body);
            }
            catch (error) {
                log.error('Error handling MCP request', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: 'Internal server error',
                        },
                        id: null,
                    });
                }
            }
        });
        // Reusable handler for GET and DELETE requests
        const handleSessionRequest = async (req, res) => {
            const sessionId = req.headers['mcp-session-id'];
            if (!sessionId || !transports[sessionId]) {
                res.status(400).send('Invalid or missing session ID');
                return;
            }
            const transport = transports[sessionId];
            await transport.handleRequest(req, res);
        };
        // Handle GET requests for server-to-client notifications via SSE
        app.get('/mcp', async (req, res) => {
            try {
                // Create a new transport for this connection
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                    onsessioninitialized: (sessionId) => {
                        // Store the transport by session ID
                        transports[sessionId] = transport;
                        log.info(`New session initialized: ${sessionId}`);
                    }
                });
                // Clean up transport when closed
                transport.onclose = () => {
                    if (transport.sessionId) {
                        delete transports[transport.sessionId];
                        log.info(`Session closed: ${transport.sessionId}`);
                    }
                };
                // Connect to the MCP server
                await this.mcpServer.connect(transport);
                // Handle the initial GET request
                await transport.handleRequest(req, res);
            }
            catch (error) {
                log.error('Error handling SSE connection', error);
                if (!res.headersSent) {
                    res.status(500).send('Internal server error');
                }
            }
        });
        // Handle DELETE requests for session termination
        app.delete('/mcp', handleSessionRequest);
        // Start the HTTP server
        app.listen(port, () => {
            log.info(`Server started with SSE transport on port ${port}`);
        });
    }
    /**
     * Stop the server
     */
    async stop() {
        try {
            await this.mcpServer.close();
            log.info('Server stopped');
        }
        catch (error) {
            log.error('Error stopping server', error);
            throw error;
        }
    }
}
//# sourceMappingURL=server.js.map