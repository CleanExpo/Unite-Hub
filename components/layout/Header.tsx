'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Home, Users, Megaphone, Search, BarChart3, Rocket, Calendar, Phone, Zap } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<any>;
  children?: {
    name: string;
    href: string;
    description: string;
  }[];
}

const navigation: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Home
  },
  {
    name: 'Growth Hacking',
    href: '/growth-hacking',
    icon: Rocket,
    children: [
      { name: 'Growth Guide', href: '/growth-hacking/guide', description: 'Complete growth hacking methodology' },
      { name: 'Growth Tools', href: '/growth-hacking/tools', description: 'Tools and calculators for growth' },
      { name: 'Workshop', href: '/growth-hacking/workshop', description: 'Hands-on growth workshops' },
      { name: 'Case Studies', href: '/growth-hacking/case-studies', description: 'Real growth success stories' },
      { name: 'Calculator', href: '/growth-hacking/calculator', description: 'Growth metrics calculator' }
    ]
  },
  {
    name: 'Agile Marketing',
    href: '/agile-marketing',
    icon: Users,
    children: [
      { name: 'Frameworks', href: '/agile-marketing/frameworks', description: 'Scrum, Kanban & Lean for Marketing' },
      { name: 'Team Training', href: '/agile-marketing/team-training', description: 'Transform your marketing team' },
      { name: 'Transformation', href: '/agile-marketing/transformation', description: 'Complete agile transformation' },
      { name: 'Certification', href: '/agile-marketing/certification', description: 'Get certified in agile marketing' }
    ]
  },
  {
    name: 'Social Advertising',
    href: '/social-advertising',
    icon: Megaphone,
    children: [
      { name: 'Facebook Ads', href: '/social-advertising/facebook-ads', description: 'Advanced Facebook advertising' },
      { name: 'LinkedIn B2B', href: '/social-advertising/linkedin-b2b', description: 'B2B LinkedIn advertising' },
      { name: 'ROI Calculator', href: '/social-advertising/roi-calculator', description: 'Calculate ad ROI' },
      { name: 'Guide', href: '/social-advertising/guide', description: 'Social advertising guide' }
    ]
  },
  {
    name: 'Competitive Analysis',
    href: '/competitive-analysis',
    icon: Search,
    children: [
      { name: 'Benchmarking', href: '/competitive-analysis/benchmarking', description: 'Competitive benchmarking' },
      { name: 'SEO Audit', href: '/competitive-analysis/seo-audit', description: 'SEO competitive analysis' },
      { name: 'Tracker', href: '/competitive-analysis/tracker', description: 'Monitor competitors' },
      { name: 'Guide', href: '/competitive-analysis/guide', description: 'Competitive analysis guide' }
    ]
  },
  {
    name: 'Market Research',
    href: '/market-research',
    icon: BarChart3,
    children: [
      { name: 'Persona Development', href: '/market-research/persona-development', description: 'Build customer personas' },
      { name: 'Industry Reports', href: '/market-research/industry-reports', description: 'Industry research reports' },
      { name: 'Survey Tools', href: '/market-research/surveys', description: 'Market research surveys' },
      { name: 'Guide', href: '/market-research/guide', description: 'Market research guide' }
    ]
  }
];

const quickLinks = [
  { name: 'SEO Synthesizer', href: '/seo-synthesizer', icon: Zap },
  { name: 'Case Studies', href: '/case-studies', icon: BarChart3 },
  { name: 'Consultation', href: '/consultation', icon: Calendar },
  { name: 'Contact', href: '/contact', icon: Phone }
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'backdrop-blur-glass bg-primary-950/80 border-b border-neutral-800/50 shadow-glass' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 group">
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">U</span>
                </div>
                <span className="text-xl font-bold text-neutral-100 group-hover:text-accent transition-colors duration-300">
                  Unite Group
                </span>
              </motion.div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <motion.button
              type="button"
              className="glass-card -m-2.5 inline-flex items-center justify-center rounded-xl p-3 text-neutral-300 hover:text-accent transition-colors duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="sr-only">Open main menu</span>
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 180 }}
                    exit={{ rotate: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 0 }}
                    exit={{ rotate: 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                {item.children ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(item.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button className="group flex items-center gap-x-2 text-sm font-semibold leading-6 text-neutral-300 hover:text-accent transition-colors duration-300 underline-animate">
                      {item.icon && <item.icon className="w-4 h-4 group-hover:text-accent transition-colors duration-300" />}
                      {item.name}
                      <motion.div
                        animate={{ rotate: activeDropdown === item.name ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 flex-none text-neutral-400 group-hover:text-accent transition-colors duration-300" aria-hidden="true" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {activeDropdown === item.name && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="absolute left-0 top-full z-10 mt-4 w-80 glass-card shadow-glass border border-neutral-700/50"
                        >
                        <div className="p-4">
                          {item.children.map((child) => (
                            <motion.div
                              key={child.href}
                              whileHover={{ x: 4 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Link
                                href={child.href as any}
                                className="group relative flex items-center gap-x-3 rounded-xl p-4 text-sm leading-6 hover:bg-neutral-800/30 transition-all duration-300"
                              >
                                <div className="flex-1">
                                  <div className="font-semibold text-neutral-100 group-hover:text-accent transition-colors duration-300">
                                    {child.name}
                                  </div>
                                  <p className="mt-1 text-neutral-400 text-xs group-hover:text-neutral-300 transition-colors duration-300">{child.description}</p>
                                </div>
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 0, x: -10 }}
                                  whileHover={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="text-accent"
                                >
                                  →
                                </motion.div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    href={item.href as any}
                    className="group flex items-center gap-x-2 text-sm font-semibold leading-6 text-neutral-300 hover:text-accent transition-colors duration-300 underline-animate"
                  >
                    {item.icon && <item.icon className="w-4 h-4 group-hover:text-accent transition-colors duration-300" />}
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
            {quickLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Link
                  href={link.href as any}
                  className="group glass-card px-4 py-2 rounded-xl flex items-center gap-x-2 text-sm font-semibold leading-6 text-neutral-300 hover:text-accent transition-all duration-300 hover:shadow-glow btn-magnetic"
                >
                  <link.icon className="w-4 h-4 group-hover:text-accent transition-colors duration-300" />
                  {link.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="lg:hidden glass-card mx-4 mb-4 rounded-2xl border border-neutral-700/50 shadow-glass"
            >
            <div className="space-y-1 p-6">
              {navigation.map((item, index) => (
                <motion.div 
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  {item.children ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-base font-semibold text-neutral-200">
                        {item.icon && <item.icon className="w-5 h-5 text-accent" />}
                        {item.name}
                      </div>
                      <div className="pl-8 space-y-1">
                        {item.children.map((child, childIndex) => (
                          <motion.div
                            key={child.href}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (index * 0.1) + (childIndex * 0.05), duration: 0.2 }}
                          >
                            <Link
                              href={child.href as any}
                              className="block rounded-lg px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800/30 hover:text-accent transition-all duration-300"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {child.name}
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href as any}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-neutral-300 hover:bg-neutral-800/30 hover:text-accent transition-all duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon && <item.icon className="w-5 h-5" />}
                      {item.name}
                    </Link>
                  )}
                </motion.div>
              ))}
              
              <div className="border-t border-neutral-700/50 mt-6 pt-4">
                {quickLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (navigation.length * 0.1) + (index * 0.1), duration: 0.3 }}
                  >
                    <Link
                      href={link.href as any}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-neutral-300 hover:bg-accent/10 hover:text-accent transition-all duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>
    </motion.header>
  );
}