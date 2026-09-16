import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export const HomeScreen = ({ scans, onNavigate, onSelectScan }) => {
  const { user, setIsProfileOpen, loading } = useAuth();
  const [waveHeights, setWaveHeights] = useState([
    45, 65, 30, 80, 95, 60, 40, 75, 90, 55, 35, 70, 50, 85, 40, 60, 30, 50, 72, 44, 88, 52, 38, 68,
  ]);

  // Live fluctuating forensics scope
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveHeights((prev) =>
        prev.map(() => Math.floor(Math.random() * 70) + 25)
      );
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const totalAudited = scans?.length || 0;
  const clonesCount = scans ? scans.filter((s) => s.isSynthetic).length : 0;
  const authenticCount = totalAudited - clonesCount;

  return (
    <div className="flex flex-col w-full space-y-4 sm:space-y-6 pb-6">
      {/* Biometric Status & Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-elevated p-4 sm:p-5 shadow-xl border border-subtle">
        {/* Ambient background glows */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-accent-10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-info-10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-void text-accent border border-accent-20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="font-label-sm text-12 font-medium font-mono">
                Engine: SpectralNeural v4.2 Active
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-info">
                <span className="material-symbols-outlined text-18">verified_user</span>
                <span className="font-label-sm text-11 font-semibold font-mono">91.2% Accuracy</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-accent">
                <span className="material-symbols-outlined text-18">bolt</span>
                <span className="font-label-sm text-11 font-semibold font-mono">&lt; 80ms Latency</span>
              </div>
            </div>
          </div>

          <div className="pt-0.5">
            <h1 className="responsive-headline-hero text-primary font-bold tracking-tight">
              AI Voice Cloning &amp; Deepfake Guard
            </h1>
            <p className="font-body-sm text-13 text-secondary mt-1 max-w-2xl leading-relaxed">
              Real-time spectral analysis and synthesized audio forensics calibrated against 34 generative neural vocoder architectures.
            </p>
          </div>

          {/* Quick Metrics Counter Strip */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
            <div className="bg-surface rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center border border-subtle shadow-sm">
              <span className="font-numeric-metric text-18 sm:text-20 text-primary font-bold">
                {totalAudited}
              </span>
              <span className="font-label-sm text-11 text-secondary uppercase tracking-wider mt-0.5">
                Total Audited
              </span>
            </div>

            <div className="bg-surface rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center border border-subtle shadow-sm">
              <span className="font-numeric-metric text-18 sm:text-20 text-error font-bold">
                {clonesCount}
              </span>
              <span className="font-label-sm text-11 text-error uppercase tracking-wider mt-0.5">
                Clones Stopped
              </span>
            </div>

            <div className="bg-surface rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center border border-subtle shadow-sm">
              <span className="font-numeric-metric text-18 sm:text-20 text-accent font-bold">
                {authenticCount}
              </span>
              <span className="font-label-sm text-11 text-accent uppercase tracking-wider mt-0.5">
                Authentic Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Responsive Split Grid */}
      <div className="responsive-2col-grid mt-4 sm:mt-5">
        {/* Left Column: Inspection Hub Actions */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-label-lg text-14 text-primary font-semibold tracking-wide">
              Inspection Hub
            </span>
            <span className="font-label-sm text-11 text-info flex items-center gap-1 font-medium font-mono">
              <span className="material-symbols-outlined text-14">graphic_eq</span> Ready
            </span>
          </div>

          {/* Action Cards Grid with Uniform Spacing & Height */}
          <div className="grid grid-cols-1 gap-3">
            {/* Live Recording Primary Callout Card */}
            <div
              onClick={() => onNavigate('scan_record')}
              className="group relative overflow-hidden rounded-2xl bg-surface p-4 sm:p-5 transition-all duration-200 active:scale-[0.99] shadow-md hover:bg-elevated border border-subtle cursor-pointer"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-accent-10 text-accent border border-accent-20 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-22" aria-hidden="true">mic</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-15 sm:text-16 text-primary font-bold">
                        Start Live Sentry
                      </span>
                      <span className="font-label-sm text-11 px-2 py-0.5 rounded-full bg-accent-20 text-accent font-semibold uppercase font-mono">
                        Instant
                      </span>
                    </div>
                    <span className="font-body-sm text-12 sm:text-13 text-secondary mt-0.5 truncate">
                      Real-time mic stream listener with live waveform phase audit
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-accent text-22 sm:text-24 transition-transform group-hover:translate-x-1 shrink-0 ml-2">
                  chevron_right
                </span>
              </div>
            </div>

            {/* Audio Transcription Card */}
            <div
              onClick={() => onNavigate('transcribe')}
              className="group relative overflow-hidden rounded-2xl bg-surface p-4 sm:p-5 transition-all duration-200 active:scale-[0.99] shadow-md hover:bg-elevated border border-subtle cursor-pointer"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#003919] text-accent border border-[#54e98a]/40 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-22" aria-hidden="true">speech_to_text</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-15 sm:text-16 text-primary font-bold">
                        Transcribe Audio
                      </span>
                      <span className="font-label-sm text-11 px-2 py-0.5 rounded-full bg-accent-20 text-accent font-semibold uppercase font-mono">
                        gemini-3.5-transcribe
                      </span>
                    </div>
                    <span className="font-body-sm text-12 sm:text-13 text-secondary mt-0.5 truncate">
                      Input microphone speech to generate verbatim text transcription
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-accent text-22 sm:text-24 transition-transform group-hover:translate-x-1 shrink-0 ml-2">
                  chevron_right
                </span>
              </div>
            </div>

            {/* Secondary Action Dual Tiles */}
            <div className="grid grid-cols-2 gap-3">
              {/* Upload Card */}
              <div
                onClick={() => onNavigate('analyze_upload')}
                className="group relative rounded-2xl bg-surface p-4 flex flex-col justify-between space-y-3 transition-all duration-200 active:scale-[0.98] shadow-md hover:bg-elevated border border-subtle cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-info-10 text-info border border-info/20 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-22" aria-hidden="true">upload_file</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-headline-sm text-15 sm:text-16 text-primary font-semibold leading-tight">
                      Upload Audio File
                    </span>
                    <span className="font-label-sm text-11 text-info font-medium bg-elevated px-2 py-0.5 rounded-full font-mono border border-subtle">
                      WAV, MP3, M4A
                    </span>
                  </div>
                  <span className="font-body-sm text-12 sm:text-13 text-secondary line-clamp-2 mt-1">
                    Inspect pre-recorded audio tracks for synthetic glitches and glottal phase drops
                  </span>
                </div>
              </div>

              {/* Sample Benchmarks Card */}
              <div
                onClick={() => onNavigate('samples')}
                className="group relative rounded-2xl bg-surface p-4 flex flex-col justify-between space-y-3 transition-all duration-200 active:scale-[0.98] shadow-md hover:bg-elevated border border-subtle cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-warning-10 text-warning border border-warning/20 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-22" aria-hidden="true">library_music</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-headline-sm text-15 sm:text-16 text-primary font-semibold leading-tight">
                      Try Benchmarks
                    </span>
                    <span className="font-label-sm text-11 text-warning font-medium bg-elevated px-2 py-0.5 rounded-full font-mono border border-subtle">
                      8 Benchmarks
                    </span>
                  </div>
                  <span className="font-body-sm text-12 sm:text-13 text-secondary line-clamp-2 mt-1">
                    Compare verified human speech against ElevenLabs, VALL-E &amp; XTTS clones
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Scan History & Live Forensics Oscillogram */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="font-label-lg text-14 text-primary font-semibold tracking-wide">
                Recent Scan History
              </span>
              <span className="font-label-sm text-11 text-secondary bg-elevated px-2 py-0.5 rounded-full font-mono">
                {scans.length} Scans Logged
              </span>
              {user && (
                <span className="hidden sm:inline-flex font-label-sm text-11 text-accent bg-accent-10 px-2 py-0.5 rounded-full font-mono border border-accent-20">
                  Firestore Active
                </span>
              )}
            </div>
            <button
              onClick={() => onNavigate('samples')}
              className="btn-pill text-12 text-accent hover:text-white flex items-center gap-1 cursor-pointer transition-all"
              aria-label="View all scan history records"
            >
              <span>See all</span>
              <span className="material-symbols-outlined text-16" aria-hidden="true">arrow_forward</span>
            </button>
          </div>

          {/* Scan History List */}
          <div className="flex flex-col space-y-2.5">
            {(!scans || scans.length === 0) ? (
              <div className="p-6 rounded-2xl bg-surface border border-subtle flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-11 h-11 rounded-full bg-elevated flex items-center justify-center text-info">
                  <span className="material-symbols-outlined text-22">graphic_eq</span>
                </div>
                <div>
                  <h4 className="text-primary font-semibold text-14">No Scans Recorded Yet</h4>
                  <p className="text-secondary text-12 mt-1 max-w-sm">
                    Original audio files or live microphone recordings analyzed will appear here.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onNavigate('analyze_upload')}
                    className="btn-primary text-12 px-3 py-1.5 rounded-lg"
                  >
                    Upload Audio
                  </button>
                  <button
                    onClick={() => onNavigate('scan_record')}
                    className="btn-secondary text-12 px-3 py-1.5 rounded-lg"
                  >
                    Record Voice
                  </button>
                </div>
              </div>
            ) : (
              scans.map((scan, idx) => {
                const isSpoof = scan.isSynthetic;

                return (
                  <div
                    key={`${scan.id || 'scan'}-${idx}`}
                    className="relative p-3.5 sm:p-4 rounded-2xl bg-surface flex flex-col space-y-2.5 transition-all duration-150 hover:bg-elevated shadow-md border border-subtle"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSpoof
                              ? 'bg-error-40 text-error'
                              : 'bg-accent-20 text-accent'
                          }`}
                        >
                          <span className="material-symbols-outlined text-18">
                            {isSpoof ? 'warning' : 'verified'}
                          </span>
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="font-headline-sm text-14 text-primary font-semibold truncate">
                            {scan.filename}
                          </span>
                          <div className="flex items-center gap-2 font-body-sm text-11 sm:text-12 text-secondary">
                            <span>{scan.timeAgo}</span>
                            <span>•</span>
                            <span className="font-mono">{scan.duration}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full font-label-sm text-10 font-bold flex items-center gap-1 ${
                          isSpoof
                            ? 'bg-[#93000a] text-error-light'
                            : 'bg-[#2ecc71] text-[#005027]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSpoof ? 'bg-[#ffb4ab] animate-pulse' : 'bg-accent'
                          }`}
                        />
                        {scan.classification}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-secondary pt-1.5 px-3 py-2 bg-void/60 rounded-xl border border-subtle">
                      <span
                        className={`font-label-sm text-12 truncate pr-2 ${
                          isSpoof ? 'text-error' : 'text-secondary'
                        }`}
                      >
                        {scan.anomalyTag}
                      </span>
                      <button
                        onClick={() => {
                          onSelectScan(scan);
                          onNavigate('incident_report');
                        }}
                        className="min-h-[32px] px-3 py-1 rounded-lg bg-elevated hover:bg-elevated-hover text-info text-12 font-semibold border border-subtle flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        aria-label={`View diagnostics for ${scan.filename}`}
                      >
                        <span>Diagnostics</span>
                        <span className="material-symbols-outlined text-14" aria-hidden="true">tune</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Spectrogram Forensics Highlight - positioned to balance columns */}
          <div className="rounded-2xl bg-void p-4 flex flex-col space-y-2.5 shadow-inner border border-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-18 text-accent">equalizer</span>
                <span className="font-label-md text-12 uppercase tracking-wider font-semibold">
                  Live Forensics Oscillogram
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-11 text-info bg-surface px-2 py-0.5 rounded-full font-mono">
                  128 Mel Bands
                </span>
                <span className="font-label-sm text-11 text-accent bg-accent-10 px-2 py-0.5 rounded-full font-mono">
                  48.0 kHz // 24-bit
                </span>
              </div>
            </div>

            {/* Soundwave Graphic with Responsive Height */}
            <div
              className="w-full responsive-equalizer-height bg-surface rounded-xl px-4 flex items-center justify-between gap-1 overflow-hidden"
              id="ambient-spectrogram"
            >
              {waveHeights.map((height, i) => {
                const isBlue = i % 4 === 0 || i % 7 === 0;
                return (
                  <div
                    key={i}
                    className={`flex-1 max-w-[8px] rounded-full transition-all duration-300 ${
                      isBlue ? 'bg-[#7dd0ff]' : 'bg-accent'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
