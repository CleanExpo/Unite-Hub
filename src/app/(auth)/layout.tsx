import React from "react";
import Image from "next/image";

// Force dynamic rendering for all auth pages — they require session context
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        background: 'var(--surface-canvas)',
        backgroundImage: 'var(--auth-bg-pattern), var(--auth-glow)',
        backgroundSize: 'var(--auth-bg-size), 100% 100%',
      }}
    >
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="mb-3"
            style={{ filter: 'drop-shadow(0 0 20px rgba(0, 245, 255, 0.10))' }}
          >
            <Image
              src="/logos/unite-group-nexus-logo.png"
              alt="Unite-Group Nexus"
              width={96}
              height={96}
              priority
              className="object-contain"
            />
          </div>
          <p className="text-white/40 text-[11px] font-mono tracking-[0.3em] uppercase">
            Unite-Group Nexus
          </p>
        </div>

        {/* Auth Card — elevated with cyan top accent */}
        <div
          className="rounded-sm p-8"
          style={{
            background:   'var(--surface-sidebar)',
            borderLeft:   '1px solid var(--color-border)',
            borderRight:  '1px solid var(--color-border)',
            borderBottom: '1px solid var(--color-border)',
            borderTop:    '1px solid rgba(0, 245, 255, 0.18)',
          }}
        >
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-white/25 text-[11px] mt-6 font-mono tracking-wider">
          © 2026 Unite-Group. All rights reserved.
        </p>
      </div>
    </div>
  );
}
