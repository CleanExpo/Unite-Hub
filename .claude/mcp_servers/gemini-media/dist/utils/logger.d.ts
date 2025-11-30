/**
 * Logger utility for the MCP server
 */
export declare enum LogLevel {
    VERBOSE = "verbose",
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal"
}
export declare class Logger {
    private readonly name;
    private static level;
    constructor(name: string);
    static setLogLevel(level: LogLevel): void;
    private shouldLog;
    private formatMessage;
    verbose(message: string, data?: unknown): void;
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, error?: unknown): void;
    fatal(message: string, error?: unknown): void;
}
export declare const createLogger: (name: string) => Logger;
