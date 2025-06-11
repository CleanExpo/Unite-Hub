'use client'

import { UserProfile } from '@/components/profile/UserProfile'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="py-12">
        <UserProfile />
      </div>
    </div>
  )
}
