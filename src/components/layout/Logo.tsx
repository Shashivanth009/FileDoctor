import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const pixelSizes = { sm: 26, md: 34, lg: 46 };
  const s = pixelSizes[size];

  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group select-none">
      <svg
        width={s}
        height={s}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform group-hover:scale-105 duration-200"
      >
        <rect x="6" y="4" width="30" height="40" rx="6" fill="#1B2942" stroke="#2A3953" strokeWidth="2" />
        <path d="M24 4L36 16H28C25.7909 16 24 14.2091 24 12V4Z" fill="#496BFF" />
        {/* Medical Cross */}
        <rect x="17" y="24" width="12" height="4" rx="2" fill="#48DCC7" />
        <rect x="21" y="20" width="4" height="12" rx="2" fill="#48DCC7" />
        {/* Pulse waveform line at bottom */}
        <path
          d="M10 38H16L18 34L21 42L24 35L26 38H32"
          stroke="#496BFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className={`font-heading font-extrabold tracking-tight ${
          size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-base'
        }`}>
          <span className="text-main-white">File</span>
          <span className="text-electric-blue">Doctor</span>
        </span>
      )}
    </Link>
  );
};

