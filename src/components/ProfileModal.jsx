import React from 'react';
import { useAuth } from '../context/AuthContext';

export const ProfileModal = ({ scansCount, onNavigateToScans }) => {
  const {
    user,
    loading,
    authError,
    signOut,
    isProfileOpen,
    setIsProfileOpen,
    clearAuthError,
  } = useAuth();

  if (!isProfileOpen) return null;

  const displayName = user?.name || 'Investigator';
  const email = user?.email || 'No email associated';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-surface border border-subtle-10 shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle bg-void">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-accent text-20">badge</span>
            <h3 className="font-headline-sm text-16 text-primary font-semibold">
              Investigator Profile
            </h3>
          </div>
          <button
            onClick={() => setIsProfileOpen(false)}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-elevated text-secondary hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-18">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {authError && (
            <div className="p-3 rounded-xl bg-error-20 border border-error-30 text-error-light text-12 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-error text-18 shrink-0">error</span>
                <span className="leading-snug">{authError}</span>
              </div>
              <button onClick={clearAuthError} className="text-error-light hover:text-white text-14 cursor-pointer" style={{ background: 'none', border: 'none' }}>✕</button>
            </div>
          )}

          {user ? (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-void border border-subtle flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-elevated flex items-center justify-center text-accent text-xl font-bold font-mono">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent-dark border-2 flex items-center justify-center"
                    style={{ borderColor: 'var(--void)' }}
                    title="Verified Account"
                  >
                    <span className="material-symbols-outlined text-accent text-12">check</span>
                  </div>
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <h4 className="font-headline-sm text-16 text-primary font-bold truncate">{displayName}</h4>
                  <p className="font-body-sm text-12 text-muted truncate font-mono">{email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="badge badge-accent">JWT Verified</span>
                    <span className="badge" style={{ background: 'rgba(123,154,255,0.1)', color: 'var(--info)', borderColor: 'rgba(123,154,255,0.2)' }}>
                      Secured
                    </span>
                  </div>
                </div>
              </div>

              {/* Database Sync Status */}
              <div className="p-3.5 rounded-xl bg-surface border border-subtle space-y-2">
                <div className="flex items-center justify-between text-11">
                  <span className="text-secondary flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    MongoDB Cloud Persistence
                  </span>
                  <span className="text-accent font-mono font-bold">ACTIVE</span>
                </div>
                <div className="text-11 text-muted font-mono bg-void p-2 rounded-lg border border-subtle space-y-1">
                  <div className="flex justify-between">
                    <span>Database:</span>
                    <span className="text-primary truncate max-w-xs">voiceguard</span>
                  </div>
                  <div className="flex justify-between">
                    <span>User ID:</span>
                    <span className="text-primary truncate max-w-xs">{user.id?.slice(0, 14)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Synced Scans:</span>
                    <span className="text-accent font-bold">{scansCount} Records Persisted</span>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-2 text-12">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-elevated border border-subtle">
                  <span className="text-secondary">Role & Clearance:</span>
                  <span className="text-primary font-semibold">{user.role || 'Forensic Biometric Analyst'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-elevated border border-subtle">
                  <span className="text-secondary">Data Retention:</span>
                  <span className="text-primary font-semibold">Persistent Cloud Storage</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                {onNavigateToScans && (
                  <button
                    onClick={() => { setIsProfileOpen(false); onNavigateToScans(); }}
                    className="btn-surface w-full text-info"
                  >
                    <span className="material-symbols-outlined text-18">query_stats</span>
                    <span>View Cloud Scans Archive ({scansCount})</span>
                  </button>
                )}

                <button
                  onClick={signOut}
                  disabled={loading}
                  className="btn-danger w-full"
                >
                  <span className="material-symbols-outlined text-18">logout</span>
                  <span>Sign Out of VoiceGuard</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-accent-10 border border-accent-30 flex items-center justify-center text-accent">
                <span className="material-symbols-outlined text-32">shield_person</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-headline-sm text-18 text-primary font-bold">Sign In Required</h4>
                <p className="font-body-sm text-12 text-secondary max-w-xs mx-auto">
                  Authenticate to sync your forensic voice scans and settings to the cloud database.
                </p>
              </div>
              <a
                href="/login"
                className="btn-primary w-full inline-flex"
                style={{ textDecoration: 'none' }}
              >
                <span className="material-symbols-outlined text-18">login</span>
                <span>Go to Login</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
