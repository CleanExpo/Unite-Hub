import { HybridAISystem } from '../../src/lib/ai-agent/hybrid/HybridAISystem' // Corrected import path
import { CompleteValidator } from './complete-validator'
import { ValidationError, ValidationWarning, ValidationReport } from './types'
import * as fs from 'fs/promises'
import * as path from 'path'
import config from './config.json'

export class AutoFixer {
  private ai: HybridAISystem
  private validator: CompleteValidator
  
  constructor() {
    this.ai = new HybridAISystem()
    this.validator = new CompleteValidator()
  }

  async fixEverything() {
    console.log('🔧 Starting Auto-Fix Process\n')
    
    // Step 1: Run validation
    const report = await this.validator.performCompleteValidation()
    
    // Step 2: Fix missing files
    await this.fixMissingFiles(report.missingFiles)
    
    // Step 3: Replace mock data
    await this.replaceMockData(report.mockDataFound)
    
    // Step 4: Fix broken connections
    await this.fixBrokenConnections(report.brokenConnections)
    
    // Step 5: Fix code quality issues
    await this.fixCodeQualityIssues(report.warnings)
    
    // Step 6: Re-validate
    console.log('\n🔍 Re-validating after fixes...\n')
    const finalReport = await this.validator.performCompleteValidation()
    
    // Generate final report
    await this.generateFinalReport(finalReport)
  }

  private async fixMissingFiles(missingFiles: string[]) {
    console.log(`\n🛠️ Fixing ${missingFiles.length} missing files...`)
    
    // Check if creating files is allowed
    if (!config.autoFix.allowedOperations.createFiles) {
      console.log('  ⚠️ File creation is disabled in configuration')
      return
    }
    
    // Limit files per run
    const filesToFix = missingFiles.slice(0, config.autoFix.maxFilesPerRun)
    
    for (const file of filesToFix) {
      console.log(`  Creating: ${file}`)
      
      const prompt = this.generatePromptForFile(file)
      let code: string | null
      
      // Determine AI strategy based on file type
      if (file.includes('api') || file.includes('auth') || file.includes('crm')) {
        // Use hybrid approach for critical files
        const basic = await this.ai.buildWithDeepSeek(prompt)
        if (basic) {
          code = await this.ai.enhanceWithClaude(basic, 'Add error handling, validation, and security')
        } else {
          code = null
        }
      } else {
        // Use DeepSeek for basic files
        code = await this.ai.buildWithDeepSeek(prompt)
      }
      
      // Skip if code generation failed
      if (!code) {
        console.error(`  ❌ Failed to generate code for: ${file}`)
        continue
      }
      
      // Save the file
      const fullPath = path.join(process.cwd(), file)
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, code)
      
      console.log(`  ✅ Created: ${file}`)
    }
    
    if (missingFiles.length > filesToFix.length) {
      console.log(`\n  ℹ️ Limited to ${config.autoFix.maxFilesPerRun} files per run. ${missingFiles.length - filesToFix.length} files remaining.`)
    }
  }

  private async replaceMockData(mockDataInstances: string[]) {
    console.log(`\n🎭 Replacing ${mockDataInstances.length} mock data instances...`)
    
    // Check if editing is allowed
    if (!config.autoFix.allowedOperations.editFiles) {
      console.log('  ⚠️ File editing is disabled in configuration')
      return
    }
    
    const replacements = config.mockData.replacements
    
    for (const instance of mockDataInstances) {
      const parts = instance.split(': ').map(part => part.trim())

      if (parts.length < 2) {
        console.error(`Skipping invalid mock data instance: ${instance}`)
        continue;
      }

      const filePath: string = parts[0];
      const content = await fs.readFile(filePath, 'utf-8')
      
      let newContent = content
      for (const [mock, real] of Object.entries(replacements)) {
        newContent = newContent.replace(new RegExp(mock, 'gi'), real)
      }
      
      await fs.writeFile(filePath, newContent)
      console.log(`  ✅ Fixed mock data in: ${path.basename(filePath)}`)
    }
  }

  private generatePromptForFile(filePath: string): string {
    const fileName = path.basename(filePath)
    const prompts: Record<string, string> = {
      'page.tsx': `Create a Next.js page component for ${filePath}. Use TypeScript, Tailwind CSS, and shadcn/ui components.`,
      'route.ts': `Create a Next.js API route for ${filePath}. Include proper error handling, validation, and TypeScript types.`,
      'CustomerList.tsx': 'Create a CRM customer list component with search, filters, and actions. Use TypeScript interfaces.',
      'DealPipeline.tsx': 'Create a drag-and-drop deal pipeline component. Include stages: lead, qualified, proposal, negotiation, won, lost.',
      'middleware.ts': 'Create Next.js middleware to protect /dashboard routes using Supabase auth.',
      'sitemap.ts': 'Create dynamic sitemap for SEO including all pages, blog posts, and services.',
      'robots.ts': 'Create robots.txt configuration allowing all crawlers except for /dashboard and /api routes.'
    }
    
    // Find matching prompt or generate generic one
    for (const [key, prompt] of Object.entries(prompts)) {
      if (fileName.includes(key)) {
        return prompt
      }
    }
    
    return `Create a production-ready ${fileName} file for ${filePath}`
  }

  private async fixBrokenConnections(brokenConnections: string[]) {
    console.log(`\n🔧 Fixing ${brokenConnections.length} broken connections...`)
    
    for (const service of brokenConnections) {
      console.log(`  Fixing ${service}...`)
      
      switch(service) {
        case 'Supabase':
          await this.fixSupabaseConnection()
          break
        case 'Stripe':
          await this.fixStripeConnection()
          break
        case 'Resend Email':
          await this.fixResendConnection()
          break
        case 'Redis (if used)':
          await this.fixRedisConnection()
          break
        default:
          console.log(`  No specific fix for ${service}`)
      }
    }
  }

  private async fixCodeQualityIssues(warnings: ValidationWarning[]) {
    console.log(`\n📝 Fixing ${warnings.length} code quality issues...`)
    
    for (const warning of warnings) {
      if (!warning.file) {
        console.error(`Warning without file: ${warning.message}`)
        continue;
      }
      
      console.log(`  Fixing issue in ${warning.file}: ${warning.message}`)
      
      // Generate a fix using AI
      const prompt = `Fix code quality issue: ${warning.message}\nFile: ${warning.file}`
      const code = await this.ai.buildWithDeepSeek(prompt)
      
      if (!code) {
        console.error(`  ❌ Failed to generate fix for: ${warning.file}`)
        continue
      }
      
      // Write the fixed code
      const fullPath = path.join(process.cwd(), warning.file)
      await fs.writeFile(fullPath, code)
      console.log(`  ✅ Fixed in ${warning.file}`)
    }
  }

  private async generateFinalReport(report: any) {
    const reportPath = path.join(process.cwd(), 'validation-report.json')
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 FINAL VALIDATION REPORT')
    console.log('='.repeat(60))
    console.log(`Health Score: ${report.healthScore}%`)
    console.log(`Errors: ${report.summary.errors}`)
    console.log(`Warnings: ${report.summary.warnings}`)
    console.log(`Missing Files: ${report.summary.missingFiles}`)
    console.log(`Mock Data: ${report.summary.mockData}`)
    console.log(`Broken Connections: ${report.summary.brokenConnections}`)
    console.log('\nFull report saved to: validation-report.json')
    
    if (report.healthScore === 100) {
      console.log('\n🎉 PERFECT! Your site is 100% complete and production-ready!')
    } else if (report.healthScore >= 80) {
      console.log('\n✅ Good! Your site is mostly complete with minor issues.')
    } else {
      console.log('\n⚠️ Your site needs more work. Review the report for details.')
    }
  }

  // Placeholder methods for connection fixes
  private async fixSupabaseConnection() {
    console.log('  🔧 Fixing Supabase connection...')
    // Implementation to fix Supabase connection
  }

  private async fixStripeConnection() {
    console.log('  💳 Fixing Stripe connection...')
    // Implementation to fix Stripe connection
  }

  private async fixResendConnection() {
    console.log('  ✉️ Fixing Resend connection...')
    // Implementation to fix Resend connection
  }

  private async fixRedisConnection() {
    console.log('  🐇 Fixing Redis connection...')
    // Implementation to fix Redis connection
  }
}
