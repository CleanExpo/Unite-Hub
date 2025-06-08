type LogLevel = "info" | "warn" | "error" | "debug"

const isProduction = process.env.NODE_ENV === "production"

export const logger = {
  info: (message: string, data?: any) => {
    if (isProduction) {
      // In production, you might want to send this to a logging service
      console.info(message, data)
    } else {
      console.info(`[INFO] ${message}`, data)
    }
  },

  warn: (message: string, data?: any) => {
    if (isProduction) {
      console.warn(message, data)
    } else {
      console.warn(`[WARN] ${message}`, data)
    }
  },

  error: (message: string, error?: any) => {
    if (isProduction) {
      console.error(message, error)
      // In a real app, you might want to send this to an error tracking service
    } else {
      console.error(`[ERROR] ${message}`, error)
    }
  },

  debug: (message: string, data?: any) => {
    if (!isProduction) {
      console.debug(`[DEBUG] ${message}`, data)
    }
  },
}
