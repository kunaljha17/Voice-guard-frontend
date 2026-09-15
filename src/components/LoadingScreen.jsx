import React, { useState, useEffect, useRef } from 'react';

const BOOT_STAGES = [
  { threshold: 0, text: 'Initializing VoiceGuard Neural Core...', code: 'BOOT_01' },
  { threshold: 22, text: 'Calibrating Glottal Pulse & Phase Filters...', code: 'FFT_CALIB' },
  { threshold: 50, text: 'Loading Wav2Vec2 Forensic Weights...', code: 'MODEL_LOAD' },
  { threshold: 75, text: 'Arming Impersonation Sentry Radar...', code: 'SENTRY_ARM' },
  { threshold: 94, text: 'All Defense Systems Active & Synchronized.', code: 'SYS_READY' },
];

export const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const isFinishedRef = useRef(false);

  // Keep callback reference updated without triggering effect re-runs
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Total startup time: 2.8 seconds - fast, smooth, non-glitchy
    const startTime = Date.now();
    const duration = 2800;

    const timer = setInterval(() => {
      if (isFinishedRef.current) return;

      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(currentPct);

      if (currentPct >= 100) {
        isFinishedRef.current = true;
        clearInterval(timer);

        // Smooth fade-out sequence
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            if (typeof onCompleteRef.current === 'function') {
              onCompleteRef.current();
            }
          }, 400);
        }, 200);
      }
    }, 25);

    return () => clearInterval(timer);
  }, []); // Strictly run once on mount

  const handleSkip = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      if (typeof onCompleteRef.current === 'function') {
        onCompleteRef.current();
      }
    }, 200);
  };

  const currentStage =
    [...BOOT_STAGES].reverse().find((stage) => progress >= stage.threshold) || BOOT_STAGES[0];

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-between px-5 py-6 sm:py-8 select-none overflow-hidden transition-opacity ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        zIndex: 99999,
        backgroundColor: '#05060B',
        color: '#E9ECF7',
        touchAction: 'none',
        transitionDuration: '400ms',
      }}
    >
      {/* Background Decorative Grid & Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #5B7CFF 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[420px] h-[280px] sm:h-[420px] rounded-full blur-[80px] sm:blur-[110px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(91, 124, 255, 0.2) 0%, transparent 70%)' }}
        />
      </div>

      {/* Top Header: System Status Pill */}
      <div className="relative z-10 w-full max-w-sm flex items-center justify-between pt-safe">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5B7CFF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5B7CFF]" />
          </span>
          <span className="font-mono text-[11px] text-[#5B7CFF] font-semibold tracking-wider">
            VOICEGUARD AI
          </span>
        </div>
        <div className="text-[10px] font-mono text-[#9BA3C2] bg-[#10131F] px-2 py-0.5 rounded-full border border-white/10">
          V2.5 FORENSICS
        </div>
      </div>

      {/* Center Hero: Shield & Biometric Visualizer */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-xs">
        {/* Radar Enclosure */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
          {/* Subtle Concentric Rings */}
          <div className="absolute inset-0 rounded-full border border-[#5B7CFF]/20 animate-ripple-1 pointer-events-none" />
          <div className="absolute inset-0 rounded-full border border-[#5B7CFF]/15 animate-ripple-2 pointer-events-none" />

          {/* Rotating Smooth Accent Arc */}
          <div
            className="absolute inset-1 rounded-full border border-transparent border-t-[#5B7CFF] animate-spin-slow pointer-events-none"
            style={{ borderTopColor: '#5B7CFF' }}
          />

          {/* Core Shield Badge */}
          <div
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#10131F] border border-[#5B7CFF]/40 flex items-center justify-center shadow-xl overflow-hidden"
            style={{
              boxShadow: '0 0 35px rgba(91, 124, 255, 0.25)',
            }}
          >
            {/* Shimmer Sweep Overlay */}
            <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shimmer-sweep" />

            {/* Glowing Pure Vector Shield Icon */}
            <svg
              viewBox="0 0 24 24"
              className="w-10 h-10 sm:w-12 sm:h-12 text-[#5B7CFF] relative z-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(91, 124, 255, 0.15)" />
              <line x1="12" y1="8" x2="12" y2="16" stroke="#E9ECF7" strokeWidth="1.8" />
              <line x1="9" y1="10" x2="9" y2="14" stroke="#5B7CFF" strokeWidth="1.6" />
              <line x1="15" y1="10" x2="15" y2="14" stroke="#5B7CFF" strokeWidth="1.6" />
              <line x1="6.5" y1="11.5" x2="6.5" y2="12.5" stroke="#9BA3C2" strokeWidth="1.4" />
              <line x1="17.5" y1="11.5" x2="17.5" y2="12.5" stroke="#9BA3C2" strokeWidth="1.4" />
            </svg>

            {/* Top Scanning Line */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-[#5B7CFF] animate-pulse" />
          </div>
        </div>

        {/* Live Audio Equalizer Bars (inline-block with GPU transforms) */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-6 mt-4">
          {[
            { delay: '0.0s', height: '12px' },
            { delay: '0.15s', height: '18px' },
            { delay: '0.3s', height: '24px' },
            { delay: '0.1s', height: '26px' },
            { delay: '0.25s', height: '20px' },
            { delay: '0.4s', height: '24px' },
            { delay: '0.2s', height: '16px' },
            { delay: '0.05s', height: '12px' },
          ].map((bar, idx) => (
            <span
              key={idx}
              className="inline-block w-1 rounded-full origin-bottom"
              style={{
                height: bar.height,
                background: 'linear-gradient(to top, #5B7CFF, #8EA6FF)',
                animation: `loadingBarBounce 1s ease-in-out infinite ${bar.delay}`,
              }}
            />
          ))}
        </div>

        {/* App Title */}
        <div className="text-center mt-3 space-y-0.5">
          <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#E9ECF7] flex items-center justify-center gap-1.5">
            <span>VoiceGuard</span>
            <span className="text-[#5B7CFF] font-mono text-[14px] font-bold px-1.5 py-0.2 rounded bg-[#5B7CFF]/10 border border-[#5B7CFF]/30">
              AI
            </span>
          </h1>
          <p className="text-[11px] text-[#9BA3C2] tracking-wider uppercase font-mono">
            Voice Clone &amp; Deepfake Defense
          </p>
        </div>
      </div>

      {/* Bottom Progress Bar & Stage Description */}
      <div className="relative z-10 w-full max-w-sm space-y-2.5 pb-safe">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[11px] text-[#9BA3C2] truncate pr-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B7CFF] shrink-0 animate-ping" />
            <span className="truncate">{currentStage.text}</span>
          </span>
          <span className="text-[#5B7CFF] font-bold shrink-0 text-[12px] font-mono">
            {progress}%
          </span>
        </div>

        {/* Progress Track */}
        <div className="relative h-2 w-full rounded-full bg-[#10131F] border border-white/10 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full transition-all duration-75 ease-out relative overflow-hidden"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #5B7CFF 0%, #7B96FF 100%)',
              boxShadow: '0 0 10px rgba(91, 124, 255, 0.5)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-sweep" />
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7394] pt-0.5">
          <span>● 48 kHz / 24-bit PCM</span>
          <button
            onClick={handleSkip}
            className="text-[#5B7CFF] hover:text-white transition-colors cursor-pointer underline underline-offset-2 font-medium"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
