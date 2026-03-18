'use client'

interface Props {
  selectedCount: number
  onArchive: () => void
  onDelete: () => void
  onMarkRead: () => void
  onTriage: () => void
  loading?: boolean
}

export function BulkActionBar({ selectedCount, onArchive, onDelete, onMarkRead, onTriage, loading }: Props) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-900 border border-white/20 px-4 py-3 rounded-sm shadow-2xl">
      <span className="text-sm text-white/60 mr-1">
        {selectedCount} thread{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <div className="w-px h-4 bg-white/10" />
      <button
        onClick={onMarkRead}
        disabled={loading}
        className="text-xs text-white/60 hover:text-white transition-colors disabled:opacity-40"
      >
        Mark Read
      </button>
      <button
        onClick={onTriage}
        disabled={loading}
        className="text-xs text-[#00F5FF] hover:text-[#00F5FF]/70 transition-colors disabled:opacity-40"
      >
        AI Triage
      </button>
      <button
        onClick={onArchive}
        disabled={loading}
        className="text-xs text-white/60 hover:text-white transition-colors disabled:opacity-40"
      >
        Archive All
      </button>
      <button
        onClick={onDelete}
        disabled={loading}
        className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
      >
        Delete All
      </button>
    </div>
  )
}
