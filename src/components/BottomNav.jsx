import React from 'react';

export const BottomNav = ({
  currentScreen,
  onNavigate,
  hasUnreadAlert = true,
}) => {
  const isHome = currentScreen === 'home';
  const isTranscribe = currentScreen === 'transcribe';
  const isScan =
    currentScreen === 'scan_record' ||
    currentScreen === 'analyze_upload' ||
    currentScreen === 'scanning_stream';
  const isSamples = currentScreen === 'samples';
  const isAlerts = currentScreen === 'alerts' || currentScreen === 'incident_report';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-void-90 backdrop-blur-2xl border-t border-surface shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
      <div className="max-w-[480px] mx-auto flex items-center justify-around h-16 px-3 pb-safe relative">
        {/* Tab 1: Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer relative ${
            isHome ? 'text-accent font-semibold' : 'text-secondary hover:text-primary'
          }`}
          aria-label="Navigate to Home"
        >
          <span className={`material-symbols-outlined text-22 transition-transform ${isHome ? 'scale-110' : ''}`}>
            home
          </span>
          <span className="font-label-sm text-10 mt-0.5 tracking-tight">Home</span>
          <span
            className={`w-1 h-1 bg-accent rounded-full mt-0.5 transition-all duration-200 ${
              isHome ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          />
        </button>

        {/* Tab 2: Transcribe */}
        <button
          onClick={() => onNavigate('transcribe')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer relative ${
            isTranscribe ? 'text-accent font-semibold' : 'text-secondary hover:text-primary'
          }`}
          aria-label="Navigate to Transcribe"
        >
          <span className={`material-symbols-outlined text-22 transition-transform ${isTranscribe ? 'scale-110' : ''}`}>
            speech_to_text
          </span>
          <span className="font-label-sm text-10 mt-0.5 tracking-tight">Transcribe</span>
          <span
            className={`w-1 h-1 bg-accent rounded-full mt-0.5 transition-all duration-200 ${
              isTranscribe ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          />
        </button>

        {/* Tab 3: Center Elevated Floating Action Button (Live Sentry / Scan) */}
        <div className="flex-1 flex justify-center items-center -mt-5">
          <button
            onClick={() => onNavigate('scan_record')}
            className="group relative flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer"
            aria-label="Activate Live Sentry Scan"
          >
            {/* Outer Glow Halo */}
            <div
              className={`absolute -inset-1 rounded-full blur-md transition-opacity duration-300 ${
                isScan ? 'bg-accent opacity-60' : 'bg-accent opacity-25 group-hover:opacity-45'
              }`}
            />

            {/* Elevated Circular Core */}
            <div
              className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 shadow-xl ${
                isScan
                  ? 'bg-accent text-white border-white/40 shadow-glow'
                  : 'bg-elevated text-accent border-accent-30 hover:border-accent'
              }`}
              style={{
                boxShadow: isScan
                  ? '0 0 20px rgba(91, 124, 255, 0.6)'
                  : '0 4px 14px rgba(0, 0, 0, 0.5)',
              }}
            >
              <span className="material-symbols-outlined text-24">mic</span>
            </div>

            <span
              className={`font-label-sm text-10 mt-1 font-semibold tracking-tight ${
                isScan ? 'text-accent' : 'text-secondary'
              }`}
            >
              Sentry
            </span>
          </button>
        </div>

        {/* Tab 4: Samples / Forensics Lab */}
        <button
          onClick={() => onNavigate('samples')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer relative ${
            isSamples ? 'text-accent font-semibold' : 'text-secondary hover:text-primary'
          }`}
          aria-label="Navigate to Forensics Lab"
        >
          <span className={`material-symbols-outlined text-22 transition-transform ${isSamples ? 'scale-110' : ''}`}>
            grid_view
          </span>
          <span className="font-label-sm text-10 mt-0.5 tracking-tight">Forensics</span>
          <span
            className={`w-1 h-1 bg-accent rounded-full mt-0.5 transition-all duration-200 ${
              isSamples ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          />
        </button>

        {/* Tab 5: Alerts & History */}
        <button
          onClick={() => onNavigate('alerts')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer relative ${
            isAlerts ? 'text-accent font-semibold' : 'text-secondary hover:text-primary'
          }`}
          aria-label="Navigate to Alerts"
        >
          <div className="relative flex items-center justify-center">
            <span className={`material-symbols-outlined text-22 transition-transform ${isAlerts ? 'scale-110' : ''}`}>
              notifications
            </span>
            {hasUnreadAlert && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-error rounded-full ring-2 ring-void animate-pulse" />
            )}
          </div>
          <span className="font-label-sm text-10 mt-0.5 tracking-tight">Alerts</span>
          <span
            className={`w-1 h-1 bg-accent rounded-full mt-0.5 transition-all duration-200 ${
              isAlerts ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          />
        </button>
      </div>
    </nav>
  );
};
