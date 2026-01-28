import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Dokud nevíme, jestli je user přihlášen, NIKAM nepřesměrovávat
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Načítání…
      </div>
    );
  }

  // Po načtení stavů rozhodni
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
