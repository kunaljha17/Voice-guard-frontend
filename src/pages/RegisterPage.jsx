import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const { signUp, authError, clearAuthError, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await signUp(name, email, password);
      navigate('/');
    } catch (_) {
      // Error set in context
    } finally {
      setSubmitting(false);
    }
  };

  const error = localError || authError;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="material-symbols-outlined text-28">person_add</span>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Register to start detecting deepfake voice clones</p>

        {error && (
          <div className="auth-error" style={{ marginBottom: '1rem' }}>
            <span className="material-symbols-outlined text-16">error</span>
            <span>{error}</span>
            <button onClick={() => { setLocalError(''); clearAuthError(); }} style={{ marginLeft: 'auto', color: 'inherit', fontSize: '14px', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              className="input-field"
              type="text"
              placeholder="Dr. Sarah Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
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
            <label className="auth-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="input-field"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              className="input-field"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-18">how_to_reg</span>
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
