import React, { useState, useEffect, useRef } from 'react';

export const ScanningScreen = ({
  filename = 'incoming_call_record_89.wav',
  duration = '0:24',
  onNavigate,
  onScanComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(1); // 1, 2, 3, 4
  const [liveFreq, setLiveFreq] = useState(44100);
  const [activeFrames, setActiveFrames] = useState(128);

  const isCompletedRef = useRef(false);

  useEffect(() => {
    // Smooth, organic progress progression over ~3.2 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (!isCompletedRef.current) {
            isCompletedRef.current = true;
            setTimeout(() => {
              onScanComplete();
            }, 400);
          }
          return 100;
        }

        // Variable speed curve: quick initial ingest, steady neural extraction, final seal
        let increment = 2;
        if (prev < 25) {
          increment = 3;
          setCurrentPhase(1);
        } else if (prev < 55) {
          increment = 2;
          setCurrentPhase(2);
        } else if (prev < 85) {
          increment = 2;
          setCurrentPhase(3);
        } else {
          increment = 3;
          setCurrentPhase(4);
        }

        // Dynamic telemetry flicker
        setLiveFreq(44100 + Math.floor(Math.random() * 200) - 100);
        setActiveFrames((f) => Math.min(1420, f + Math.floor(Math.random() * 30) + 10));

        return Math.min(100, prev + increment);
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onScanComplete]);

  const handleSkip = () => {
    if (!isCompletedRef.current) {
      isCompletedRef.current = true;
      onScanComplete();
    }
  };

  return (
    <div className="flex flex-col w-full pb-10 px-3 sm:px-4 max-w-5xl mx-auto">
      {/* Top Meta info */}
      <div className="flex flex-col items-center text-center mt-2 mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-elevated text-info text-10 font-semibold mb-2 shadow-sm border border-subtle">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span className="tracking-widest uppercase font-mono">Deepfake Audio Inspection</span>
        </div>

        <div className="flex items-center gap-1.5 text-secondary font-body-sm text-12">
          <span className="material-symbols-outlined text-16 text-accent">graphic_eq</span>
          <span className="font-mono text-primary truncate max-w-[200px] sm:max-w-xs">{filename}</span>
          <span className="text-muted text-11 font-mono font-medium">({duration})</span>
        </div>
      </div>

      {/* Main Content Layout - 1 col on mobile, 2 cols on tablet/desktop */}
      <div className="responsive-2col-grid">
        {/* Left Column: Futuristic Radar Biometric Stage */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-void border border-subtle relative overflow-hidden shadow-xl">
          <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] mx-auto flex items-center justify-center">
            {/* Ambient Pulse Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#54e98a]/15 via-[#7dd0ff]/20 to-transparent blur-2xl animate-pulse pointer-events-none" />

            {/* Radar Circular Grid & Sweeping Scanner Beam */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 320">
              <defs>
                <linearGradient id="cyan-grad" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#54e98a" />
                  <stop offset="100%" stopColor="#7dd0ff" />
                </linearGradient>
                <linearGradient id="green-grad" x1="0%" x2="100%" y1="100%" y2="0%">
                  <stop offset="0%" stopColor="#7dd0ff" />
                  <stop offset="100%" stopColor="#54e98a" />
                </linearGradient>
                <linearGradient id="beam-grad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#54e98a" stopOpacity="0" />
                  <stop offset="50%" stopColor="#7dd0ff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#54e98a" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              {/* Concentric Guide Rings */}
              <circle
                className="text-[#30353c]/50"
                cx="160"
                cy="160"
                fill="none"
                r="148"
                stroke="currentColor"
                strokeDasharray="4 6"
                strokeWidth="1.5"
              />
              <circle
                className="text-info/25"
                cx="160"
                cy="160"
                fill="none"
                r="126"
                stroke="currentColor"
                strokeWidth="1"
              />
              <circle
                className="text-accent/25"
                cx="160"
                cy="160"
                fill="none"
                r="102"
                stroke="currentColor"
                strokeDasharray="8 8"
                strokeWidth="1.5"
              />

              {/* Animated Rotating Tech Arcs */}
              <circle
                className="radar-ring-clockwise"
                cx="160"
                cy="160"
                fill="none"
                opacity="0.6"
                r="138"
                stroke="url(#cyan-grad)"
                strokeDasharray="50 180"
                strokeWidth="2"
              />
              <circle
                className="radar-ring-counter"
                cx="160"
                cy="160"
                fill="none"
                opacity="0.75"
                r="114"
                stroke="url(#green-grad)"
                strokeDasharray="30 140"
                strokeWidth="2.5"
              />

              {/* Crosshair Target Ticks */}
              <line stroke="#7dd0ff" strokeLinecap="round" strokeWidth="2" x1="160" x2="160" y1="12" y2="28" />
              <line stroke="#7dd0ff" strokeLinecap="round" strokeWidth="2" x1="160" x2="160" y1="292" y2="308" />
              <line stroke="#7dd0ff" strokeLinecap="round" strokeWidth="2" x1="12" x2="28" y1="160" y2="160" />
              <line stroke="#7dd0ff" strokeLinecap="round" strokeWidth="2" x1="292" x2="308" y1="160" y2="160" />

              {/* Continuous Sweeping Radar Beam */}
              <g className="radar-sweep">
                <path d="M 160 160 L 260 110 A 115 115 0 0 0 160 45 Z" fill="url(#beam-grad)" />
                <line opacity="0.95" stroke="#54e98a" strokeLinecap="round" strokeWidth="2" x1="160" x2="260" y1="160" y2="110" />
              </g>
            </svg>

            {/* Center Waveform Capsule */}
            <div className="relative w-36 sm:w-40 h-36 sm:h-40 rounded-full bg-surface shadow-[0_0_40px_rgba(84,233,138,0.25)] flex items-center justify-center p-3 border border-subtle z-10">
              <div className="w-full h-full rounded-full bg-void flex items-center justify-center gap-1.5 px-3 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-[#7dd0ff]/10 via-transparent to-[#54e98a]/10 pointer-events-none" />

                {/* Animated Equalizer Wave Bars */}
                <div className="w-1.5 rounded-full bg-[#7dd0ff]/70 wave-bar wave-bar-1 h-8" />
                <div className="w-1.5 rounded-full bg-[#7dd0ff] wave-bar wave-bar-2 h-14" />
                <div className="w-1.5 rounded-full bg-[#6bfe9c] wave-bar wave-bar-3 h-20" />
                <div className="w-2 rounded-full bg-accent shadow-[0_0_12px_#54e98a] wave-bar wave-bar-4 h-28" />
                <div className="w-1.5 rounded-full bg-[#7dd0ff] wave-bar wave-bar-5 h-22" />
                <div className="w-1.5 rounded-full bg-[#7dd0ff]/80 wave-bar wave-bar-6 h-12" />
                <div className="w-1.5 rounded-full bg-[#7dd0ff]/60 wave-bar wave-bar-7 h-6" />

                <div className="absolute bottom-2.5 flex items-center gap-1 text-9 font-mono uppercase tracking-widest text-accent font-semibold">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                  Wav2Vec2
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Footer */}
          <div className="flex items-center justify-center gap-3 mt-4 text-10 text-secondary font-mono">
            <span>Sampling: {liveFreq} Hz</span>
            <span>•</span>
            <span>Frames: {activeFrames} / 1420</span>
          </div>
        </div>

        {/* Right Column: Acoustic Pipeline & Progress */}
        <div className="flex flex-col space-y-3.5">
          {/* Acoustic Pipeline Card */}
          <div className="bg-surface rounded-xl p-4 sm:p-5 shadow-md border border-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label-sm text-10 sm:text-11 text-secondary uppercase tracking-wider font-semibold font-mono">
                Acoustic Pipeline
              </span>
              <span className="font-label-sm text-11 sm:text-12 text-accent flex items-center gap-1 font-semibold font-mono">
                <span className="material-symbols-outlined text-14 animate-spin">sync</span>
                Phase {Math.min(currentPhase, 4)} of 4
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    progress >= 25
                      ? 'bg-accent/20 text-accent'
                      : 'bg-info/20 text-info animate-pulse'
                  }`}
                >
                  <span className="material-symbols-outlined text-14">
                    {progress >= 25 ? 'check' : 'sync'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-sm text-12 text-primary font-medium truncate">
                    Audio decoded &amp; normalized
                  </p>
                  <p className="font-label-sm text-10 text-secondary">
                    48 kHz stereo PCM • zero-jitter buffer
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    progress >= 55
                      ? 'bg-accent/20 text-accent'
                      : progress >= 25
                      ? 'bg-info/20 text-info animate-pulse'
                      : 'bg-elevated text-muted'
                  }`}
                >
                  <span className="material-symbols-outlined text-14">
                    {progress >= 55 ? 'check' : progress >= 25 ? 'sync' : 'radio_button_unchecked'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-sm text-12 text-primary font-medium truncate">
                    Mel-spectrogram &amp; prosody extracted
                  </p>
                  <p className="font-label-sm text-10 text-secondary">
                    128 Mel bands • temporal envelope mapped
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                  currentPhase === 3
                    ? 'bg-elevated/80 border border-accent-20'
                    : 'bg-transparent'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    progress >= 85
                      ? 'bg-accent/20 text-accent'
                      : progress >= 55
                      ? 'bg-info/20 text-info animate-pulse'
                      : 'bg-elevated text-muted'
                  }`}
                >
                  <span className="material-symbols-outlined text-14">
                    {progress >= 85 ? 'check' : progress >= 55 ? 'bolt' : 'radio_button_unchecked'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-body-sm text-12 text-info font-semibold">
                      Neural vocoder artifact classifier
                    </p>
                    {currentPhase === 3 && (
                      <span className="flex gap-0.5 text-info">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7dd0ff] animate-bounce-dot" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7dd0ff] animate-bounce-dot" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7dd0ff] animate-bounce-dot" />
                      </span>
                    )}
                  </div>
                  <p className="font-label-sm text-10 text-secondary mt-0.5">
                    Wav2Vec2 latent representation check
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div
                className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                  currentPhase >= 4
                    ? 'bg-elevated/80 border border-accent-30'
                    : 'opacity-60'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    progress >= 100
                      ? 'bg-accent/20 text-accent'
                      : 'bg-elevated-hover text-muted'
                  }`}
                >
                  <span className="material-symbols-outlined text-14">
                    {progress >= 100 ? 'check' : 'radio_button_unchecked'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-sm text-12 text-primary font-medium truncate">
                    Finalizing forensic confidence score
                  </p>
                  <p className="font-label-sm text-10 text-muted">
                    Weight aggregation &amp; report seal
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-surface rounded-xl p-4 shadow-md border border-subtle">
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-label-md text-13 text-primary font-semibold tracking-wide">
                Analysis Progress
              </span>
              <span className="font-label-sm text-11 text-info font-medium font-mono">
                {progress}% complete
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-void overflow-hidden p-0.5 border border-subtle">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#54e98a] via-[#7dd0ff] to-[#6bfe9c] shadow-[0_0_12px_#54e98a] transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Skip / Immediate View Button */}
          <div>
            <button
              onClick={handleSkip}
              className="w-full py-2.5 rounded-xl bg-surface hover:bg-elevated text-primary font-label-sm text-11 sm:text-12 font-semibold tracking-wider uppercase border border-subtle transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              type="button"
            >
              Skip to Results Immediately →
            </button>
          </div>

          {/* Zero-Knowledge Security Badge */}
          <div>
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-void shadow-sm text-center border border-subtle">
              <span
                className="material-symbols-outlined text-16 text-accent"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              <span className="font-label-sm text-10 text-secondary tracking-wide uppercase font-mono">
                Zero-knowledge private computation
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ScanningScreen;
