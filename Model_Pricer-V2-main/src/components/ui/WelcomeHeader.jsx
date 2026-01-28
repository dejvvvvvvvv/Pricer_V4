import React from 'react';

const WelcomeHeader = ({ name, subtitle }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-foreground">
        Vítejte zpět, {name}!
      </h1>
      <p className="text-lg text-muted-foreground mt-2">
        {subtitle}
      </p>
    </div>
  );
};

export default WelcomeHeader;
