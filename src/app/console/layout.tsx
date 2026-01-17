'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield, Brain, AlertTriangle, Activity, Wrench, Target,
  Building2, Globe, MapPin, Gauge, Scale, CreditCard, FileCheck,
  LayoutDashboard, ChevronLeft, ChevronRight
} from 'lucide-react';

const engines = [
  { name: 'Overview', path: '/console', icon: LayoutDashboard },
  { name: 'ASRS', path: '/console/asrs', icon: Shield, description: 'Safety & Risk' },
  { name: 'MCSE', path: '/console/mcse', icon: Brain, description: 'Cognitive Validation' },
  { name: 'UPEWE', path: '/console/upewe', icon: AlertTriangle, description: 'Predictions' },
  { name: 'AIRE', path: '/console/aire', icon: Wrench, description: 'Incident Response' },
  { name: 'SORIE', path: '/console/sorie', icon: Target, description: 'Strategic' },
  { name: 'EGCBI', path: '/console/egcbi', icon: Building2, description: 'Governance' },
  { name: 'GRH', path: '/console/grh', icon: Globe, description: 'Regulatory' },
  { name: 'RAAOE', path: '/console/raaoe', icon: MapPin, description: 'Regional Ops' },
  { name: 'GSLPIE', path: '/console/gslpie', icon: Gauge, description: 'Performance' },
  { name: 'AGLBASE', path: '/console/aglbase', icon: Scale, description: 'Load Balancing' },
  { name: 'TCPQEL', path: '/console/tcpqel', icon: CreditCard, description: 'Plans & Quotas' },
  { name: 'UCSCEL', path: '/console/ucscel', icon: FileCheck, description: 'Contracts' },
];

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-bg-base text-text-primary">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-bg-raised transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          {!collapsed && <h1 className="text-xl font-bold">Unite Console</h1>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-bg-hover"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {engines.map((engine) => {
            const Icon = engine.icon;
            const isActive = pathname === engine.path;

            return (
              <Link
                key={engine.path}
                href={engine.path}
                className={`flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-accent-500 text-text-primary'
                    : 'hover:bg-bg-hover text-text-secondary'
                }`}
              >
                <Icon size={20} />
                {!collapsed && (
                  <div className="flex-1">
                    <div className="font-medium">{engine.name}</div>
                    {engine.description && (
                      <div className="text-xs text-text-muted">{engine.description}</div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-subtle text-xs text-text-tertiary">
          {!collapsed && <div>v1.0.0 • 18 Engines</div>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
