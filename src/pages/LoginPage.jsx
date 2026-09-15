import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { signIn, authError, clearAuthError, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (_) {
      // Error set in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="material-symbols-outlined text-28">shield</span>
        </div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to VoiceGuard AI to access your forensic dashboard</p>

        {authError && (
          <div className="auth-error" style={{ marginBottom: '1rem' }}>
            <span className="material-symbols-outlined text-16">error</span>
            <span>{authError}</span>
            <button onClick={clearAuthError} style={{ marginLeft: 'auto', color: 'inherit', fontSize: '14px', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              className="input-field"
              type="email"
              placeholder="analyst@voiceguard.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting || loading}
            style={{ marginTop: '0.5rem', padding: '0.875rem' }}
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-18 animate-spin">progress_activity</span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-18">login</span>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};
