import { CompleteValidator } from './validation/complete-validator'
import { AutoFixer } from './validation/auto-fixer'
import * as fs from 'fs/promises'
import * as path from 'path'
import { glob } from 'glob'

async function main() {
  console.log('🚀 Unite Group - Complete System Validation & Auto-Fix')
  console.log('=' .repeat(60))
  console.log()
  
  // Handle command-line arguments
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: tsx scripts/validate-and-fix-all.ts [options]')
    console.log()
    console.log('Options:')
    console.log('  --fix        Run in auto-fix mode to automatically fix issues')
    console.log('  --help, -h   Show this help message')
    console.log()
    console.log('Examples:')
    console.log('  tsx scripts/validate-and-fix-all.ts          # Run validation only')
    console.log('  tsx scripts/validate-and-fix-all.ts --fix    # Run validation and auto-fix')
    return
  }
  
  const fixMode = args.includes('--fix')
  
  if (fixMode) {
    console.log('🔧 Running in AUTO-FIX mode')
    console.log('This will automatically fix all issues found\n')
    
    const fixer = new AutoFixer()
    await fixer.fixEverything()
    console.log('\n✅ All fixes applied successfully!')
    
  } else {
    console.log('🔍 Running in VALIDATE-ONLY mode')
    console.log('Add --fix flag to automatically fix issues\n')
    
    const validator = new CompleteValidator()
    const report = await validator.performCompleteValidation()
    
    // Save report
    await fs.writeFile('validation-report.json', JSON.stringify(report, null, 2))
    
    console.log('\n📊 Validation complete!')
    console.log(`Health Score: ${report.healthScore}%`)
    console.log('Full report saved to: validation-report.json')
    
    if (report.summary.errors > 0) {
      console.log('\n❌ Errors found! Run with --fix flag to auto-fix:')
      console.log('npx tsx scripts/validate-and-fix-all.ts --fix')
    }
  }
}

main().catch(console.error)
