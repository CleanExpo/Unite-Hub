import { NextResponse } from 'next/server';

async function handleGET(req, userId) () {
  return NextResponse.json({ message: 'Hello from Unite Group API!' });
}

export const GET = withApiAuth(handleGET);