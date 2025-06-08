#!/usr/bin/env tsx

/**
 * 🚀 PRE-DEPLOYMENT AUTOMATION
 * Automated testing pipeline that runs before every deployment
 */

import { ComprehensiveTestRunner } from './comprehensive-test-runner.js'
import { createDockerIntegration } from './docker-integration.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

interface AutomationConfig {
  skipOnCriticalFailure: boolean
  maxRetries: number
  buildValidation: boolean
  dockerValidation: boolean
  performanceThresholds: {
    maxResponseTime: number
    maxMemoryUsage: number
    maxCpuUsage: number
  }
  notifications: {
    webhook?: string
    email?: string
  }
}

interface DeploymentResult {
  success: boolean
  timestamp: string
  testsRun: number
  testsPassed: number
  testsFailed: number
  buildTime: number
  dockerHealth: string
  criticalIssues: string[]
  recommendations: string[]
  deploymentReady: boolean
  reportPath: string
}

class PreDeploymentAutomation {
  private config: AutomationConfig
  private docker: any
  private testRunner: ComprehensiveTestRunner

  constructor(config: Partial<AutomationConfig> = {}) {
    this.config = {
      skipOnCriticalFailure: true,
      maxRetries: 2,
      buildValidation: true,
      dockerValidation: true,
      performanceThresholds: {
        maxResponseTime: 5000,
        maxMemoryUsage: 80,
        maxCpuUsage: 80
      },
      notifications: {},
      ...config
    }

    this.docker = createDockerIntegration()
    this.testRunner = new ComprehensiveTestRunner()
  }

  async runPreDeploymentPipeline(): Promise<DeploymentResult> {
    const startTime = Date.now()
    
    console.log('🚀 STARTING PRE-DEPLOYMENT AUTOMATION PIPELINE')
    console.log('=' .repeat(60))

    const result: DeploymentResult = {
      success: false,
      timestamp: new Date().toISOString(),
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      buildTime: 0,
      dockerHealth: 'unknown',
      criticalIssues: [],
      recommendations: [],
      deploymentReady: false,
      reportPath: ''
    }

    try {
      // Step 1: Environment validation
      console.log('\n📋 STEP 1: Environment Validation')
      await this.validateEnvironment()

      // Step 2: Build validation
      if (this.config.buildValidation) {
        console.log('\n🔨 STEP 2: Build Validation')
        const buildStart = Date.now()
        await this.validateBuild()
        result.buildTime = Date.now() - buildStart
      }

      // Step 3: Docker health check
      if (this.config.dockerValidation) {
        console.log('\n🐳 STEP 3: Docker Health Check')
        const dockerHealth = await this.validateDockerHealth()
        result.dockerHealth = dockerHealth.overallHealth
      }

      // Step 4: Comprehensive testing
      console.log('\n🧪 STEP 4: Comprehensive Testing')
      const testResults = await this.runComprehensiveTests()
      result.testsRun = testResults.totalTests
      result.testsPassed = testResults.passed
      result.testsFailed = testResults.failed

      // Step 5: Performance validation
      console.log('\n⚡ STEP 5: Performance Validation')
      const performanceResults = await this.validatePerformance()

      // Step 6: Security scan
      console.log('\n🔒 STEP 6: Security Scan')
      const securityResults = await this.runSecurityScan()

      // Step 7: Final analysis
      console.log('\n📊 STEP 7: Final Analysis')
      result.deploymentReady = await this.analyzeDeploymentReadiness(
        testResults, 
        performanceResults, 
        securityResults
      )

      // Generate comprehensive report
      const reportPath = await this.generateDeploymentReport(result, {
        testResults,
        performanceResults,
        securityResults
      })
      result.reportPath = reportPath

      result.success = result.deploymentReady
      
      // Send notifications if configured
      if (this.config.notifications.webhook || this.config.notifications.email) {
        await this.sendNotifications(result)
      }

      console.log('\n' + '='.repeat(60))
      console.log('🏁 PRE-DEPLOYMENT PIPELINE COMPLETED')
      console.log('='.repeat(60))

      this.printFinalSummary(result)

      return result

    } catch (error) {
      console.error('🚨 PRE-DEPLOYMENT PIPELINE FAILED:', error)
      result.criticalIssues.push(`Pipeline execution failed: ${error.message}`)
      
      // Emergency report
      result.reportPath = await this.generateEmergencyReport(result, error)
      
      throw error
    }
  }

  private async validateEnvironment(): Promise<void> {
    const checks = [
      { name: 'Node.js version', command: 'node --version' },
      { name: 'npm version', command: 'npm --version' },
      { name: 'Environment variables', command: 'echo "Checking .env files..."' }
    ]

    for (const check of checks) {
      try {
        const { stdout } = await execAsync(check.command)
        console.log(`✅ ${check.name}: ${stdout.trim()}`)
      } catch (error) {
        console.log(`❌ ${check.name}: FAILED`)
        throw new Error(`Environment validation failed: ${check.name}`)
      }
    }

    // Check critical environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`)
      }
    }

    console.log('✅ Environment validation completed')
  }

  private async validateBuild(): Promise<void> {
    console.log('🔨 Building application...')
    
    try {
      // Clean previous build
      await execAsync('rm -rf .next')
      
      // Run build with validation
      const { stdout, stderr } = await execAsync('npm run build 2>&1', { 
        timeout: 300000 // 5 minutes
      })
      
      console.log('✅ Build completed successfully')
      
      // Check for build warnings
      if (stderr && stderr.includes('Warning')) {
        console.log('⚠️  Build warnings detected (non-blocking)')
      }
      
    } catch (error) {
      console.error('❌ Build failed')
      throw new Error(`Build validation failed: ${error.message}`)
    }
  }

  private async validateDockerHealth(): Promise<any> {
    console.log('🐳 Initializing Docker monitoring...')
    
    const dockerAvailable = await this.docker.initialize()
    
    if (!dockerAvailable) {
      console.log('⚠️  Docker not available - skipping Docker validation')
      return { overallHealth: 'not_available' }
    }

    // Wait for monitoring to collect data
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    const healthReport = await this.docker.generateHealthReport()
    
    console.log(`🐳 Docker health: ${healthReport.overallHealth}`)
    console.log(`   Containers: ${healthReport.containers.length}`)
    console.log(`   Errors: ${healthReport.totalErrors}`)
    console.log(`   Warnings: ${healthReport.totalWarnings}`)
    
    return healthReport
  }

  private async runComprehensiveTests(): Promise<any> {
    console.log('🧪 Running comprehensive test suite...')
    
    let attempt = 1
    let lastError: Error | null = null
    
    while (attempt <= this.config.maxRetries) {
      try {
        console.log(`   Attempt ${attempt}/${this.config.maxRetries}`)
        
        const results = await this.testRunner.run({
          dockerEnabled: this.config.dockerValidation,
          generateReport: true,
          priority: 'critical' // Run critical and high priority tests first
        })
        
        // Check if critical tests passed
        const criticalFailures = results.categories
          .filter(cat => cat.priority === 'critical' && cat.failed > 0)
        
        if (criticalFailures.length > 0 && this.config.skipOnCriticalFailure) {
          throw new Error(`Critical test failures detected: ${criticalFailures.map(c => c.category).join(', ')}`)
        }
        
        return results
        
      } catch (error) {
        lastError = error
        console.log(`❌ Test attempt ${attempt} failed: ${error.message}`)
        
        if (attempt < this.config.maxRetries) {
          console.log('⏳ Waiting before retry...')
          await new Promise(resolve => setTimeout(resolve, 30000)) // Wait 30 seconds
        }
        
        attempt++
      }
    }
    
    throw lastError || new Error('All test attempts failed')
  }

  private async validatePerformance(): Promise<any> {
    console.log('⚡ Running performance validation...')
    
    const performanceTests = [
      '/api/health',
      '/api/contact',
      '/api/crm/dashboard'
    ]
    
    const results: Array<{
      endpoint: string
      responseTime: number
      status: number
      withinThreshold: boolean
      error?: string
    }> = []
    
    for (const endpoint of performanceTests) {
      const start = Date.now()
      
      try {
        const response = await fetch(`http://localhost:3000${endpoint}`, {
          method: 'GET',
          headers: { 'User-Agent': 'Performance-Test' }
        })
        
        const responseTime = Date.now() - start
        
        results.push({
          endpoint,
          responseTime,
          status: response.status,
          withinThreshold: responseTime <= this.config.performanceThresholds.maxResponseTime
        })
        
        if (responseTime > this.config.performanceThresholds.maxResponseTime) {
          console.log(`⚠️  ${endpoint}: ${responseTime}ms (exceeds ${this.config.performanceThresholds.maxResponseTime}ms threshold)`)
        } else {
          console.log(`✅ ${endpoint}: ${responseTime}ms`)
        }
        
      } catch (error) {
        results.push({
          endpoint,
          responseTime: -1,
          status: 0,
          error: error.message,
          withinThreshold: false
        })
        console.log(`❌ ${endpoint}: ${error.message}`)
      }
    }
    
    return {
      tests: results,
      averageResponseTime: results.reduce((sum, r) => sum + (r.responseTime > 0 ? r.responseTime : 0), 0) / results.filter(r => r.responseTime > 0).length,
      allWithinThreshold: results.every(r => r.withinThreshold)
    }
  }

  private async runSecurityScan(): Promise<any> {
    console.log('🔒 Running security scan...')
    
    const securityChecks = [
      {
        name: 'Environment variables exposure',
        check: async () => {
          // Check if sensitive env vars are properly secured
          const sensitiveVars = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN']
          const issues: string[] = []
          
          // This is a simplified check - in production you'd use proper security scanning tools
          for (const varName of Object.keys(process.env)) {
            if (sensitiveVars.some(sensitive => varName.includes(sensitive))) {
              if (process.env[varName] === 'test' || process.env[varName] === 'password') {
                issues.push(`Weak ${varName} detected`)
              }
            }
          }
          
          return { issues, severity: issues.length > 0 ? 'medium' as const : 'low' as const }
        }
      },
      {
        name: 'API security headers',
        check: async () => {
          const response = await fetch('http://localhost:3000/api/health')
          const headers = response.headers
          
          const securityHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection']
          const missing = securityHeaders.filter(header => !headers.has(header))
          
          return { 
            issues: missing.map(h => `Missing security header: ${h}`),
            severity: missing.length > 2 ? 'high' as const : missing.length > 0 ? 'medium' as const : 'low' as const
          }
        }
      }
    ]
    
    const results: Array<{
      name: string
      issues: string[]
      severity: 'low' | 'medium' | 'high'
    }> = []
    
    for (const check of securityChecks) {
      try {
        const result = await check.check()
        results.push({ name: check.name, ...result })
        
        if (result.issues.length > 0) {
          console.log(`⚠️  ${check.name}: ${result.issues.length} issues (${result.severity})`)
        } else {
          console.log(`✅ ${check.name}: No issues`)
        }
      } catch (error) {
        results.push({ 
          name: check.name, 
          issues: [`Check failed: ${error.message}`], 
          severity: 'high' 
        })
        console.log(`❌ ${check.name}: Check failed`)
      }
    }
    
    return {
      checks: results,
      totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
      highSeverityIssues: results.filter(r => r.severity === 'high').length
    }
  }

  private async analyzeDeploymentReadiness(testResults: any, performanceResults: any, securityResults: any): Promise<boolean> {
    console.log('📊 Analyzing deployment readiness...')
    
    const criteria = [
      {
        name: 'Test pass rate',
        check: () => {
          const passRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100
          return { pass: passRate >= 85, value: passRate, threshold: 85 }
        }
      },
      {
        name: 'Critical tests',
        check: () => {
          const criticalFailures = testResults.categories
            .filter(cat => cat.priority === 'critical' && cat.failed > 0).length
          return { pass: criticalFailures === 0, value: criticalFailures, threshold: 0 }
        }
      },
      {
        name: 'Performance thresholds',
        check: () => {
          return { 
            pass: performanceResults.allWithinThreshold, 
            value: performanceResults.averageResponseTime,
            threshold: this.config.performanceThresholds.maxResponseTime
          }
        }
      },
      {
        name: 'Security issues',
        check: () => {
          return {
            pass: securityResults.highSeverityIssues === 0,
            value: securityResults.totalIssues,
            threshold: 0
          }
        }
      }
    ]
    
    let allCriteriaMet = true
    
    for (const criterion of criteria) {
      const result = criterion.check()
      
      if (result.pass) {
        console.log(`✅ ${criterion.name}: PASS (${result.value})`)
      } else {
        console.log(`❌ ${criterion.name}: FAIL (${result.value} > threshold: ${result.threshold})`)
        allCriteriaMet = false
      }
    }
    
    return allCriteriaMet
  }

  private async generateDeploymentReport(result: DeploymentResult, data: any): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportDir = 'tests/reports/deployment'
    await fs.mkdir(reportDir, { recursive: true })
    
    const reportPath = path.join(reportDir, `deployment-report-${timestamp}.json`)
    
    const fullReport = {
      ...result,
      detailedResults: data,
      generatedAt: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
    
    await fs.writeFile(reportPath, JSON.stringify(fullReport, null, 2))
    
    // Also generate HTML summary
    const htmlReport = await this.generateHtmlDeploymentReport(fullReport)
    const htmlPath = path.join(reportDir, `deployment-report-${timestamp}.html`)
    await fs.writeFile(htmlPath, htmlReport)
    
    console.log(`📋 Deployment report generated: ${reportPath}`)
    console.log(`📋 HTML report generated: ${htmlPath}`)
    
    return reportPath
  }

  private async generateHtmlDeploymentReport(report: any): Promise<string> {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Unite Group - Deployment Readiness Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status { font-size: 2em; margin: 20px 0; text-align: center; }
        .ready { color: #28a745; }
        .not-ready { color: #dc3545; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .section { margin: 30px 0; }
        .issues { background: #f8d7da; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .recommendations { background: #d4edda; padding: 15px; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Deployment Readiness Report</h1>
            <p>Generated: ${report.timestamp}</p>
        </div>
        
        <div class="status ${report.deploymentReady ? 'ready' : 'not-ready'}">
            ${report.deploymentReady ? '✅ DEPLOYMENT READY' : '❌ DEPLOYMENT NOT READY'}
        </div>
        
        <div class="metrics">
            <div class="metric">
                <div style="font-size: 2em; font-weight: bold;">${report.testsRun}</div>
                <div>Total Tests</div>
            </div>
            <div class="metric">
                <div style="font-size: 2em; font-weight: bold; color: #28a745;">${report.testsPassed}</div>
                <div>Tests Passed</div>
            </div>
            <div class="metric">
                <div style="font-size: 2em; font-weight: bold; color: #dc3545;">${report.testsFailed}</div>
                <div>Tests Failed</div>
            </div>
            <div class="metric">
                <div style="font-size: 2em; font-weight: bold;">${(report.buildTime / 1000).toFixed(1)}s</div>
                <div>Build Time</div>
            </div>
        </div>
        
        ${report.criticalIssues.length > 0 ? `
            <div class="section">
                <h3>🚨 Critical Issues</h3>
                <div class="issues">
                    <ul>
                        ${report.criticalIssues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>
            </div>
        ` : ''}
        
        ${report.recommendations.length > 0 ? `
            <div class="section">
                <h3>🔧 Recommendations</h3>
                <div class="recommendations">
                    <ul>
                        ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em;">
            <p>Report generated by Unite Group Pre-Deployment Automation</p>
        </div>
    </div>
</body>
</html>
    `
  }

  private async generateEmergencyReport(result: DeploymentResult, error: any): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportDir = 'tests/reports/emergency'
    await fs.mkdir(reportDir, { recursive: true })
    
    const reportPath = path.join(reportDir, `emergency-report-${timestamp}.json`)
    
    const emergencyReport = {
      ...result,
      error: error.message,
      stack: error.stack,
      generatedAt: new Date().toISOString(),
      type: 'EMERGENCY_DEPLOYMENT_FAILURE'
    }
    
    await fs.writeFile(reportPath, JSON.stringify(emergencyReport, null, 2))
    
    return reportPath
  }

  private async sendNotifications(result: DeploymentResult): Promise<void> {
    // Webhook notification
    if (this.config.notifications.webhook) {
      try {
        await fetch(this.config.notifications.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: result.deploymentReady ? 'success' : 'failure',
            summary: `Deployment ${result.deploymentReady ? 'READY' : 'NOT READY'} - ${result.testsPassed}/${result.testsRun} tests passed`,
            details: result,
            timestamp: result.timestamp
          })
        })
        console.log('📧 Webhook notification sent')
      } catch (error) {
        console.log('⚠️  Failed to send webhook notification')
      }
    }
  }

  private printFinalSummary(result: DeploymentResult): void {
    const passRate = Math.round((result.testsPassed / result.testsRun) * 100) || 0
    
    console.log(`\n📊 DEPLOYMENT READINESS: ${result.deploymentReady ? '✅ READY' : '❌ NOT READY'}`)
    console.log(`📈 Test Results: ${result.testsPassed}/${result.testsRun} passed (${passRate}%)`)
    console.log(`🕒 Build Time: ${(result.buildTime / 1000).toFixed(1)}s`)
    console.log(`🐳 Docker Health: ${result.dockerHealth}`)
    
    if (result.criticalIssues.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES (${result.criticalIssues.length}):`)
      result.criticalIssues.forEach(issue => console.log(`   • ${issue}`))
    }
    
    if (result.recommendations.length > 0) {
      console.log(`\n🔧 RECOMMENDATIONS (${result.recommendations.length}):`)
      result.recommendations.forEach(rec => console.log(`   • ${rec}`))
    }
    
    console.log(`\n📋 Full Report: ${result.reportPath}`)
  }

  async cleanup(): Promise<void> {
    if (this.docker) {
      await this.docker.cleanup()
    }
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  
  const config: Partial<AutomationConfig> = {}
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--skip-build':
        config.buildValidation = false
        break
      case '--skip-docker':
        config.dockerValidation = false
        break
      case '--retries':
        config.maxRetries = parseInt(args[++i]) || 2
        break
      case '--webhook':
        config.notifications = { webhook: args[++i] }
        break
      case '--help':
        console.log(`
🚀 PRE-DEPLOYMENT AUTOMATION

Usage: tsx tests/pre-deployment-automation.ts [options]

Options:
  --skip-build          Skip build validation
  --skip-docker         Skip Docker health validation
  --retries <number>    Number of test retries (default: 2)
  --webhook <url>       Webhook URL for notifications
  --help               Show this help message

Examples:
  tsx tests/pre-deployment-automation.ts
  tsx tests/pre-deployment-automation.ts --skip-docker --retries 1
  tsx tests/pre-deployment-automation.ts --webhook https://hooks.slack.com/...
        `)
        process.exit(0)
    }
  }
  
  // Run automation
  const automation = new PreDeploymentAutomation(config)
  
  automation.runPreDeploymentPipeline()
    .then(result => {
      process.exit(result.deploymentReady ? 0 : 1)
    })
    .catch(error => {
      console.error('Automation failed:', error)
      process.exit(1)
    })
    .finally(() => {
      automation.cleanup()
    })
}

export { PreDeploymentAutomation }
export default PreDeploymentAutomation
