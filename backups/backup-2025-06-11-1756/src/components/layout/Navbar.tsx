Here's a production-ready `Navbar.tsx` file using Next.js, TypeScript, Tailwind CSS, and React Icons:

```tsx
import { useState } from 'react';
import Link from 'next/link';
import { FiMenu, FiX, FiSearch, FiUser, FiShoppingCart } from 'react-icons/fi';
import { BsCart3 } from 'react-icons/bs';
import { FiBell } from 'react-icons/fi';

// Use this array to manage navigation items
const navItems = [
  { name: 'Home', href: '/', current: true },
  { name: 'Products', href: '/products', current: false },
  { name: 'About', href: '/about', current: false },
  { name: 'Blog', href: '/blog', current: false },
  { name: 'Contact', href: '/contact', current: false },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(0);

  const cartItems = 3; // Replace with actual cart item count

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" passHref>
              <a className="text-xl font-bold text-gray-800 hover:text-blue-600">
                Brand<span className="text-blue-500">.</span>
              </a>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <Link 
                key={index} 
                href={item.href} 
                passHref
                onClick={() => setActiveItem(index)}
              >
                <a 
                  className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                    activeItem === index
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </a>
              </Link>
            ))}

            {/* Search Bar (Desktop) */}
            <div className="relative">
              <div className