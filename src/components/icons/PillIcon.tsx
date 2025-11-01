import React from "react";

type PillIconProps = {
  size?: number;
  className?: string;
};

export default function PillIcon({ size = 16, className }: PillIconProps) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer capsule */}
      <defs>
        <linearGradient id="pill-green" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6EF2A2" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
        <linearGradient id="pill-dark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0B5B3A" />
          <stop offset="100%" stopColor="#063822" />
        </linearGradient>
      </defs>

      {/* Right dark half */}
      <path
        d="M32 6c12.15 0 22 9.85 22 22s-9.85 22-22 22H20C7.85 50  -2 40.15 -2 28S7.85 6 20 6h12z"
        transform="translate(12 6) scale(0.8)"
        fill="url(#pill-dark)"
        stroke="#062E1D"
        strokeWidth="2"
        opacity="0.95"
      />

      {/* Left green half */}
      <path
        d="M26 6H20C7.85 6 -2 15.85 -2 28s9.85 22 22 22h6V6z"
        transform="translate(12 6) scale(0.8)"
        fill="url(#pill-green)"
        stroke="#0E6F46"
        strokeWidth="2"
      />

      {/* Shine */}
      <ellipse cx="22" cy="20" rx="8" ry="4" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}



