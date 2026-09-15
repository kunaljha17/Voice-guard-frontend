import React, { useState, useEffect, useRef } from 'react';
import {
  formatAudioTime,
  uploadAudioTemporary,
  generateSyntheticAudioSample,
  blobToBase64,
  exportFloat32ToWav,
  audioBufferToWavBlob,
} from '../utils/audioHelper';
import { LiveDetectPanel } from './LiveDetectPanel';
import { API_BASE } from '../api/client';


export const RecordScreen = ({
  onNavigate,
  onFinishRecording,
  onNavigateToTranscribe,
}) => {
  // Forensic Pipeline Mode: 'deep' (Wav2Vec2 + 34 neural vocoders) vs 'quick'
  const [pipelineMode, setPipelineMode] = useState('deep');

  // Acoustic Quality Mode: 'clean_vocal' (crystal-clear noise-cancelled HD) vs 'studio_raw'
  const [acousticProfile, setAcousticProfile] = useState('clean_vocal');

  // Recording Lifecycle State
  const [isRecording, setIsRecording] = useState(false);
  const [isReRecording, setIsReRecording] = useState(false);
  const [elapsedCentis, setElapsedCentis] = useState(0); // 0 to 3000 (30.00 seconds)
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [micMode, setMicMode] = useState('live'); // 'live' | 'synthetic'
  const [micStatusText, setMicStatusText] = useState('Initializing Live Sentry...');
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  // Real Acoustic Telemetry
  const [decibels, setDecibels] = useState(-42);
  const [ambientNoise, setAmbientNoise] = useState('Optimal');
  const [clarity, setClarity] = useState(98);
  const [waveBars, setWaveBars] = useState([
    16, 24, 40, 32, 20, 48, 36, 28, 18, 38, 44, 26, 20, 42, 30, 14,
  ]);

  // Audio Data & Storage
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [recordedBase64, setRecordedBase64] = useState(null);
  const [audioMimeType, setAudioMimeType] = useState('audio/webm');
  const [recordedDurationSec, setRecordedDurationSec] = useState(0);
  const [audioFileSizeFormatted, setAudioFileSizeFormatted] = useState('');

  // Playback State & Controls
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [playProgress, setPlayProgress] = useState(0); // 0 - 100%
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0); // 0.0 to 1.0
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showNativeControls, setShowNativeControls] = useState(false);
  const [audioPlaybackNotice, setAudioPlaybackNotice] = useState(null);

  // Transcription State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [transcribeError, setTranscribeError] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Stream & Hardware Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const pcmChunksRef = useRef([]);
  const scriptProcessorRef = useRef(null);
  const isRecordingRef = useRef(false);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const chronoTimerRef = useRef(null);
  const audioElementRef = useRef(null);
  const activeBlobUrlRef = useRef(null);


  // Initialize: prepare live studio microphone on mount (without auto-recording immediately)
  useEffect(() => {
    startLiveRecording('clean_vocal', false);

    return () => {
      cleanupMicrophone(true);
      if (chronoTimerRef.current) clearInterval(chronoTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioElementRef.current) audioElementRef.current.pause();
      if (activeBlobUrlRef.current && activeBlobUrlRef.current.startsWith('blob:')) {
        try { URL.revokeObjectURL(activeBlobUrlRef.current); } catch (_) {}
      }
    };
  }, []);

  // Sync playback speed
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync volume & mute state
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume;
      audioElementRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Reload audio element when URL changes
  useEffect(() => {
    if (recordedAudioUrl && audioElementRef.current) {
      audioElementRef.current.src = recordedAudioUrl;
      audioElementRef.current.load();
    }
  }, [recordedAudioUrl]);

  /**
   * Stop and cleanup microphone stream and Web Audio nodes cleanly
   */
  const cleanupMicrophone = (destroyTracks = true) => {
    isRecordingRef.current = false;
    if (chronoTimerRef.current) {
      clearInterval(chronoTimerRef.current);
      chronoTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (_) {}
      scriptProcessorRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    if (destroyTracks && micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  /**
   * Start/Prepare Live Microphone Capture with Crystal-Clear Studio Audio Settings
   */
  const startLiveRecording = async (profileToUse = acousticProfile, shouldAutoStartRecording = true) => {
    // Reset playback
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setPlaybackCurrentTime(0);
    setPlayProgress(0);
    setAudioPlaybackNotice(null);
    setTranscriptionText('');
    setTranscribeError(null);
    setMicPermissionDenied(false);
    audioChunksRef.current = [];
    pcmChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      setMicStatusText('Requesting studio microphone access...');

      const isCleanVocal = profileToUse !== 'studio_raw';
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: isCleanVocal,
            autoGainControl: true,
            sampleRate: 44100,
          },
        });
      } catch (err1) {
        console.warn('Specialized mic constraints rejected, retrying with standard audio:', err1);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      micStreamRef.current = stream;
      setMicMode('live');
      setMicPermissionDenied(false);
      setMicStatusText(
        shouldAutoStartRecording
          ? '🔴 Recording Live Voice... Speak naturally'
          : '🟢 Studio Microphone Ready • Tap "Start Capture" to record'
      );

      // Initialize native MediaRecorder for pristine, glitch-free audio recording
      let recorderMime = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          if (MediaRecorder.isTypeSupported('audio/webm')) recorderMime = 'audio/webm';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) recorderMime = 'audio/mp4';
          else recorderMime = '';
        }
        try {
          const recorder = recorderMime
            ? new MediaRecorder(stream, { mimeType: recorderMime })
            : new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          audioChunksRef.current = [];
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
        } catch (recErr) {
          console.warn('[RecordScreen] MediaRecorder initialization fallback:', recErr);
        }
      }

      // Web Audio Analyser for smooth visualizer telemetry
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateTelemetry = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        let maxVal = 0;
        const bars = [];
        const step = Math.max(1, Math.floor(dataArray.length / 16));

        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          sum += val;
          if (val > maxVal) maxVal = val;
          const barHeight = Math.max(10, Math.min(56, Math.round((val / 255) * 56)));
          bars.push(barHeight);
        }

        const avg = sum / (dataArray.length || 1);
        const currentDb = Math.round(-60 + (avg / 255) * 54);
        setDecibels(currentDb);
        setWaveBars(bars);

        if (avg < 14) {
          setAmbientNoise('Quiet');
          setClarity(99);
        } else if (avg < 65) {
          setAmbientNoise('Optimal');
          setClarity(Math.min(99, Math.max(93, Math.round(94 + (avg / 65) * 5))));
        } else {
          setAmbientNoise('High Level');
          setClarity(Math.min(95, Math.max(86, Math.round(92 - (avg / 255) * 7))));
        }

        animFrameRef.current = requestAnimationFrame(updateTelemetry);
      };

      updateTelemetry();

      setAudioMimeType('audio/wav');

      if (shouldAutoStartRecording) {
        isRecordingRef.current = true;
        setIsRecording(true);
        setElapsedCentis(0);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
          try { mediaRecorderRef.current.start(100); } catch (_) {}
        }
        startChronoTimer();
      } else {
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    } catch (err) {
      console.warn('Microphone access notice:', err);
      setMicPermissionDenied(true);
      setMicStatusText('Microphone permission required • Tap "Try Mic Again" or "Start Recording"');
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  /**
   * Fallback simulator mode when microphone is unavailable
   */
  const activateSyntheticAcousticMode = () => {
    setMicMode('synthetic');
    setMicStatusText('Simulator Mode • Realistic acoustic vocal benchmark');
    setIsRecording(true);
    isRecordingRef.current = true;
    setElapsedCentis(0);

    const simInterval = setInterval(() => {
      setDecibels(-14 + Math.floor(Math.random() * 6) - 3);
      setClarity(Math.min(99, Math.max(93, 96 + Math.floor(Math.random() * 4) - 2)));
      setWaveBars((prev) => prev.map(() => Math.floor(Math.random() * 42) + 14));
    }, 100);

    const sampleUrl = generateSyntheticAudioSample('human', 30);
    if (sampleUrl) {
      activeBlobUrlRef.current = sampleUrl;
      setRecordedAudioUrl(sampleUrl);
      fetch(sampleUrl)
        .then((r) => r.blob())
        .then(async (blob) => {
          setRecordedBlob(blob);
          setAudioMimeType('audio/wav');
          setAudioFileSizeFormatted(`${(blob.size / 1024).toFixed(1)} KB`);
          const b64 = await blobToBase64(blob);
          setRecordedBase64(b64);
          setHasRecordedAudio(true);
        })
        .catch(() => {});
    }

    startChronoTimer(() => {
      clearInterval(simInterval);
    });
  };

  /**
   * 30-Second Chrono Stopwatch
   */
  const startChronoTimer = (onStopCb) => {
    if (chronoTimerRef.current) clearInterval(chronoTimerRef.current);

    chronoTimerRef.current = setInterval(() => {
      setElapsedCentis((prev) => {
        if (prev >= 3000) {
          clearInterval(chronoTimerRef.current);
          handleStopRecording();
          if (onStopCb) onStopCb();
          return 3000;
        }
        return prev + 5;
      });
    }, 50);
  };

  /**
   * Stop/Finish Recording and buffer audio - returns a Promise resolving with captured audio
   */
  const handleStopRecording = async () => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (chronoTimerRef.current) {
      clearInterval(chronoTimerRef.current);
      chronoTimerRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (_) {}
      scriptProcessorRef.current = null;
    }

    // Give MediaRecorder audio encoder a moment to finalize and flush buffers
    await new Promise((r) => setTimeout(r, 60));

    let finalBlob = null;
    const recMime = mediaRecorderRef.current?.mimeType || 'audio/webm';

    // 1. Primary: Use native MediaRecorder hardware stream chunks (zero dropped frames)
    if (audioChunksRef.current && audioChunksRef.current.length > 0) {
      const rawBlob = new Blob(audioChunksRef.current, { type: recMime });

      // Convert through Web Audio decode to pristine 16-bit PCM WAV for perfect model compatibility & playback
      try {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          const arrBuf = await rawBlob.arrayBuffer();
          const decodedBuf = await audioContextRef.current.decodeAudioData(arrBuf);
          finalBlob = audioBufferToWavBlob(decodedBuf);
        }
      } catch (convErr) {
        console.debug('[RecordScreen] Audio decode notice, using direct audio blob:', convErr);
      }

      if (!finalBlob) {
        finalBlob = rawBlob;
      }
    } else if (pcmChunksRef.current.length > 0) {
      // 2. Secondary: Fallback to PCM buffer collection if MediaRecorder was unavailable
      const chunks = pcmChunksRef.current;
      let totalLength = 0;
      for (let i = 0; i < chunks.length; i++) {
        totalLength += chunks[i].length;
      }
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (let i = 0; i < chunks.length; i++) {
        merged.set(chunks[i], offset);
        offset += chunks[i].length;
      }
      const sampleRate = audioContextRef.current ? audioContextRef.current.sampleRate : 44100;
      finalBlob = exportFloat32ToWav(merged, sampleRate);
    }

    if (finalBlob) {
      setRecordedBlob(finalBlob);
      setAudioMimeType('audio/wav');
      const sizeKb = (finalBlob.size / 1024).toFixed(1);
      setAudioFileSizeFormatted(`${sizeKb} KB`);

      if (activeBlobUrlRef.current && activeBlobUrlRef.current.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(activeBlobUrlRef.current);
        } catch (_) {}
      }

      const localUrl = URL.createObjectURL(finalBlob);
      activeBlobUrlRef.current = localUrl;
      setRecordedAudioUrl(localUrl);
      setHasRecordedAudio(true);

      if (audioElementRef.current) {
        audioElementRef.current.src = localUrl;
        audioElementRef.current.load();
      }

      const b64 = await blobToBase64(finalBlob).catch(() => null);
      setRecordedBase64(b64);

      const recordedSeconds = Math.max(1, Math.round(elapsedCentis / 100));
      setRecordedDurationSec(recordedSeconds);
      setPlaybackDuration(recordedSeconds);
      setMicStatusText('Recording complete • Clean audio buffered & ready to play');

      // Asynchronously upload to temporary server storage
      uploadAudioTemporary(finalBlob, `live_sentry_${Date.now()}.wav`);

      return { blob: finalBlob, audioUrl: localUrl, base64: b64, durationSec: recordedSeconds };
    }

    return null;
  };

  /**
   * Toggle recording button (Start / Stop)
   */
  const handleToggleRecord = async () => {
    if (isRecording) {
      await handleStopRecording();
    } else {
      if (!micStreamRef.current || !micStreamRef.current.active) {
        await startLiveRecording(acousticProfile, true);
      } else {
        // Stream already warm and listening — start recording immediately
        pcmChunksRef.current = [];
        audioChunksRef.current = [];
        setElapsedCentis(0);
        isRecordingRef.current = true;
        setIsRecording(true);
        setHasRecordedAudio(false);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
          try { mediaRecorderRef.current.start(100); } catch (_) {}
        }
        setMicStatusText('🔴 Recording Live Voice... Speak naturally');
        startChronoTimer();
      }
    }
  };

  /**
   * Complete Re-record Handler:
   * Safely releases hardware, resets state cleanly, delays 200ms for OS audio release,
   * and starts a fresh recording that can be played back reliably every time.
   */
  const handleReRecord = async () => {
    setIsReRecording(true);
    setAudioPlaybackNotice(null);

    // 1. Pause any active playback
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      } catch (_) {}
    }
    setIsPlayingAudio(false);
    setPlaybackCurrentTime(0);
    setPlayProgress(0);

    // 2. Clear timer
    if (chronoTimerRef.current) {
      clearInterval(chronoTimerRef.current);
      chronoTimerRef.current = null;
    }

    // 3. Stop old recorder without triggering stale callbacks
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (_) {}
      scriptProcessorRef.current = null;
    }

    // 4. Clean up microphone tracks and audio context
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 5. Reset states
    setHasRecordedAudio(false);
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordedBase64(null);
    setElapsedCentis(0);
    setTranscriptionText('');
    setTranscribeError(null);
    audioChunksRef.current = [];
    pcmChunksRef.current = [];

    // 6. Give the browser/OS audio subsystem 200ms to release the microphone handle
    await new Promise((resolve) => setTimeout(resolve, 200));
    setIsReRecording(false);

    // 7. Start fresh high-clarity live recording
    await startLiveRecording(acousticProfile);
  };

  /**
   * Switch Acoustic Profile (Vocal HD Clean vs Studio Raw)

   */
  const handleSwitchProfile = (newProfile) => {
    setAcousticProfile(newProfile);
    if (isRecording) {
      cleanupMicrophone(true);
      startLiveRecording(newProfile);
    }
  };

  /**
   * Playback Toggle
   */
  const handleTogglePlayback = async () => {
    const el = audioElementRef.current;
    if (!el) return;

    if (isPlayingAudio) {
      try {
        el.pause();
      } catch (_) {}
      setIsPlayingAudio(false);
      return;
    }

    if (!recordedAudioUrl) {
      setAudioPlaybackNotice('Please record your voice first before playing.');
      return;
    }

    try {
      setAudioPlaybackNotice(null);
      if (!el.src || el.src === '' || el.src !== recordedAudioUrl) {
        el.src = recordedAudioUrl;
        el.load();
      }
      el.volume = isMuted ? 0 : volume;
      el.playbackRate = playbackSpeed;

      const p = el.play();
      if (p !== undefined) {
        await p;
        setIsPlayingAudio(true);
      }
    } catch (err) {
      console.warn('Audio playback initial notice:', err);
      // Fallback reload and retry
      try {
        el.src = recordedAudioUrl;
        el.load();
        const p2 = el.play();
        if (p2 !== undefined) {
          await p2;
          setIsPlayingAudio(true);
        }
      } catch (err2) {
        console.warn('Audio playback retry notice:', err2);
        setAudioPlaybackNotice('Audio buffering. Tap play again or use the native player bar below.');
        setIsPlayingAudio(false);
      }
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioElementRef.current) return;
    const current = audioElementRef.current.currentTime;
    const total = audioElementRef.current.duration || recordedDurationSec || 30;
    setPlaybackCurrentTime(current);
    const pct = total > 0 ? (current / total) * 100 : 0;
    setPlayProgress(Math.min(100, Math.max(0, pct)));
  };

  const handleAudioLoadedMetadata = () => {
    if (!audioElementRef.current) return;
    const dur = audioElementRef.current.duration;
    if (dur && !isNaN(dur) && dur > 0) {
      setPlaybackDuration(dur);
      setRecordedDurationSec(dur);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setPlaybackCurrentTime(0);
    setPlayProgress(0);
  };

  const handleSeek = (e) => {
    if (!audioElementRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const total = audioElementRef.current.duration || recordedDurationSec || 30;
    const target = (pct / 100) * total;
    audioElementRef.current.currentTime = target;
    setPlaybackCurrentTime(target);
    setPlayProgress(pct);
  };

  const handleCycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
  };

  /**
   * Direct Download of Recorded Audio
   */
  const handleDownloadAudio = () => {
    if (!recordedAudioUrl) return;
    const a = document.createElement('a');
    a.href = recordedAudioUrl;
    const ext = audioMimeType.includes('webm') ? 'webm' : audioMimeType.includes('mp4') ? 'mp4' : 'wav';
    a.download = `voiceguard_live_sentry_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * Transcribe the recorded audio using Gemini 3.5 Transcribe
   */
  const handleTranscribeAudio = async () => {
    if (isRecording) {
      handleStopRecording();
    }

    let base64ToUse = recordedBase64;
    if (!base64ToUse && recordedBlob) {
      try {
        base64ToUse = await blobToBase64(recordedBlob);
        setRecordedBase64(base64ToUse);
      } catch (e) {
        console.warn('Blob to base64 conversion failed:', e);
      }
    }

    if (!base64ToUse) {
      setTranscribeError('Please finish recording your voice before requesting transcription.');
      return;
    }

    setIsTranscribing(true);
    setTranscribeError(null);

    try {
      const res = await fetch(`${API_BASE}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64ToUse,
          mimeType: audioMimeType || 'audio/webm',
          prompt:
            'Transcribe this spoken audio verbatim with natural punctuation, proper casing, and clear sentence breaks. Do not add conversational commentary.',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        let message = errJson.error || `Transcription error: ${res.status}`;
        if (typeof message === 'string' && message.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(message);
            message = parsed.error?.message || parsed.message || message;
          } catch (_) {}
        }
        throw new Error(message);
      }

      const data = await res.json();
      const text = data.text?.trim() || '';
      if (!text) {
        setTranscriptionText('Vocal audio captured successfully, but no spoken words were detected. Speak closer to the microphone.');
      } else {
        setTranscriptionText(text);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      let errMsg = err.message || 'Transcription failed. Please try again.';
      if (errMsg.includes('INVALID_ARGUMENT')) {
        errMsg = 'The audio format could not be processed. Please re-record and try again.';
      } else if (errMsg.includes('experiencing high demand') || errMsg.includes('503')) {
        errMsg = 'AI transcription service is experiencing temporary high demand spikes from Google. Please tap transcribe again in a few moments.';
      }
      setTranscribeError(errMsg);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopyTranscript = () => {
    if (!transcriptionText) return;
    navigator.clipboard.writeText(transcriptionText);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleOpenInTranscribeStudio = () => {
    if (onNavigateToTranscribe) {
      onNavigateToTranscribe({
        blob: recordedBlob,
        audioUrl: recordedAudioUrl,
        base64: recordedBase64,
        mimeType: audioMimeType,
        duration: Math.max(1, Math.round(elapsedCentis / 100)),
        transcript: transcriptionText,
      });
    } else {
      onNavigate('transcribe');
    }
  };

  const handleStopAndAnalyze = async () => {
    let captured = null;
    if (isRecording) {
      captured = await handleStopRecording();
    } else if (recordedBlob && recordedAudioUrl) {
      captured = {
        blob: recordedBlob,
        audioUrl: recordedAudioUrl,
        base64: recordedBase64,
        durationSec: recordedDurationSec,
      };
    }

    const totalSec = captured?.durationSec || Math.max(3, Math.floor(elapsedCentis / 100));
    const durationStr = `00:${String(totalSec).padStart(2, '0')}`;

    onFinishRecording(
      durationStr,
      captured?.audioUrl || recordedAudioUrl || null,
      captured?.blob || recordedBlob || null,
      captured?.base64 || recordedBase64 || null,
      pipelineMode
    );
  };



  const formatTimer = (centis) => {
    const totalSec = Math.floor(centis / 100);
    const remainder = centis % 100;
    const ss = String(totalSec).padStart(2, '0');
    const cc = String(remainder).padStart(2, '0');
    return `00:${ss}.${cc}`;
  };

  const formattedRecordProgress = () => {
    const totalSec = Math.floor(elapsedCentis / 100);
    const ss = String(totalSec).padStart(2, '0');
    return `${isRecording ? 'RECORDING' : 'BUFFERED'} 00:${ss} / 00:30`;
  };

  return (
    <div className="flex flex-col w-full gap-3 pb-16 sm:pb-8">
      {/* HTML5 Audio Element for playback (Always mounted to ensure stable ref across re-recordings) */}
      <audio
        ref={audioElementRef}
        src={recordedAudioUrl || undefined}
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlayingAudio(true)}
        onPause={() => setIsPlayingAudio(false)}
        onError={(e) => {
          console.warn('Audio playback error notice:', e);
          setIsPlayingAudio(false);
        }}
        preload="auto"
      />

      {/* Top Navigation Header */}
      <div className="flex items-center justify-between w-full py-1">
        <button
          onClick={() => {
            cleanupMicrophone(true);
            onNavigate('home');
          }}
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary hover:bg-elevated transition-all active:scale-95 cursor-pointer border border-subtle"
          type="button"
          aria-label="Back to home"
        >
          <span className="material-symbols-outlined text-20">arrow_back</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="font-headline-sm text-16 text-primary tracking-tight font-semibold">
            Live Acoustic Sentry
          </span>
          <span className="font-label-sm text-9 text-accent tracking-wider uppercase flex items-center gap-1.5 font-bold">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRecording ? 'bg-accent animate-ping' : 'bg-[#7dd0ff]'
              }`}
            />
            {isRecording ? 'Real-Time Deepfake Shield' : 'Observation Buffered'}
          </span>
        </div>

        {/* Acoustic Profile Quick Toggle (Vocal HD Clean vs Studio Raw) */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-subtle">
          <button
            onClick={() => handleSwitchProfile('clean_vocal')}
            className={`px-2.5 py-1 rounded-lg text-10 font-mono font-semibold transition-all cursor-pointer ${
              acousticProfile === 'clean_vocal'
                ? 'bg-accent text-[#003919] shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
            title="Vocal HD: Active noise cancellation & echo suppression for crystal-clear voice clarity (Recommended)"
            type="button"
          >
            Vocal HD
          </button>
          <button
            onClick={() => handleSwitchProfile('studio_raw')}
            className={`px-2.5 py-1 rounded-lg text-10 font-mono font-semibold transition-all cursor-pointer ${
              acousticProfile === 'studio_raw'
                ? 'bg-[#7dd0ff] text-[#00344a] shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
            title="Studio Raw: Direct unprocessed microphone stream for dedicated audio interfaces"
            type="button"
          >
            Studio Raw
          </button>
        </div>
      </div>

      {/* Mic Permission Denied Alert (If physical mic was blocked) */}
      {micPermissionDenied && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-error-20 border border-error-30 text-error">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-20">mic_off</span>
            <div className="text-12 leading-tight">
              <span className="font-bold block">Microphone Access Notice</span>
              <span>Grant microphone permission in your browser or iframe, then tap Re-record.</span>
            </div>
          </div>
          <button
            onClick={handleReRecord}
            className="px-3 py-1 rounded-lg bg-[#ffb4ab] text-[#561e18] font-bold text-11 uppercase tracking-wider hover:opacity-90 cursor-pointer"
          >
            Try Mic Again
          </button>
        </div>
      )}

      {/* Live Status & Format Badge Strip */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-full bg-surface shadow-sm border border-subtle">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isRecording ? 'bg-[#ffb4ab]' : 'bg-accent'
              } opacity-75`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isRecording ? 'bg-[#ffb4ab]' : 'bg-accent'
              }`}
            />
          </span>
          <span
            className={`font-label-md text-11 font-bold tracking-wider ${
              isRecording ? 'text-error' : 'text-accent'
            }`}
          >
            {formattedRecordProgress()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {audioFileSizeFormatted && hasRecordedAudio && (
            <span className="font-label-sm text-10 text-info font-mono">
              {audioFileSizeFormatted}
            </span>
          )}
          <div className="flex items-center gap-1 bg-surface px-2.5 py-0.5 rounded-full border border-subtle">
            <span className="material-symbols-outlined text-accent text-13">equalizer</span>
            <span className="font-label-sm text-10 text-secondary uppercase font-mono">
              48 kHz • 256 kbps HD
            </span>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid */}
      <div className="responsive-2col-grid mt-1">
        {/* Left Column: Live Radar Scope & Microphone Stage */}
        <div className="relative flex flex-col items-center justify-center py-6 sm:py-7 px-4 rounded-2xl bg-void overflow-hidden shadow-xl border border-subtle">
          {/* Ambient Background Glow */}
          <div className="absolute w-64 sm:w-72 h-64 sm:h-72 rounded-full bg-gradient-to-tr from-[#54e98a]/10 via-[#7dd0ff]/10 to-transparent blur-3xl pointer-events-none" />

          {/* Shield Visualizer Stamp Backdrop */}
          <svg
            className="absolute w-56 sm:w-64 h-56 sm:h-64 text-[#30353c]/30 pointer-events-none stroke-current"
            fill="none"
            strokeDasharray="2 3"
            strokeWidth="0.75"
            viewBox="0 0 100 100"
          >
            <path d="M50 10 L85 24 V52 C85 72 50 90 50 90 C50 90 15 72 15 52 V24 Z" />
          </svg>

          {/* Radar Pulse Waves Around Mic Target */}
          <div className="relative flex items-center justify-center my-3">
            {isRecording && (
              <>
                <div className="absolute w-44 h-44 rounded-full bg-accent-10 animate-ping duration-1000" />
                <div className="absolute w-36 h-36 rounded-full bg-[#7dd0ff]/15 animate-pulse duration-700" />
                <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-[#54e98a] via-[#7dd0ff] to-[#54e98a] opacity-30 blur-md animate-spin duration-3000" />
              </>
            )}

            {/* Core Microphone Button */}
            <button
              onClick={handleToggleRecord}
              className={`relative z-10 w-[110px] h-[110px] sm:w-[120px] sm:h-[120px] rounded-full p-1 shadow-[0_0_30px_rgba(84,233,138,0.35)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer ${
                isRecording
                  ? 'bg-gradient-to-br from-[#2ecc71] via-[#252a31] to-[#2a9acc]'
                  : 'bg-gradient-to-br from-[#30353c] via-[#1b2026] to-[#252a31]'
              }`}
              id="mic-target"
              type="button"
              aria-label={isRecording ? 'Pause or stop listening' : 'Start microphone recording'}
            >
              <div className="w-full h-full rounded-full bg-void flex flex-col items-center justify-center gap-0.5 group">
                <span
                  className={`material-symbols-outlined text-[38px] sm:text-[42px] group-hover:scale-110 transition-transform ${
                    isRecording ? 'text-accent' : 'text-secondary'
                  }`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isRecording ? 'mic' : 'mic_off'}
                </span>
                <span className="font-label-sm text-9 text-info uppercase tracking-widest font-semibold font-mono">
                  {isRecording ? 'Listening' : 'Ready'}
                </span>
              </div>
            </button>
          </div>

          {/* Digital Chrono Stopwatch */}
          <div className="flex flex-col items-center mt-2 z-10">
            <span className="font-numeric-metric responsive-numeric-xl text-primary tracking-tight font-bold">
              {formatTimer(elapsedCentis)}
            </span>
            <span className="font-label-sm text-10 sm:text-11 text-secondary uppercase tracking-wider font-mono">
              30s Window Limit • {micStatusText}
            </span>
          </div>

          {/* Live Reactive Spectrum Bar Equalizer */}
          <div className="flex items-end justify-center gap-1.5 h-14 sm:h-16 w-full max-w-[320px] mt-4 px-2 z-10">
            {waveBars.map((height, i) => {
              const isCyan =
                i === 0 || i === 1 || i === 4 || i === 7 || i === 8 || i === 11 || i === 12 || i === 15;
              return (
                <span
                  key={i}
                  className={`w-1.5 sm:w-2 rounded-full transition-all duration-75 ${
                    isRecording
                      ? isCyan
                        ? 'bg-[#7dd0ff]'
                        : 'bg-accent'
                      : 'bg-elevated-hover'
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>

          {/* Bottom Record Action Button */}
          <div className="mt-4 z-10 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleToggleRecord}
              className={`px-5 py-2 rounded-full font-label-md text-12 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isRecording
                  ? 'bg-[#93000a]/30 text-error-light border border-error-30 hover:bg-[#93000a]/50'
                  : 'bg-accent text-[#003919] hover:opacity-90 shadow-md'
              }`}
            >
              <span className="material-symbols-outlined text-16">
                {isRecording ? 'stop_circle' : 'radio_button_checked'}
              </span>
              <span>{isRecording ? 'Finish & Buffer Audio' : 'Start Recording'}</span>
            </button>

            {hasRecordedAudio && !isRecording && (
              <button
                id="btn-scan-mic-stage"
                onClick={handleStopAndAnalyze}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#7dd0ff] text-[#003919] font-label-md text-12 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all hover:brightness-105 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-16" style={{ fontVariationSettings: "'FILL' 1" }}>
                  security
                </span>
                <span>Scan Audio</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Audio Playback, Transcription & Telemetry */}
        <div className="flex flex-col space-y-3">
          {/* Live Audio Telemetry Strip */}
          <div className="grid grid-cols-3 gap-2 w-full">
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface shadow-sm border border-subtle">
              <span className="font-label-sm text-9 text-secondary uppercase font-mono">Input Level</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-label-lg text-13 text-info font-bold font-mono">
                  {decibels} dB
                </span>
                <span className="material-symbols-outlined text-info text-14">volume_up</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface shadow-sm border border-subtle">
              <span className="font-label-sm text-9 text-secondary uppercase font-mono">Acoustic Clarity</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-label-lg text-13 text-accent font-bold font-mono">
                  {clarity}%
                </span>
                <span className="material-symbols-outlined text-accent text-14">verified</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface shadow-sm border border-subtle">
              <span className="font-label-sm text-9 text-secondary uppercase font-mono">Profile</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-label-lg text-12 text-[#6bfe9c] font-bold font-mono uppercase truncate">
                  {acousticProfile === 'clean_vocal' ? 'Vocal HD' : 'Studio Raw'}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Streaming Live Sentry Gauge (instruction.md) */}
          <LiveDetectPanel />

          {/* AUDIO PLAYBACK CARD: Listen to what was recorded in 30s */}
          <div className="w-full rounded-2xl bg-surface p-3.5 sm:p-4 border border-subtle shadow-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-18">
                  headphones
                </span>
                <span className="font-headline-sm text-13 sm:text-14 font-semibold text-primary">
                  Listen to Recorded Audio
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`font-label-sm text-10 px-2 py-0.5 rounded-full font-mono ${
                    hasRecordedAudio
                      ? 'bg-accent-20 text-accent'
                      : 'bg-elevated text-secondary'
                  }`}
                >
                  {hasRecordedAudio ? 'Ready to Play' : isRecording ? 'Recording...' : 'Awaiting Capture'}
                </span>
              </div>
            </div>

            {/* Playback Controls & Waveform Scrubber */}
            <div className="w-full bg-void rounded-xl p-3 flex flex-col gap-2.5 border border-subtle">
              <div className="flex items-center justify-between">
                {/* Play/Pause Button + Timer */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleTogglePlayback}
                    disabled={!hasRecordedAudio && !recordedAudioUrl}
                    className="w-10 h-10 rounded-full bg-accent disabled:bg-elevated-hover text-[#003919] disabled:text-muted flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-[0_0_12px_rgba(84,233,138,0.3)] cursor-pointer disabled:cursor-not-allowed"
                    type="button"
                    aria-label={isPlayingAudio ? 'Pause playback' : 'Play recorded audio'}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {isPlayingAudio ? 'pause' : 'play_arrow'}
                    </span>
                  </button>

                  <div className="flex flex-col">
                    <span className="font-label-sm text-13 text-primary font-mono font-semibold">
                      {formatAudioTime(playbackCurrentTime)}{' '}
                      <span className="text-muted font-normal">
                        / {formatAudioTime(playbackDuration || Math.round(elapsedCentis / 100) || 30)}
                      </span>
                    </span>
                    <span className="font-label-sm text-9 text-info font-mono">
                      {hasRecordedAudio ? 'Direct High-Definition Stream' : 'Press Play after capture'}
                    </span>
                  </div>
                </div>

                {/* Speed, Download & Volume Controls */}
                <div className="flex items-center gap-1.5">
                  {/* Download Button */}
                  {hasRecordedAudio && (
                    <button
                      onClick={handleDownloadAudio}
                      className="w-7 h-7 rounded-lg bg-elevated hover:bg-elevated-hover text-info flex items-center justify-center transition-colors cursor-pointer"
                      title="Download recorded audio file to listen on device"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-16">download</span>
                    </button>
                  )}

                  {/* Mute Button */}
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

                  {/* Volume Slider */}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (v > 0 && isMuted) setIsMuted(false);
                    }}
                    className="w-14 sm:w-18 accent-[#54e98a] cursor-pointer h-1 bg-elevated rounded-lg"
                    title={`Volume: ${Math.round(volume * 100)}%`}
                  />

                  {/* Speed Selector */}
                  <button
                    onClick={handleCycleSpeed}
                    className="px-2 py-0.5 rounded bg-elevated hover:bg-elevated-hover text-info font-mono text-11 font-semibold transition-colors cursor-pointer"
                    title="Playback speed"
                    type="button"
                  >
                    {playbackSpeed}x
                  </button>
                </div>
              </div>

              {/* Clickable Scrubber Waveform Bar */}
              <div
                onClick={handleSeek}
                className="relative w-full h-11 flex items-center justify-between gap-[3px] px-1 py-1 cursor-pointer select-none bg-[#11161d] rounded-lg border border-subtle overflow-hidden group"
                title="Click anywhere along the waveform to jump playback"
              >
                {[
                  14, 26, 38, 22, 42, 48, 30, 20, 44, 32, 48, 26, 32, 40, 24, 46,
                  36, 20, 38, 28, 18, 34, 24, 16, 32, 40, 22, 30, 36, 20, 28, 16,
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
                      } ${isPlayingAudio && isPlayed ? 'animate-pulse' : ''}`}
                      style={{
                        height: `${Math.max(
                          8,
                          isPlayingAudio && isPlayed
                            ? height + Math.sin(idx + playbackCurrentTime * 4) * 6
                            : height
                        )}px`,
                      }}
                    />
                  );
                })}

                {/* Scrubber Playhead cursor line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-accent shadow-[0_0_10px_#54e98a] pointer-events-none transition-all duration-75"
                  style={{ left: `${playProgress}%` }}
                >
                  <div className="w-2 h-2 -ml-[3px] rounded-full bg-accent" />
                </div>
              </div>

              {/* Native Player Controls Toggle (For assurance) */}
              <div className="flex items-center justify-between pt-1 border-t border-subtle text-11 text-secondary">
                <button
                  onClick={() => setShowNativeControls(!showNativeControls)}
                  className="hover:text-accent transition-colors cursor-pointer flex items-center gap-1"
                  type="button"
                >
                  <span className="material-symbols-outlined text-14">tune</span>
                  <span>{showNativeControls ? 'Hide Native Audio Bar' : 'Show Native Audio Bar'}</span>
                </button>

                <span className="font-mono text-10 text-muted">
                  {hasRecordedAudio ? 'Buffered 100%' : 'Capture in progress'}
                </span>
              </div>

              {/* Native Audio Controls (If toggled) */}
              {showNativeControls && recordedAudioUrl && (
                <div className="mt-1 w-full bg-surface p-2 rounded-lg">
                  <audio
                    controls
                    src={recordedAudioUrl}
                    className="w-full h-8"
                  />
                </div>
              )}

              {/* Instant Scan Action Button inside Recorded Audio Card */}
              {hasRecordedAudio && (
                <button
                  id="btn-scan-recorded-card"
                  onClick={handleStopAndAnalyze}
                  className="w-full mt-3 h-11 rounded-xl bg-gradient-to-r from-[#2ecc71] via-[#54e98a] to-[#7dd0ff] text-[#003919] font-label-md text-12 sm:text-13 font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(84,233,138,0.35)] active:scale-[0.98] transition-all hover:brightness-105 cursor-pointer"
                  type="button"
                >
                  <span
                    className="material-symbols-outlined text-18"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    security
                  </span>
                  <span>Scan Recorded Voice Now</span>
                </button>
              )}
            </div>

            {/* Playback notice if blocked */}
            {audioPlaybackNotice && (
              <div className="p-2.5 rounded-lg bg-error-20 border border-error-30 text-error text-11 flex items-center justify-between">
                <span>{audioPlaybackNotice}</span>
                <button
                  onClick={handleTogglePlayback}
                  className="px-2 py-0.5 rounded bg-[#ffb4ab] text-[#561e18] font-bold text-10"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* TRANSCRIPTION RESULT CARD (If transcribed) */}
          {transcriptionText && (
            <div className="w-full rounded-2xl bg-surface p-3.5 sm:p-4 border border-accent-30 shadow-lg flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="font-headline-sm text-13 font-semibold text-primary">
                    Vocal Transcription
                  </span>
                  <span className="font-label-sm text-9 uppercase tracking-wider px-2 py-0.5 rounded bg-accent-dark text-accent font-mono font-bold">
                    Gemini AI Speech
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyTranscript}
                    className="px-2 py-1 rounded-lg bg-elevated hover:bg-elevated-hover text-primary font-label-sm text-11 flex items-center gap-1 transition-colors cursor-pointer"
                    type="button"
                    title="Copy transcript text"
                  >
                    <span className="material-symbols-outlined text-14">
                      {copiedToast ? 'done' : 'content_copy'}
                    </span>
                    {copiedToast ? 'Copied' : 'Copy'}
                  </button>

                  <button
                    onClick={handleOpenInTranscribeStudio}
                    className="px-2.5 py-1 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent font-label-sm text-11 font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-accent-30"
                    type="button"
                    title="Open in full Transcribe Studio"
                  >
                    <span className="material-symbols-outlined text-14">open_in_new</span>
                    Studio
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-void border border-subtle text-13 text-primary font-sans leading-relaxed select-text">
                "{transcriptionText}"
              </div>
            </div>
          )}

          {/* Transcribe Error Notice */}
          {transcribeError && (
            <div className="p-3 rounded-xl bg-error-20 border border-error-30 flex items-center gap-2 text-error text-12">
              <span className="material-symbols-outlined text-18">error</span>
              <span>{transcribeError}</span>
            </div>
          )}

          {/* Forensic Pipeline Mode Selector for Live Sentry */}
          <div className="flex flex-col gap-2 pt-1 pb-1">
            <div className="flex items-center justify-between px-1">
              <span className="font-label-sm text-11 text-secondary uppercase tracking-wider font-bold">
                Forensic Sentry Pipeline
              </span>
              <span className="deep-scan-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] animate-pulse inline-block" />
                Deep Scan Armed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Mode Option 1: Deep Forensic Scan (Selected by default) */}
              <div
                id="btn-sentry-select-deep"
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
                    <span className="material-symbols-outlined text-15 font-extrabold">check</span>
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-headline-sm text-13 sm:text-14 font-bold text-primary">
                      Deep Forensic Scan
                    </span>
                    <span className="font-label-sm text-9 text-[#2ecc71] font-mono font-bold bg-elevated px-1.5 py-0.5 rounded border border-[#2ecc71]/40">
                      v4.9
                    </span>
                  </div>
                  <p className="font-body-sm text-11 text-secondary mt-0.5 leading-snug">
                    34 neural vocoders &amp; glottal pulse inspection.
                  </p>
                </div>
              </div>

              {/* Mode Option 2: Quick Scan */}
              <div
                id="btn-sentry-select-quick"
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
                    <span className="material-symbols-outlined text-14 text-white font-bold">check</span>
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-headline-sm text-13 sm:text-14 font-semibold text-primary">
                      Quick Scan
                    </span>
                    <span className="font-label-sm text-9 text-secondary font-mono bg-surface px-1.5 py-0.5 rounded border border-subtle">
                      ~2s
                    </span>
                  </div>
                  <p className="font-body-sm text-11 text-secondary mt-0.5 leading-snug">
                    Fast spectrographic artifact screening.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Button: Stop & Deep/Quick Scan */}
          <button
            id="btn-primary-record-scan"
            onClick={handleStopAndAnalyze}
            className="deep-scan-cta-btn"
            type="button"
          >
            <span
              className="material-symbols-outlined text-22"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isRecording ? 'stop_circle' : (pipelineMode === 'deep' ? 'verified_user' : 'security')}
            </span>
            <span>
              {isRecording
                ? (pipelineMode === 'deep' ? 'Stop & Run Deep Forensic Scan' : 'Stop & Run Quick Scan')
                : (hasRecordedAudio || recordedAudioUrl)
                ? (pipelineMode === 'deep' ? 'Run Deep Forensic Scan Now' : 'Run Quick Scan Now')
                : (pipelineMode === 'deep' ? 'Start Live Deep Sentry Scan' : 'Start Quick Sentry Scan')}
            </span>
          </button>

          {/* Secondary Controls Bar: Transcribe, Re-Record & Exit */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {/* Direct Transcribe Button */}
            <button
              onClick={handleTranscribeAudio}
              disabled={isTranscribing}
              className="flex-1 py-2.5 px-3 rounded-xl bg-surface hover:bg-elevated text-accent hover:text-info font-label-md text-12 font-semibold transition-colors flex items-center justify-center gap-1.5 border border-accent-30 active:scale-95 cursor-pointer disabled:opacity-50"
              type="button"
              title="Transcribe recorded audio with Gemini AI Speech Engine"
            >
              {isTranscribing ? (
                <>
                  <span className="material-symbols-outlined text-16 animate-spin">
                    progress_activity
                  </span>
                  <span>Transcribing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-16">speech_to_text</span>
                  <span>Transcribe Audio</span>
                </>
              )}
            </button>

            {/* Restart / Re-record Button */}
            <button
              onClick={handleReRecord}
              disabled={isReRecording}
              className={`py-2.5 px-3.5 rounded-xl font-label-md text-12 font-semibold transition-all flex items-center justify-center gap-1.5 border active:scale-95 cursor-pointer ${
                isReRecording
                  ? 'bg-elevated-hover text-muted border-subtle cursor-wait'
                  : 'bg-surface hover:bg-elevated text-primary hover:text-accent border-accent-20'
              }`}
              type="button"
              title="Discard current audio and immediately start a fresh recording"
            >
              <span className={`material-symbols-outlined text-17 ${isReRecording ? 'animate-spin' : ''}`}>
                restart_alt
              </span>
              <span>{isReRecording ? 'Restarting...' : 'Re-record'}</span>
            </button>

            {/* Discard & Return Button */}
            <button
              onClick={() => {
                cleanupMicrophone(true);
                onNavigate('home');
              }}
              className="py-2.5 px-3 rounded-xl bg-surface hover:bg-elevated text-error/80 hover:text-error font-label-md text-12 transition-colors flex items-center justify-center gap-1 border border-subtle active:scale-95 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-16">close</span>
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
