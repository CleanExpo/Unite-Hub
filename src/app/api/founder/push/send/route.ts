import { NextRequest, NextResponse } from 'next/server';
import { sendPushToOwner } from '@/lib/push/webPushService';

interface SendBody {
  ownerId: string;
  title: string;
  body: string;
  url?: string;
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const sendBody: SendBody = await req.json();

  if (!sendBody.ownerId || !sendBody.title || !sendBody.body) {
    return NextResponse.json({ error: 'Missing required fields: ownerId, title, body' }, { status: 400 });
  }

  const result = await sendPushToOwner(sendBody.ownerId, {
    title: sendBody.title,
    body: sendBody.body,
    url: sendBody.url,
  });

  return NextResponse.json(result);
}
