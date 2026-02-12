import React from 'react';

export default function ForgeHeroUnderline({ className = '' }) {
  return (
    <svg
      className={`forge-hero-underline ${className}`}
      viewBox="0 0 280 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {/* Layer 1 — wide, low opacity */}
      <path
        d="M4 11C30 5 60 13 90 8C120 3 150 12 180 7C210 3 240 10 276 6"
        stroke="var(--forge-accent-primary, #00D4AA)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
        className="forge-underline-stroke forge-underline-stroke-1"
      />
      {/* Layer 2 — medium */}
      <path
        d="M8 9C35 4 65 12 95 7C125 2 155 11 185 6C215 2 245 9 272 5"
        stroke="var(--forge-accent-primary, #00D4AA)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
        className="forge-underline-stroke forge-underline-stroke-2"
      />
      {/* Layer 3 — sharp, high opacity */}
      <path
        d="M6 10C32 4.5 62 12.5 92 7.5C122 2.5 152 11.5 182 6.5C212 2 242 9.5 274 5.5"
        stroke="var(--forge-accent-primary, #00D4AA)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
        className="forge-underline-stroke forge-underline-stroke-3"
      />
    </svg>
  );
}
