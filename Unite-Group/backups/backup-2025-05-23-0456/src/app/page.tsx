'use client'

import { Button } from '@/components/Button';

export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Unite Group</h1>
      <p style={{ marginBottom: '1rem' }}>Welcome to your Next.js application!</p>
      
      <Button onClick={() => alert('Button clicked!')}>
        Click Me
      </Button>
    </main>
  )
}
