import React from 'react';
import './GlobalMap.css';

const GlobalMap = () => {
  return (
    <div className="map-container-wrapper">
      <div className="map-container">
        <svg viewBox="0 0 1000 550" className="map-background">
          <rect style={{fill: '#f8fafc'}} width={1000} height={550} />
          
          {/* Simplified World Map Paths (Abstract) */}
          <g transform="translate(0, 50)" style={{fill: '#bfdbfe'}}> {/* blue-200 */}
             {/* North America */}
             <path d="M150,80 Q250,50 320,100 T280,250 T180,220 T100,150 Z" />
             {/* South America */}
             <path d="M280,270 Q350,270 360,350 T320,480 T260,400 T280,270 Z" />
             {/* Eurasia + Africa */}
             <path d="M420,100 Q550,50 750,80 T850,150 T900,250 T800,350 T700,320 T650,450 T520,400 T450,250 T400,200 T420,100 Z" />
             {/* Australia */}
             <path d="M780,400 Q850,380 880,420 T820,480 T780,400 Z" />
              {/* UK */}
              <path d="M450,120 Q470,110 470,140 T450,150 T450,120 Z" />
              {/* Japan */}
              <path d="M860,180 Q880,170 880,210 T860,220 T860,180 Z" />
          </g>
          
        </svg>
        <div className="map-cities">
          {/* New York - approx North America East Coast */}
          <div style={{'--x': 28, '--y': 35}} className="map-city">
            <div className="map-city__label">
              <span data-icon="🗽" className="map-city__sign">New York</span>
            </div>
          </div>
          
          {/* London - UK location */}
          <div style={{'--x': 46, '--y': 28}} className="map-city">
            <div className="map-city__label">
              <span data-icon="💂" className="map-city__sign">London</span>
            </div>
          </div>

          {/* Paris - France location */}
          <div style={{'--x': 49, '--y': 33}} className="map-city">
             <div className="map-city__label">
              <span data-icon="🥖" className="map-city__sign">Paris</span>
            </div>
          </div>

          {/* Berlin - Germany location */}
          <div style={{'--x': 53, '--y': 30}} className="map-city">
            <div className="map-city__label">
              <span data-icon="🥨" className="map-city__sign">Berlin</span>
            </div>
          </div>

          {/* Prague - Central Europe */}
          <div style={{'--x': 55, '--y': 34}} className="map-city">
            <div className="map-city__label">
              <span data-icon="🏰" className="map-city__sign">Prague</span>
            </div>
          </div>

          {/* Tokyo - Japan location */}
          <div style={{'--x': 86, '--y': 38}} className="map-city">
            <div className="map-city__label">
              <span data-icon="🍣" className="map-city__sign">Tokyo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalMap;
