import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchMe, loginUser, registerUser } from '../api/client.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // On mount — validate existing JWT token
  useEffect(() => {
    const token = localStorage.getItem('voiceguard_token');
    if (token) {
      fetchMe()
        .then(({ user: profile }) => setUser(profile))
        .catch(() => {
          localStorage.removeItem('voiceguard_token');
          localStorage.removeItem('voiceguard_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Listen for forced logout (401 interceptor)
    const handleLogout = () => {
      setUser(null);
      setIsProfileOpen(false);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const signIn = async (email, password) => {
    setAuthError(null);
    try {
      const { token, user: profile } = await loginUser(email, password);
      localStorage.setItem('voiceguard_token', token);
      localStorage.setItem('voiceguard_user', JSON.stringify(profile));
      setUser(profile);
      return profile;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signUp = async (name, email, password) => {
    setAuthError(null);
    try {
      const { token, user: profile } = await registerUser(name, email, password);
      localStorage.setItem('voiceguard_token', token);
      localStorage.setItem('voiceguard_user', JSON.stringify(profile));
      setUser(profile);
      return profile;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signOut = () => {
    localStorage.removeItem('voiceguard_token');
    localStorage.removeItem('voiceguard_user');
    setUser(null);
    setIsProfileOpen(false);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        signIn,
        signUp,
        signOut,
        isProfileOpen,
        setIsProfileOpen,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
