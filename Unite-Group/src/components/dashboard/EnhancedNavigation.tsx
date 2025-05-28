'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  Calendar, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  ChevronDown,
  Briefcase,
  Shield,
  Bot,
  Heart,
  Activity,
  Zap,
  Lightbulb
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';

interface NavigationItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Consultations',
    href: '/dashboard/consultations',
    icon: Calendar,
    badge: '3',
  },
  {
    name: 'Projects',
    href: '/dashboard/projects',
    icon: FolderOpen,
    badge: '12',
  },
  {
    name: 'Contacts',
    href: '/dashboard/contacts',
    icon: Users,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    children: [
      { name: 'Overview', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Performance', href: '/dashboard/analytics/performance', icon: BarChart3 },
      { name: 'Reports', href: '/dashboard/analytics/reports', icon: BarChart3 },
    ]
  },
  {
    name: 'AI Gateway',
    href: '/dashboard/ai-gateway',
    icon: Bot,
    badge: 'NEW',
  },
  {
    name: 'Innovation',
    href: '/dashboard/innovation',
    icon: Lightbulb,
    badge: 'HOT',
  },
  {
    name: 'Autonomous',
    href: '/dashboard/autonomous',
    icon: Zap,
    badge: 'BETA',
    children: [
      { name: 'Self-Healing', href: '/dashboard/self-healing', icon: Heart },
      { name: 'Monitoring', href: '/dashboard/autonomous/monitoring', icon: Activity },
      { name: 'Recovery', href: '/dashboard/autonomous/recovery', icon: Shield },
    ]
  },
  {
    name: 'Business',
    href: '/dashboard/business',
    icon: Briefcase,
    children: [
      { name: 'CRM', href: '/dashboard/business/crm', icon: Users },
      { name: 'Sales', href: '/dashboard/business/sales', icon: BarChart3 },
      { name: 'Marketing', href: '/dashboard/business/marketing', icon: BarChart3 },
    ]
  },
  {
    name: 'Security',
    href: '/dashboard/security',
    icon: Shield,
    children: [
      { name: 'Overview', href: '/dashboard/security', icon: Shield },
      { name: 'Compliance', href: '/dashboard/security/compliance', icon: Shield },
      { name: 'Audit Logs', href: '/dashboard/security/audit', icon: Shield },
    ]
  },
];

interface User {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
}

interface EnhancedNavigationProps {
  user?: User;
  isAdmin?: boolean;
}

export function EnhancedNavigation({ user, isAdmin }: EnhancedNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-200"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-40">
        <div className="flex items-center justify-between h-full px-6">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search everything..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {isAdmin ? 'Administrator' : 'User'}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <nav className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 z-50 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-slate-700">
          <Link href="/" className="text-2xl font-bold text-white">
            <span className="text-teal-400">UG</span> UNITE Group
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col h-full pt-6">
          <div className="flex-1 px-4 space-y-2">
            {navigationItems.map((item) => (
              <div key={item.name}>
                <div className="relative">
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (item.children) {
                        toggleExpanded(item.name);
                      } else {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                      isActive(item.href)
                        ? 'bg-teal-600 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${
                        isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`} />
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <Badge 
                          variant={item.badge === 'NEW' || item.badge === 'HOT' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            item.badge === 'NEW' 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : item.badge === 'HOT'
                              ? 'bg-orange-500 hover:bg-orange-600'
                              : 'bg-slate-600 text-slate-200'
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {item.children && (
                        <ChevronDown className={`h-4 w-4 transition-transform ${
                          expandedItems.includes(item.name) ? 'rotate-180' : ''
                        }`} />
                      )}
                    </div>
                  </Link>
                </div>

                {/* Submenu */}
                {item.children && expandedItems.includes(item.name) && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                          isActive(child.href)
                            ? 'bg-teal-600/50 text-white'
                            : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <child.icon className="h-4 w-4" />
                        <span>{child.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Section */}
          <div className="p-4 border-t border-slate-700">
            <div className="space-y-2">
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-all duration-200"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full justify-start px-3 py-2 text-sm font-medium text-slate-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
