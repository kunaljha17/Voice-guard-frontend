import React, { useState, useRef, useEffect } from 'react';

export const SamplesScreen = ({
  scans = [],
  onNavigate,
  onSelectScan,
}) => {
  const [filter, setFilter] = useState('all');
  const [playingClipId, setPlayingClipId] = useState(null);
  const [activeModalClip, setActiveModalClip] = useState(null);

  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const authenticScans = scans.filter((c) => !c.isSynthetic);
  const clonedScans = scans.filter((c) => c.isSynthetic);

  const filteredClips = scans.filter((clip) => {
    if (filter === 'all') return true;
    if (filter === 'authentic') return !clip.isSynthetic;
    if (filter === 'cloned') return clip.isSynthetic;
    return true;
  });

  const togglePlay = (clip) => {
    if (!clip.audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setPlayingClipId(null);
    }

    if (playingClipId === clip.id) {
      audioRef.current.pause();
      setPlayingClipId(null);
    } else {
      audioRef.current.pause();
      audioRef.current.src = clip.audioUrl;
      audioRef.current.play().catch((err) => console.warn('Audio playback notice:', err));
      setPlayingClipId(clip.id);
    }
  };

  const handleOpenDiagnostics = (clip) => {
    onSelectScan(clip);
    onNavigate('incident_report');
  };

  return (
    <div className="flex flex-col w-full pb-6 space-y-4">
      {/* Interactive Forensics Vault Header */}
      <div className="relative overflow-hidden rounded-xl bg-surface p-4 shadow-md border border-subtle">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-accent-10 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-accent text-20">folder_special</span>
          <span className="font-label-sm text-10 uppercase tracking-wider text-accent font-semibold font-mono">
            Original Forensics Vault
          </span>
        </div>
        <h2 className="font-headline-md text-20 text-primary font-bold tracking-tight">
          Saved Audio Scans Library
        </h2>
        <p className="font-body-sm text-12 text-secondary mt-1 leading-relaxed">
          Permanent archive of verified genuine user recordings and uploaded audio telemetry analyzed by the dual-model neural engine.
        </p>

        {/* Status Strip */}
        <div className="mt-3 flex items-center justify-between bg-void px-3 py-2 rounded-lg border border-subtle">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <span className="font-label-sm text-11 text-primary">
              Only Original User Scans Saved
            </span>
          </div>
          <span className="font-label-sm text-11 text-info font-semibold font-mono">
            {scans.length} Stored
          </span>
        </div>
      </div>

      {/* Filter Switcher Segment */}
      <div className="flex items-center gap-1.5 p-1 bg-void rounded-xl overflow-x-auto no-scrollbar border border-subtle">
        <button
          onClick={() => setFilter('all')}
          className={`tab-btn flex-1 py-2 px-2 rounded-lg font-label-sm text-11 whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
            filter === 'all'
              ? 'bg-elevated text-accent shadow-sm font-semibold'
              : 'text-secondary hover:text-primary'
          }`}
          id="filter-all"
        >
          <span>All Scans</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-9 ${
              filter === 'all' ? 'bg-accent-20 text-accent' : 'bg-elevated-hover text-secondary'
            }`}
          >
            {scans.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('authentic')}
          className={`tab-btn flex-1 py-2 px-2 rounded-lg font-label-sm text-11 whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
            filter === 'authentic'
              ? 'bg-elevated text-accent shadow-sm font-semibold'
              : 'text-secondary hover:text-primary'
          }`}
          id="filter-authentic"
        >
          <span>Authentic Human</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-9 ${
              filter === 'authentic'
                ? 'bg-accent-20 text-accent'
                : 'bg-elevated-hover text-secondary'
            }`}
          >
            {authenticScans.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('cloned')}
          className={`tab-btn flex-1 py-2 px-2 rounded-lg font-label-sm text-11 whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
            filter === 'cloned'
              ? 'bg-elevated text-error shadow-sm font-semibold'
              : 'text-secondary hover:text-primary'
          }`}
          id="filter-cloned"
        >
          <span>Deepfake Flags</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-9 ${
              filter === 'cloned'
                ? 'bg-[#93000a] text-error-light'
                : 'bg-elevated-hover text-secondary'
            }`}
          >
            {clonedScans.length}
          </span>
        </button>
      </div>

      {/* Audio Clips Stack / Empty State */}
      {filteredClips.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 sm:p-12 text-center border border-subtle flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-elevated flex items-center justify-center text-info shadow-inner">
            <span className="material-symbols-outlined text-28">graphic_eq</span>
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-headline-sm text-16 text-primary font-semibold">
              No Original Scans in Library
            </h3>
            <p className="font-body-sm text-12 text-secondary leading-relaxed">
              All mock sample clips have been removed. Any authentic audio file you upload or record via Live Sentry will be archived here.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => onNavigate('analyze_upload')}
              className="px-4 py-2 rounded-xl bg-accent text-[#003919] font-bold text-12 hover:bg-[#43d477] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Upload Audio File
            </button>
            <button
              onClick={() => onNavigate('scan_record')}
              className="px-4 py-2 rounded-xl bg-elevated text-primary font-medium text-12 hover:bg-[#303640] transition-all cursor-pointer border border-subtle active:scale-95"
            >
              Live Mic Sentry
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4" id="samples-container">
          {filteredClips.map((clip) => {
            const isCloned = clip.isSynthetic;
            const isPlaying = playingClipId === clip.id;

            return (
              <div
                key={clip.id}
                className="clip-card relative rounded-xl bg-surface p-4 flex flex-col gap-2.5 shadow-md transition-all hover:bg-elevated border border-subtle"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-10 font-semibold ${
                        isCloned
                          ? 'bg-[#93000a] text-error-light'
                          : 'bg-accent/15 text-accent'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isCloned ? 'bg-[#ffb4ab] animate-pulse' : 'bg-accent'
                        }`}
                      />
                      {clip.classification || (isCloned ? 'AI Clone Flagged' : 'Authentic Human')}
                    </span>
                  </div>
                  <span className="font-label-sm text-11 text-secondary font-mono">
                    {clip.duration}
                  </span>
                </div>

                <div>
                  <h3 className="font-headline-sm text-15 text-primary font-semibold truncate">
                    {clip.filename}
                  </h3>
                  <p className="font-body-sm text-12 text-secondary mt-0.5 leading-snug truncate">
                    {clip.anomalyTag || clip.acousticFindings}
                  </p>
                </div>

                {/* Playback & Telemetry Track */}
                <div className="bg-void rounded-lg p-2.5 flex items-center justify-between gap-2.5 border border-subtle">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {clip.audioUrl ? (
                      <button
                        onClick={() => togglePlay(clip)}
                        className={`w-9 h-9 rounded-full bg-elevated-hover flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
                          isPlaying ? 'text-accent bg-elevated' : 'text-primary hover:text-accent'
                        }`}
                        aria-label="Toggle playback"
                      >
                        <span
                          className="material-symbols-outlined text-20 play-icon"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-muted flex-shrink-0">
                        <span className="material-symbols-outlined text-18">volume_off</span>
                      </div>
                    )}

                    <div className="flex flex-col min-w-0">
                      <span className="font-label-sm text-11 text-primary font-medium truncate">
                        {clip.audioUrl ? 'Original Recording Audio' : 'Metadata Forensic Signature'}
                      </span>
                      <span className="font-label-sm text-10 text-muted font-mono">
                        {clip.timeAgo || 'Saved Scan'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-label-sm text-12 font-bold flex-shrink-0 font-mono ${
                      isCloned ? 'text-error' : 'text-accent'
                    }`}
                  >
                    {clip.confidencePercent ? `${clip.confidencePercent}%` : ''}
                  </span>
                </div>

                {/* Full Diagnostics Action */}
                <button
                  onClick={() => handleOpenDiagnostics(clip)}
                  className="w-full h-10 rounded-full bg-elevated-hover text-primary hover:bg-[#353a40] font-label-md text-12 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-subtle"
                >
                  <span className="material-symbols-outlined text-18">query_stats</span>
                  View Diagnostics Report
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Quick-Action Banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface p-4 shadow-md flex items-center gap-3 border border-subtle">
        <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0 text-accent">
          <span className="material-symbols-outlined text-[26px]">mic</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-headline-sm text-14 font-semibold text-primary">
            Start Real-Time Voice Guard
          </h4>
          <p className="font-body-sm text-12 text-secondary truncate">
            Record voice live to verify authenticity in under 1 second.
          </p>
        </div>
        <button
          onClick={() => onNavigate('scan_record')}
          className="h-9 px-4 rounded-full bg-accent text-[#003919] font-label-sm text-11 uppercase tracking-wider font-bold shadow-sm hover:opacity-90 flex-shrink-0 transition-opacity cursor-pointer"
        >
          Record Voice
        </button>
      </div>
    </div>
  );
};
