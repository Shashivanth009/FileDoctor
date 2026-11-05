import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const pixelSizes = { sm: 28, md: 36, lg: 48 };
  const s = pixelSizes[size];

  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group select-none">
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Ambient background glow on hover */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-electric-blue/30 via-arctic-mint/20 to-transparent blur-md opacity-40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative transition-transform duration-300 ease-out group-hover:scale-105 group-active:scale-95 drop-shadow-md"
        >
          <defs>
            <linearGradient id="fd-grad-primary" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#496BFF" />
              <stop offset="100%" stopColor="#48DCC7" />
            </linearGradient>

            <linearGradient id="fd-grad-card" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E2D48" />
              <stop offset="100%" stopColor="#121A2C" />
            </linearGradient>

            <linearGradient id="fd-grad-fold" x1="26" y1="4" x2="38" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6382FF" />
              <stop offset="100%" stopColor="#48DCC7" />
            </linearGradient>

            <filter id="fd-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#48DCC7" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Main Document Body with chamfered folded corner */}
          <path
            d="M8 9C8 6.79086 9.79086 5 12 5H27L40 18V39C40 41.2091 38.2091 43 36 43H12C9.79086 43 8 41.2091 8 39V9Z"
            fill="url(#fd-grad-card)"
            stroke="url(#fd-grad-primary)"
            strokeWidth="1.75"
          />

          {/* Top-Right Glowing Folded Ear */}
          <path
            d="M27 5L40 18H31C28.7909 18 27 16.2091 27 14V5Z"
            fill="url(#fd-grad-fold)"
            opacity="0.95"
          />

          {/* Subtle Document Grid Lines */}
          <line x1="14" y1="13" x2="22" y2="13" stroke="#2A3953" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="18" x2="21" y2="18" stroke="#2A3953" strokeWidth="1.5" strokeLinecap="round" />

          {/* Precision Clinic Cross + Vital Pulse Waveform */}
          <g filter="url(#fd-glow)">
            {/* Vertical Pill */}
            <rect x="22" y="22" width="4" height="15" rx="2" fill="#48DCC7" />

            {/* Horizontal Pill & Pulse Hybrid */}
            <path
              d="M13.5 29.5H19L21.2 25.5L24 33.5L26.8 27.5L28.5 29.5H34.5"
              stroke="#F6F8FF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Pulse Anchor Light Dot */}
          <circle cx="35" cy="29.5" r="1.5" fill="#48DCC7" />
        </svg>
      </div>

      {showText && (
        <span className={`font-heading font-extrabold tracking-tight flex items-center ${
          size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-base'
        }`}>
          <span className="text-main-white transition-colors duration-200">File</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-arctic-mint ml-0.5">
            Doctor
          </span>
        </span>
      )}
    </Link>
  );
};
