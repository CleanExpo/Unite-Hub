/**
 * Unite-Hub Root Page (Route Group)
 * Redirects to dashboard
 */

import { redirect } from 'next/navigation';

export default function UniteHubRootPage() {
  redirect('/unite-hub/dashboard');
}
