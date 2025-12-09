/**
 * Founder Ops Index Page
 * Redirects to Twin tab
 */

import { redirect } from 'next/navigation';

export default function FounderOpsPage() {
  redirect('/founder/ops/twin');
}
