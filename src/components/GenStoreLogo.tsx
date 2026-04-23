import React from 'react';

interface GenStoreLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  /** 'gradient' renders gradient text (default), 'light' renders white text for dark backgrounds */
  textVariant?: 'gradient' | 'light';
}

export function GenStoreLogo({
  size = 40,
  className = '',
  showText = false,
  textClassName = '',
  textVariant = 'gradient',
}: GenStoreLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="GenStore logo"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="gs-bag" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="gs-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <linearGradient id="gs-shine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Rounded-square background */}
        <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#gs-bag)" />

        {/* Subtle shine overlay */}
        <rect x="2" y="2" width="60" height="30" rx="16" fill="url(#gs-shine)" />

        {/* Shopping bag body */}
        <path
          d="M16 24h32l-3 22a3 3 0 01-3 2.8H22a3 3 0 01-3-2.8L16 24z"
          fill="rgba(255,255,255,0.15)"
          stroke="white"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Bag handle */}
        <path
          d="M24 24v-4a8 8 0 1116 0v4"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Letter G integrated inside the bag */}
        <path
          d="M37.5 33.5a7 7 0 10-1 7h-4.5v-3h7v3a10.5 10.5 0 11 1.5-10"
          fill="none"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <span
          className={`font-bold ${
            textVariant === 'light'
              ? 'text-white'
              : 'bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent'
          } ${textClassName}`}
          style={{ fontSize: size * 0.55 }}
        >
          GenStore
        </span>
      )}
    </span>
  );
}
