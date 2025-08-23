'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, ChevronDown, Building2, Phone, 
  Rocket, Users, Megaphone, Search, BarChart3,
  HardHat, Shield, Wrench, Home, FileText
} from 'lucide-react';

export default function NavigationHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: <Home className="h-4 w-4" />
    },
    {
      name: 'Services',
      icon: <Rocket className="h-4 w-4" />,
      items: [
        { name: 'Growth Hacking', href: '/growth-hacking', description: '127+ leads per month' },
        { name: 'Agile Marketing', href: '/agile-marketing', description: 'Complete 32% more jobs' },
        { name: 'Social Advertising', href: '/social-advertising', description: '87+ leads at $12 each' },
        { name: 'Competitive Analysis', href: '/competitive-analysis', description: 'Win 34% more quotes' },
        { name: 'Market Research', href: '/market-research', description: '67% conversion increase' }
      ]
    },
    {
      name: 'Trade Solutions',
      icon: <HardHat className="h-4 w-4" />,
      items: [
        { name: 'Local SEO for Contractors', href: '/local-seo-contractors', description: 'Dominate Google locally' },
        { name: 'Business Automation', href: '/contractor-business-automation', description: 'Save 20+ hours weekly' },
        { name: 'Digital Transformation', href: '/digital-transformation-trades', description: 'Modernize your business' },
        { name: 'Safety Compliance', href: '/safety-compliance-software', description: 'Queensland WHS made simple' },
        { name: 'Business Scaling', href: '/trade-business-scaling', description: 'Grow beyond owner-operator' }
      ]
    },
    {
      name: 'About',
      icon: <Building2 className="h-4 w-4" />,
      items: [
        { name: 'About Us', href: '/about', description: 'Founded by a tradie' },
        { name: 'Our Team', href: '/team', description: 'Meet our experts' },
        { name: 'Case Studies', href: '/case-studies', description: 'Success stories' },
        { name: 'Testimonials', href: '/testimonials', description: 'Client reviews' }
      ]
    },
    {
      name: 'Contact',
      href: '/contact',
      icon: <Phone className="h-4 w-4" />
    }
  ];

  const isActive = (href: string) => pathname === href;
  const isParentActive = (items?: any[]) => items?.some(item => pathname === item.href);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <span className="font-bold text-xl text-gray-900">Unite Group</span>
              <span className="text-xs text-gray-600 block">Digital Marketing for Trades</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        isParentActive(item.items)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.icon}
                      {item.name}
                      <ChevronDown className={`h-4 w-4 transition-transform ${
                        openDropdown === item.name ? 'rotate-180' : ''
                      }`} />
                    </button>
                    
                    {openDropdown === item.name && (
                      <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                        {item.items?.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`block px-4 py-2 hover:bg-gray-50 ${
                              isActive(subItem.href) ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                            }`}
                            onClick={() => setOpenDropdown(null)}
                          >
                            <div className="font-medium">{subItem.name}</div>
                            <div className="text-xs text-gray-500">{subItem.description}</div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            
            {/* CTA Buttons */}
            <div className="ml-4 flex items-center gap-2">
              <Link
                href="/consultation"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Free Consultation
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {navigation.map((item) => (
              <div key={item.name} className="mb-2">
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <div>
                    <div className="px-4 py-2 text-sm font-medium text-gray-900">
                      {item.name}
                    </div>
                    <div className="ml-4 mt-1 space-y-1">
                      {item.items?.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block px-4 py-2 rounded-lg text-sm ${
                            isActive(subItem.href)
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div className="mt-4 px-4 space-y-2">
              <Link
                href="/consultation"
                className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Free Consultation
              </Link>
              <Link
                href="/dashboard"
                className="block w-full px-4 py-2 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Review Dashboard
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}