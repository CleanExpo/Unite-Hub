import Link from "next/link"
import Image from "next/image"
import { Facebook, Linkedin, Youtube, AtSign } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t border-[#4ecdc4]/20 bg-[#001428]">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="UNITE Group Logo" width={40} height={40} />
              <span className="text-xl font-bold text-white">UNITE Group</span>
            </Link>
            <p className="text-gray-400">United in vision. Independent in spirit.</p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/CARSIaus/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#4ecdc4] transition-colors duration-200 flex items-center justify-center w-10 h-10 rounded-full bg-[#0c2340]/30"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/carsiaus/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#4ecdc4] transition-colors duration-200 flex items-center justify-center w-10 h-10 rounded-full bg-[#0c2340]/30"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://www.youtube.com/@carsi6767/videos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#4ecdc4] transition-colors duration-200 flex items-center justify-center w-10 h-10 rounded-full bg-[#0c2340]/30"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
              <a
                href="https://www.reddit.com/r/CARSIGeneral/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#4ecdc4] transition-colors duration-200 flex items-center justify-center w-10 h-10 rounded-full bg-[#0c2340]/30"
                aria-label="Reddit"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="8" cy="9" r="1" />
                  <circle cx="16" cy="9" r="1" />
                  <path d="M12 16a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4Z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/services/rest-api-development"
                  className="text-gray-400 hover:text-[#4ecdc4] transition-colors"
                >
                  REST API Development
                </Link>
              </li>
              <li>
                <Link href="/services/app-development" className="text-gray-400 hover:text-[#4ecdc4] transition-colors">
                  App Development
                </Link>
              </li>
              <li>
                <Link href="/services/gmb-strategies" className="text-gray-400 hover:text-[#4ecdc4] transition-colors">
                  GMB Strategies
                </Link>
              </li>
              <li>
                <Link
                  href="/services/nextjs-website-creators"
                  className="text-gray-400 hover:text-[#4ecdc4] transition-colors"
                >
                  Next.js Website Creation
                </Link>
              </li>
              <li>
                <Link href="/education" className="text-gray-400 hover:text-[#4ecdc4] transition-colors">
                  Online Education
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[#4ecdc4] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/about#team" className="text-gray-400 hover:text-[#4ecdc4] transition-colors">
                  Our Team
                </Link>
              </li>
              <li>
                <Link href="/podcast" className="text-gray-400 hover:text-[#4ecdc4] transition-colors">
                  Podcast
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-[#4ecdc4] transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[#4ecdc4] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#4ecdc4] mt-1"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-gray-400">Wacol, QLD, Australia</span>
              </li>
              <li className="flex items-start space-x-3">
                <AtSign className="text-[#4ecdc4] mt-1" size={20} />
                <span className="text-gray-400">support@carsi.com.au</span>
              </li>
              <li className="flex items-start space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#4ecdc4] mt-1"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span className="text-gray-400">0457 123 005</span>
              </li>
              <li className="flex items-start space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#4ecdc4] mt-1"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <a href="mailto:support@carsi.com.au" className="text-gray-400 hover:text-[#4ecdc4] transition-colors">
                  Email Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#4ecdc4]/10">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-col md:flex-row gap-2 md:gap-8 items-center">
              <p className="text-gray-400 text-sm">© {new Date().getFullYear()} CARSI. All rights reserved.</p>
              <p className="text-gray-400 text-sm">ABN: 12 345 678 901</p>
            </div>

            {/* Podcast Link in Footer */}
            <div className="flex items-center">
              <a
                href="https://open.spotify.com/show/2PtpuuiYKKlKa7fWI0IvaV?si=vLpI88DpSUK0JsmXGKJvPw&nd=1&dlsi=b17b9673a73c443e"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-400 hover:text-[#4ecdc4] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mr-2"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                The Science of Property Restoration Podcast
              </a>
            </div>

            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-[#4ecdc4] text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-[#4ecdc4] text-sm">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
