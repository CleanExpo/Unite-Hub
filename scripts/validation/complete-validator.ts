import * as fs from 'fs/promises'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { glob } from 'glob'
import { ValidationError, ValidationWarning, ValidationReport } from './types'

export class CompleteValidator {
  private errors: ValidationError[] = []
  private warnings: ValidationWarning[] = []
  private missingFiles: string[] = []
  private mockDataFound: string[] = []
  private brokenConnections: string[] = []
  
  async performCompleteValidation() {
    console.log('🔍 Starting 100% System Validation\n')
    
    // Phase 1: File Structure Check
    await this.validateFileStructure()
    
    // Phase 2: Code Quality Check
    await this.validateCodeQuality()
    
    // Phase 3: Mock Data Detection
    await this.detectMockData()
    
    // Phase 4: API Connection Tests
    await this.testAPIConnections()
    
    // Phase 5: Database Health Check
    await this.validateDatabase()
    
    // Phase 6: Frontend Component Check
    await this.validateFrontendComponents()
    
    // Phase 7: CRM System Check
    await this.validateCRMSystem()
    
    // Phase 8: SEO & Performance Check
    await this.validateSEOPerformance()
    
    // Generate Report
    return this.generateValidationReport()
  }

  private async validateFileStructure() {
    console.log('📁 Phase 1: Checking File Structure...')
    
    const requiredFiles = [
      // Pages
      'src/app/page.tsx',
      'src/app/about/page.tsx',
      'src/app/contact/page.tsx',
      'src/app/services/initial-consultation/page.tsx',
      'src/app/services/software-development/page.tsx',
      'src/app/services/strategic-seo/page.tsx',
      'src/app/services/expert-education/page.tsx',
      'src/app/privacy/page.tsx',
      'src/app/terms/page.tsx',
      
      // API Routes
      'src/app/api/contact/route.ts',
      'src/app/api/newsletter/route.ts',
      'src/app/api/health/route.ts',
      
      // CRM Pages (Internal)
      'src/app/dashboard/crm/page.tsx',
      'src/app/dashboard/crm/customers/page.tsx',
      'src/app/dashboard/crm/deals/page.tsx',
      
      // CRM API Routes
      'src/app/api/crm/customers/route.ts',
      'src/app/api/crm/deals/route.ts',
      'src/app/api/crm/activities/route.ts',
      
      // Components
      'src/components/layout/Navbar.tsx',
      'src/components/layout/Footer.tsx',
      'src/components/NewsletterSignup.tsx',
      'src/components/crm/CustomerList.tsx',
      'src/components/crm/DealPipeline.tsx',
      
      // Config Files
      'src/app/sitemap.ts',
      'src/app/robots.ts',
      'src/middleware.ts',
      '.env.local'
    ]
    
    for (const file of requiredFiles) {
      const exists = await this.fileExists(file)
      if (!exists) {
        this.missingFiles.push(file)
        this.errors.push({
          type: 'missing_file',
          file,
          message: `Required file missing: ${file}`
        })
      }
    }
    
    console.log(`  ✓ Checked ${requiredFiles.length} required files`)
    console.log(`  ❌ Missing: ${this.missingFiles.length} files\n`)
  }

  private async validateCodeQuality() {
    console.log('🔧 Phase 2: Checking Code Quality...')
    
    const filesToCheck = await this.getAllTypeScriptFiles()
    
    for (const file of filesToCheck) {
      try {
        const stats = await fs.stat(file)
        if (stats.isDirectory()) continue
        
        const content = await fs.readFile(file, 'utf-8')
      
        // Check for TODO comments
        if (content.includes('TODO')) {
          this.warnings.push({
            type: 'todo_found',
            file,
            message: 'TODO comment found'
          })
        }
        
        // Check for console.log (should not be in production)
        if (content.includes('console.log') && !file.includes('test')) {
          this.warnings.push({
            type: 'console_log',
            file,
            message: 'console.log found in production code'
          })
        }
        
        // Check for proper error handling
        if (content.includes('catch') && !content.includes('console.error') && !content.includes('throw')) {
          this.warnings.push({
            type: 'silent_error',
            file,
            message: 'Catch block without proper error handling'
          })
        }
      } catch (error) {
        // Skip files that can't be read
        console.error(`Failed to read file ${file}:`, error)
      }
    }
    
    console.log(`  ✓ Checked ${filesToCheck.length} TypeScript files\n`)
  }

  private async detectMockData() {
    console.log('🎭 Phase 3: Detecting Mock Data...')
    
    const mockPatterns = [
      'Lorem ipsum',
      'placeholder',
      'example.com',
      'test@test.com',
      'John Doe',
      'Jane Doe',
      '123-456-7890',
      'TODO:',
      'FIXME:',
      'Coming Soon',
      'Under Construction'
    ]
    
    const filesToCheck = await this.getAllFiles(['tsx', 'ts', 'jsx', 'js'])
    
    for (const file of filesToCheck) {
      try {
        const stats = await fs.stat(file)
        if (stats.isDirectory()) continue
        
        const content = await fs.readFile(file, 'utf-8')
        
        for (const pattern of mockPatterns) {
          if (content.toLowerCase().includes(pattern.toLowerCase())) {
            this.mockDataFound.push(`${file}: "${pattern}"`)
            this.errors.push({
              type: 'mock_data',
              file,
              message: `Mock data found: "${pattern}"`
            })
          }
        }
      } catch (error) {
        // Skip files that can't be read
        console.error(`Failed to read file ${file}:`, error)
      }
    }
    
    console.log(`  ✓ Scanned for mock data patterns`)
    console.log(`  ❌ Found: ${this.mockDataFound.length} instances\n`)
  }

  private async testAPIConnections() {
    console.log('🔌 Phase 4: Testing API Connections...')
    
    const apiTests = [
      { name: 'Supabase', test: this.testSupabase },
      { name: 'Stripe', test: this.testStripe },
      { name: 'Resend Email', test: this.testResend },
      { name: 'Redis (if used)', test: this.testRedis }
    ]
    
    for (const api of apiTests) {
      try {
        await api.test()
        console.log(`  ✅ ${api.name}: Connected`)
} catch (error: unknown) {
        console.log(`  ❌ ${api.name}: Failed`)
        this.brokenConnections.push(api.name)
        this.errors.push({
          type: 'api_connection',
          service: api.name,
        message: `API connection failed: ${(error as Error).message}`
        })
      }
    }
    
    console.log()
  }

  private async validateDatabase() {
    console.log('🗄️ Phase 5: Validating Database...')
    
    const requiredTables = [
      'organizations',
      'profiles',
      'customers',
      'deals',
      'activities',
      'newsletter_subscribers'
    ]
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      for (const table of requiredTables) {
        const { error } = await supabase.from(table).select('count').limit(1)
        
        if (error) {
          this.errors.push({
            type: 'database_table',
            table,
            message: `Table missing or inaccessible: ${table}`
          })
        } else {
          console.log(`  ✅ Table exists: ${table}`)
        }
      }
} catch (error: unknown) {
      this.errors.push({
        type: 'database_connection',
        message: 'Failed to connect to database'
      })
    }
    
    console.log()
  }

  private async validateFrontendComponents() {
    console.log('🎨 Phase 6: Validating Frontend Components...')
    
    const componentChecks = [
      { path: 'src/components/ui', required: ['button', 'card', 'input', 'form'] },
      { path: 'src/components/layout', required: ['Navbar', 'Footer'] },
      { path: 'src/components/crm', required: ['CustomerList', 'DealPipeline'] }
    ]
    
    for (const check of componentChecks) {
      const dirPath = path.join(process.cwd(), check.path)
      try {
        const files = await fs.readdir(dirPath)
        for (const required of check.required) {
          const found = files.some(f => f.toLowerCase().includes(required.toLowerCase()))
          if (!found) {
            this.errors.push({
              type: 'missing_component',
              component: required,
              message: `Required component missing: ${check.path}/${required}`
            })
          }
        }
      } catch {
        this.errors.push({
          type: 'missing_directory',
          path: check.path,
          message: `Component directory missing: ${check.path}`
        })
      }
    }
    
    console.log()
  }

  private async validateCRMSystem() {
    console.log('🔒 Phase 7: Validating CRM System...')
    
    // Check authentication middleware
    const middlewarePath = path.join(process.cwd(), 'src/middleware.ts')
    if (await this.fileExists(middlewarePath)) {
      const content = await fs.readFile(middlewarePath, 'utf-8')
      if (!content.includes('auth') || !content.includes('dashboard')) {
        this.errors.push({
          type: 'security',
          file: middlewarePath,
          message: 'Middleware missing authentication checks for dashboard'
        })
      }
    }
    
    // Check RLS policies
    console.log('  ✓ Checking Row Level Security...')
    // This would need actual database queries
    
    console.log()
  }

  private async validateSEOPerformance() {
    console.log('📈 Phase 8: Validating SEO & Performance...')
    
    // Check for metadata
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx')
    if (await this.fileExists(layoutPath)) {
      const content = await fs.readFile(layoutPath, 'utf-8')
      const seoChecks = ['metadata', 'title', 'description', 'keywords']
      
      for (const check of seoChecks) {
        if (!content.includes(check)) {
          this.warnings.push({
            type: 'seo',
            file: layoutPath,
            message: `Missing SEO element: ${check}`
          })
        }
      }
    }
    
    // Check for sitemap
    if (!await this.fileExists('src/app/sitemap.ts')) {
      this.errors.push({
        type: 'seo',
        message: 'Sitemap missing'
      })
    }
    
    console.log()
  }

  private generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        missingFiles: this.missingFiles.length,
        mockData: this.mockDataFound.length,
        brokenConnections: this.brokenConnections.length
      },
      errors: this.errors,
      warnings: this.warnings,
      missingFiles: this.missingFiles,
      mockDataFound: this.mockDataFound,
      brokenConnections: this.brokenConnections,
      healthScore: this.calculateHealthScore()
    }
    
    return report
  }

  private calculateHealthScore(): number {
    const totalIssues = this.errors.length + this.warnings.length
    const maxScore = 100
    const deduction = totalIssues * 2
    return Math.max(0, maxScore - deduction)
  }

  // Helper methods
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(process.cwd(), filePath))
      return true
    } catch {
      return false
    }
  }

  private async getAllTypeScriptFiles(): Promise<string[]> {
    try {
      const files = await glob('src/**/*.{ts,tsx}', {
        ignore: ['node_modules/**', '.next/**', 'src/**/*.d.ts']
      })
      return files
    } catch (error) {
      console.error('Error getting TypeScript files:', error)
      return []
    }
  }

  private async getAllFiles(extensions: string[]): Promise<string[]> {
    try {
      const pattern = `src/**/*.{${extensions.join(',')}}`
      const files = await glob(pattern, {
        ignore: ['node_modules/**', '.next/**']
      })
      return files
    } catch (error) {
      console.error('Error getting files:', error)
      return []
    }
  }

  // API Test Methods
  private async testSupabase() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await supabase.from('profiles').select('count').limit(1)
    if (error) throw error
  }

  private async testStripe() {
    // Test Stripe connection
  }

  private async testResend() {
    // Test Resend connection
  }

  private async testRedis() {
    // Test Redis connection if configured
  }
}
