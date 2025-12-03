const apiKey = process.env.SENDGRID_API_KEY

console.log('=== SENDGRID DIAGNOSTIC ===')
console.log('SENDGRID_API_KEY exists:', !!apiKey)
console.log('Key prefix:', apiKey?.substring(0, 10) + '...')

if (!apiKey) {
  console.error('Missing SendGrid API key')
  process.exit(1)
}

async function test() {
  console.log('\n--- Testing API Connection ---')
  const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })

  if (response.ok) {
    const data = await response.json()
    console.log('SendGrid API: SUCCESS')
    console.log('Account:', data.first_name, data.last_name)
  } else {
    const errorText = await response.text()
    console.error('SendGrid API error:', response.status, response.statusText)
    console.error('Response:', errorText)
    if (response.status === 401) {
      console.error('DIAGNOSIS: Invalid API key')
    } else if (response.status === 403) {
      console.error('DIAGNOSIS: API key lacks permissions')
    }
  }
}

test()
