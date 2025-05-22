"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown } from "lucide-react"
import { supabaseClient } from "@/lib/supabase/client"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isServicesOpen, setIsServicesOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabaseClient.auth.getUser()
      setUser(data?.user || null)
    }

    getUser()

    const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut()
  }

  return (
    <nav className="bg-[#0a192f] border-b border-[#1a2f55] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/images/unite-logo.png" alt="UNITE Group" width={40} height={40} className="rounded-lg" />
              <span className="text-xl font-bold text-white">UNITE Group</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="/"
                className="text-gray-300 hover:text-[#64ffda] px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </Link>

              {/* Services Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  className="text-gray-300 hover:text-[#64ffda] px-3 py-2 text-sm font-medium transition-colors flex items-center"
                >
                  Services
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {isServicesOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-[#112240] border border-[#1a2f55] rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <Link
                        href="/services"
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-[#64ffda] hover:bg-[#1a2f55]"
                        onClick={() => setIsServicesOpen(false)}
                      >
                        All Services
                      </Link>
                      <Link
                        href="/services/software-development"
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-[#64ffda] hover:bg-[#1a2f55]"
                        onClick={() => setIsServicesOpen(false)}
                      >
                        Software Development
                      </Link>
                      <Link
                        href="/services/seo-services"
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-[#64ffda] hover:bg-[#1a2f55]"
                        onClick={() => setIsServicesOpen(false)}
                      >
                        SEO Services
                      </Link>
                      <Link
                        href="/services/expert-education"
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-[#64ffda] hover:bg-[#1a2f55]"
                        onClick={() => setIsServicesOpen(false)}
                      >
                        Expert Education
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/about"
                className="text-gray-300 hover:text-[#64ffda] px-3 py-2 text-sm font-medium transition-colors"
              >
                About
              </Link>

              <Link
                href="/contact"
                className="text-gray-300 hover:text-[#64ffda] px-3 py-2 text-sm font-medium transition-colors"
              >
                Contact
              </Link>

              {user && (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-300 hover:text-[#64ffda] px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/projects"
                    className="text-gray-300 hover:text-[#64ffda] px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Projects
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="text-gray-300 hover:text-[#64ffda] text-sm">
                  Profile
                </Link>
                <button onClick={handleSignOut} className="text-gray-300 hover:text-[#64ffda] text-sm">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-300 hover:text-[#64ffda] text-sm font-medium">
                  Sign In
                </Link>
                <Button asChild className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] text-sm">
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-[#64ffda] p-2">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#112240] rounded-lg mt-2">
              <Link
                href="/"
                className="text-gray-300 hover:text-[#64ffda] block px-3 py-2 text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/services"
                className="text-gray-300 hover:text-[#64ffda] block px-3 py-2 text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                Services
              </Link>
              <Link
                href="/about"
                className="text-gray-300 hover:text-[#64ffda] block px-3 py-2 text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-gray-300 hover:text-[#64ffda] block px-3 py-2 text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-300 hover:text-[#64ffda] block px-3 py-2 text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/projects"
                    className="text-gray-300 hover:text-[#64ffda] block px-3 py-2 text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link
                    href="/profile"
                    className="text-gray-300 hover:text-[#64ffda] block px-3 py-2 text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsOpen(false)
                    }}
                    className="text-gray-300 hover:text-[#64ffda] block px-3 py-2 text-base font-medium w-full text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-300 hover:text-[#64ffda] block px-3 py-2 text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] block px-3 py-2 text-base font-medium rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
