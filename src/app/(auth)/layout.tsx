import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-unite-navy via-gray-900 to-unite-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-unite-teal to-unite-blue bg-clip-text text-transparent">
            Unite Hub
          </h1>
          <p className="text-gray-400 mt-2">AI-Powered Marketing CRM</p>
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
