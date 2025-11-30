/**
 * Logger utility for the MCP server
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["VERBOSE"] = "verbose";
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["FATAL"] = "fatal";
})(LogLevel || (LogLevel = {}));
export class Logger {
    name;
    static level = LogLevel.FATAL;
    constructor(name) {
        this.name = name;
    }
    static setLogLevel(level) {
        Logger.level = level;
    }
    shouldLog(level) {
        const levels = Object.values(LogLevel);
        return levels.indexOf(level) >= levels.indexOf(Logger.level);
    }
    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}`;
    }
    verbose(message, data) {
        if (this.shouldLog(LogLevel.VERBOSE)) {
            const formattedData = data ? JSON.stringify(data) : '';
            console.log(this.formatMessage(LogLevel.VERBOSE, message), formattedData);
        }
    }
    debug(message, data) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(this.formatMessage(LogLevel.DEBUG, message), data || '');
        }
    }
    info(message, data) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(this.formatMessage(LogLevel.INFO, message), data || '');
        }
    }
    warn(message, data) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage(LogLevel.WARN, message), data || '');
        }
    }
    error(message, error) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage(LogLevel.ERROR, message), error || '');
        }
    }
    fatal(message, error) {
        if (this.shouldLog(LogLevel.FATAL)) {
            console.error(this.formatMessage(LogLevel.FATAL, message), error || '');
        }
    }
}
export const createLogger = (name) => new Logger(name);
//# sourceMappingURL=logger.js.map