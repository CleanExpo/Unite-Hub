#!/usr/bin/env tsx

/**
 * 🧪 COMPREHENSIVE TEST RUNNER
 * Tests everything we build with Docker logs integration
 */

import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { COMPREHENSIVE_TEST_CONFIG, DOCKER_CONFIG, TestCategory } from './comprehensive-test-suite.config.js'

const execAsync = promisify(exec)

interface TestResult {
  endpoint: string
  status: 'PASS' | 'FAIL' | 'SKIP' | 'TIMEOUT'
  statusCode: number
  responseTime: number
  error?: string
  dockerLogs?: string[]
  timestamp: string
}

interface CategoryResult {
  category: string
  priority: string
  passed: number
  failed: number
  skipped: number
  totalTime: number
  results: TestResult[]
}

interface TestSuiteResult {
  startTime: string
  endTime: string
  totalTime: number
  totalTests: number
  passed: number
  failed: number
  skipped: number
  categories: CategoryResult[]
  dockerAnalysis: DockerAnalysis
  summary: string
}

interface DockerAnalysis {
  containerStatus: string
  errorCount: number
  warningCount: number
  performanceIssues: number
  securityIssues: number
  criticalLogs: string[]
  recommendations: string[]
}

class ComprehensiveTestRunner {
  private results: TestSuiteResult
  private authToken: string | null = null
  private dockerLogsBuffer: string[] = []

  constructor() {
    this.results = {
      startTime: new Date().toISOString(),
      endTime: '',
      totalTime: 0,
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      categories: [],
      dockerAnalysis: {
        containerStatus: 'unknown',
        errorCount: 0,
        warningCount: 0,
        performanceIssues: 0,
        securityIssues: 0,
        criticalLogs: [],
        recommendations: []
      },
      summary: ''
    }
  }

  async run(options: {
    categories?: string[]
    priority?: string
    dockerEnabled?: boolean
    generateReport?: boolean
  } = {}): Promise<TestSuiteResult> {
    console.log('🧪 STARTING COMPREHENSIVE TEST SUITE')
    console.log('=====================================')
    
    const startTime = Date.now()

    try {
      // Initialize Docker monitoring if enabled
      if (options.dockerEnabled !== false && COMPREHENSIVE_TEST_CONFIG.dockerEnabled) {
        await this.initializeDockerMonitoring()
      }

      // Filter categories based on options
      const categoriesToTest = this.filterCategories(options)
      
      // Count total tests
      this.results.totalTests = categoriesToTest.reduce(
        (total, cat) => total + cat.endpoints.length, 0
      )

      console.log(`📊 Running ${this.results.totalTests} tests across ${categoriesToTest.length} categories`)

      // Run tests by category in dependency order
      const sortedCategories = this.sortCategoriesByDependencies(categoriesToTest)
      
      for (const category of sortedCategories) {
        console.log(`\n🔄 Testing: ${category.name} (${category.priority} priority)`)
        const categoryResult = await this.runCategoryTests(category)
        this.results.categories.push(categoryResult)
        
        // Update totals
        this.results.passed += categoryResult.passed
        this.results.failed += categoryResult.failed
        this.results.skipped += categoryResult.skipped

        // Print category summary
        const passRate = Math.round((categoryResult.passed / (categoryResult.passed + categoryResult.failed)) * 100) || 0
        console.log(`  ✅ ${categoryResult.passed} passed, ❌ ${categoryResult.failed} failed, ⏭️ ${categoryResult.skipped} skipped (${passRate}% pass rate)`)

        // Stop if critical category fails
        if (category.priority === 'critical' && categoryResult.failed > 0) {
          console.log(`🚨 CRITICAL CATEGORY FAILED: ${category.name}`)
          console.log('   Stopping test execution due to critical failures')
          break
        }
      }

      // Analyze Docker logs
      if (options.dockerEnabled !== false) {
        this.results.dockerAnalysis = await this.analyzeDockerLogs()
      }

      // Calculate final results
      this.results.endTime = new Date().toISOString()
      this.results.totalTime = Date.now() - startTime
      this.results.summary = this.generateSummary()

      // Generate detailed report
      if (options.generateReport !== false) {
        await this.generateReport()
      }

      // Print final summary
      this.printFinalSummary()

      return this.results

    } catch (error) {
      console.error('🚨 TEST SUITE EXECUTION FAILED:', error)
      throw error
    }
  }

  private async initializeDockerMonitoring(): Promise<void> {
    try {
      // Check if Docker is available
      await execAsync('docker --version')
      
      // Check container status
      try {
        const { stdout } = await execAsync(`docker ps --filter "name=${DOCKER_CONFIG.containerName}" --format "{{.Status}}"`)
        this.results.dockerAnalysis.containerStatus = stdout.trim() || 'not_running'
      } catch {
        this.results.dockerAnalysis.containerStatus = 'not_found'
      }

      // Start log monitoring
      if (this.results.dockerAnalysis.containerStatus.includes('Up')) {
        this.startDockerLogMonitoring()
      }

      console.log(`🐳 Docker monitoring initialized (container: ${this.results.dockerAnalysis.containerStatus})`)
    } catch (error) {
      console.log('⚠️  Docker not available - continuing without Docker monitoring')
      this.results.dockerAnalysis.containerStatus = 'docker_unavailable'
    }
  }

  private startDockerLogMonitoring(): void {
    const dockerLogs = spawn('docker', ['logs', '-f', '--tail', '100', DOCKER_CONFIG.containerName])
    
    dockerLogs.stdout.on('data', (data) => {
      const logs = data.toString().split('\n').filter(line => line.trim())
      this.dockerLogsBuffer.push(...logs)
      
      // Keep buffer size manageable
      if (this.dockerLogsBuffer.length > DOCKER_CONFIG.maxLogLines) {
        this.dockerLogsBuffer = this.dockerLogsBuffer.slice(-DOCKER_CONFIG.maxLogLines)
      }
    })

    dockerLogs.stderr.on('data', (data) => {
      const logs = data.toString().split('\n').filter(line => line.trim())
      this.dockerLogsBuffer.push(...logs.map(log => `STDERR: ${log}`))
    })
  }

  private filterCategories(options: any): TestCategory[] {
    let categories = COMPREHENSIVE_TEST_CONFIG.categories.filter(cat => cat.enabled)

    if (options.categories) {
      categories = categories.filter(cat => 
        options.categories.some((name: string) => 
          cat.name.toLowerCase().includes(name.toLowerCase())
        )
      )
    }

    if (options.priority) {
      const priorities = ['critical', 'high', 'medium', 'low']
      const minPriorityIndex = priorities.indexOf(options.priority)
      categories = categories.filter(cat => 
        priorities.indexOf(cat.priority) <= minPriorityIndex
      )
    }

    return categories
  }

  private sortCategoriesByDependencies(categories: TestCategory[]): TestCategory[] {
    const sorted: TestCategory[] = []
    const remaining = [...categories]

    while (remaining.length > 0) {
      const readyToRun = remaining.filter(cat => 
        cat.dependencies.every(dep => 
          sorted.some(s => s.name === dep)
        )
      )

      if (readyToRun.length === 0) {
        // Add categories without dependencies or break circular deps
        const noDeps = remaining.filter(cat => cat.dependencies.length === 0)
        if (noDeps.length > 0) {
          sorted.push(...noDeps)
          remaining.splice(0, remaining.length, ...remaining.filter(cat => !noDeps.includes(cat)))
        } else {
          // Break circular dependency by adding the first remaining
          sorted.push(remaining[0])
          remaining.splice(0, 1)
        }
      } else {
        sorted.push(...readyToRun)
        remaining.splice(0, remaining.length, ...remaining.filter(cat => !readyToRun.includes(cat)))
      }
    }

    return sorted
  }

  private async runCategoryTests(category: TestCategory): Promise<CategoryResult> {
    const categoryResult: CategoryResult = {
      category: category.name,
      priority: category.priority,
      passed: 0,
      failed: 0,
      skipped: 0,
      totalTime: 0,
      results: []
    }

    const startTime = Date.now()

    // Get authentication if needed
    if (category.authentication && !this.authToken) {
      await this.getAuthToken()
    }

    // Run tests in parallel or series based on config
    if (COMPREHENSIVE_TEST_CONFIG.parallel && category.endpoints.length > 1) {
      const promises = category.endpoints.map(endpoint => this.runSingleTest(endpoint, category))
      categoryResult.results = await Promise.all(promises)
    } else {
      for (const endpoint of category.endpoints) {
        const result = await this.runSingleTest(endpoint, category)
        categoryResult.results.push(result)
      }
    }

    // Calculate category statistics
    categoryResult.results.forEach(result => {
      switch (result.status) {
        case 'PASS': categoryResult.passed++; break
        case 'FAIL': categoryResult.failed++; break
        case 'SKIP': categoryResult.skipped++; break
        case 'TIMEOUT': categoryResult.failed++; break
      }
    })

    categoryResult.totalTime = Date.now() - startTime
    return categoryResult
  }

  private async runSingleTest(endpoint: string, category: TestCategory): Promise<TestResult> {
    const testStart = Date.now()
    const dockerLogsBefore = [...this.dockerLogsBuffer]

    try {
      const url = `${COMPREHENSIVE_TEST_CONFIG.baseUrl}${endpoint}`
      const headers: any = {
        'Content-Type': 'application/json',
        'User-Agent': 'UniteGroup-TestSuite/1.0'
      }

      if (category.authentication && this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), category.timeout)

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - testStart

      // Get Docker logs for this test
      const dockerLogsAfter = this.dockerLogsBuffer.slice(dockerLogsBefore.length)

      const result: TestResult = {
        endpoint,
        status: response.ok ? 'PASS' : 'FAIL',
        statusCode: response.status,
        responseTime,
        timestamp: new Date().toISOString(),
        dockerLogs: dockerLogsAfter.filter(log => 
          log.includes(endpoint) || 
          DOCKER_CONFIG.logFilters.errors.some(err => log.includes(err))
        )
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read response')
        result.error = `HTTP ${response.status}: ${errorText.substring(0, 200)}`
      }

      return result

    } catch (error: any) {
      const responseTime = Date.now() - testStart
      
      return {
        endpoint,
        status: error.name === 'AbortError' ? 'TIMEOUT' : 'FAIL',
        statusCode: 0,
        responseTime,
        error: error.message,
        timestamp: new Date().toISOString(),
        dockerLogs: this.dockerLogsBuffer.slice(dockerLogsBefore.length).filter(log =>
          log.includes(endpoint) || 
          DOCKER_CONFIG.logFilters.errors.some(err => log.includes(err))
        )
      }
    }
  }

  private async getAuthToken(): Promise<void> {
    try {
      // Try to get auth token from test user
      const authUrl = `${COMPREHENSIVE_TEST_CONFIG.baseUrl}/api/auth/session`
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.TEST_USER_EMAIL || 'test@unitegroup.com.au',
          password: process.env.TEST_USER_PASSWORD || 'test123'
        })
      })

      if (response.ok) {
        const data = await response.json()
        this.authToken = data.token || data.access_token || 'mock-token-for-testing'
      } else {
        console.log('⚠️  Could not get auth token, using mock token for testing')
        this.authToken = 'mock-token-for-testing'
      }
    } catch (error) {
      console.log('⚠️  Auth failed, using mock token for testing')
      this.authToken = 'mock-token-for-testing'
    }
  }

  private async analyzeDockerLogs(): Promise<DockerAnalysis> {
    const analysis: DockerAnalysis = {
      containerStatus: this.results.dockerAnalysis.containerStatus,
      errorCount: 0,
      warningCount: 0,
      performanceIssues: 0,
      securityIssues: 0,
      criticalLogs: [],
      recommendations: []
    }

    // Analyze collected logs
    this.dockerLogsBuffer.forEach(log => {
      const logLower = log.toLowerCase()
      
      // Count errors
      if (DOCKER_CONFIG.logFilters.errors.some(err => logLower.includes(err.toLowerCase()))) {
        analysis.errorCount++
        if (analysis.criticalLogs.length < 10) {
          analysis.criticalLogs.push(log)
        }
      }

      // Count warnings
      if (DOCKER_CONFIG.logFilters.warnings.some(warn => logLower.includes(warn.toLowerCase()))) {
        analysis.warningCount++
      }

      // Count performance issues
      if (DOCKER_CONFIG.logFilters.performance.some(perf => logLower.includes(perf.toLowerCase()))) {
        analysis.performanceIssues++
      }

      // Count security issues
      if (DOCKER_CONFIG.logFilters.security.some(sec => logLower.includes(sec.toLowerCase()))) {
        analysis.securityIssues++
      }
    })

    // Generate recommendations
    if (analysis.errorCount > 10) {
      analysis.recommendations.push('High error count detected - investigate application stability')
    }
    if (analysis.performanceIssues > 5) {
      analysis.recommendations.push('Performance issues detected - consider optimization')
    }
    if (analysis.securityIssues > 0) {
      analysis.recommendations.push('Security issues detected - review authentication and authorization')
    }
    if (analysis.warningCount > 20) {
      analysis.recommendations.push('High warning count - review application configuration')
    }

    return analysis
  }

  private generateSummary(): string {
    const passRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100) || 0
    const avgResponseTime = this.results.categories
      .flatMap(cat => cat.results)
      .reduce((sum, result) => sum + result.responseTime, 0) / this.results.totalTests || 0

    let summary = `Test Suite Summary:\n`
    summary += `├─ Total Tests: ${this.results.totalTests}\n`
    summary += `├─ Passed: ${this.results.passed} (${passRate}%)\n`
    summary += `├─ Failed: ${this.results.failed}\n`
    summary += `├─ Skipped: ${this.results.skipped}\n`
    summary += `├─ Execution Time: ${(this.results.totalTime / 1000).toFixed(2)}s\n`
    summary += `├─ Average Response Time: ${avgResponseTime.toFixed(0)}ms\n`
    summary += `└─ Docker Analysis: ${this.results.dockerAnalysis.errorCount} errors, ${this.results.dockerAnalysis.warningCount} warnings`

    return summary
  }

  private async generateReport(): Promise<void> {
    const reportDir = 'tests/reports'
    await fs.mkdir(reportDir, { recursive: true })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportPath = path.join(reportDir, `test-report-${timestamp}.json`)
    
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2))
    
    // Generate HTML report
    const htmlReport = await this.generateHtmlReport()
    const htmlPath = path.join(reportDir, `test-report-${timestamp}.html`)
    await fs.writeFile(htmlPath, htmlReport)

    console.log(`📊 Reports generated:`)
    console.log(`   JSON: ${reportPath}`)
    console.log(`   HTML: ${htmlPath}`)
  }

  private async generateHtmlReport(): Promise<string> {
    // Generate a comprehensive HTML report
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Unite Group - Comprehensive Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #333; }
        .metric-label { color: #666; margin-top: 5px; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .skip { color: #ffc107; }
        .category { margin: 20px 0; border: 1px solid #ddd; border-radius: 6px; }
        .category-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
        .category-results { padding: 10px; }
        .test-result { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee; }
        .test-result:last-child { border-bottom: none; }
        .status-badge { padding: 3px 8px; border-radius: 3px; color: white; font-size: 0.8em; }
        .docker-analysis { background: #e3f2fd; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Unite Group - Comprehensive Test Report</h1>
            <p>Generated: ${this.results.endTime}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${this.results.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value pass">${this.results.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value fail">${this.results.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value skip">${this.results.skipped}</div>
                <div class="metric-label">Skipped</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(this.results.totalTime / 1000).toFixed(2)}s</div>
                <div class="metric-label">Execution Time</div>
            </div>
        </div>

        ${this.results.categories.map(cat => `
            <div class="category">
                <div class="category-header">
                    <h3>${cat.category} (${cat.priority})</h3>
                    <small>✅ ${cat.passed} passed • ❌ ${cat.failed} failed • ⏭️ ${cat.skipped} skipped • ⏱️ ${(cat.totalTime / 1000).toFixed(2)}s</small>
                </div>
                <div class="category-results">
                    ${cat.results.map(result => `
                        <div class="test-result">
                            <span>${result.endpoint}</span>
                            <div>
                                <span class="status-badge" style="background: ${result.status === 'PASS' ? '#28a745' : result.status === 'FAIL' ? '#dc3545' : '#ffc107'}">${result.status}</span>
                                <small style="margin-left: 10px;">${result.responseTime}ms</small>
                                ${result.statusCode ? `<small style="margin-left: 10px;">HTTP ${result.statusCode}</small>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}

        <div class="docker-analysis">
            <h3>🐳 Docker Analysis</h3>
            <p><strong>Container Status:</strong> ${this.results.dockerAnalysis.containerStatus}</p>
            <p><strong>Errors:</strong> ${this.results.dockerAnalysis.errorCount} • <strong>Warnings:</strong> ${this.results.dockerAnalysis.warningCount} • <strong>Performance Issues:</strong> ${this.results.dockerAnalysis.performanceIssues}</p>
            
            ${this.results.dockerAnalysis.recommendations.length > 0 ? `
                <div class="recommendations">
                    <h4>🔧 Recommendations:</h4>
                    <ul>
                        ${this.results.dockerAnalysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em;">
            <p>Report generated by Unite Group Comprehensive Test Suite</p>
        </div>
    </div>
</body>
</html>
    `
  }

  private printFinalSummary(): void {
    console.log('\n' + '='.repeat(50))
    console.log('🏁 COMPREHENSIVE TEST SUITE COMPLETED')
    console.log('='.repeat(50))
    
    const passRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100) || 0
    const status = passRate >= 90 ? '🎉 EXCELLENT' : passRate >= 75 ? '✅ GOOD' : passRate >= 50 ? '⚠️  NEEDS ATTENTION' : '🚨 CRITICAL'
    
    console.log(`\n📊 OVERALL RESULT: ${status} (${passRate}% pass rate)`)
    console.log(this.results.summary)
    
    if (this.results.dockerAnalysis.recommendations.length > 0) {
      console.log('\n🔧 RECOMMENDATIONS:')
      this.results.dockerAnalysis.recommendations.forEach(rec => {
        console.log(`   • ${rec}`)
      })
    }
    
    // Print critical failures
    const criticalFailures = this.results.categories
      .filter(cat => cat.priority === 'critical' && cat.failed > 0)
    
    if (criticalFailures.length > 0) {
      console.log('\n🚨 CRITICAL FAILURES:')
      criticalFailures.forEach(cat => {
        console.log(`   • ${cat.category}: ${cat.failed} failures`)
        cat.results.filter(r => r.status === 'FAIL').forEach(result => {
          console.log(`     - ${result.endpoint}: ${result.error}`)
        })
      })
    }

    console.log('\n' + '='.repeat(50))
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const options: any = {}

  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--categories':
        options.categories = args[++i]?.split(',')
        break
      case '--priority':
        options.priority = args[++i]
        break
      case '--no-docker':
        options.dockerEnabled = false
        break
      case '--no-report':
        options.generateReport = false
        break
      case '--help':
        console.log(`
🧪 COMPREHENSIVE TEST SUITE

Usage: tsx tests/comprehensive-test-runner.ts [options]

Options:
  --categories <list>    Comma-separated list of categories to test
  --priority <level>     Test only categories with specified priority or higher (critical|high|medium|low)
  --no-docker           Disable Docker log monitoring
  --no-report           Skip generating HTML/JSON reports
  --help                Show this help message

Examples:
  tsx tests/comprehensive-test-runner.ts
  tsx tests/comprehensive-test-runner.ts --categories "CRM,AI" --priority high
  tsx tests/comprehensive-test-runner.ts --no-docker --no-report
        `)
        process.exit(0)
    }
  }

  // Run the test suite
  const runner = new ComprehensiveTestRunner()
  runner.run(options)
    .then(results => {
      const passRate = Math.round((results.passed / (results.passed + results.failed)) * 100) || 0
      process.exit(passRate >= 75 ? 0 : 1)
    })
    .catch(error => {
      console.error('Test suite failed:', error)
      process.exit(1)
    })
}

export { ComprehensiveTestRunner }
export type { TestResult, CategoryResult, TestSuiteResult }
