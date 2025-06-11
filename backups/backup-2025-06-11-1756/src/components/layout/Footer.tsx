Here's a production-ready `Footer.tsx` component designed with Tailwind CSS, accessibility, and modern UI practices in mind:

```tsx
import { useState, useEffect } from 'react';
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' },
  ];

  const socialLinks = [
    { name: 'Twitter', url: 'https://twitter.com', icon: 'TwitterIcon' },
    { name: 'Facebook', url: 'https://facebook.com', icon: 'FacebookIcon' },
    { name: 'Instagram', url: 'https://instagram.com', icon: 'InstagramIcon' },
  ];

  const teamMembers = [
    { 
      name: 'Jane Smith',
      role: 'CEO & Founder',
      social: [
        { name: 'LinkedIn', url: 'https://linkedin.com' },
        { name: 'Twitter', url: 'https://twitter.com' },
      ]
    },
    { 
      name: 'Unite Group Team',
      role: 'Lead Developer',
      social: [
        { name: 'GitHub', url: 'https://github.com' },
        { name: 'LinkedIn', url: 'https://linkedin.com' },
      ]
    },
  ];

  if (!window) return null;

  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-12 gap-8">
          {/* Logo & Description Column */}
          <div className="md:col-span-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-xl font-bold">
                L
              </div>
              <h2 className="text-xl font-bold">YourBrand</h2>
            </div>
            <p className="mt-4 text-gray-300">
              We help businesses grow and innovate in the digital landscape. 
              Our mission is to provide exceptional solutions and services.
            </p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                  aria-label={link.name}
                >
                  <span className="sr-only">{link.name}</span>
                  <div className="w-5 h-5 bg-gray-400 rounded-full animate-spin" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Column */}
          <div className="md:col-span-3">
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <nav>
              <ul className="space-y-3">
                {navigationItems.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-gray-300 hover:text-white transition-colors"
                      aria-label={`Go to ${item.name}`}
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Legal Column */}
          <div className="md:col-span-3">
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <nav>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/privacy"
                    className="text-gray-300 hover:text-white transition-colors"
                    aria-label="Privacy Policy"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-gray-300 hover:text-white transition-colors"
                    aria-label="Terms of Service"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/cookie"
                    className="text-gray-300 hover:text-white transition-colors"
                    aria-label="Cookie Policy"
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Contact Info Column */}
          <div className="md:col-span-2">
            <h3