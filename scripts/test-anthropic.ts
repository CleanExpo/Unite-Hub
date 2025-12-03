import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY

console.log('=== ANTHROPIC DIAGNOSTIC ===')
console.log('ANTHROPIC_API_KEY exists:', !!apiKey)
console.log('Key prefix:', apiKey?.substring(0, 15) + '...')

if (!apiKey) {
  console.error('Missing Anthropic API key')
  process.exit(1)
}

const client = new Anthropic({ apiKey })

async function test() {
  try {
    console.log('\n--- Testing API Connection ---')
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say OK' }]
    })
    console.log('Anthropic API: SUCCESS')
    console.log('Response:', (response.content[0] as any).text)
    console.log('Model used:', response.model)
  } catch (error: any) {
    console.error('Anthropic API error:', error.message)
    if (error.status === 401) {
      console.error('DIAGNOSIS: Invalid API key')
    } else if (error.status === 429) {
      console.error('DIAGNOSIS: Rate limited or out of credits')
    } else if (error.status === 400) {
      console.error('DIAGNOSIS: Bad request - check model name')
    }
    console.error('Full error:', JSON.stringify(error, null, 2))
  }
}

test()
