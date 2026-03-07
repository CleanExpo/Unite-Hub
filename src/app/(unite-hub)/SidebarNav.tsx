'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Brain,
  Network,
  Users,
  TrendingUp,
  Megaphone,
  Mail,
  CheckSquare,
  FolderOpen,
  Kanban,
  BarChart3,
  FileText,
  Settings,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    heading: 'Primary',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Founder OS', href: '/founder/os', icon: Brain },
      { label: 'Ecosystem', href: '/founder/connections', icon: Network },
    ],
  },
  {
    heading: 'CRM',
    items: [
      { label: 'Contacts', href: '/dashboard/contacts', icon: Users },
      { label: 'Deals', href: '/dashboard/deals', icon: TrendingUp },
      { label: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
      { label: 'Emails', href: '/dashboard/emails', icon: Mail },
      { label: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
      { label: 'Kanban', href: '/kanban', icon: Kanban },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Reports', href: '/dashboard/reports', icon: FileText },
    ],
  },
  {
    heading: 'Platform',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  let itemIndex = 0;

  return (
    <nav className="flex-1 overflow-y-auto pb-4">
      {navSections.map((section) => (
        <div key={section.heading}>
          <p className="text-white/20 font-mono text-xs uppercase tracking-widest px-4 py-2 mt-4">
            {section.heading}
          </p>
          {section.items.map((item) => {
            const Icon = item.icon;
            const currentIndex = itemIndex++;
            // Exact match for /dashboard to avoid prefix-matching all dashboard routes
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <motion.div
                key={item.href}
                initial={mounted ? false : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: mounted ? 0 : currentIndex * 0.04,
                  duration: 0.4,
                  ease: [0.19, 1, 0.22, 1],
                }}
              >
                <Link
                  href={item.href}
                  style={isActive ? { borderLeft: '2px solid #00F5FF' } : undefined}
                  className={
                    isActive
                      ? 'font-mono text-sm px-4 py-2.5 flex items-center gap-3 rounded-sm transition-colors bg-[#00F5FF]/10 text-[#00F5FF] border-l-2 border-[#00F5FF]'
                      : 'font-mono text-sm px-4 py-2.5 flex items-center gap-3 rounded-sm transition-colors text-white/50 hover:text-white/90 hover:bg-white/[0.03]'
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
