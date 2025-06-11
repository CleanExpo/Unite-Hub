'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Handshake, ClipboardList, Activity, Settings, BarChart, MessageCircle } from 'lucide-react';

interface SidebarProps {
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard/crm', label: 'Dashboard', icon: Home },
    { href: '/dashboard/crm/clients', label: 'Clients', icon: Users },
    { href: '/dashboard/crm/deals', label: 'Deals', icon: Handshake },
    { href: '/dashboard/crm/tasks', label: 'Tasks', icon: ClipboardList },
    { href: '/dashboard/crm/activity', label: 'Activity', icon: Activity },
    { href: '/dashboard/crm/communication', label: 'Communication', icon: MessageCircle },
    { href: '/dashboard/crm/reports', label: 'Reports', icon: BarChart },
  ];

  if (isAdmin) {
    menuItems.push({ href: '/dashboard/crm/settings', label: 'Settings', icon: Settings });
  }

  return (
    <div className="w-64 bg-slate-800 text-white h-full">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-6">CRM Dashboard</h2>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
