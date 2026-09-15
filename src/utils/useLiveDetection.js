import { useRef, useState, useCallback, useEffect } from 'react';
import { getWsUrl } from '../api/client';

/**
 * useLiveDetection Hook
 * Streams clean live microphone audio via WebSocket to the inference relay service.
 * Supports:
 * - Continuous uncompressed raw PCM via AudioWorklet (prevents codec warble & robotic distortion)
 * - Automatic fallback to high-bitrate Opus MediaRecorder (128kbps)
 * - Jitter smoothing (averages last 2-3 score readings)
 * - Graceful error recovery and connection status telemetry
 */
export function useLiveDetection() {
  const [score, setScore] = useState(null);
  const [smoothedScore, setSmoothedScore] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState(null);
  const [statusText, setStatusText] = useState('Idle');
  const [recentScores, setRecentScores] = useState([]);
  const [captureMethod, setCaptureMethod] = useState('pcm'); // 'pcm' | 'mediarecorder'

  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);
  const recorderRef = useRef(null);
  const scoreHistoryRef = useRef([]);

  // Calculate smoothed average when score updates
  const updateScores = useCallback((newScore) => {
    scoreHistoryRef.current = [...scoreHistoryRef.current.slice(-2), newScore];
    const avg = scoreHistoryRef.current.reduce((a, b) => a + b, 0) / scoreHistoryRef.current.length;
    setScore(newScore);
    setSmoothedScore(Math.round(avg * 1000) / 1000);
    setRecentScores((prev) => [...prev.slice(-15), { score: newScore, time: Date.now() }]);
    setError(null);
  }, []);

  const stop = useCallback(() => {
    // 1. Stop recorder
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch (_) {}
      recorderRef.current = null;
    }

    // 2. Disconnect AudioWorklet node
    if (workletNodeRef.current) {
      try {
        workletNodeRef.current.disconnect();
      } catch (_) {}
      workletNodeRef.current = null;
    }

    // 3. Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }

    // 4. Stop microphone tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // 5. Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (_) {}
      wsRef.current = null;
    }

    setIsLive(false);
    setStatusText('Live Sentry Stopped');
  }, []);

  const start = useCallback(async () => {
    // Cleanup previous instance if active
    stop();
    setError(null);
    setStatusText('Connecting to Live Sentry...');

    try {
      // 1. Microphone capture with raw speech constraints (Fix #2: disable aggressive DSP)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
            sampleRate: 48000,
          },
        });
      } catch (_) {
        // Fallback to standard getUserMedia
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;

      // 2. Connect to WebSocket route (/live-detect)
      const wsUrl = getWsUrl('/live-detect');

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatusText('🟢 Live Sentry Streaming Active');
        setIsLive(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data.score === 'number') {
            const pct = (data.score * 100).toFixed(1);
            const isFake = data.score >= 0.5;
            console.log(
              `%c[VoiceGuard Live Sentry]%c ${pct}% Likely Cloned %c(${isFake ? '🔴 SYNTHETIC/CLONED' : '🟢 AUTHENTIC HUMAN'})%c [Engine: ${data.engine || 'relay'}]`,
              'background: #10131F; color: #5B7CFF; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
              isFake ? 'color: #ff6b6b; font-weight: bold; font-size: 13px;' : 'color: #4ade80; font-weight: bold; font-size: 13px;',
              isFake ? 'color: #ffb4ab; font-style: italic;' : 'color: #7dd0ff; font-style: italic;',
              'color: #9ba3c2; font-size: 10px;'
            );
            updateScores(data.score);
          } else if (data.error) {
            console.warn('[useLiveDetection] WS notice:', data.error);
            setError('Inference relay notice: waiting for next vocal chunk...');
          }
        } catch (e) {
          console.warn('[useLiveDetection] Message parse error:', e);
        }
      };

      ws.onerror = (e) => {
        console.warn('[useLiveDetection] WebSocket error:', e);
        setError('Live detection connection issue. Check server status.');
      };

      ws.onclose = () => {
        setIsLive(false);
        setStatusText('Disconnected');
      };

      // 3. Audio Streaming Engine: Prefer continuous raw PCM via AudioWorklet (Fix #3)
      let workletInitialized = false;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          const audioContext = new AudioCtx({ sampleRate: 48000 });
          audioContextRef.current = audioContext;
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          await audioContext.audioWorklet.addModule('/pcm-processor.js');
          const source = audioContext.createMediaStreamSource(stream);
          const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor', {
            processorOptions: { sampleRate: 48000, chunkSeconds: 3 },
          });

          workletNode.port.onmessage = (e) => {
            if (ws.readyState === WebSocket.OPEN && e.data) {
              // e.data is Float32Array raw PCM samples
              const buffer = e.data.buffer || e.data;
              ws.send(buffer);
            }
          };

          source.connect(workletNode);
          workletNodeRef.current = workletNode;
          setCaptureMethod('pcm');
          workletInitialized = true;
        } catch (workletErr) {
          console.warn('[useLiveDetection] AudioWorklet init notice, switching to high-bitrate MediaRecorder:', workletErr);
        }
      }

      // Fallback: High-bitrate Opus MediaRecorder (128kbps) (Fix #1)
      if (!workletInitialized) {
        setCaptureMethod('mediarecorder');
        let mimeType = 'audio/webm;codecs=opus';
        if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
        }

        const recorderOptions = {
          audioBitsPerSecond: 128000, // Explicit high bitrate to prevent compression artifacts
        };
        if (mimeType) recorderOptions.mimeType = mimeType;

        const recorder = new MediaRecorder(stream, recorderOptions);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data);
          }
        };

        recorder.start(3000); // 3-second chunks per instruction.md
        recorderRef.current = recorder;
      }
    } catch (err) {
      console.error('[useLiveDetection] Failed to start live audio capture:', err);
      setError(`Microphone permission error: ${err.message}`);
      setStatusText('Microphone access denied or unavailable');
      setIsLive(false);
    }
  }, [stop, updateScores]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    score,
    smoothedScore,
    isLive,
    error,
    statusText,
    recentScores,
    captureMethod,
    start,
    stop,
  };
}
