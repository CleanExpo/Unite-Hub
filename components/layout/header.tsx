"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, ShoppingCart } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#4ecdc4]/20 bg-[#001428]/95 backdrop-blur supports-[backdrop-filter]:bg-[#001428]/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="UNITE Group Logo" width={40} height={40} />
          <span className="text-xl font-bold text-white">UNITE Group</span>
        </Link>

        <nav className="hidden md:flex gap-6">
          <Link href="/" className="text-sm font-medium text-white hover:text-[#4ecdc4] transition-colors">
            Home
          </Link>
          <Link href="/services" className="text-sm font-medium text-white hover:text-[#4ecdc4] transition-colors">
            Services
          </Link>
          <Link href="/education" className="text-sm font-medium text-white hover:text-[#4ecdc4] transition-colors">
            Education
          </Link>
          <Link href="/about" className="text-sm font-medium text-white hover:text-[#4ecdc4] transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-sm font-medium text-white hover:text-[#4ecdc4] transition-colors">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/cart" className="text-white hover:text-[#4ecdc4]">
            <ShoppingCart className="h-5 w-5" />
          </Link>
          <Button className="hidden sm:flex bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
            Get Started
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:text-[#4ecdc4] hover:bg-transparent"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#001428] border-b border-[#4ecdc4]/20">
          <nav className="flex flex-col p-4">
            <Link
              href="/"
              className="py-3 text-white hover:text-[#4ecdc4] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/services"
              className="py-3 text-white hover:text-[#4ecdc4] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="/education"
              className="py-3 text-white hover:text-[#4ecdc4] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Education
            </Link>
            <Link
              href="/about"
              className="py-3 text-white hover:text-[#4ecdc4] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="py-3 text-white hover:text-[#4ecdc4] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <Button
              className="mt-3 bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
