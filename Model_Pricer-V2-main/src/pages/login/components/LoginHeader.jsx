import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <Link to="/" className="inline-flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center elevation-2">
          <Icon name="Layers3" size={28} color="white" />
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-bold text-foreground">Commun Printing</h1>
          <p className="text-sm text-muted-foreground">3D tiskové služby</p>
        </div>
      </Link>

      {/* Welcome Message */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Vítejte zpět
        </h2>
        <p className="text-muted-foreground">
          Přihlaste se do svého účtu a pokračujte v 3D tisku
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;