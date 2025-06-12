import { HybridAISystem } from '../../src/lib/ai-agent/hybrid/HybridAISystem'
import { buildTasks } from './all-tasks'
import * as fs from 'fs/promises'
import * as path from 'path'

async function buildEverything() {
  const ai = new HybridAISystem()
  
  for (const task of buildTasks) {
    console.log(`\n🏗️ Building: ${task.id}`)
    
    try {
      // DeepSeek phase
      console.log('  🤖 DeepSeek generating...')
      const basic = await ai.buildWithDeepSeek(task.deepseekPrompt)
      
      // Claude enhancement
      console.log('  ⚡ Claude enhancing...')
      const enhanced = await ai.enhanceWithClaude(basic, task.claudeEnhance)
      
      // Ensure enhanced is a string
      if (enhanced == null) {
        throw new Error('AI enhancement returned null or undefined');
      }
      
      // Save file
      const filePath = path.join(process.cwd(), task.output)
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, enhanced)
      
      console.log(`  ✅ Saved to ${task.output}`)
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`  ❌ Error in ${task.id}:`, error)
    }
  }
  
  console.log('\n🎉 Build complete!')
}

buildEverything().catch(console.error)
