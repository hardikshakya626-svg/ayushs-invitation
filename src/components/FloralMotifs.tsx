import React from 'react';

// Neoclassical Palace Arch Silhouette Header Motif
export function PalaceArchSilhouette({ className = "w-full max-w-lg h-24 text-[#D4A5A5]" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 500 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Classical Roman/Palladian Arch Line Art */}
      <path 
        d="M50 95V45C50 20 150 5 250 5C350 5 450 20 450 45V95" 
        stroke="currentColor" 
        strokeWidth="0.8" 
        strokeDasharray="2 3"
        opacity="0.4"
      />
      <path 
        d="M70 95V50C70 28 150 15 250 15C350 15 430 28 430 50V95" 
        stroke="currentColor" 
        strokeWidth="0.8" 
        opacity="0.55"
      />
      
      {/* Central Keystones / Rose Bloom */}
      <circle cx="250" cy="15" r="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="250" cy="15" r="1.5" fill="currentColor" />
      
      {/* Gentle leaf sprigs along the curve */}
      <path d="M230 18C222 14 218 20 224 22" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
      <path d="M270 18C278 14 282 20 276 22" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// Delicate, ultra-clean line art floral divider in soft rose gold
export function FloralDivider({ className = "w-64 h-8 text-[#C8A97E]" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 360 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <path 
        d="M20 20H140M220 20H340" 
        stroke="currentColor" 
        strokeWidth="0.75" 
        strokeLinecap="round" 
        strokeDasharray="3 3"
        opacity="0.5"
      />
      <circle cx="70" cy="20" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="290" cy="20" r="1.5" fill="currentColor" opacity="0.6" />
      
      {/* Central Botanical Rose Blossom & Sprigs */}
      <g stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Soft Blooming Petals */}
        <path d="M180 8C175 14 175 24 180 30C185 24 185 14 180 8Z" fill="currentColor" fillOpacity="0.12" />
        <path d="M180 30C172 26 166 18 170 11C176 15 179 22 180 30Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M180 30C188 26 194 18 190 11C184 15 181 22 180 30Z" fill="currentColor" fillOpacity="0.08" />
        
        {/* Outstretched leafy tendrils */}
        <path d="M164 20C154 18 146 22 140 19" />
        <path d="M196 20C206 18 214 22 220 19" />
        <circle cx="140" cy="19" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="220" cy="19" r="1.5" fill="currentColor" opacity="0.6" />

        {/* Delicate bud accents */}
        <path d="M152 16C149 11 155 10 156 15" fill="currentColor" fillOpacity="0.15" />
        <path d="M208 16C211 11 205 10 204 15" fill="currentColor" fillOpacity="0.15" />
      </g>
    </svg>
  );
}

// Soft botanical corner floral for family invitation & cards
export function CornerFloral({ 
  position = "top-left", 
  className = "w-16 h-16 text-[#C8A97E]" 
}: { 
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}) {
  const rotation = {
    "top-left": "rotate-0",
    "top-right": "rotate-90",
    "bottom-right": "rotate-180",
    "bottom-left": "-rotate-90"
  }[position];

  return (
    <svg 
      viewBox="0 0 80 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${className} ${rotation} transition-transform pointer-events-none`}
    >
      <g stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round">
        {/* Hairline double frame corner */}
        <path d="M4 76V18C4 10 10 4 18 4H76" opacity="0.4" />
        
        {/* Blossom spray */}
        <circle cx="22" cy="22" r="6" fill="currentColor" fillOpacity="0.15" />
        <path d="M22 16C19 19 19 25 22 28C25 25 25 19 22 16Z" fill="currentColor" fillOpacity="0.25" />
        <circle cx="22" cy="22" r="2" fill="currentColor" />

        {/* Soft foliage vines */}
        <path d="M22 16C20 10 26 6 32 10" />
        <path d="M16 22C10 20 6 26 10 32" />
        <circle cx="4" cy="4" r="1.5" fill="currentColor" opacity="0.6" />
      </g>
    </svg>
  );
}

// Minimal auspicious Lord Ganesh line art motif
export function GaneshMotif({ className = "w-14 h-14 text-[#C8A97E]" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <span className="font-cinzel text-[10px] uppercase tracking-[0.35em] text-[#C8A97E] font-semibold">
        ॥ श्री गणेशाय नमः ॥
      </span>
      <svg 
        viewBox="0 0 60 60" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-9 h-9 mt-1.5 text-[#C8A97E]"
      >
        <g stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" strokeLinejoin="round">
          {/* Stylized Lord Ganesha line outline */}
          <path d="M30 12C25 12 21 16 21 21C21 28 28 30 30 38C32 44 27 48 24 48" />
          <path d="M30 21C34 21 37 24 37 28C37 34 32 36 30 38" />
          <circle cx="30" cy="16" r="1.2" fill="currentColor" />
          {/* Tilak */}
          <path d="M28 8V12M32 8V12M25 10H35" strokeWidth="0.75" />
          {/* Modak */}
          <circle cx="38" cy="38" r="1.8" fill="currentColor" fillOpacity="0.3" />
        </g>
      </svg>
    </div>
  );
}
