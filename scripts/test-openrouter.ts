const apiKey = process.env.OPENROUTER_API_KEY

console.log('=== OPENROUTER DIAGNOSTIC ===')
console.log('OPENROUTER_API_KEY exists:', !!apiKey)
console.log('Key prefix:', apiKey?.substring(0, 15) + '...')

if (!apiKey) {
  console.error('Missing OpenRouter API key')
  process.exit(1)
}

async function test() {
  console.log('\n--- Testing API Connection ---')
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://synthex.social',
        'X-Title': 'Unite-Hub Diagnostic'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say OK' }]
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log('OpenRouter API: SUCCESS')
      console.log('Response:', data.choices?.[0]?.message?.content)
      console.log('Model:', data.model)
    } else {
      const errorText = await response.text()
      console.error('OpenRouter API error:', response.status, response.statusText)
      console.error('Response:', errorText)
    }
  } catch (error: any) {
    console.error('OpenRouter error:', error.message)
  }
}

test()
