import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Instagram,
} from "lucide-react";
import { services } from "@/lib/services-data";

export default function SiteFooter() {
  return (
    <footer className="py-20 bg-slate-950 border-t border-slate-800">
      <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex justify-start mb-4">
              <Link href="/" className="flex items-start w-full">
                <Image
                  src="/unite-group-logo-image.png"
                  alt="Unite Group Logo"
                  width={200}
                  height={200}
                  className="h-32 lg:h-48 w-auto"
                  priority
                />
              </Link>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Empowering businesses with cutting-edge technology solutions.
              Transform your operations with our AI-powered platform and expert
              services.
            </p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center text-slate-400">
                <Mail size={16} className="mr-2 text-cyan-400" />{" "}
                support@unite-group.in
              </p>

              <p className="flex items-center text-slate-400">
                <MapPin size={16} className="mr-2 text-cyan-400" /> Union Place,
                Ipswich CBD, Queensland, Australia
              </p>
            </div>
          </div>
          <div>
            <h5 className="text-lg font-semibold text-white mb-4">Company</h5>
            <ul className="space-y-2 text-sm">
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
              <li>
                <Link
                  href="/pricing"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-lg font-semibold text-white mb-4">Solutions</h5>
            <ul className="space-y-2 text-sm">
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
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  All Services
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-lg font-semibold text-white mb-4">
              Subscribe to our newsletter
            </h5>
            <p className="text-sm text-slate-400 mb-4">
              Get the latest updates on new features, products, and exclusive
              offers.
            </p>
            <form className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 rounded-l-lg bg-slate-800 border border-slate-700 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                aria-label="Email for newsletter"
              />
              <button
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2.5 rounded-r-lg font-semibold transition-colors"
              >
                Subscribe
              </button>
            </form>
            <div className="mt-6 flex space-x-4">
              <Link
                href="#"
                aria-label="LinkedIn"
                className="text-slate-400 hover:text-cyan-400"
              >
                <Linkedin size={20} />
              </Link>
              <Link
                href="#"
                aria-label="Twitter"
                className="text-slate-400 hover:text-cyan-400"
              >
                <Twitter size={20} />
              </Link>
              <Link
                href="#"
                aria-label="Instagram"
                className="text-slate-400 hover:text-cyan-400"
              >
                <Instagram size={20} />
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm">
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} Unite Group. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 sm:mt-0 items-center">
            <Link
              href="/privacy-policy"
              className="text-slate-500 hover:text-cyan-400"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-slate-500 hover:text-cyan-400"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
