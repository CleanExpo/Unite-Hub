/**
 * Synthex Client Dashboard — Redirect
 *
 * Legacy route at /client-dashboard redirects to the full
 * Synthex dashboard at /synthex/dashboard
 */

import { redirect } from 'next/navigation';

export default function SynthexClientDashboard() {
  redirect('/synthex/dashboard');
}
