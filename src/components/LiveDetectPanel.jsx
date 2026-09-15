import React from 'react';
import { useLiveDetection } from '../utils/useLiveDetection';

/**
 * LiveDetectPanel Component (instruction.md)
 * Provides real-time streaming audio detection directly from the browser mic,
 * feeding continuous raw PCM / high-bitrate audio through WebSocket to the
 * ML inference relay and rendering a live human-vs-cloned score gauge.
 */
export function LiveDetectPanel() {
  const {
    score,
    smoothedScore,
    isLive,
    error,
    statusText,
    captureMethod,
    start,
    stop,
  } = useLiveDetection();

  // Use smoothed score when available to avoid jitter, falling back to raw score
  const displayScore = smoothedScore !== null ? smoothedScore : score;
  const percentage = displayScore !== null ? Math.round(displayScore * 100) : null;

  // Determine gauge styling
  let gaugeClass = 'gauge-neutral';
  let verdictText = 'Analyzing voice...';
  if (percentage !== null) {
    if (percentage >= 50) {
      gaugeClass = 'gauge-cloned';
      verdictText = 'Likely Cloned / Synthetic';
    } else {
      gaugeClass = 'gauge-human';
      verdictText = 'Likely Authentic Human';
    }
  }

  return (
    <div className="live-panel">
      {/* Panel Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${
                isLive ? 'bg-[#ff6b6b] animate-ping opacity-75' : 'bg-accent'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isLive ? 'bg-[#ff6b6b]' : 'bg-accent'
              }`}
            />
          </span>
          <span className="font-headline-sm text-14 text-primary font-bold tracking-tight">
            Live Sentry Stream
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-label-sm text-9 font-mono px-2 py-0.5 rounded-full bg-elevated border border-subtle text-secondary uppercase">
            {captureMethod === 'pcm' ? 'Raw PCM 48kHz' : 'Opus 128kbps'}
          </span>
          <span
            className={`font-label-sm text-9 font-mono px-2 py-0.5 rounded-full ${
              isLive
                ? 'bg-[#93000a]/30 text-error-light border border-error-30'
                : 'bg-surface text-muted border border-subtle'
            }`}
          >
            {isLive ? 'Streaming' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="flex flex-col items-center justify-center my-1 w-full">
        <button
          onClick={isLive ? stop : start}
          className={isLive ? 'live-btn-stop' : 'live-btn-start'}
          type="button"
          id="btn-live-sentry-toggle"
        >
          <span className="material-symbols-outlined text-18">
            {isLive ? 'stop_circle' : 'radio_button_checked'}
          </span>
          <span>{isLive ? 'Stop Live' : 'Start Live'}</span>
        </button>

        <span className="font-label-sm text-10 text-secondary mt-1.5 font-mono">
          {statusText}
        </span>
      </div>

      {/* Live Score Gauge (instruction.md Section 4) */}
      {score !== null && (
        <div className={`score-gauge ${gaugeClass} w-full mt-1`}>
          <div className="text-24 font-bold tracking-tight">
            {percentage}% likely cloned
          </div>
          <div className="text-11 font-medium mt-0.5 opacity-90">
            {verdictText}
          </div>
          {smoothedScore !== null && smoothedScore !== score && (
            <div className="text-9 text-muted font-mono mt-1">
              Raw: {(score * 100).toFixed(0)}% • 3-Chunk Smoothed
            </div>
          )}
        </div>
      )}

      {/* Error / Fallback Status Banner */}
      {error && (
        <div className="w-full text-center p-2 rounded-lg bg-error-dark border border-error-30 text-error-text text-11 font-mono">
          {error}
        </div>
      )}
    </div>
  );
}
export default LiveDetectPanel;
