'use client'

import Link from 'next/link'
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Our Team', href: '/about#team' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
      { name: 'Contact', href: '/contact' }
    ],
    solutions: [
      { name: 'CRM Solutions', href: '/services#crm' },
      { name: 'AI & Analytics', href: '/services#ai' },
      { name: 'Cloud Infrastructure', href: '/services#cloud' },
      { name: 'Software Development', href: '/services#development' },
      { name: 'Consulting', href: '/services#consulting' }
    ],
    resources: [
      { name: 'Documentation', href: '/docs' },
      { name: 'API Reference', href: '/api-docs' },
      { name: 'Blog', href: '/blog' },
      { name: 'Case Studies', href: '/case-studies' },
      { name: 'Support', href: '/support' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'GDPR', href: '/gdpr' },
      { name: 'Security', href: '/security' }
    ]
  }

  const socialLinks = [
    { icon: <Facebook className="h-5 w-5" />, href: 'https://facebook.com/unitegroup', label: 'Facebook' },
    { icon: <Twitter className="h-5 w-5" />, href: 'https://twitter.com/unitegroup', label: 'Twitter' },
    { icon: <Linkedin className="h-5 w-5" />, href: 'https://linkedin.com/company/unitegroup', label: 'LinkedIn' },
    { icon: <Instagram className="h-5 w-5" />, href: 'https://instagram.com/unitegroup', label: 'Instagram' }
  ]

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <h3 className="text-2xl font-bold text-white">Unite Group</h3>
              </Link>
              <p className="text-gray-400 mb-4">
                Empowering businesses with cutting-edge technology solutions. Transform your operations with our AI-powered platform and expert services.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href="mailto:contact@unite-group.in" className="hover:text-white transition-colors">
                    contact@unite-group.in
                  </a>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href="tel:+918888888888" className="hover:text-white transition-colors">
                    +91 88888 88888
                  </a>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                  <span>
                    Unite Business Park<br />
                    Sector 62, Noida<br />
                    Uttar Pradesh 201309, India
                  </span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4 mt-6">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2">
                {footerLinks.solutions.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-gray-800 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-white font-semibold mb-2">Subscribe to our newsletter</h4>
              <p className="text-gray-400">
                Get the latest updates on new features, products, and exclusive offers.
              </p>
            </div>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {currentYear} Unite Group. All rights reserved.
            </p>
            
            {/* Certifications/Badges */}
            <div className="flex items-center space-x-6">
              <span className="text-gray-400 text-sm">ISO 27001 Certified</span>
              <span className="text-gray-400 text-sm">GDPR Compliant</span>
              <span className="text-gray-400 text-sm">SOC 2 Type II</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
