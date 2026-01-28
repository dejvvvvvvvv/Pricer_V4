import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';

// Locations with coordinates adjusted for a standard Mercator/Miller projection SVG
const locations = [
  { id: 1, x: 21, y: 38, name: 'San Francisco', users: 120, flag: '🇺🇸' },
  { id: 2, x: 28, y: 36, name: 'New York', users: 340, flag: '🇺🇸' },
  { id: 3, x: 49, y: 26, name: 'London', users: 560, flag: '🇬🇧' },
  { id: 4, x: 53, y: 30, name: 'Prague', users: 890, flag: '🇨🇿' },
  { id: 5, x: 54, y: 32, name: 'Vienna', users: 210, flag: '🇦🇹' },
  { id: 6, x: 86, y: 38, name: 'Tokyo', users: 450, flag: '🇯🇵' },
  { id: 7, x: 88, y: 75, name: 'Sydney', users: 180, flag: '🇦🇺' },
  { id: 8, x: 32, y: 70, name: 'São Paulo', users: 230, flag: '🇧🇷' },
  { id: 9, x: 54, y: 72, name: 'Cape Town', users: 140, flag: '🇿🇦' },
];

export default function InteractiveWorldMap() {
  const [activePoint, setActivePoint] = useState(null);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="relative w-full aspect-[2/1] rounded-3xl overflow-visible group">
        
        {/* World Map SVG - High fidelity silhouette style */}
        <div className="absolute inset-0 flex items-center justify-center">
            {/* 
                Simplified yet accurate World Map Path 
                Style: Solid dark silhouette (slate-800) to match the reference "physical map" look
            */}
            <svg 
                viewBox="0 0 1000 500" 
                className="w-full h-full drop-shadow-xl filter"
                style={{ filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.15))' }} // Floating 3D effect
            >
                <g fill="#1e293b" stroke="none"> {/* slate-800 */}
                    {/* North America */}
                    <path d="M150,40 L180,45 L220,30 L300,30 L350,20 L380,40 L350,90 L320,110 L280,105 L260,130 L280,160 L260,200 L230,220 L210,190 L180,180 L150,140 L120,100 L110,70 L130,50 Z M190,60 L210,70 L200,90 L180,80 Z" />
                    <path d="M100,50 L140,40 L150,60 L120,80 L90,60 Z" /> {/* Alaska approx */}
                    <path d="M280,30 L350,15 L380,30 L340,60 L300,40 Z" /> {/* Greenland approx */}
                    
                    {/* South America */}
                    <path d="M260,230 L300,230 L330,260 L350,300 L320,380 L300,420 L280,440 L260,390 L240,320 L250,260 Z" />
                    
                    {/* Europe */}
                    <path d="M460,130 L490,120 L510,100 L530,110 L540,140 L520,160 L500,160 L480,155 L470,145 L460,150 L450,140 Z" />
                    <path d="M440,110 L460,115 L455,140 L440,130 Z" /> {/* UK */}
                    
                    {/* Africa */}
                    <path d="M460,170 L520,170 L550,190 L560,230 L580,260 L550,340 L520,360 L480,300 L450,250 L440,200 Z" />
                    <path d="M570,300 L590,300 L585,340 L570,330 Z" /> {/* Madagascar */}

                    {/* Asia / Eurasia */}
                    <path d="M530,110 L580,100 L650,90 L750,90 L850,100 L880,140 L850,180 L820,220 L750,240 L700,200 L660,230 L620,200 L580,170 L550,150 Z" />
                    <path d="M850,150 L870,150 L860,190 L850,180 Z" /> {/* Japan */}
                    <path d="M750,260 L780,270 L760,300 L730,280 Z" /> {/* SE Asia Islands approx */}
                    <path d="M800,280 L840,280 L820,310 Z" /> {/* Indonesia approx */}

                    {/* Australia */}
                    <path d="M800,350 L880,340 L900,380 L860,420 L820,410 L790,380 Z" />
                    <path d="M920,400 L940,410 L930,440 L910,430 Z" /> {/* NZ */}
                </g>
            </svg>
        </div>

        {/* Interactive Pins */}
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="absolute z-10"
            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
          >
            <div className="relative group/pin">
              {/* Pulse Effect - White/Bright to contrast against Dark Map */}
              <div className="absolute -inset-3 bg-white/30 rounded-full animate-ping opacity-75" />
              
              {/* Pin Head */}
              <button 
                className={`relative h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-white shadow-lg transition-all duration-300 ${
                    activePoint === loc.id ? 'bg-blue-500 scale-125' : 'bg-white hover:scale-110 hover:bg-blue-500'
                }`}
                onMouseEnter={() => setActivePoint(loc.id)}
                onMouseLeave={() => setActivePoint(null)}
                aria-label={loc.name}
              />

              {/* Tooltip Card */}
              <AnimatePresence>
                {(activePoint === loc.id) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-20 pointer-events-none"
                  >
                    <div className="bg-slate-900/95 backdrop-blur text-white rounded-xl shadow-2xl p-3 w-40 text-center relative border border-slate-700">
                        {/* Triangle Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                        
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">{loc.flag}</span>
                            <span className="font-bold text-sm">{loc.name}</span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                {loc.users} users
                            </div>
                        </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
        
      </div>
    </div>
  );
}
