import React, { useState, useEffect, useRef } from 'react';
import { generateSyntheticAudioSample, formatAudioTime } from '../utils/audioHelper';

export const ReportScreen = ({
  scanItem,
  onNavigate,
}) => {
  if (!scanItem) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface rounded-2xl border border-subtle space-y-4 my-8">
        <div className="w-16 h-16 rounded-2xl bg-elevated flex items-center justify-center text-info shadow-inner">
          <span className="material-symbols-outlined text-32">analytics</span>
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-primary text-lg font-bold">No Scan Selected</h3>
          <p className="text-secondary text-sm">
            All sample mock data has been removed. Please run a genuine audio analysis or select a scan from your library to inspect its diagnostic report.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2 rounded-xl bg-elevated text-primary font-semibold text-sm hover:bg-[#303640] transition-colors cursor-pointer border border-subtle"
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('analyze_upload')}
            className="px-4 py-2 rounded-xl bg-accent text-[#003919] font-bold text-sm hover:bg-[#43d477] transition-colors cursor-pointer"
          >
            Upload Audio
          </button>
        </div>
      </div>
    );
  }

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(24);
  const [playProgress, setPlayProgress] = useState(0); // 0 - 100%
  const [speed, setSpeed] = useState('1.0x');
  const [isLooping, setIsLooping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [audioUrl, setAudioUrl] = useState(scanItem.audioUrl || null);

  const audioRef = useRef(null);

  const isSynthetic = scanItem.isSynthetic;
  const filename = scanItem.filename;
  const confidence = scanItem.confidencePercent;
  const modelName = scanItem.model;
  const findings =
    scanItem.acousticFindings ||
    'Extremely high probability of latent diffusion neural voice generation.';

  // Initialize audio source from scanItem
  useEffect(() => {
    if (scanItem?.audioUrl) {
      setAudioUrl(scanItem.audioUrl);
    } else {
      setAudioUrl(null);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [scanItem]);

  // Sync speed changes to audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed === '1.5x' ? 1.5 : 1.0;
    }
  }, [speed]);

  // Sync looping to audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const togglePlayback = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('[ReportScreen] Audio play failed:', err);
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    const dur = audioRef.current.duration || duration || 24;
    setCurrentTime(curr);
    const pct = dur > 0 ? (curr / dur) * 100 : 0;
    setPlayProgress(Math.min(100, Math.max(0, pct)));
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    if (dur && !isNaN(dur) && dur > 0) {
      setDuration(dur);
    }
  };

  const handleEnded = () => {
    if (!isLooping) {
      setIsPlaying(false);
      setCurrentTime(0);
      setPlayProgress(0);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const total = audioRef.current.duration || duration || 24;
    const target = (pct / 100) * total;
    audioRef.current.currentTime = target;
    setCurrentTime(target);
    setPlayProgress(pct);
  };

  const formattedSeconds = formatAudioTime(currentTime);
  const formattedTotal = formatAudioTime(duration);

  return (
    <div className="flex flex-col w-full pb-8 gap-4">
      {/* Subheader & Quick Export */}
      <div className="flex items-center justify-between mt-1 px-1">
        <div className="flex flex-col">
          <span className="font-label-sm text-10 text-info uppercase tracking-widest font-semibold">
            Acoustic Telemetry
          </span>
          <h2 className="font-headline-sm text-18 text-primary font-semibold tracking-tight">
            Forensic Audio Report
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            aria-label="Share or Export"
            className="w-10 h-10 rounded-full bg-elevated hover:bg-elevated-hover flex items-center justify-center text-primary transition-transform active:scale-95 shadow-md border border-subtle cursor-pointer"
            id="quick-export-btn"
          >
            <span className="material-symbols-outlined text-20">ios_share</span>
          </button>
        </div>
      </div>

      {/* Analyzed File Metadata Pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface shadow-sm w-fit max-w-full border border-subtle">
        <span className="material-symbols-outlined text-info text-16 shrink-0">
          audio_file
        </span>
        <span className="font-label-md text-11 text-secondary truncate">
          {filename} <span className="text-muted mx-1">•</span> Scanned today at 14:32
        </span>
      </div>

      {/* Main Responsive Grid Layout for Tablet & Desktop */}
      <div className="responsive-2col-grid mt-1">
        {/* Left Column: Verdict & Forensic Oscillogram Scope */}
        <div className="flex flex-col space-y-4">
          {/* Main Verdict Card (Controlled Alarm Hero) */}
          <div className="relative overflow-hidden rounded-2xl bg-void p-4 shadow-xl border border-subtle">
            {/* Ambient Red/Amber Forensic Glow Layer */}
            {isSynthetic ? (
              <>
                <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-error-20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-[#f8a018]/15 blur-3xl pointer-events-none" />
              </>
            ) : (
              <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
            )}

            <div className="relative z-10 flex flex-col gap-3">
              {/* Top Alert Ribbon */}
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
                    isSynthetic
                      ? 'bg-[#93000a] text-error-light'
                      : 'bg-accent-dark text-[#6bfe9c]'
                  }`}
                >
                  <span className="material-symbols-outlined text-15 animate-pulse">
                    {isSynthetic ? 'crisis_alert' : 'verified'}
                  </span>
                  <span className="font-label-sm text-10 uppercase tracking-wider font-bold">
                    {isSynthetic ? 'High Risk Threat' : 'Authentic Human Voice'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-warning font-label-sm text-11">
                  <span className="material-symbols-outlined text-14">bolt</span>
                  <span>{isSynthetic ? modelName : 'Natural Resonance'}</span>
                </div>
              </div>

              {/* Icon + Verdict Display */}
              <div className="flex items-start gap-3 mt-1">
                <div
                  className={`relative shrink-0 flex items-center justify-center w-14 h-14 rounded-xl shadow-inner ${
                    isSynthetic
                      ? 'bg-error-40 text-error'
                      : 'bg-accent-20 text-accent'
                  }`}
                >
                  <svg
                    className="w-8 h-8 drop-shadow-[0_0_8px_rgba(255,180,171,0.4)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2L3 6V11.5C3 16.8 6.8 21.6 12 23C17.2 21.6 21 16.8 21 11.5V6L12 2Z"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                    {isSynthetic ? (
                      <>
                        <path d="M12 8V13" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                        <circle cx="12" cy="16.5" fill="currentColor" r="1.25" />
                      </>
                    ) : (
                      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                    )}
                  </svg>
                  {isSynthetic && (
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ffb4ab]">
                      <span className="h-2 w-2 rounded-full bg-[#690005] animate-ping" />
                    </span>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span
                    className={`font-label-sm text-10 uppercase tracking-wider ${
                      isSynthetic ? 'text-error' : 'text-accent'
                    }`}
                  >
                    {isSynthetic ? 'Synthesized Audio Match' : 'Biometric Audio Match'}
                  </span>
                  <h3 className="font-headline-md text-20 font-bold text-primary leading-tight tracking-tight">
                    {isSynthetic ? 'Cloned / AI-Generated Voice' : 'Verified Human Speech Track'}
                  </h3>
                </div>
              </div>

              {/* Confidence Metric & Gauge */}
              <div className="mt-1 bg-elevated/60 rounded-xl p-3 flex flex-col gap-1.5 backdrop-blur-md border border-subtle">
                <div className="flex justify-between items-baseline">
                  <span className="font-body-sm text-12 text-secondary font-medium">
                    Model Confidence
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-numeric-metric text-[26px] font-bold tracking-tight ${
                        isSynthetic ? 'text-error' : 'text-accent'
                      }`}
                    >
                      {confidence}%
                    </span>
                    <span className="font-label-sm text-10 text-secondary uppercase font-mono">
                      {isSynthetic ? 'Synthetic' : 'Authentic'}
                    </span>
                  </div>
                </div>

                {/* Meter bar */}
                <div className="relative w-full h-2 rounded-full bg-elevated-hover overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                      isSynthetic
                        ? 'bg-gradient-to-r from-[#f8a018] via-[#ffb4ab] to-[#ffb4ab] shadow-[0_0_10px_rgba(255,180,171,0.6)]'
                        : 'bg-gradient-to-r from-[#54e98a] to-[#2ecc71] shadow-[0_0_10px_rgba(84,233,138,0.6)]'
                    }`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>

                <p className="font-body-sm text-11 text-secondary flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-15 text-warning">warning</span>
                  {findings}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Waveform Forensic Scope */}
          <div className="flex flex-col rounded-2xl bg-surface p-4 shadow-md gap-3 border border-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-info text-20">graphic_eq</span>
                <span className="font-label-lg text-13 font-semibold text-primary">
                  Acoustic Oscillogram
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-elevated text-info font-label-sm text-10 font-medium font-mono">
                24.0s Sample
              </span>
            </div>

            {/* Scrubber Area */}
            <div className="relative w-full bg-void rounded-xl p-3 overflow-hidden flex flex-col gap-2 border border-subtle">
              {/* Hidden HTML5 Audio Element */}
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  preload="metadata"
                />
              )}

              {/* Waveform Graph SVG */}
              <div
                onClick={handleSeek}
                className="relative w-full h-24 flex items-center cursor-pointer select-none"
                title="Click anywhere to seek playback"
              >
                <svg
                  className="w-full h-full preserve-3d"
                  preserveAspectRatio="none"
                  viewBox="0 0 380 96"
                >
                  <defs>
                    <linearGradient id="safeWave" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#7dd0ff" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#54e98a" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient id="flaggedWave" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffb4ab" stopOpacity="1" />
                      <stop offset="100%" stopColor="#93000a" stopOpacity="0.7" />
                    </linearGradient>
                  </defs>

                  {/* Flagged anomaly background spans */}
                  {isSynthetic && (
                    <>
                      <rect
                        fill="#93000a"
                        fillOpacity="0.3"
                        height="88"
                        rx="6"
                        stroke="none"
                        width="79"
                        x="63"
                        y="4"
                      />
                      <rect
                        fill="#93000a"
                        fillOpacity="0.3"
                        height="88"
                        rx="6"
                        stroke="none"
                        width="64"
                        x="221"
                        y="4"
                      />
                    </>
                  )}

                  {/* Center Reference Line */}
                  <line stroke="#30353c" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="380" y1="48" y2="48" />

                  {/* Waveform Bars Segment 1: Safe baseline */}
                  <g fill="url(#safeWave)">
                    <rect height="20" rx="1.5" width="3" x="6" y="38" />
                    <rect height="36" rx="1.5" width="3" x="15" y="30" />
                    <rect height="48" rx="1.5" width="3" x="24" y="24" />
                    <rect height="28" rx="1.5" width="3" x="33" y="34" />
                    <rect height="56" rx="1.5" width="3" x="42" y="20" />
                    <rect height="40" rx="1.5" width="3" x="51" y="28" />
                  </g>

                  {/* Segment 2: Glottal Pulse Artifacts */}
                  <g fill={isSynthetic ? 'url(#flaggedWave)' : 'url(#safeWave)'}>
                    <rect height="76" rx="1.75" width="3.5" x="63" y="10" />
                    <rect height="84" rx="1.75" width="3.5" x="73" y="6" />
                    <rect height="68" rx="1.75" width="3.5" x="83" y="14" />
                    <rect height="88" rx="1.75" width="3.5" x="93" y="4" />
                    <rect height="72" rx="1.75" width="3.5" x="103" y="12" />
                    <rect height="80" rx="1.75" width="3.5" x="113" y="8" />
                    <rect height="64" rx="1.75" width="3.5" x="123" y="16" />
                    <rect height="76" rx="1.75" width="3.5" x="133" y="10" />
                  </g>

                  {/* Segment 3: Safe Mid */}
                  <g fill="url(#safeWave)">
                    <rect height="32" rx="1.5" width="3" x="146" y="32" />
                    <rect height="44" rx="1.5" width="3" x="156" y="26" />
                    <rect height="24" rx="1.5" width="3" x="166" y="36" />
                    <rect height="52" rx="1.5" width="3" x="176" y="22" />
                    <rect height="40" rx="1.5" width="3" x="186" y="28" />
                    <rect height="36" rx="1.5" width="3" x="196" y="30" />
                    <rect height="20" rx="1.5" width="3" x="206" y="38" />
                  </g>

                  {/* Segment 4: Anomaly 2 - Spectral Discontinuity */}
                  <g fill={isSynthetic ? 'url(#flaggedWave)' : 'url(#safeWave)'}>
                    <rect height="80" rx="1.75" width="3.5" x="221" y="8" />
                    <rect height="88" rx="1.75" width="3.5" x="231" y="4" />
                    <rect height="72" rx="1.75" width="3.5" x="241" y="12" />
                    <rect height="84" rx="1.75" width="3.5" x="251" y="6" />
                    <rect height="76" rx="1.75" width="3.5" x="261" y="10" />
                    <rect height="64" rx="1.75" width="3.5" x="271" y="16" />
                    <rect height="72" rx="1.75" width="3.5" x="281" y="12" />
                  </g>

                  {/* Segment 5: Trailing */}
                  <g fill="url(#safeWave)">
                    <rect height="28" rx="1.5" width="3" x="294" y="34" />
                    <rect height="44" rx="1.5" width="3" x="304" y="26" />
                    <rect height="24" rx="1.5" width="3" x="314" y="36" />
                    <rect height="16" rx="1.5" width="3" x="324" y="40" />
                    <rect height="36" rx="1.5" width="3" x="334" y="30" />
                    <rect height="48" rx="1.5" width="3" x="344" y="24" />
                    <rect height="32" rx="1.5" width="3" x="354" y="32" />
                    <rect height="12" rx="1.5" width="3" x="364" y="42" />
                  </g>
                </svg>

                {/* Dynamic Playhead indicator line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#7dd0ff] shadow-[0_0_8px_#7dd0ff] pointer-events-none transition-all duration-75"
                  style={{ left: `${playProgress}%` }}
                >
                  <div className="w-2.5 h-2.5 -ml-1 rounded-full bg-[#7dd0ff] shadow-md" />
                </div>
              </div>

              {/* Scrubber Playback Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlayback}
                    aria-label={isPlaying ? 'Pause sample' : 'Play sample'}
                    className="w-9 h-9 rounded-full bg-accent text-[#003919] flex items-center justify-center shadow hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  >
                    <span
                      className="material-symbols-outlined text-20"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <div className="flex flex-col">
                    <span className="font-label-md text-13 text-primary font-semibold font-mono">
                      {formattedSeconds}
                    </span>
                    <span className="font-label-sm text-10 text-secondary font-mono">
                      / {formattedTotal}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSpeed(speed === '1.0x' ? '1.5x' : '1.0x')}
                    className="px-2.5 py-1 rounded-full bg-elevated text-primary font-label-sm text-11 hover:bg-elevated-hover cursor-pointer"
                  >
                    {speed}
                  </button>
                  <button
                    onClick={() => setIsLooping(!isLooping)}
                    aria-label="Loop Segment"
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isLooping
                        ? 'bg-accent-20 text-accent'
                        : 'bg-elevated text-primary hover:bg-elevated-hover'
                    }`}
                  >
                    <span className="material-symbols-outlined text-16">repeat</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Flagged Segment Pill Tags */}
            {isSynthetic && (
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="font-label-sm text-10 uppercase tracking-wider text-muted font-semibold">
                  Flagged Forensic Anomalies
                </span>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setPlayProgress(25)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface hover:bg-elevated text-left transition-colors cursor-pointer border border-subtle"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#ffb4ab] shrink-0" />
                      <span className="font-label-md text-12 text-primary font-medium truncate">
                        Robotic Glottal Pulse
                      </span>
                    </div>
                    <span className="font-label-sm text-10 text-error bg-error-40 px-2 py-0.5 rounded-md shrink-0 font-bold font-mono">
                      {scanItem?.glottalPulseWindow || '0:04 - 0:09'}
                    </span>
                  </button>

                  <button
                    onClick={() => setPlayProgress(62)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface hover:bg-elevated text-left transition-colors cursor-pointer border border-subtle"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#f8a018] shrink-0" />
                      <span className="font-label-md text-12 text-primary font-medium truncate">
                        Synthetic Spectral Discontinuity
                      </span>
                    </div>
                    <span className="font-label-sm text-10 text-warning bg-elevated-hover px-2 py-0.5 rounded-md shrink-0 font-bold font-mono">
                      {scanItem?.spectralDiscontinuityWindow || '0:14 - 0:18'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Diagnostics Telemetry, Technical Specs, Action CTAs */}
        <div className="flex flex-col space-y-4">
          {/* Expandable Forensic Diagnostic Breakdown */}
          <div className="flex flex-col rounded-2xl bg-surface p-4 shadow-md gap-2 border border-subtle">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              className="flex items-center justify-between w-full text-left cursor-pointer"
              id="toggle-forensics"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-20">
                  analytics
                </span>
                <span className="font-label-lg text-13 font-semibold text-primary">
                  Neural Diagnostic Telemetry
                </span>
              </div>
              <span
                className={`material-symbols-outlined text-secondary transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            {/* Diagnostics Content List */}
            {isExpanded && (
              <div className="flex flex-col gap-2 mt-1" id="forensics-content">
                {/* Metric 1 */}
                <div className="flex flex-col p-3 rounded-xl bg-surface gap-1 border border-subtle">
                  <div className="flex justify-between items-center">
                    <span className="font-label-md text-12 text-primary font-medium">
                      Neural Consistency Score
                    </span>
                    <span
                      className={`font-label-md text-12 font-bold ${
                        isSynthetic ? 'text-error' : 'text-accent'
                      }`}
                    >
                      {scanItem?.neuralConsistency ?? 98.4}% {isSynthetic ? 'Synthetic' : 'Organic'}
                    </span>
                  </div>
                  <p className="font-body-sm text-11 text-secondary leading-snug">
                    Spectral weight distributions deviate significantly from biological human vocal tract profiles.
                  </p>
                </div>

                {/* Metric 2 */}
                <div className="flex flex-col p-3 rounded-xl bg-surface gap-1 border border-subtle">
                  <div className="flex justify-between items-center">
                    <span className="font-label-md text-12 text-primary font-medium">
                      Breath &amp; Micro-tremor Anomaly
                    </span>
                    <span
                      className={`font-label-sm text-10 px-2 py-0.5 rounded-full font-bold ${
                        isSynthetic
                          ? 'bg-[#93000a] text-error-light'
                          : 'bg-accent-dark text-[#6bfe9c]'
                      }`}
                    >
                      {scanItem?.breathAnomalySeverity || 'CRITICAL'}
                    </span>
                  </div>
                  <p className="font-body-sm text-11 text-secondary leading-snug">
                    Absence of human autonomic respiratory pauses and microscopic vocal cord tension flutter.
                  </p>
                </div>

                {/* Metric 3 */}
                <div className="flex flex-col p-3 rounded-xl bg-surface gap-1 border border-subtle">
                  <div className="flex justify-between items-center">
                    <span className="font-label-md text-12 text-primary font-medium">
                      Acoustic Harmonic Jitter
                    </span>
                    <span className="font-label-md text-12 text-warning font-bold">
                      {scanItem?.harmonicDiffusionMatch ?? 96.0}% Diffusion Match
                    </span>
                  </div>
                  <p className="font-body-sm text-11 text-secondary leading-snug">
                    High correlation with high-order generative mel-spectrogram vocoder architectures.
                  </p>
                </div>

                {/* Metric 4 */}
                <div className="flex flex-col p-3 rounded-xl bg-surface gap-1 border border-subtle">
                  <div className="flex justify-between items-center">
                    <span className="font-label-md text-12 text-primary font-medium">
                      Phase Frequency Cutoff
                    </span>
                    <span className="font-label-md text-12 text-info font-bold">
                      {scanItem?.phaseCutoff || '4.2 kHz Hard Cutoff'}
                    </span>
                  </div>
                  <p className="font-body-sm text-11 text-secondary leading-snug">
                    Unnatural high-frequency attenuation typical of low-latency inference speech pipelines.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Biometric Technical Specifications Card */}
          <div className="p-4 rounded-2xl bg-surface border border-subtle space-y-2.5">
            <span className="font-label-sm text-11 text-info uppercase tracking-wider font-semibold font-mono flex items-center gap-1.5">
              <span className="material-symbols-outlined text-15">settings_input_component</span>
              Forensic Acoustic Signature Specs
            </span>
            <div className="grid grid-cols-2 gap-2 text-11 font-mono">
              <div className="p-2 rounded-lg bg-void border border-subtle">
                <span className="text-muted block text-9 uppercase">Sample Rate</span>
                <span className="text-primary font-bold">48,000 Hz</span>
              </div>
              <div className="p-2 rounded-lg bg-void border border-subtle">
                <span className="text-muted block text-9 uppercase">Audio Codec</span>
                <span className="text-primary font-bold">PCM 24-bit stereo</span>
              </div>
              <div className="p-2 rounded-lg bg-void border border-subtle">
                <span className="text-muted block text-9 uppercase">Mel Bands</span>
                <span className="text-primary font-bold">128 Mel Filters</span>
              </div>
              <div className="p-2 rounded-lg bg-void border border-subtle">
                <span className="text-muted block text-9 uppercase">Classifier Seed</span>
                <span className="text-accent font-bold">SHA-256 #891F</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2 mt-2">
            {/* Primary CTA */}
            <button
              onClick={() => onNavigate('scan_record')}
              className="w-full h-[52px] rounded-full bg-gradient-to-r from-[#2ecc71] via-[#54e98a] to-[#7dd0ff] flex items-center justify-center gap-2 text-[#003919] font-label-lg text-13 font-bold uppercase tracking-wider shadow-lg shadow-[#54e98a]/20 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-20">mic_external_on</span>
              <span>Analyze Another Clip</span>
            </button>

            {/* Secondary CTA */}
            <button
              onClick={() => setShowShareModal(true)}
              className="w-full h-12 rounded-full bg-elevated hover:bg-[#353a40] flex items-center justify-center gap-2 text-primary font-label-md text-12 font-semibold transition-colors active:scale-[0.99] shadow-sm border border-subtle cursor-pointer"
            >
              <span className="material-symbols-outlined text-18 text-info">picture_as_pdf</span>
              <span>Share Forensic Report (PDF)</span>
            </button>

            {/* False Positive Report Link */}
            <div className="flex justify-center mt-1">
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="text-center font-body-sm text-12 text-muted hover:text-primary underline underline-offset-4 transition-colors py-1 cursor-pointer"
              >
                Flag as False Positive / Submit Feedback
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl p-5 max-w-[360px] w-full border border-subtle-10 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-16 text-primary font-semibold">
                Export Forensic Report
              </span>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-secondary hover:text-primary"
              >
                <span className="material-symbols-outlined text-18">close</span>
              </button>
            </div>
            <p className="text-12 text-secondary">
              Report ID: <span className="font-mono text-info">VG-2026-0907-89</span>
            </p>
            <div className="bg-void p-3 rounded-xl text-11 font-mono text-primary space-y-1">
              <div>File: {filename}</div>
              <div>Verdict: {isSynthetic ? 'Synthetic Deepfake (98.4%)' : 'Authentic Human (99.6%)'}</div>
              <div>Hash: sha256-4c9f1a2e8870</div>
              <div>Sign: Cryptographic Seal Active</div>
            </div>
            <button
              onClick={() => {
                alert('Forensic PDF report generated and downloaded to device.');
                setShowShareModal(false);
              }}
              className="w-full py-2.5 rounded-full bg-accent text-[#003919] font-label-md text-12 font-bold uppercase tracking-wider"
            >
              Download PDF Report
            </button>
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl p-5 max-w-[360px] w-full border border-subtle-10 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-16 text-primary font-semibold">
                Submit Forensic Feedback
              </span>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackSubmitted(false);
                }}
                className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-secondary hover:text-primary"
              >
                <span className="material-symbols-outlined text-18">close</span>
              </button>
            </div>

            {feedbackSubmitted ? (
              <div className="py-4 text-center space-y-2">
                <span className="material-symbols-outlined text-36 text-accent">check_circle</span>
                <p className="text-13 text-primary font-semibold">Feedback Received</p>
                <p className="text-11 text-secondary">
                  Thank you. Audio sample telemetry has been logged for engine re-calibration.
                </p>
              </div>
            ) : (
              <>
                <p className="text-12 text-secondary">
                  Help calibrate the spectral neural classifier by flagging discrepancies.
                </p>
                <textarea
                  placeholder="Describe acoustic characteristics or speaker background..."
                  className="w-full h-20 p-2.5 rounded-xl bg-void border border-subtle-10 text-12 text-primary focus:outline-none focus:border-[#7dd0ff]"
                />
                <button
                  onClick={() => setFeedbackSubmitted(true)}
                  className="w-full py-2.5 rounded-full bg-elevated hover:bg-[#353a40] text-primary font-label-md text-12 font-bold uppercase tracking-wider border border-subtle"
                >
                  Send Diagnostics to Lab
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
