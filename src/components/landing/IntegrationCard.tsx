'use client';

import React from 'react';
import { useState } from 'react';

import { PulsingDot } from '@/components/AnimatedElements';

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  status?: 'Connected' | 'Available' | 'Coming Soon';
  actionText?: string;
  badgeText?: string;
  delay?: number;
}

export function IntegrationCard({
  name,
  description,
  icon,
  status = 'Available',
  actionText = 'Configure',
  badgeText,
}: IntegrationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [displayDescription, setDisplayDescription] = useState(description);

  return (
    <div
      className="group relative bg-gradient-to-br from-bg-card to-secondary-500/5 rounded-xl p-6 border border-border-base hover:border-secondary-500 transition-all duration-300 h-full cursor-pointer"
      onMouseEnter={() => {
        setIsHovered(true);
        setDisplayDescription('Learn more →');
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setDisplayDescription(description);
      }}
      style={{
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered
          ? '0 12px 24px -8px rgba(52, 123, 247, 0.25)'
          : '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Badge */}
      {badgeText && (
        <div className="absolute top-4 right-4">
          <span className="inline-block px-2 py-1 rounded-full bg-gradient-to-r from-accent-500 to-accent-400 text-white text-[10px] font-bold uppercase tracking-wide">
            {badgeText}
          </span>
        </div>
      )}

      {/* Icon */}
      <div className="flex items-center justify-center h-16 w-16 mb-4 rounded-lg bg-white shadow-sm group-hover:shadow-md transition-shadow">
        {icon}
      </div>

      {/* Name & Status */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-bold text-text-primary">{name}</h3>
          {status === 'Connected' && <PulsingDot className="scale-75" />}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              status === 'Connected'
                ? 'text-success-500'
                : status === 'Coming Soon'
                ? 'text-accent-500'
                : 'text-text-secondary'
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Description */}
      <p
        className={`text-sm mb-4 transition-all duration-300 ${
          isHovered ? 'text-secondary-500 font-semibold' : 'text-text-secondary'
        }`}
      >
        {displayDescription}
      </p>

      {/* Action Button (appears on hover) */}
      {status !== 'Coming Soon' && (
        <div
          className="transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0.5 }}
        >
          <button
            className="text-xs font-semibold text-secondary-500 hover:text-secondary-400 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Add integration configuration logic here
            }}
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
}

// Predefined integration icons
export function GmailIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <path
        d="M24 9.5L7.5 19v20h8v-16l8.5 6.5L32.5 23v16h8V19L24 9.5z"
        fill="#EA4335"
      />
      <path d="M32.5 23L24 29.5 15.5 23v16h17V23z" fill="#C5221F" />
      <path d="M7.5 19l8.5 6.5v-7L7.5 12v7z" fill="#4285F4" />
      <path d="M40.5 19l-8.5 6.5v-7L40.5 12v7z" fill="#FBBC04" />
    </svg>
  );
}

export function SlackIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <path
        d="M14 19a3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3h3v3zm1.5 0a3 3 0 013-3 3 3 0 013 3v7.5a3 3 0 01-3 3 3 3 0 01-3-3V19z"
        fill="#E01E5A"
      />
      <path
        d="M18.5 14a3 3 0 01-3-3 3 3 0 013-3 3 3 0 013 3v3h-3zm0 1.5a3 3 0 013 3 3 3 0 01-3 3h-7.5a3 3 0 01-3-3 3 3 0 013-3h7.5z"
        fill="#36C5F0"
      />
      <path
        d="M29 19a3 3 0 013-3 3 3 0 013 3 3 3 0 01-3 3h-3v-3zm-1.5 0a3 3 0 01-3 3 3 3 0 01-3-3v-7.5a3 3 0 013-3 3 3 0 013 3V19z"
        fill="#2EB67D"
      />
      <path
        d="M24.5 29a3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3v-3h3zm0-1.5a3 3 0 01-3-3 3 3 0 013-3h7.5a3 3 0 013 3 3 3 0 01-3 3h-7.5z"
        fill="#ECB22E"
      />
    </svg>
  );
}

export function ZapierIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 6L38 20H28v8h10l-14 14-14-14h10v-8H10L24 6z"
        fill="#FF4A00"
      />
    </svg>
  );
}

export function HubSpotIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="18" fill="#FF7A59" />
      <path
        d="M24 12v24M12 24h24M18 18l12 12M18 30l12-12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StripeIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="8" fill="#635BFF" />
      <path
        d="M22 18c0-1.5 1.2-2.2 3-2.2 2.6 0 5.9.8 8.5 2.2V11c-2.8-1.2-5.6-1.7-8.5-1.7-7 0-11.6 3.6-11.6 9.7 0 9.5 13 8 13 12.1 0 1.6-1.4 2.1-3.3 2.1-2.9 0-6.6-1.2-9.5-2.8V37c3.1 1.4 6.2 2 9.5 2 7.1 0 12-3.5 12-9.7 0-10.2-13-8.4-13-12.3z"
        fill="white"
      />
    </svg>
  );
}

export function SalesforceIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <path
        d="M20 14a6 6 0 00-9 5.2 5.5 5.5 0 00.5 10.8h15a5.5 5.5 0 001.5-10.8 7 7 0 00-8-5.2z"
        fill="#00A1E0"
      />
      <path d="M18 20a4 4 0 108 0 4 4 0 00-8 0z" fill="#032E61" />
    </svg>
  );
}

export function MailchimpIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="18" fill="#FFE01B" />
      <path
        d="M24 10c-2 0-4 1-5 2.5-1-1-2.5-1.5-4-1.5a8 8 0 108 16c1 0 2-.5 3-1a6 6 0 006-6c0-4-3.5-8-8-10z"
        fill="#241C15"
      />
    </svg>
  );
}

export function PipedriveIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="8" fill="#000000" />
      <path
        d="M15 20h6v13h-6V20zm8-5h6v18h-6V15zm8 8h6v10h-6V23z"
        fill="white"
      />
    </svg>
  );
}
