import React from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logos/unite-hub-logo.png"
            alt="Unite-Group Logo"
            width={120}
            height={120}
            priority
            className="object-contain mb-3"
          />
          <p className="text-white/40 text-sm font-mono">AI-Powered Marketing CRM</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-sm mt-6 font-mono">
          © 2025 Unite-Group. All rights reserved.
        </p>
      </div>
    </div>
  );
}
