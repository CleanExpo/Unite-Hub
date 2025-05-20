"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  // Handle scroll event to change header style
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Education", href: "/education" },
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ]

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled ? "bg-[#001428]/90 backdrop-blur-md shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.png" alt="UNITE Group Logo" width={40} height={40} />
              <span className="text-xl font-bold text-white">UNITE Group</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-[#4ecdc4] ${
                  pathname === item.href ? "text-[#4ecdc4]" : "text-gray-300"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-[#4ecdc4]/20 animate-pulse"></div>
            ) : user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 focus:outline-none">
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url || "/placeholder.svg"}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full border border-[#4ecdc4]/50"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#4ecdc4]/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-[#4ecdc4]" />
                    </div>
                  )}
                  <span className="text-sm text-gray-300">
                    {user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "User"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-[#002a42] rounded-md shadow-lg overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#4ecdc4]/10 hover:text-[#4ecdc4]"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#4ecdc4]/10 hover:text-[#4ecdc4]"
                    >
                      Dashboard
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#4ecdc4]/10 hover:text-[#4ecdc4]"
                      onClick={() => {
                        /* Handle sign out */
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-[#4ecdc4]/10">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">Sign up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#001428] border-t border-[#4ecdc4]/20">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-[#4ecdc4] ${
                    pathname === item.href ? "text-[#4ecdc4]" : "text-gray-300"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-[#4ecdc4]/20 animate-pulse"></div>
              ) : user ? (
                <>
                  <Link
                    href="/profile"
                    className="text-sm font-medium text-gray-300 hover:text-[#4ecdc4] transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-gray-300 hover:text-[#4ecdc4] transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    className="text-sm font-medium text-gray-300 hover:text-[#4ecdc4] transition-colors text-left"
                    onClick={() => {
                      /* Handle sign out */
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-2 border-t border-[#4ecdc4]/10">
                  <Link href="/auth/signin">
                    <Button
                      variant="ghost"
                      className="w-full justify-center text-gray-300 hover:text-white hover:bg-[#4ecdc4]/10"
                    >
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button className="w-full justify-center bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
