'use client';

import dynamic from 'next/dynamic';

const ChatWidget = dynamic(() => import('./ChatWidget'), {
  ssr: false // Disable SSR for chat widget as it uses browser-only features
});

export default function ChatWidgetWrapper() {
  return <ChatWidget />;
}
