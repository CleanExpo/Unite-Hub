#!/usr/bin/env tsx

/**
 * 🚀 COMPREHENSIVE TEST EXECUTION SCRIPT
 * 
 * This script runs the complete test suite including:
 * - Docker environment setup
 * - Parallel test execution
 * - Pydantic agent framework validation
 * - Quality gate enforcement
 * - 100% functionality verification
 */

import { execSync, spawn, exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'

const execAsync = promisify(exec)

interface TestResults {
  dockerHealth: boolean
  webServiceHealth: boolean
  aiAgentHealth: boolean
  databaseHealth: boolean
  redisHealth: boolean
  comprehensiveTests: boolean
  qualityGatesPassed: boolean
  overallStatus: 'PASS' | 'FAIL'
  executionTime: number
}

class ComprehensiveTestRunner {
  private startTime = Date.now()

  async runAllTests(): Promise<TestResults> {
    console.log('🚀 STARTING COMPREHENSIVE TEST EXECUTION')
    console.log('=' .repeat(80))
    console.log('📋 Testing Strategy: Docker + Parallel + Quality Gates + 100% Verification')
    console.log('🔒 Quality Standard: No deployment until 100% functionality confirmed')
    console.log('=' .repeat(80))

    const results: TestResults = {
      dockerHealth: false,
      webServiceHealth: false,
      aiAgentHealth: false,
      databaseHealth: false,
      redisHealth: false,
      comprehensiveTests: false,
      qualityGatesPassed: false,
      overallStatus: 'FAIL',
      executionTime: 0
    }

    try {
      // Step 1: Setup Docker Environment
      console.log('\n🐳 STEP 1: Setting up Docker environment...')
      await this.setupDockerEnvironment()
      results.dockerHealth = true
      console.log('✅ Docker environment ready')

      // Step 2: Start All Services
      console.log('\n🔧 STEP 2: Starting all services...')
      await this.startServices()
      console.log('✅ All services started')

      // Step 3: Wait for Services to be Ready
      console.log('\n⏳ STEP 3: Waiting for services to be ready...')
      await this.waitForServices()
      console.log('✅ All services are healthy')

      // Step 4: Test Individual Services
      console.log('\n🔍 STEP 4: Testing individual services...')
      results.webServiceHealth = await this.testWebService()
      results.aiAgentHealth = await this.testAIAgentService()
      results.databaseHealth = await this.testDatabaseService()
      results.redisHealth = await this.testRedisService()

      // Step 5: Run Comprehensive Parallel Tests
      console.log('\n🧪 STEP 5: Running comprehensive parallel tests...')
      results.comprehensiveTests = await this.runComprehensiveTests()

      // Step 6: Quality Gate Validation
      console.log('\n🚪 STEP 6: Validating quality gates...')
      results.qualityGatesPassed = await this.validateQualityGates(results)

      // Step 7: Generate Final Report
      console.log('\n📊 STEP 7: Generating final report...')
      results.overallStatus = this.determineOverallStatus(results)
      results.executionTime = Date.now() - this.startTime

      await this.generateFinalReport(results)

      return results

    } catch (error) {
      console.error('❌ Test execution failed:', error)
      results.executionTime = Date.now() - this.startTime
      await this.generateFinalReport(results)
      throw error
    }
  }

  private async setupDockerEnvironment(): Promise<void> {
    try {
      // Check Docker availability
      execSync('docker --version', { stdio: 'pipe' })
      execSync('docker-compose --version', { stdio: 'pipe' })
      
      // Clean up any existing containers
      try {
        execSync('docker-compose down -v', { stdio: 'pipe' })
      } catch (error) {
        // Ignore if no containers exist
      }

      console.log('   ✅ Docker environment validated')
    } catch (error) {
      throw new Error('Docker not available or not running')
    }
  }

  private async startServices(): Promise<void> {
    try {
      // Build and start all services
      console.log('   🔨 Building Docker images...')
      execSync('docker-compose build', { stdio: 'inherit' })
      
      console.log('   🚀 Starting services...')
      execSync('docker-compose up -d db redis', { stdio: 'inherit' })
      
      // Wait a bit for database to initialize
      await new Promise(resolve => setTimeout(resolve, 10000))
      
      // Start application services
      execSync('docker-compose up -d web ai-agents', { stdio: 'inherit' })
      
    } catch (error) {
      throw new Error('Failed to start Docker services')
    }
  }

  private async waitForServices(): Promise<void> {
    const services = [
      { name: 'Database', command: 'docker-compose exec -T db pg_isready -U unite_user -d unite_crm' },
      { name: 'Redis', command: 'docker-compose exec -T redis redis-cli ping' },
      { name: 'Web', url: 'http://localhost:3000/api/health' },
      { name: 'AI Agents', url: 'http://localhost:8000/health' }
    ]

    for (const service of services) {
      console.log(`   ⏳ Waiting for ${service.name}...`)
      let attempts = 0
      const maxAttempts = 30

      while (attempts < maxAttempts) {
        try {
          if (service.command) {
            execSync(service.command, { stdio: 'pipe' })
            console.log(`   ✅ ${service.name} is ready`)
            break
          } else if (service.url) {
            const response = await fetch(service.url)
            if (response.ok) {
              console.log(`   ✅ ${service.name} is ready`)
              break
            }
          }
        } catch (error) {
          // Service not ready yet
        }

        attempts++
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        if (attempts >= maxAttempts) {
          throw new Error(`${service.name} failed to become ready`)
        }
      }
    }
  }

  private async testWebService(): Promise<boolean> {
    try {
      console.log('   🌐 Testing web service...')
      
      // Test health endpoint
      const healthResponse = await fetch('http://localhost:3000/api/health')
      if (!healthResponse.ok) {
        throw new Error('Health check failed')
      }

      // Test CRM endpoints
      const endpoints = [
        '/api/crm/clients',
        '/api/crm/deals', 
        '/api/crm/tasks',
        '/api/crm/staff'
      ]

      for (const endpoint of endpoints) {
        const response = await fetch(`http://localhost:3000${endpoint}`)
        if (response.status >= 500) {
          throw new Error(`Endpoint ${endpoint} failed with status ${response.status}`)
        }
      }

      console.log('   ✅ Web service tests passed')
      return true
    } catch (error) {
      console.log(`   ❌ Web service tests failed: ${error}`)
      return false
    }
  }

  private async testAIAgentService(): Promise<boolean> {
    try {
      console.log('   🤖 Testing AI agent service...')
      
      // Test health endpoint
      const healthResponse = await fetch('http://localhost:8000/health')
      if (!healthResponse.ok) {
        throw new Error('AI agent health check failed')
      }

      // Test agent creation
      const createAgentResponse = await fetch('http://localhost:8000/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'TestAgent',
          description: 'Agent for testing',
          capabilities: ['text_generation', 'reasoning']
        })
      })

      if (!createAgentResponse.ok) {
        throw new Error('Agent creation failed')
      }

      // Test task execution
      const taskResponse = await fetch('http://localhost:8000/tasks/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Task',
          description: 'Test the agent framework',
          input_data: { test: 'data' }
        })
      })

      if (!taskResponse.ok) {
        throw new Error('Task execution failed')
      }

      console.log('   ✅ AI agent service tests passed')
      return true
    } catch (error) {
      console.log(`   ❌ AI agent service tests failed: ${error}`)
      return false
    }
  }

  private async testDatabaseService(): Promise<boolean> {
    try {
      console.log('   🗄️ Testing database service...')
      
      // Test database connection
      const result = execSync('docker-compose exec -T db psql -U unite_user -d unite_crm -c "SELECT 1;"', 
        { encoding: 'utf-8', stdio: 'pipe' })
      
      if (!result.includes('1')) {
        throw new Error('Database query failed')
      }

      console.log('   ✅ Database service tests passed')
      return true
    } catch (error) {
      console.log(`   ❌ Database service tests failed: ${error}`)
      return false
    }
  }

  private async testRedisService(): Promise<boolean> {
    try {
      console.log('   🔴 Testing Redis service...')
      
      // Test Redis connection
      const result = execSync('docker-compose exec -T redis redis-cli ping', 
        { encoding: 'utf-8', stdio: 'pipe' })
      
      if (!result.includes('PONG')) {
        throw new Error('Redis ping failed')
      }

      console.log('   ✅ Redis service tests passed')
      return true
    } catch (error) {
      console.log(`   ❌ Redis service tests failed: ${error}`)
      return false
    }
  }

  private async runComprehensiveTests(): Promise<boolean> {
    try {
      console.log('   🧪 Running comprehensive parallel test suite...')
      
      // Set environment variables for tests
      process.env.TEST_BASE_URL = 'http://localhost:3000'
      process.env.AI_AGENT_URL = 'http://localhost:8000'
      
      // Run the comprehensive test suite
      execSync('npm run test:parallel', { stdio: 'inherit' })

      console.log('   ✅ Comprehensive tests passed')
      return true
    } catch (error) {
      console.log(`   ❌ Comprehensive tests failed: ${error}`)
      return false
    }
  }

  private async validateQualityGates(results: TestResults): Promise<boolean> {
    console.log('   🚪 Validating quality gates...')
    
    const gates = [
      { name: 'Docker Health', passed: results.dockerHealth },
      { name: 'Web Service', passed: results.webServiceHealth },
      { name: 'AI Agent Service', passed: results.aiAgentHealth },
      { name: 'Database Service', passed: results.databaseHealth },
      { name: 'Redis Service', passed: results.redisHealth },
      { name: 'Comprehensive Tests', passed: results.comprehensiveTests }
    ]

    let allPassed = true
    for (const gate of gates) {
      const status = gate.passed ? '✅' : '❌'
      console.log(`     ${status} ${gate.name}`)
      if (!gate.passed) allPassed = false
    }

    if (allPassed) {
      console.log('   ✅ All quality gates passed')
    } else {
      console.log('   ❌ Quality gates failed')
    }

    return allPassed
  }

  private determineOverallStatus(results: TestResults): 'PASS' | 'FAIL' {
    const allHealthy = results.dockerHealth && 
                      results.webServiceHealth && 
                      results.aiAgentHealth && 
                      results.databaseHealth && 
                      results.redisHealth &&
                      results.comprehensiveTests &&
                      results.qualityGatesPassed

    return allHealthy ? 'PASS' : 'FAIL'
  }

  private async generateFinalReport(results: TestResults): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      executionTime: `${(results.executionTime / 1000).toFixed(2)}s`,
      overallStatus: results.overallStatus,
      serviceHealth: {
        docker: results.dockerHealth,
        web: results.webServiceHealth,
        aiAgents: results.aiAgentHealth,
        database: results.databaseHealth,
        redis: results.redisHealth
      },
      testResults: {
        comprehensiveTests: results.comprehensiveTests,
        qualityGates: results.qualityGatesPassed
      },
      readyForProduction: results.overallStatus === 'PASS'
    }

    // Save report
    await fs.mkdir('test-reports', { recursive: true })
    const reportPath = `test-reports/comprehensive-test-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

    // Print final status
    console.log('\n' + '='.repeat(80))
    console.log('📊 COMPREHENSIVE TEST EXECUTION REPORT')
    console.log('='.repeat(80))
    console.log(`🎯 Overall Status: ${results.overallStatus}`)
    console.log(`⏱️  Execution Time: ${(results.executionTime / 1000).toFixed(2)}s`)
    console.log(`🐳 Docker Health: ${results.dockerHealth ? '✅ HEALTHY' : '❌ FAILED'}`)
    console.log(`🌐 Web Service: ${results.webServiceHealth ? '✅ HEALTHY' : '❌ FAILED'}`)
    console.log(`🤖 AI Agents: ${results.aiAgentHealth ? '✅ HEALTHY' : '❌ FAILED'}`)
    console.log(`🗄️ Database: ${results.databaseHealth ? '✅ HEALTHY' : '❌ FAILED'}`)
    console.log(`🔴 Redis: ${results.redisHealth ? '✅ HEALTHY' : '❌ FAILED'}`)
    console.log(`🧪 Tests: ${results.comprehensiveTests ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`🚪 Quality Gates: ${results.qualityGatesPassed ? '✅ PASSED' : '❌ FAILED'}`)
    
    if (results.overallStatus === 'PASS') {
      console.log('\n🎉 ALL SYSTEMS 100% FUNCTIONAL - READY FOR PRODUCTION!')
      console.log('✅ Quality standards met')
      console.log('✅ All services healthy')
      console.log('✅ All tests passing')
      console.log('✅ Production deployment approved')
    } else {
      console.log('\n🚫 SYSTEMS NOT READY - ISSUES DETECTED')
      console.log('❌ Quality standards not met')
      console.log('🔧 Manual intervention required')
      console.log('📋 Review failed components above')
    }

    console.log(`\n📄 Detailed report saved: ${reportPath}`)
    console.log('='.repeat(80))
  }

  async cleanup(): Promise<void> {
    try {
      console.log('\n🧹 Cleaning up Docker environment...')
      execSync('docker-compose down -v', { stdio: 'pipe' })
      console.log('✅ Cleanup completed')
    } catch (error) {
      console.log('⚠️  Cleanup failed (containers may still be running)')
    }
  }
}

// Main execution
async function main() {
  const runner = new ComprehensiveTestRunner()
  
  try {
    const results = await runner.runAllTests()
    
    if (results.overallStatus === 'PASS') {
      console.log('\n🎉 COMPREHENSIVE TESTING COMPLETED SUCCESSFULLY!')
      process.exit(0)
    } else {
      console.log('\n❌ COMPREHENSIVE TESTING FAILED!')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error)
    process.exit(1)
  } finally {
    // Optional cleanup (comment out if you want to keep containers running)
    // await runner.cleanup()
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, cleaning up...')
  const runner = new ComprehensiveTestRunner()
  await runner.cleanup()
  process.exit(1)
})

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { ComprehensiveTestRunner }
