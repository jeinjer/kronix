import React, { createContext, useContext } from 'react';
import { useAuthController } from './auth/useAuthController';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider />');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const value = useAuthController();

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
