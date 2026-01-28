import React from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginForm from './components/LoginForm';

export default function Login() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/customer-dashboard';

  // Pokud už jsem přihlášen, pryč z loginu
  if (!loading && currentUser) {
    return <Navigate to={from} replace />;
  }

  const handleLogin = async ({ email, password }) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login failed:", error);
      // Zde můžete zobrazit chybovou zprávu uživateli
    }
  };

  return <LoginForm handleLogin={handleLogin} />;
}
