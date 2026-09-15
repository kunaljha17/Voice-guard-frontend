import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export const Header = ({
  currentScreen,
  onNavigate,
  showBack = false,
  onBack,
  titleOverride,
}) => {
  const { user, setIsProfileOpen, loading } = useAuth();

  const getScreenLabel = () => {
    if (titleOverride) return titleOverride;
    switch (currentScreen) {
      case 'home': return 'Home';
      case 'scan_record': return 'Live Sentry';
      case 'analyze_upload': return 'File Upload';
      case 'samples': return 'Forensics Lab';
      case 'alerts': return 'History & Alerts';
      case 'scanning_stream': return 'Live Analysis Stream';
      case 'incident_report': return 'Incident Details';
      case 'transcribe': return 'Audio Transcription';
      default: return 'VoiceGuard';
    }
  };

  const isFullTitleHeader =
    currentScreen === 'scanning_stream' || currentScreen === 'incident_report';

  const navLinks = [
    { label: 'Home', screen: 'home', icon: 'home' },
    { label: 'Transcribe', screen: 'transcribe', icon: 'speech_to_text' },
    { label: 'Live Sentry', screen: 'scan_record', icon: 'mic' },
    { label: 'Upload File', screen: 'analyze_upload', icon: 'upload_file' },
    { label: 'Forensics Lab', screen: 'samples', icon: 'grid_view' },
    { label: 'Alerts & Rules', screen: 'alerts', icon: 'notifications' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-void-90 backdrop-blur-2xl border-b border-surface shadow-md">
      <div className="flex justify-between items-center px-4 h-14 sm:h-16 w-full max-w-7xl mx-auto pt-safe">
        {/* Left: Back button + Brand */}
        <div className="flex items-center gap-2">
          {showBack ? (
            <button
              onClick={onBack || (() => onNavigate('home'))}
              aria-label="Go back"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-surface hover:bg-elevated text-primary transition-all active:scale-90 cursor-pointer border border-subtle"
            >
              <span className="material-symbols-outlined text-20">arrow_back</span>
            </button>
          ) : (
            <div
              className="w-9 h-9 rounded-xl bg-accent-10 border border-accent-20 flex items-center justify-center text-accent drop-shadow-accent select-none cursor-pointer"
              onClick={() => onNavigate('home')}
            >
              <span className="material-symbols-outlined text-20">shield</span>
            </div>
          )}

          <div
            className="flex items-center gap-1.5 cursor-pointer select-none"
            onClick={() => onNavigate('home')}
          >
            {isFullTitleHeader ? (
              <div className="flex items-center gap-2">
                <h1 className="font-headline-sm text-primary font-semibold tracking-tight text-15 sm:text-18">
                  {getScreenLabel()}
                </h1>
                <span className="hidden md:inline-flex font-label-sm bg-surface text-info px-2 py-0.5 rounded-full uppercase tracking-wider text-9 border border-subtle">
                  Deepfake Inspection
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-primary tracking-tight font-bold text-17 sm:text-20">
                  VoiceGuard
                </span>
                <span className="font-label-sm bg-accent-10 text-accent px-1.5 py-0.5 rounded text-9 font-bold font-mono border border-accent-20">
                  AI
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Bar (Visible on md and above) */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-90 p-1 rounded-full border border-subtle shadow-inner">
          {navLinks.map((item) => {
            const isActive =
              currentScreen === item.screen ||
              (item.screen === 'scan_record' &&
                (currentScreen === 'scan_record' || currentScreen === 'scanning_stream')) ||
              (item.screen === 'alerts' && currentScreen === 'incident_report');

            return (
              <button
                key={item.screen}
                onClick={() => onNavigate(item.screen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-11 font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-elevated text-accent font-semibold shadow-sm'
                    : 'text-secondary hover:text-primary hover:bg-white-5'
                }`}
              >
                <span className="material-symbols-outlined text-16">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Telemetry pill & Profile */}
        <div className="flex items-center gap-2">
          {/* Desktop status pill */}
          <div className="hidden lg:flex items-center gap-2 bg-surface px-3 py-1 rounded-full border border-subtle">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <span className="font-label-sm text-11 text-primary font-medium font-mono">
              SpectralNeural v4.2
            </span>
          </div>

          {/* Mobile: Screen label */}
          {!isFullTitleHeader && (
            <span className="font-label-md text-11 text-secondary md:hidden">
              {getScreenLabel()}
            </span>
          )}

          {/* Profile / Avatar Button */}
          {user ? (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-surface hover:bg-elevated border border-subtle transition-all cursor-pointer group"
              title={`${user.name || 'User'} (${user.email}) - View Profile`}
              aria-label="User Profile"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-accent text-xs font-bold font-mono ring-accent">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full ring-2 ring-void" />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-label-md text-11 text-primary font-semibold leading-tight group-hover:text-white max-w-[100px] truncate">
                  {user.name?.split(' ')[0] || 'Investigator'}
                </span>
                <span className="font-label-sm text-9 text-accent font-mono leading-none">
                  JWT Synced
                </span>
              </div>
            </button>
          ) : (
            <a
              href="/login"
              className="btn-primary text-11 px-3 py-1 rounded-full flex items-center gap-1"
              style={{ textDecoration: 'none' }}
            >
              <span className="material-symbols-outlined text-14">login</span>
              <span>Sign In</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
