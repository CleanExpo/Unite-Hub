/**
 * 🐳 DOCKER INTEGRATION UTILITIES
 * Advanced Docker log analysis and container management for testing
 */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export interface DockerContainer {
  id: string
  name: string
  status: string
  image: string
  ports: string[]
  created: string
  uptime: string
}

export interface DockerLogEntry {
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'FATAL'
  source: string
  message: string
  metadata?: any
}

export interface DockerHealthCheck {
  containerStatus: 'healthy' | 'unhealthy' | 'starting' | 'none' | 'not_found'
  memoryUsage: number
  cpuUsage: number
  networkConnections: number
  logErrors: number
  lastErrors: string[]
  recommendations: string[]
}

export class DockerIntegration {
  private containers: Map<string, DockerContainer> = new Map()
  private logBuffer: DockerLogEntry[] = []
  private logStream: any = null
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor(private config: {
    containerNames: string[]
    maxLogBuffer: number
    healthCheckInterval: number
    logFilters: {
      includePatterns: string[]
      excludePatterns: string[]
      errorPatterns: string[]
      warningPatterns: string[]
    }
  }) {}

  async initialize(): Promise<boolean> {
    try {
      // Check Docker availability
      await execAsync('docker --version')
      console.log('🐳 Docker detected and available')

      // Discover containers
      await this.discoverContainers()
      
      // Start monitoring
      await this.startMonitoring()
      
      return true
    } catch (error) {
      console.log('⚠️  Docker not available or containers not running')
      return false
    }
  }

  async discoverContainers(): Promise<void> {
    try {
      const { stdout } = await execAsync('docker ps --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}|{{.Ports}}|{{.CreatedAt}}"')
      
      const lines = stdout.trim().split('\n').filter(line => line)
      
      for (const line of lines) {
        const [id, name, status, image, ports, created] = line.split('|')
        
        if (this.config.containerNames.some(configName => name.includes(configName))) {
          const container: DockerContainer = {
            id: id.trim(),
            name: name.trim(),
            status: status.trim(),
            image: image.trim(),
            ports: ports.trim().split(',').map(p => p.trim()).filter(p => p),
            created: created.trim(),
            uptime: this.extractUptime(status)
          }
          
          this.containers.set(name.trim(), container)
          console.log(`📦 Found container: ${name} (${status})`)
        }
      }
    } catch (error) {
      console.log('⚠️  No containers found or Docker not accessible')
    }
  }

  async startMonitoring(): Promise<void> {
    if (this.containers.size === 0) {
      console.log('⚠️  No containers to monitor')
      return
    }

    // Start log streaming for each container
    for (const [name, container] of this.containers) {
      this.startLogStream(container)
    }

    // Start health checking
    this.startHealthChecking()
  }

  private startLogStream(container: DockerContainer): void {
    const logStream = spawn('docker', ['logs', '-f', '--tail', '50', container.id])
    
    logStream.stdout.on('data', (data) => {
      this.processLogData(container.name, data.toString(), 'stdout')
    })

    logStream.stderr.on('data', (data) => {
      this.processLogData(container.name, data.toString(), 'stderr')
    })

    logStream.on('error', (error) => {
      console.log(`⚠️  Log stream error for ${container.name}:`, error.message)
    })

    console.log(`📊 Started log monitoring for ${container.name}`)
  }

  private processLogData(containerName: string, data: string, stream: 'stdout' | 'stderr'): void {
    const lines = data.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      const logEntry = this.parseLogLine(containerName, line, stream)
      
      if (this.shouldIncludeLog(logEntry)) {
        this.logBuffer.push(logEntry)
        
        // Keep buffer size manageable
        if (this.logBuffer.length > this.config.maxLogBuffer) {
          this.logBuffer = this.logBuffer.slice(-this.config.maxLogBuffer)
        }
      }
    }
  }

  private parseLogLine(containerName: string, line: string, stream: 'stdout' | 'stderr'): DockerLogEntry {
    // Try to parse structured logs (JSON format)
    try {
      const parsed = JSON.parse(line)
      return {
        timestamp: parsed.timestamp || new Date().toISOString(),
        level: this.determineLogLevel(parsed.level || line),
        source: `${containerName}:${stream}`,
        message: parsed.message || line,
        metadata: parsed
      }
    } catch {
      // Fallback to plain text parsing
      return {
        timestamp: new Date().toISOString(),
        level: this.determineLogLevel(line),
        source: `${containerName}:${stream}`,
        message: line
      }
    }
  }

  private determineLogLevel(input: string): DockerLogEntry['level'] {
    const lower = input.toLowerCase()
    if (lower.includes('fatal') || lower.includes('critical')) return 'FATAL'
    if (lower.includes('error') || lower.includes('err')) return 'ERROR'
    if (lower.includes('warn') || lower.includes('warning')) return 'WARN'
    if (lower.includes('debug') || lower.includes('trace')) return 'DEBUG'
    return 'INFO'
  }

  private shouldIncludeLog(logEntry: DockerLogEntry): boolean {
    const message = logEntry.message.toLowerCase()
    
    // Check exclude patterns first
    if (this.config.logFilters.excludePatterns.some(pattern => 
      message.includes(pattern.toLowerCase()))) {
      return false
    }
    
    // Check include patterns
    if (this.config.logFilters.includePatterns.length > 0) {
      return this.config.logFilters.includePatterns.some(pattern => 
        message.includes(pattern.toLowerCase()))
    }
    
    return true
  }

  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [name, container] of this.containers) {
        await this.performHealthCheck(container)
      }
    }, this.config.healthCheckInterval)
  }

  private async performHealthCheck(container: DockerContainer): Promise<DockerHealthCheck> {
    try {
      // Get container stats
      const { stdout: statsOutput } = await execAsync(
        `docker stats ${container.id} --no-stream --format "{{.MemUsage}}|{{.CPUPerc}}"`
      )
      
      const [memUsage, cpuUsage] = statsOutput.trim().split('|')
      
      // Parse memory usage (e.g., "123.4MiB / 1.5GiB")
      const memoryUsage = this.parseMemoryUsage(memUsage)
      
      // Parse CPU usage (e.g., "12.34%")
      const cpuPercent = parseFloat(cpuUsage.replace('%', ''))
      
      // Count recent errors
      const recentErrors = this.getRecentErrors(container.name, 300000) // Last 5 minutes
      
      // Determine health status
      const containerStatus = await this.getContainerHealthStatus(container)
      
      const healthCheck: DockerHealthCheck = {
        containerStatus,
        memoryUsage,
        cpuUsage: cpuPercent,
        networkConnections: await this.getNetworkConnections(container),
        logErrors: recentErrors.length,
        lastErrors: recentErrors.slice(-5).map(entry => entry.message),
        recommendations: this.generateHealthRecommendations(memoryUsage, cpuPercent, recentErrors.length)
      }
      
      return healthCheck
    } catch (error) {
      return {
        containerStatus: 'not_found',
        memoryUsage: 0,
        cpuUsage: 0,
        networkConnections: 0,
        logErrors: 0,
        lastErrors: [],
        recommendations: ['Container health check failed - investigate container status']
      }
    }
  }

  private parseMemoryUsage(memUsage: string): number {
    // Parse "123.4MiB / 1.5GiB" -> percentage
    const parts = memUsage.split(' / ')
    if (parts.length !== 2) return 0
    
    const used = this.parseMemoryValue(parts[0])
    const total = this.parseMemoryValue(parts[1])
    
    return total > 0 ? (used / total) * 100 : 0
  }

  private parseMemoryValue(value: string): number {
    const num = parseFloat(value)
    if (value.includes('GiB')) return num * 1024
    if (value.includes('MiB')) return num
    if (value.includes('KiB')) return num / 1024
    return num
  }

  private async getContainerHealthStatus(container: DockerContainer): Promise<DockerHealthCheck['containerStatus']> {
    try {
      const { stdout } = await execAsync(`docker inspect ${container.id} --format "{{.State.Health.Status}}"`)
      const status = stdout.trim()
      
      if (status === 'healthy') return 'healthy'
      if (status === 'unhealthy') return 'unhealthy'
      if (status === 'starting') return 'starting'
      return 'none'
    } catch {
      return 'not_found'
    }
  }

  private async getNetworkConnections(container: DockerContainer): Promise<number> {
    try {
      // Get network connections count (simplified)
      const { stdout } = await execAsync(
        `docker exec ${container.id} netstat -an 2>/dev/null | grep ESTABLISHED | wc -l`
      )
      return parseInt(stdout.trim()) || 0
    } catch {
      return 0
    }
  }

  private getRecentErrors(containerName: string, timeWindowMs: number): DockerLogEntry[] {
    const cutoff = Date.now() - timeWindowMs
    return this.logBuffer.filter(entry => 
      entry.source.includes(containerName) &&
      (entry.level === 'ERROR' || entry.level === 'FATAL') &&
      new Date(entry.timestamp).getTime() > cutoff
    )
  }

  private generateHealthRecommendations(memUsage: number, cpuUsage: number, errorCount: number): string[] {
    const recommendations: string[] = []
    
    if (memUsage > 80) {
      recommendations.push('High memory usage detected - consider increasing memory limits or investigating memory leaks')
    }
    
    if (cpuUsage > 80) {
      recommendations.push('High CPU usage detected - investigate performance bottlenecks or scale resources')
    }
    
    if (errorCount > 10) {
      recommendations.push('High error rate detected - investigate application logs and error patterns')
    }
    
    if (memUsage > 90 || cpuUsage > 90) {
      recommendations.push('CRITICAL: Resource usage extremely high - immediate intervention required')
    }
    
    return recommendations
  }

  private extractUptime(status: string): string {
    // Extract uptime from status like "Up 2 hours" or "Up 5 minutes"
    const match = status.match(/Up\s+(.+?)(?:\s+\(|$)/)
    return match ? match[1] : 'unknown'
  }

  // Public methods for test integration
  
  async getContainerLogs(containerName: string, since?: string): Promise<DockerLogEntry[]> {
    if (since) {
      const sinceTime = new Date(since).getTime()
      return this.logBuffer.filter(entry => 
        entry.source.includes(containerName) &&
        new Date(entry.timestamp).getTime() > sinceTime
      )
    }
    
    return this.logBuffer.filter(entry => entry.source.includes(containerName))
  }

  async getErrorLogs(containerName?: string, level: DockerLogEntry['level'] = 'ERROR'): Promise<DockerLogEntry[]> {
    return this.logBuffer.filter(entry => 
      entry.level === level &&
      (!containerName || entry.source.includes(containerName))
    )
  }

  async generateHealthReport(): Promise<{
    containers: DockerContainer[]
    overallHealth: 'healthy' | 'warning' | 'critical'
    totalErrors: number
    totalWarnings: number
    recommendations: string[]
  }> {
    const containers = Array.from(this.containers.values())
    const totalErrors = this.logBuffer.filter(entry => entry.level === 'ERROR' || entry.level === 'FATAL').length
    const totalWarnings = this.logBuffer.filter(entry => entry.level === 'WARN').length
    
    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (totalErrors > 50 || totalWarnings > 100) overallHealth = 'critical'
    else if (totalErrors > 10 || totalWarnings > 20) overallHealth = 'warning'
    
    const recommendations: string[] = []
    if (totalErrors > 0) recommendations.push(`${totalErrors} errors detected - investigate error patterns`)
    if (totalWarnings > 20) recommendations.push(`${totalWarnings} warnings detected - review application configuration`)
    if (containers.length === 0) recommendations.push('No containers found - ensure Docker environment is properly configured')
    
    return {
      containers,
      overallHealth,
      totalErrors,
      totalWarnings,
      recommendations
    }
  }

  async exportLogs(filePath: string, format: 'json' | 'txt' = 'json'): Promise<void> {
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    
    if (format === 'json') {
      await fs.writeFile(filePath, JSON.stringify(this.logBuffer, null, 2))
    } else {
      const txtContent = this.logBuffer.map(entry => 
        `[${entry.timestamp}] ${entry.level} ${entry.source}: ${entry.message}`
      ).join('\n')
      await fs.writeFile(filePath, txtContent)
    }
  }

  async cleanup(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    
    if (this.logStream) {
      this.logStream.kill()
    }
    
    console.log('🐳 Docker monitoring cleanup completed')
  }
}

// Factory function for easy integration
export function createDockerIntegration(containerNames: string[] = ['unite-group-app', 'nextjs', 'app']): DockerIntegration {
  return new DockerIntegration({
    containerNames,
    maxLogBuffer: 1000,
    healthCheckInterval: 30000, // 30 seconds
    logFilters: {
      includePatterns: [],
      excludePatterns: ['node_modules', 'webpack-hmr'],
      errorPatterns: ['ERROR', 'FATAL', 'CRITICAL', 'Exception', 'failed'],
      warningPatterns: ['WARN', 'WARNING', 'deprecated']
    }
  })
}

export default DockerIntegration
