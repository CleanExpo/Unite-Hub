import React from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-unite-navy via-gray-900 to-unite-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logos/unite-hub-logo.png"
            alt="Unite-Hub Logo"
            width={120}
            height={120}
            priority
            className="object-contain mb-3"
          />
          <p className="text-gray-400 text-sm">AI-Powered Marketing CRM</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © 2025 Unite Hub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
