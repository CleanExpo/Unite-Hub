import { NextResponse } from 'next/server';

async function handleGET() {
  return NextResponse.json({ message: 'Hello from Unite Group API!' });
}

export const GET = handleGET;
