// src/app/(founder)/founder/graph/page.tsx
import { ConnectCard } from '@/components/founder/integrations/ConnectCard'

export default function GraphPage() {
  const configured = Boolean(process.env.GOOGLE_DRIVE_VAULT_FOLDER_ID)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-light text-white/90">Knowledge Graph</h1>
        <p className="text-sm text-white/40 mt-1">Obsidian vault · synced via Google Drive</p>
      </div>

      {!configured ? (
        <ConnectCard
          service="Obsidian Vault"
          description="Connect your Obsidian vault via Google Drive to access your knowledge base and link notes to CRM records."
          connectUrl="/api/obsidian/connect"
          icon="🔮"
        />
      ) : (
        <div className="border border-white/[0.10] p-6 rounded-sm text-white/40 text-sm">
          Vault connected — graph rendering coming in Phase 5.
        </div>
      )}
    </div>
  )
}
