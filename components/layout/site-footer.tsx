import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Linkedin } from "lucide-react";
import { services } from "@/lib/services-data";

export default function SiteFooter() {
  return (
    <footer className="py-20 bg-slate-950 border-t border-slate-800 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/5 via-transparent to-teal-900/5"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800/10 via-transparent to-slate-800/10"></div>
      <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <Link href="/" className="flex items-center">
            <Image
              src="/unite-group-logo-image.png"
              alt="Unite Group Logo"
              width={200}
              height={200}
              className="h-32 lg:h-48 w-auto"
              priority
            />
          </Link>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              We help businesses remove roadblocks, operate better, and grow
              faster. No jargon. No fluff. Just practical outcomes that drive
              real results.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-6">Company</h5>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/about-us"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/case-studies"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Case Studies
                </Link>
              </li>
              <li>
                <Link
                  href="/success-blueprint"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Success Blueprint
                </Link>
              </li>
              <li>
                <Link
                  href="/innovation-lab"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Innovation Lab
                </Link>
              </li>
              <li>
                <Link
                  href="/unite-ecosystem"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Our Ecosystem
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-6">
              Our Solutions
            </h5>
            <ul className="space-y-3 text-sm">
              {services.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Link
                    href={s.link}
                    className="text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/services"
                  className="text-slate-400 hover:text-cyan-400 transition-colors font-medium"
                >
                  View All Services →
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-6">Contact & Social</h5>
            <div className="space-y-4 text-sm">
              <div className="flex items-center text-slate-400">
                <Mail size={16} className="mr-3 text-cyan-400" />
                contact@unite-group.in
              </div>
              <div className="flex items-center text-slate-400">
                <MapPin size={16} className="mr-3 text-cyan-400" />
                Brisbane, QLD, Australia
              </div>
              <div className="pt-2">
                <p className="text-slate-400 mb-3">Follow us:</p>
                <div className="flex space-x-3">
                  <Link
                    href="https://www.linkedin.com/company/unite-group-australia/"
                    aria-label="LinkedIn"
                    className="text-slate-400 hover:text-cyan-400 transition-colors p-2 hover:bg-slate-800 rounded-lg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin size={20} />
                  </Link>
                  <Link
                    href="mailto:contact@unite-group.in"
                    aria-label="Email"
                    className="text-slate-400 hover:text-cyan-400 transition-colors p-2 hover:bg-slate-800 rounded-lg"
                  >
                    <Mail size={20} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm">
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} Unite Group. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0 items-center">
            <Link
              href="/privacy-policy"
              className="text-slate-500 hover:text-cyan-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-slate-500 hover:text-cyan-400 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-slate-500 hover:text-cyan-400 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
