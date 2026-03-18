'use client'

interface Account {
  email: string
  label: string
  unreadCount?: number
}

interface Props {
  accounts: Account[]
  activeAccount: string
  onSelect: (email: string) => void
}

export function AccountTabs({ accounts, activeAccount, onSelect }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-white/[0.06]">
      {accounts.map(account => {
        const active = account.email === activeAccount
        return (
          <button
            key={account.email}
            onClick={() => onSelect(account.email)}
            className={[
              'flex items-center gap-1.5 px-3 py-2 text-xs rounded-sm transition-colors flex-shrink-0',
              active
                ? 'bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/30'
                : 'text-white/50 hover:text-white/80 border border-transparent hover:border-white/10',
            ].join(' ')}
          >
            <span className="truncate max-w-[160px]">{account.label || account.email.split('@')[0]}</span>
            {(account.unreadCount ?? 0) > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${active ? 'bg-[#00F5FF]/20 text-[#00F5FF]' : 'bg-white/10 text-white/60'}`}>
                {account.unreadCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
