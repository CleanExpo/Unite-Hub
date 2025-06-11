'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Handshake, ClipboardList, Activity, Settings, BarChart, MessageCircle } from 'lucide-react';

interface SidebarProps {
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> 'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Handshake, ClipboardList, Activity, Settings, BarChart, MessageCircle } from 'lucide-react';

interface SidebarProps {
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard/crm', icon: <Home className="h-5 w-5" /> },
    { name: 'Clients', href: '/dashboard/crm/clients', icon: <Users className="h-5 w-5" /> },
    { name: 'Deals', href: '/dashboard/crm/deals', icon: <Handshake className="h-5 w-5" /> },
    { name: 'Tasks', href: '/dashboard/crm/tasks', icon: <ClipboardList className="h-5 w-5" /> },
    { name: 'Activities', href: '/dashboard/crm/activities', icon: <Activity className="h-5 w-5" /> },
    { name: 'Messages', href: '/dashboard/crm/messaging', icon: <MessageCircle className="h-5 w-5" /> },
  ];
  
  if (isAdmin) {
    navItems.push(
      { name: 'Analytics', href: '/dashboard/crm/analytics', icon: <BarChart className="h-5 w-5" /> }
    );
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">CRM Dashboard</h2>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-slate-800 text-teal-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
          
          <li>
            <Link
              href="/dashboard/crm/settings"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                pathname === '/dashboard/crm/settings'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3"><Settings className="h-5 w-5" /></span>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
.Value -replace "'", "'" <Home className="h-5 w-5" /> 'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Handshake, ClipboardList, Activity, Settings, BarChart, MessageCircle } from 'lucide-react';

interface SidebarProps {
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard/crm', icon: <Home className="h-5 w-5" /> },
    { name: 'Clients', href: '/dashboard/crm/clients', icon: <Users className="h-5 w-5" /> },
    { name: 'Deals', href: '/dashboard/crm/deals', icon: <Handshake className="h-5 w-5" /> },
    { name: 'Tasks', href: '/dashboard/crm/tasks', icon: <ClipboardList className="h-5 w-5" /> },
    { name: 'Activities', href: '/dashboard/crm/activities', icon: <Activity className="h-5 w-5" /> },
    { name: 'Messages', href: '/dashboard/crm/messaging', icon: <MessageCircle className="h-5 w-5" /> },
  ];
  
  if (isAdmin) {
    navItems.push(
      { name: 'Analytics', href: '/dashboard/crm/analytics', icon: <BarChart className="h-5 w-5" /> }
    );
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">CRM Dashboard</h2>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-slate-800 text-teal-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
          
          <li>
            <Link
              href="/dashboard/crm/settings"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                pathname === '/dashboard/crm/settings'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3"><Settings className="h-5 w-5" /></span>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
.Value -replace "'", "'" <Users className="h-5 w-5" /> 'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Handshake, ClipboardList, Activity, Settings, BarChart, MessageCircle } from 'lucide-react';

interface SidebarProps {
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard/crm', icon: <Home className="h-5 w-5" /> },
    { name: 'Clients', href: '/dashboard/crm/clients', icon: <Users className="h-5 w-5" /> },
    { name: 'Deals', href: '/dashboard/crm/deals', icon: <Handshake className="h-5 w-5" /> },
    { name: 'Tasks', href: '/dashboard/crm/tasks', icon: <ClipboardList className="h-5 w-5" /> },
    { name: 'Activities', href: '/dashboard/crm/activities', icon: <Activity className="h-5 w-5" /> },
    { name: 'Messages', href: '/dashboard/crm/messaging', icon: <MessageCircle className="h-5 w-5" /> },
  ];
  
  if (isAdmin) {
    navItems.push(
      { name: 'Analytics', href: '/dashboard/crm/analytics', icon: <BarChart className="h-5 w-5" /> }
    );
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">CRM Dashboard</h2>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-slate-800 text-teal-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
          
          <li>
            <Link
              href="/dashboard/crm/settings"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                pathname === '/dashboard/crm/settings'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3"><Settings className="h-5 w-5" /></span>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
.Value -replace "'", "'" <Handshake className="h-5 w-5" /> 'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Handshake, ClipboardList, Activity, Settings, BarChart, MessageCircle } from 'lucide-react';

interface SidebarProps {
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard/crm', icon: <Home className="h-5 w-5" /> },
    { name: 'Clients', href: '/dashboard/crm/clients', icon: <Users className="h-5 w-5" /> },
    { name: 'Deals', href: '/dashboard/crm/deals', icon: <Handshake className="h-5 w-5" /> },
    { name: 'Tasks', href: '/dashboard/crm/tasks', icon: <ClipboardList className="h-5 w-5" /> },
    { name: 'Activities', href: '/dashboard/crm/activities', icon: <Activity className="h-5 w-5" /> },
    { name: 'Messages', href: '/dashboard/crm/messaging', icon: <MessageCircle className="h-5 w-5" /> },
  ];
  
  if (isAdmin) {
    navItems.push(
      { name: 'Analytics', href: '/dashboard/crm/analytics', icon: <BarChart className="h-5 w-5" /> }
    );
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">CRM Dashboard</h2>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-slate-800 text-teal-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
          
          <li>
            <Link
              href="/dashboard/crm/settings"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                pathname === '/dashboard/crm/settings'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3"><Settings className="h-5 w-5" /></span>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
.Value -replace "'", "'" <ClipboardList className="h-5 w-5" /> 'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Handshake, ClipboardList, Activity, Settings, BarChart, MessageCircle } from 'lucide-react';

interface SidebarProps {
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard/crm', icon: <Home className="h-5 w-5" /> },
    { name: 'Clients', href: '/dashboard/crm/clients', icon: <Users className="h-5 w-5" /> },
    { name: 'Deals', href: '/dashboard/crm/deals', icon: <Handshake className="h-5 w-5" /> },
    { name: 'Tasks', href: '/dashboard/crm/tasks', icon: <ClipboardList className="h-5 w-5" /> },
    { name: 'Activities', href: '/dashboard/crm/activities', icon: <Activity className="h-5 w-5" /> },
    { name: 'Messages', href: '/dashboard/crm/messaging', icon: <MessageCircle className="h-5 w-5" /> },
  ];
  
  if (isAdmin) {
    navItems.push(
      { name: 'Analytics', href: '/dashboard/crm/analytics', icon: <BarChart className="h-5 w-5" /> }
    );
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">CRM Dashboard</h2>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-slate-800 text-teal-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
          
          <li>
            <Link
              href="/dashboard/crm/settings"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                pathname === '/dashboard/crm/settings'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3"><Settings className="h-5 w-5" /></span>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
.Value -replace "'", "'" <Activity className="h-5 w-5" /> 'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Handshake, ClipboardList, Activity, Settings, BarChart, MessageCircle } from 'lucide-react';

interface SidebarProps {
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard/crm', icon: <Home className="h-5 w-5" /> },
    { name: 'Clients', href: '/dashboard/crm/clients', icon: <Users className="h-5 w-5" /> },
    { name: 'Deals', href: '/dashboard/crm/deals', icon: <Handshake className="h-5 w-5" /> },
    { name: 'Tasks', href: '/dashboard/crm/tasks', icon: <ClipboardList className="h-5 w-5" /> },
    { name: 'Activities', href: '/dashboard/crm/activities', icon: <Activity className="h-5 w-5" /> },
    { name: 'Messages', href: '/dashboard/crm/messaging', icon: <MessageCircle className="h-5 w-5" /> },
  ];
  
  if (isAdmin) {
    navItems.push(
      { name: 'Analytics', href: '/dashboard/crm/analytics', icon: <BarChart className="h-5 w-5" /> }
    );
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">CRM Dashboard</h2>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-slate-800 text-teal-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
          
          <li>
            <Link
              href="/dashboard/crm/settings"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                pathname === '/dashboard/crm/settings'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3"><Settings className="h-5 w-5" /></span>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
.Value -replace "'", "'" <MessageCircle className="h-5 w-5" /> 'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Handshake, ClipboardList, Activity, Settings, BarChart, MessageCircle } from 'lucide-react';

interface SidebarProps {
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard/crm', icon: <Home className="h-5 w-5" /> },
    { name: 'Clients', href: '/dashboard/crm/clients', icon: <Users className="h-5 w-5" /> },
    { name: 'Deals', href: '/dashboard/crm/deals', icon: <Handshake className="h-5 w-5" /> },
    { name: 'Tasks', href: '/dashboard/crm/tasks', icon: <ClipboardList className="h-5 w-5" /> },
    { name: 'Activities', href: '/dashboard/crm/activities', icon: <Activity className="h-5 w-5" /> },
    { name: 'Messages', href: '/dashboard/crm/messaging', icon: <MessageCircle className="h-5 w-5" /> },
  ];
  
  if (isAdmin) {
    navItems.push(
      { name: 'Analytics', href: '/dashboard/crm/analytics', icon: <BarChart className="h-5 w-5" /> }
    );
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">CRM Dashboard</h2>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-slate-800 text-teal-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
          
          <li>
            <Link
              href="/dashboard/crm/settings"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                pathname === '/dashboard/crm/settings'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3"><Settings className="h-5 w-5" /></span>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
.Value -replace "'", "'" <BarChart className="h-5 w-5" /> }
    );
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">CRM Dashboard</h2>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-slate-800 text-teal-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
          
          <li>
            <Link
              href="/dashboard/crm/settings"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                pathname === '/dashboard/crm/settings'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3"><Settings className="h-5 w-5" /></span>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
