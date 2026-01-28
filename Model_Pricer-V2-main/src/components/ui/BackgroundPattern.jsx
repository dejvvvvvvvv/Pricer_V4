import React from 'react';

const BackgroundPattern = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'white',
          backgroundImage: 'radial-gradient(125% 125% at 50% 10%, #e3e6f0 35%, rgba(89, 39, 226, 1) 100%)'
        }}
      />
    </div>
  );
};

export default BackgroundPattern;
