'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`bg-slate-950/50 backdrop-blur-sm border-b border-slate-800 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center space-x-2 text-sm">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-500 mx-2" />}
              {index === items.length - 1 ? (
                <span className="flex items-center gap-1 text-gray-400">
                  {index === 0 && <Home className="w-4 h-4" />}
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href as any}
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {index === 0 && <Home className="w-4 h-4" />}
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}