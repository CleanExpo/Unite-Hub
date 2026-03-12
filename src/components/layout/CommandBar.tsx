'use client'

import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Lock, ClipboardCheck,
  Scale, Share2, Settings, MessageSquare, Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command'
import { useUIStore } from '@/store/ui'

interface NavCommand {
  type: 'nav'
  label: string
  icon: LucideIcon
  path: string
  shortcut?: string
}

interface ActionCommand {
  type: 'action'
  label: string
  icon: LucideIcon
  action: () => void
  shortcut?: string
}

type Command = NavCommand | ActionCommand

const NAV_COMMANDS: NavCommand[] = [
  { type: 'nav', label: 'Dashboard',  icon: LayoutDashboard, path: '/founder/dashboard' },
  { type: 'nav', label: 'Contacts',   icon: Users,           path: '/founder/contacts' },
  { type: 'nav', label: 'Vault',      icon: Lock,            path: '/founder/vault' },
  { type: 'nav', label: 'Approvals',  icon: ClipboardCheck,  path: '/founder/approvals' },
  { type: 'nav', label: 'Advisory',   icon: Scale,           path: '/founder/advisory' },
  { type: 'nav', label: 'Social',     icon: Share2,          path: '/founder/social' },
  { type: 'nav', label: 'Settings',   icon: Settings,        path: '/founder/settings' },
]

export function CommandBar() {
  const router = useRouter()
  const commandBarOpen = useUIStore((s) => s.commandBarOpen)
  const toggleCommandBar = useUIStore((s) => s.toggleCommandBar)
  const toggleBron = useUIStore((s) => s.toggleBron)
  const toggleCapture = useUIStore((s) => s.toggleCapture)

  if (!commandBarOpen) return null

  const ACTION_COMMANDS: ActionCommand[] = [
    {
      type: 'action',
      label: 'Open Bron Chat',
      icon: MessageSquare,
      action: toggleBron,
      shortcut: '\u2318\u21E7B',
    },
    {
      type: 'action',
      label: 'Capture Idea',
      icon: Zap,
      action: toggleCapture,
      shortcut: '\u2318I',
    },
  ]

  function run(cmd: Command) {
    if (cmd.type === 'nav') {
      router.push(cmd.path)
    } else {
      cmd.action()
    }
    toggleCommandBar()
  }

  return (
    <CommandDialog open={commandBarOpen} onOpenChange={toggleCommandBar}>
      <CommandInput placeholder="Search pages and actions\u2026" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {NAV_COMMANDS.map((cmd) => (
            <CommandItem
              key={cmd.label}
              value={cmd.label}
              onSelect={() => run(cmd)}
            >
              <cmd.icon
                size={14}
                strokeWidth={1.5}
                style={{ color: 'var(--color-text-disabled)' }}
              />
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Actions">
          {ACTION_COMMANDS.map((cmd) => (
            <CommandItem
              key={cmd.label}
              value={cmd.label}
              onSelect={() => run(cmd)}
            >
              <cmd.icon
                size={14}
                strokeWidth={1.5}
                style={{ color: 'var(--color-text-disabled)' }}
              />
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
