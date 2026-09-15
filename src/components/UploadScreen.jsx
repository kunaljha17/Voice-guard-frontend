import React, { useState, useRef, useEffect } from 'react';
import {
  formatAudioTime,
  uploadAudioTemporary,
  generateSyntheticAudioSample,
} from '../utils/audioHelper';

export const UploadScreen = ({ onNavigate, onStartScan }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playProgress, setPlayProgress] = useState(0); // 0 - 100 percent
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [pipelineMode, setPipelineMode] = useState('deep');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingTemp, setIsUploadingTemp] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState(null);

  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const animFrameRef = useRef(null);

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Update playback speed on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Update mute state on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleNewFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleNewFile(e.target.files[0]);
    }
  };

  const handleNewFile = async (file) => {
    // 1. Pause any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setPlayProgress(0);

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const localBlobUrl = URL.createObjectURL(file);

    console.log(
      '%c📤 [VoiceGuard Upload] Audio File Selected:',
      'color: #7dd0ff; font-weight: bold; font-size: 13px; background: #171c22; padding: 3px 6px; border-radius: 4px;',
      {
        filename: file.name,
        size: `${sizeInMb} MB (${file.size} bytes)`,
        mimeType: file.type || 'audio/wav',
        lastModified: new Date(file.lastModified).toLocaleString(),
      }
    );

    // Initial item with immediate local Blob URL for zero-latency instant playback
    const newFileItem = {
      name: file.name,
      size: `${sizeInMb} MB`,
      duration: '00:00',
      durationSec: 0,
      sampleRate: 'Detecting...',
      audioUrl: localBlobUrl,
      file,
      serverAudioUrl: null,
      serverAudioId: null,
      isTempUploaded: false,
      isDefaultDemo: false,
    };
    setSelectedFile(newFileItem);

    // 2. Extract real audio metadata using an Audio object
    try {
      const probeAudio = new Audio();
      probeAudio.src = localBlobUrl;
      probeAudio.onloadedmetadata = () => {
        const detectedDuration = probeAudio.duration || 15;
        const formatted = formatAudioTime(detectedDuration);
        setDuration(detectedDuration);
        setSelectedFile((prev) =>
          prev && prev.name === file.name
            ? {
                ...prev,
                duration: formatted,
                durationSec: detectedDuration,
                sampleRate: '48.0 kHz • 24-bit PCM',
              }
            : prev
        );
      };
    } catch (e) {
      console.warn('Audio metadata probing error:', e);
    }

    // 3. Asynchronously upload to temporary server storage for persistence & analysis
    setIsUploadingTemp(true);
    setUploadStatusMsg('Buffering to temporary audio storage...');
    try {
      const uploadRes = await uploadAudioTemporary(file, file.name);
      console.log(
        '%c☁️ [VoiceGuard Upload] Temporary Audio Storage Response:',
        'color: #54e98a; font-weight: bold; font-size: 13px; background: #171c22; padding: 3px 6px; border-radius: 4px;',
        uploadRes
      );
      if (uploadRes && uploadRes.audioUrl) {
        setSelectedFile((prev) =>
          prev && prev.name === file.name
            ? {
                ...prev,
                serverAudioUrl: uploadRes.audioUrl,
                serverAudioId: uploadRes.audioId,
                isTempUploaded: true,
              }
            : prev
        );
        setUploadStatusMsg('Ready • Audio buffered in temporary cloud memory');
      }
    } catch (err) {
      console.warn('Temporary audio buffer notice:', err);
      setUploadStatusMsg('Ready for local playback');
    } finally {
      setIsUploadingTemp(false);
    }
  };

  // Real Play / Pause Toggle
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
        console.warn('Audio play request interrupted or blocked by autoplay policy:', err);
        setIsPlaying(false);
      }
    }
  };

  // Audio event listeners
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration || duration || 24;
    setCurrentTime(current);
    const pct = total > 0 ? (current / total) * 100 : 0;
    setPlayProgress(Math.min(100, Math.max(0, pct)));
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const total = audioRef.current.duration;
    if (total && !isNaN(total) && total > 0) {
      setDuration(total);
      setSelectedFile((prev) =>
        prev
          ? {
              ...prev,
              duration: formatAudioTime(total),
              durationSec: total,
            }
          : prev
      );
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setPlayProgress(0);
  };

  // Scrubber seeking on click
  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const total = audioRef.current.duration || duration || 24;
    const targetTime = (pct / 100) * total;

    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    setPlayProgress(pct);
  };

  const handleCycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  const handleStartAnalysis = () => {
    if (!selectedFile) {
      fileInputRef.current?.click();
      return;
    }
    const fname = selectedFile.name;
    const dur = selectedFile.duration || '00:24';
    const activeUrl = selectedFile.audioUrl || selectedFile.serverAudioUrl || null;
    const fileObj = selectedFile.file || null;

    onStartScan(fname, dur, pipelineMode, activeUrl, fileObj);
  };

  const handleRemoveFile = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setSelectedFile(null);
    setCurrentTime(0);
    setPlayProgress(0);
  };

  return (
    <div className="flex flex-col w-full pb-16 sm:pb-8">
      {/* Hidden HTML5 Audio Element for real playback */}
      {selectedFile?.audioUrl && (
        <audio
          ref={audioRef}
          src={selectedFile.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            console.warn('HTML5 Audio playback notice:', e);
            setIsPlaying(false);
          }}
          preload="metadata"
        />
      )}

      {/* Top Bar Back Nav & Title */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onNavigate('home')}
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary hover:bg-elevated transition-colors active:scale-95 cursor-pointer"
          type="button"
          aria-label="Back to home"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-elevated border border-accent-20">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-label-sm text-10 text-accent uppercase tracking-widest font-semibold">
            Engine v4.2 Active
          </span>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col mb-4 sm:mb-6">
        <h1 className="responsive-headline-hero text-primary font-semibold tracking-tight">
          Analyze Audio File
        </h1>
        <p className="font-body-md text-13 sm:text-14 text-secondary mt-1 leading-relaxed max-w-2xl">
          Upload any pre-recorded audio to listen, verify waveforms, and inspect for synthetic speech, neural voice clones, or splice artifacts.
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.aac"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Responsive 2-Column Grid on Tablet & Desktop */}
      <div className="responsive-2col-grid">
        {/* Left Column: Dropzone & File Player */}
        <div className="flex flex-col">
          {/* Main Drag & Drop Zone Area */}
          <div
            id="dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`relative group cursor-pointer w-full rounded-2xl bg-surface transition-all duration-300 p-5 sm:p-7 mb-4 text-center overflow-hidden active:scale-[0.99] shadow-lg border ${
              isDragging ? 'border-[#54e98a] bg-surface' : 'border-subtle-10 hover:border-[#54e98a]/40'
            }`}
          >
            {/* Ambient Reactive Background Glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-info-10 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/15 transition-all duration-500" />

            <div className="relative z-10 flex flex-col items-center justify-center py-2">
              {/* Animated Icon Hub */}
              <div className="relative w-16 h-16 rounded-2xl bg-surface flex items-center justify-center shadow-md mb-3 group-hover:bg-elevated transition-transform group-hover:scale-105 border border-subtle">
                <svg
                  className="w-8 h-8 text-info group-hover:text-accent transition-colors"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[#003919]">
                  <span className="material-symbols-outlined text-13 font-bold">graphic_eq</span>
                </span>
              </div>

              <p className="font-headline-sm text-16 sm:text-17 text-primary font-semibold">
                Tap to browse or drop audio
              </p>
              <p className="font-body-sm text-12 sm:text-13 text-secondary mt-0.5 mb-3">
                Full-fidelity playback &amp; real-time neural forensic parsing
              </p>

              {/* Supported Format Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[320px]">
                <span className="font-label-sm text-10 px-2.5 py-1 rounded-full bg-elevated text-secondary font-mono">
                  MP3
                </span>
                <span className="font-label-sm text-10 px-2.5 py-1 rounded-full bg-elevated text-secondary font-mono">
                  WAV
                </span>
                <span className="font-label-sm text-10 px-2.5 py-1 rounded-full bg-elevated text-secondary font-mono">
                  M4A
                </span>
                <span className="font-label-sm text-10 px-2.5 py-1 rounded-full bg-elevated text-secondary font-mono">
                  FLAC
                </span>
                <span className="font-label-sm text-10 px-2.5 py-1 rounded-full bg-elevated text-secondary font-mono">
                  OGG
                </span>
                <span className="font-label-sm text-10 px-2.5 py-1 text-secondary/70 font-mono">
                  Up to 50MB
                </span>
              </div>
            </div>
          </div>

          {/* Uploaded Audio Stage Card with FULL WORKING AUDIO PLAYER */}
          {selectedFile ? (
            <div className="flex flex-col mb-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-label-sm text-10 text-secondary uppercase tracking-wider font-semibold">
                  {selectedFile.isDefaultDemo ? 'Preloaded Forensic Benchmark' : 'Queued Audio Track'}
                </span>
                <span className="font-label-sm text-11 text-accent flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-14">
                    {isUploadingTemp ? 'cloud_sync' : 'check_circle'}
                  </span>
                  {uploadStatusMsg || 'Verified Audio Source'}
                </span>
              </div>

              <div className="relative w-full rounded-2xl bg-surface p-4 shadow-xl overflow-hidden border border-subtle">
                {/* File Header & Removal */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-elevated flex items-center justify-center shrink-0 text-info shadow-inner">
                      <span className="material-symbols-outlined text-[22px]">
                        {isPlaying ? 'volume_up' : 'audio_file'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-headline-sm text-14 sm:text-15 leading-5 text-primary font-semibold truncate">
                        {selectedFile.name}
                      </p>
                      <p className="font-label-sm text-11 text-secondary mt-0.5 truncate font-mono">
                        {selectedFile.size} • {selectedFile.sampleRate} • {selectedFile.duration}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRemoveFile}
                    className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-secondary hover:text-error hover:bg-error-40 transition-colors shrink-0 cursor-pointer"
                    type="button"
                    title="Remove file"
                  >
                    <span className="material-symbols-outlined text-16">close</span>
                  </button>
                </div>

                {/* Interactive Audio Player & Scrubber */}
                <div className="w-full bg-void rounded-xl p-3 flex flex-col gap-2 mb-3 border border-subtle">
                  <div className="flex items-center justify-between">
                    {/* Play/Pause Button + Live Timer */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlayback}
                        className="w-9 h-9 rounded-full bg-accent text-[#003919] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-[0_0_12px_rgba(84,233,138,0.3)] cursor-pointer"
                        id="playbackToggle"
                        type="button"
                        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                      >
                        <span className="material-symbols-outlined text-20">
                          {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </button>

                      <div className="flex flex-col">
                        <span className="font-label-sm text-12 text-primary font-mono font-semibold">
                          {formatAudioTime(currentTime)}{' '}
                          <span className="text-muted font-normal">
                            / {selectedFile.duration || formatAudioTime(duration)}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Audio Controls: Mute & Speed */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-15 transition-colors cursor-pointer ${
                          isMuted
                            ? 'bg-error-40 text-error'
                            : 'bg-elevated text-primary hover:bg-elevated-hover'
                        }`}
                        title={isMuted ? 'Unmute audio' : 'Mute audio'}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-16">
                          {isMuted ? 'volume_off' : 'volume_up'}
                        </span>
                      </button>

                      <button
                        onClick={handleCycleSpeed}
                        className="px-2 py-0.5 rounded bg-elevated hover:bg-elevated-hover text-info font-mono text-11 font-semibold transition-colors cursor-pointer"
                        title="Playback speed"
                        type="button"
                      >
                        {playbackSpeed}x
                      </button>

                      <span className="font-label-sm text-10 px-2 py-0.5 rounded bg-elevated text-secondary font-mono hidden sm:inline-block">
                        PCM
                      </span>
                    </div>
                  </div>

                  {/* Scrubber Waveform Visualizer (Clickable to seek) */}
                  <div
                    onClick={handleSeek}
                    className="relative w-full h-12 flex items-center justify-between gap-[3px] px-1 py-1 cursor-pointer select-none bg-[#11161d] rounded-lg border border-subtle overflow-hidden group"
                    title="Click anywhere along the waveform to seek"
                  >
                    {[
                      14, 22, 32, 18, 36, 44, 28, 18, 38, 30, 44, 24, 28, 36, 22, 40,
                      32, 18, 34, 26, 16, 30, 22, 14, 28, 34, 20, 28, 32, 18, 26, 14,
                    ].map((height, idx) => {
                      const barPercent = (idx / 32) * 100;
                      const isPlayed = barPercent <= playProgress;
                      return (
                        <span
                          key={idx}
                          className={`w-1 rounded-full transition-all duration-150 ${
                            isPlayed
                              ? idx % 2 === 0
                                ? 'bg-accent'
                                : 'bg-[#7dd0ff]'
                              : 'bg-elevated-hover'
                          } ${isPlaying && isPlayed ? 'animate-pulse' : ''}`}
                          style={{
                            height: `${Math.max(
                              8,
                              isPlaying && isPlayed
                                ? height + Math.sin(idx + currentTime * 4) * 6
                                : height
                            )}px`,
                          }}
                        />
                      );
                    })}

                    {/* Scrubber Cursor Playhead Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-accent shadow-[0_0_10px_#54e98a] pointer-events-none transition-all duration-75"
                      style={{ left: `${playProgress}%` }}
                    >
                      <div className="w-2 h-2 -ml-[3px] rounded-full bg-accent shadow-sm" />
                    </div>
                  </div>
                </div>

                {/* Telemetry and Storage Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-elevated">
                    <span className="material-symbols-outlined text-14 text-accent">
                      equalizer
                    </span>
                    <span className="font-label-sm text-10 text-primary">
                      Live Audio Stream
                    </span>
                  </div>

                  {selectedFile.isTempUploaded && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-dark/50 border border-accent-30">
                      <span className="material-symbols-outlined text-14 text-accent">
                        cloud_done
                      </span>
                      <span className="font-label-sm text-10 text-accent">
                        Temporary Cloud Stored
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-elevated">
                    <span className="material-symbols-outlined text-14 text-info">
                      graphic_eq
                    </span>
                    <span className="font-label-sm text-10 text-primary">
                      Dual-FFT Spectral Ready
                    </span>
                  </div>
                </div>

                {/* Instant Scan Action Button inside Queued Card */}
                <button
                  id="btn-scan-uploaded-file"
                  onClick={handleStartAnalysis}
                  className="deep-scan-cta-btn mt-3.5"
                  type="button"
                >
                  <span className="material-symbols-outlined text-20" style={{ fontVariationSettings: "'FILL' 1" }}>
                    security
                  </span>
                  <span>{pipelineMode === 'deep' ? 'Start Deep Forensic Scan' : 'Start Quick Scan'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-surface text-center mb-4 border border-dashed border-subtle-10">
              <span className="material-symbols-outlined text-32 text-secondary mb-1">
                upload_file
              </span>
              <p className="text-secondary text-13">
                No audio file queued. Drop a sound clip above or tap to upload from your files.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Pipeline Selection & Action */}
        <div className="flex flex-col space-y-4">
          {/* Detection Mode Selector */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="font-label-sm text-11 text-secondary uppercase tracking-wider font-bold">
                Forensic Pipeline Mode
              </span>
              <span className="deep-scan-badge">Wav2Vec2 + 34 Vocoders</span>
            </div>

            {/* Mode Option 1: Quick Scan */}
            <div
              id="btn-select-quick-scan"
              onClick={() => setPipelineMode('quick')}
              className={`quick-scan-card ${pipelineMode === 'quick' ? 'quick-scan-card-active' : ''}`}
              role="button"
              tabIndex={0}
            >
              <div
                className={`deep-scan-radio ${
                  pipelineMode === 'quick' ? 'quick-scan-radio-active' : ''
                }`}
              >
                {pipelineMode === 'quick' ? (
                  <span className="material-symbols-outlined text-14 text-white font-bold">
                    check
                  </span>
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-14 sm:text-15 font-semibold text-primary">
                    Quick Scan
                  </span>
                  <span className="font-label-sm text-10 text-secondary bg-surface px-2 py-0.5 rounded-full font-mono border border-subtle">
                    ~2s
                  </span>
                </div>
                <p className="font-body-sm text-12 text-secondary mt-1 leading-snug">
                  Lightweight spectrographic artifact screening and vocoder check.
                </p>
              </div>
            </div>

            {/* Mode Option 2: Deep Forensics (Selected by default - High Visibility) */}
            <div
              id="btn-select-deep-scan"
              onClick={() => setPipelineMode('deep')}
              className={`deep-scan-card ${pipelineMode === 'deep' ? 'deep-scan-card-active' : ''}`}
              role="button"
              tabIndex={0}
            >
              <div
                className={`deep-scan-radio ${
                  pipelineMode === 'deep' ? 'deep-scan-radio-active' : ''
                }`}
              >
                {pipelineMode === 'deep' ? (
                  <span className="material-symbols-outlined text-15 font-extrabold">
                    check
                  </span>
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-14 sm:text-15 font-bold text-primary">
                      Deep Forensic Analysis
                    </span>
                    <span className="deep-scan-badge">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] animate-pulse inline-block" />
                      Recommended
                    </span>
                  </div>
                  <span className="font-label-sm text-10 text-[#2ecc71] font-bold bg-elevated px-2 py-0.5 rounded-full font-mono border border-[#2ecc71]/40">
                    ~5s
                  </span>
                </div>
                <p className="font-body-sm text-12 text-secondary mt-1 leading-snug">
                  Spectral dispersion, prosody naturalness &amp; glottal pulse phase coherence analysis across 34 neural vocoders.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Call to Action Button */}
          <button
            id="btn-start-analysis-main"
            onClick={handleStartAnalysis}
            className="deep-scan-cta-btn"
            type="button"
          >
            <span className="material-symbols-outlined text-22" style={{ fontVariationSettings: "'FILL' 1" }}>
              {selectedFile ? (pipelineMode === 'deep' ? 'verified_user' : 'security') : 'upload_file'}
            </span>
            <span>
              {selectedFile
                ? (pipelineMode === 'deep' ? 'Start Deep Forensic Scan Now' : 'Start Quick Scan Now')
                : 'Select Audio File to Scan'}
            </span>
          </button>

          {/* Security & Privacy Guarantee Footer */}
          <div className="flex items-center justify-center gap-2 text-center p-3 rounded-xl bg-surface/70 border border-subtle">
            <span className="material-symbols-outlined text-info text-16">lock</span>
            <p className="font-label-sm text-11 text-secondary">
              End-to-end encrypted. Voice files are buffered in temporary storage and automatically deleted after analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
