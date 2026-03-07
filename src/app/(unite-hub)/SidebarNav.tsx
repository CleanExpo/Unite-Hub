'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Mail,
  Megaphone,
  FolderKanban,
  CheckSquare,
  Activity,
  Settings,
  Brain,
  Search,
  BarChart3,
} from 'lucide-react';

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard/overview',
    icon: LayoutDashboard,
  },
  {
    label: 'Contacts',
    href: '/dashboard/contacts',
    icon: Users,
  },
  {
    label: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Megaphone,
  },
  {
    label: 'Email Intelligence',
    href: '/dashboard/emails',
    icon: Mail,
  },
  {
    label: 'Kanban',
    href: '/kanban',
    icon: FolderKanban,
  },
  {
    label: 'AI Agents',
    href: '/founder/agents',
    icon: Brain,
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    label: 'Search Suite',
    href: '/dashboard/seo',
    icon: Search,
  },
  {
    label: 'Tasks',
    href: '/dashboard/tasks',
    icon: CheckSquare,
  },
  {
    label: 'Activity',
    href: '/dashboard/activity',
    icon: Activity,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {navigationItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <motion.div
            key={item.href}
            initial={mounted ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: mounted ? 0 : index * 0.05,
              duration: 0.4,
              ease: [0.19, 1, 0.22, 1],
            }}
          >
            <Link
              href={item.href}
              style={isActive ? { borderLeft: '2px solid #00F5FF' } : undefined}
              className={
                isActive
                  ? 'flex items-center space-x-3 px-4 py-3 rounded-sm text-[#00F5FF] bg-white/[0.04] border border-white/[0.08] transition-colors'
                  : 'flex items-center space-x-3 px-4 py-3 rounded-sm text-white/50 hover:text-white/90 hover:bg-white/[0.03] transition-colors'
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}
