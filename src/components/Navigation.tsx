"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, ChevronDown, ArrowRight, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ServiceMegaMenu } from "@/components/navigation/ServiceMegaMenu";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { GlobalSearch } from "@/components/search/GlobalSearch";

const navigation = [
  { name: "About", href: "/about-us" },
  { name: "Case Studies", href: "/case-studies" },
  { name: "Blog", href: "/blog" },
  { name: "Resources", href: "/resources" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/contact" },
];

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    try {
      const supabase = getSupabaseClient();
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        isScrolled
          ? "bg-slate-900/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center"
          >
            <Image
              src="/images/unite-logo.png"
              alt="UNITE Group"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <ServiceMegaMenu />
            
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-teal-400"
                    : "text-slate-300 hover:text-white"
                )}
              >
                {item.name}
              </Link>
            ))}

            <div className="flex items-center space-x-4 ml-4">
              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                aria-label="Open search"
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                      >
                        Login
                      </Link>
                      <Button
                        asChild
                        size="sm"
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
                      >
                        <Link href="/register">
                          Get Started
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-slate-900 border-t border-slate-800"
          >
            <div className="px-4 pt-4 pb-6 space-y-4">
              <Link
                href="/services"
                className="block text-base font-medium text-slate-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </Link>

              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "block text-base font-medium transition-colors",
                    pathname === item.href
                      ? "text-teal-400"
                      : "text-slate-300 hover:text-white"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="pt-4 space-y-4 border-t border-slate-800">
                {!loading && (
                  <>
                    {user ? (
                      <>
                        <Link
                          href="/dashboard"
                          className="block text-base font-medium text-slate-300 hover:text-white transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Button
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          variant="outline"
                          className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                        >
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block text-base font-medium text-slate-300 hover:text-white transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Login
                        </Link>
                        <Button
                          asChild
                          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
                        >
                          <Link href="/register">
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="container mx-auto px-4 pt-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <GlobalSearch
                  isFullScreen
                  onClose={() => setSearchOpen(false)}
                  placeholder="Search services, resources, blog posts..."
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
                  aria-label="Close search"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
