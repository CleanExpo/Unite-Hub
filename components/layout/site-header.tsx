"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { services } from "@/lib/services-data"

export const mainNavLinks = [
  { name: "About", href: "/about-us" },
  { name: "Case Studies", href: "/case-studies" },
  // { name: "Pricing", href: "/pricing" },
]

export default function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md shadow-lg h-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <Image
              src="/unite-group-logo-image.png"s
              alt="Unite Group Logo"
              width={200}
              height={200}
              className="h-32 lg:h-48 w-auto"
              priority
            />
          </Link>
          <nav className="hidden lg:flex space-x-1 items-center">
            {/* Services Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Link
                  href="/services"
                  className={cn(
                    "text-sm text-slate-300 hover:text-cyan-400 transition-colors duration-300 px-3 py-2 rounded-md flex items-center",
                    pathname.startsWith("/services") ? "text-cyan-400 font-semibold bg-slate-800/50" : "",
                  )}
                >
                  Services <ChevronDown size={16} className="ml-1" />
                </Link>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700 text-slate-200 w-56">
                <DropdownMenuItem asChild>
                  <Link href="/services" className="hover:!bg-slate-700 !text-slate-200 hover:!text-cyan-300">
                    All Services
                  </Link>
                </DropdownMenuItem>
                {services.map((service) => (
                  <DropdownMenuItem key={service.id} asChild>
                    <Link href={service.link} className="hover:!bg-slate-700 !text-slate-200 hover:!text-cyan-300">
                      {service.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {mainNavLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-sm text-slate-300 hover:text-cyan-400 transition-colors duration-300 px-3 py-2 rounded-md",
                  pathname === link.href || (link.href === "/case-studies" && pathname.startsWith("/case-studies"))
                    ? "text-cyan-400 font-semibold bg-slate-800/50"
                    : "",
                )}
              >
                {link.name}
              </Link>
            ))}
            <motion.a
              href="/contact"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-colors duration-300 text-sm ml-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Us
            </motion.a>
          </nav>
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-300 hover:text-cyan-400"
              aria-label="Toggle mobile menu"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="lg:hidden bg-slate-900 absolute w-full shadow-xl pb-4"
        >
          <nav className="flex flex-col space-y-1 px-4 pt-2">
            <Link
              href="/services"
              className={cn(
                "text-slate-300 hover:text-cyan-400 py-2 text-center block",
                pathname.startsWith("/services") ? "text-cyan-400 font-semibold" : "",
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Services
            </Link>
            {mainNavLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-slate-300 hover:text-cyan-400 py-2 text-center block",
                  pathname === link.href || (link.href === "/case-studies" && pathname.startsWith("/case-studies"))
                    ? "text-cyan-400 font-semibold"
                    : "",
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <motion.a
              href="/contact" // Changed from /#contact to /contact for consistency
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-300 text-center block mt-2"
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact Us
            </motion.a>
          </nav>
        </motion.div>
      )}
    </header>
  )
}
