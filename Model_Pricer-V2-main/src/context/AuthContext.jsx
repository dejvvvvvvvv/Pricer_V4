import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // <<< důležité

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // volitelně dotáhnout profil z Firestore
          const ref = doc(db, 'users', user.uid);
          const snap = await getDoc(ref).catch(() => null);
          setCurrentUser(snap?.exists() ? { ...user, ...snap.data() } : user);
        } else {
          setCurrentUser(null);
        }
      } finally {
        setLoading(false); // <<< nastavujeme až po vyřešení callbacku
      }
    });

    return () => unsubscribe();
  }, []);

  const value = { currentUser, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
