import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Twitter } from 'lucide-react';
import pageContent from '../config/synthex-page-content.json';

const socialIcons = {
  Twitter,
  Linkedin,
};

export function Footer() {
  const { footer } = pageContent;

  return (
    <footer className="bg-gray-800/50 border-t border-gray-700">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href={footer.logo.href} className="inline-block">
              <span className="sr-only">{footer.logo.alt}</span>
              <Image
                src={footer.logo.src}
                alt={footer.logo.alt}
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-gray-400 text-base">
              {footer.tagline}
            </p>
            <div className="flex space-x-6">
              {footer.socials.map((item) => {
                const Icon = socialIcons[item.icon as keyof typeof socialIcons];
                return (
                  <a key={item.name} href={item.href} className="text-gray-400 hover:text-orange-500">
                    <span className="sr-only">{item.name}</span>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 xl:mt-0 xl:col-span-2">
            {footer.navigation.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
                  {section.title}
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {section.links.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-base text-gray-400 hover:text-orange-500">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            {footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}