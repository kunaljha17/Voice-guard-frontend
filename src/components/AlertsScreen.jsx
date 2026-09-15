import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const AlertsScreen = ({
  settings = {},
  onUpdateSettings = () => {},
  onViewLatestIncident = () => {},
}) => {
  const { user, setIsProfileOpen } = useAuth();
  const [showBanner, setShowBanner] = useState(true);
  const [streamMuted, setStreamMuted] = useState(false);
  const [simulatedConfidence, setSimulatedConfidence] = useState(94.5);
  const [savedToast, setSavedToast] = useState(false);

  const safeSettings = settings || {};
  const threshold = safeSettings.highPriorityThreshold ?? 90;
  const isHighPriorityTriggered = simulatedConfidence >= threshold;

  const triggerSavedToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleToggle = (key) => {
    onUpdateSettings({
      ...safeSettings,
      [key]: !safeSettings[key],
    });
    triggerSavedToast();
  };

  const handleSensitivityChange = (val) => {
    onUpdateSettings({
      ...safeSettings,
      sensitivity: val,
    });
    triggerSavedToast();
  };

  const handleThresholdChange = (val) => {
    const clamped = Math.min(99, Math.max(50, isNaN(val) ? 90 : Math.round(val)));
    onUpdateSettings({
      ...safeSettings,
      highPriorityThreshold: clamped,
    });
    triggerSavedToast();
  };

  const getSensitivityLabel = (val) => {
    if (val >= 85) return `High (${val}%)`;
    if (val >= 70) return `Balanced (${val}%)`;
    return `Aggressive (${val}%)`;
  };

  const getThresholdTier = (val) => {
    if (val >= 95) {
      return {
        label: `Critical Only (≥${val}%)`,
        badgeColor: 'bg-[#93000a] text-error-light border border-error-30',
        desc: 'Maximum precision. Only unmistakable, verified deepfakes will fire intrusive alerts.',
      };
    }
    if (val >= 90) {
      return {
        label: `High Priority (≥${val}%)`,
        badgeColor: 'bg-[#ffc37d] text-[#462a00]',
        desc: 'Recommended security balance. Triggers on high-confidence neural synthesis.',
      };
    }
    if (val >= 80) {
      return {
        label: `Balanced (≥${val}%)`,
        badgeColor: 'bg-[#7dd0ff] text-[#00344d]',
        desc: 'Standard forensic threshold. Flags potential clones and suspicious acoustic artifacts.',
      };
    }
    return {
      label: `Sensitive / Broad (≥${val}%)`,
      badgeColor: 'bg-accent text-[#003919]',
      desc: 'Early warning mode. Alert dispatches on any detected vocal irregularities.',
    };
  };

  const currentTier = getThresholdTier(threshold);

  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      {/* Toast Notification for Cloud Sync */}
      {savedToast && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-accent-dark text-accent border border-accent-30 shadow-xl backdrop-blur-md animate-fade-in font-label-md text-12 font-semibold">
          <span className="material-symbols-outlined text-18">cloud_done</span>
          <span>Threshold synced to {user ? 'Cloud account' : 'session'}</span>
        </div>
      )}

      {/* Responsive 2-Column Grid */}
      <div className="responsive-2col-grid">
        {/* Left Column: Simulated Alerts & Notifications */}
        <div className="flex flex-col space-y-4">
          {/* Active In-App Alert Banner with Threshold Gate */}
          {showBanner && (
            <section
              className={`relative overflow-hidden rounded-xl p-3 shadow-lg transition-all duration-300 border ${
                isHighPriorityTriggered
                  ? 'bg-gradient-to-r from-[#93000a] via-[#b3261e] to-[#93000a] border-[#ffb4ab]/40 shadow-[0_12px_28px_rgba(147,0,10,0.5)]'
                  : 'bg-surface border-subtle-10 opacity-90'
              }`}
              id="inAppAlertBanner"
            >
              {/* Animated Glow Pulse Underlay if High Priority */}
              {isHighPriorityTriggered && (
                <div className="absolute -inset-1 bg-gradient-to-r from-[#ffb4ab]/30 to-[#ffc37d]/20 blur-md pointer-events-none animate-pulse" />
              )}

              <div className="relative z-10 flex flex-col gap-2">
                {/* Top Row: Icon + Badge + Dismiss */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`relative flex items-center justify-center w-8 h-8 rounded-lg ${
                        isHighPriorityTriggered
                          ? 'bg-void/80 text-error'
                          : 'bg-elevated text-secondary'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-20 ${
                          isHighPriorityTriggered ? 'animate-bounce' : ''
                        }`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {isHighPriorityTriggered ? 'warning' : 'notifications_off'}
                      </span>
                      {isHighPriorityTriggered && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ffb4ab] rounded-full ring-2 ring-[#93000a]" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-sm text-14 text-primary font-bold tracking-tight">
                        {isHighPriorityTriggered
                          ? '⚠ High-Priority Alert: Voice Cloning'
                          : 'ℹ Alert Suppressed (Below Threshold)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`font-label-sm text-10 font-bold font-mono px-2 py-0.5 rounded-full ${
                        isHighPriorityTriggered
                          ? 'bg-void text-error border border-error-30'
                          : 'bg-elevated text-secondary'
                      }`}
                    >
                      {isHighPriorityTriggered ? 'TRIGGERED' : 'SUPPRESSED'}
                    </span>
                    <button
                      onClick={() => setShowBanner(false)}
                      aria-label="Dismiss Alert"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-void/40 text-primary hover:bg-void transition-colors cursor-pointer"
                      id="dismissBannerBtn"
                    >
                      <span className="material-symbols-outlined text-16">close</span>
                    </button>
                  </div>
                </div>

                {/* Description Subtext showing Threshold Comparison */}
                <p className="font-body-sm text-12 text-primary font-medium leading-snug">
                  {isHighPriorityTriggered ? (
                    <>
                      Detected confidence (
                      <span className="font-bold text-error font-mono">
                        {simulatedConfidence}%
                      </span>
                      ) meets or exceeds your custom threshold (
                      <span className="font-bold text-warning font-mono">≥{threshold}%</span>
                      ). High-priority push alert and urgent audio alarms are triggered.
                    </>
                  ) : (
                    <>
                      Detected confidence (
                      <span className="font-bold text-secondary font-mono">
                        {simulatedConfidence}%
                      </span>
                      ) is below your custom threshold (
                      <span className="font-bold text-info font-mono">≥{threshold}%</span>
                      ). High-priority alarm is silenced; event is stored in background telemetry.
                    </>
                  )}
                </p>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-label-sm text-10 text-secondary font-mono">
                    Custom Threshold: ≥{threshold}% • Sample: {simulatedConfidence}%
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBanner(false)}
                      className="px-3 py-1.5 rounded-full font-label-md text-11 text-primary hover:bg-void/30 transition-colors cursor-pointer"
                      id="quickDismiss"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={onViewLatestIncident}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-void text-error font-label-md text-11 font-bold shadow-md hover:bg-surface transition-all cursor-pointer"
                    >
                      <span>View Forensics</span>
                      <span className="material-symbols-outlined text-16">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Interactive Live Threshold Test Bench */}
          <section className="flex flex-col gap-2 p-3.5 rounded-xl bg-surface border border-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-18 text-info">
                  science
                </span>
                <span className="font-headline-sm text-13 text-primary font-semibold">
                  Threshold Test Simulator
                </span>
              </div>
              <span className="font-label-sm text-10 text-muted font-mono">
                Live Trigger Preview
              </span>
            </div>
            <p className="font-body-sm text-11 text-secondary leading-relaxed">
              Select or slide an incoming synthetic confidence score to verify how your custom
              threshold (<span className="font-bold text-accent">≥{threshold}%</span>) gates the
              high-priority notification.
            </p>

            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-11 font-mono">
                <span className="text-secondary">Simulated Audio Confidence:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-12 ${
                    isHighPriorityTriggered
                      ? 'bg-[#93000a] text-error-light'
                      : 'bg-elevated text-secondary'
                  }`}
                >
                  {simulatedConfidence}%{' '}
                  {isHighPriorityTriggered ? '⚡ High Alert' : '🔇 Suppressed'}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                step="0.5"
                value={simulatedConfidence}
                onChange={(e) => {
                  setSimulatedConfidence(Number(e.target.value));
                  setShowBanner(true);
                }}
                className="w-full h-1.5 bg-void rounded-lg appearance-none cursor-pointer accent-[#7dd0ff]"
              />
            </div>

            {/* Quick Test Presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { label: '72% Call', val: 72 },
                { label: '86% Bot', val: 86 },
                { label: '92% Clone', val: 92 },
                { label: '98% Deepfake', val: 98.4 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setSimulatedConfidence(p.val);
                    setShowBanner(true);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-10 font-mono font-medium transition-all cursor-pointer border ${
                    simulatedConfidence === p.val
                      ? 'bg-elevated text-info border-[#7dd0ff]/40 shadow-sm'
                      : 'bg-void text-secondary hover:text-primary border-subtle'
                  }`}
                  type="button"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          {/* Simulated OS Lock Screen / System Push Notification Card */}
          <section className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="font-label-sm text-10 uppercase tracking-widest text-secondary font-semibold font-mono">
                Simulated Push Notification
              </span>
              <span className="font-label-sm text-10 text-info flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7dd0ff] animate-ping" />
                Live Broadcast
              </span>
            </div>

            {/* Notification Container */}
            <div
              className={`relative overflow-hidden rounded-xl bg-surface/90 backdrop-blur-xl p-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] border ${
                isHighPriorityTriggered
                  ? 'border-error-30 ring-1 ring-[#ffb4ab]/20'
                  : 'border-subtle opacity-75'
              }`}
            >
              {/* Top Meta Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-void flex items-center justify-center border border-accent-20 text-accent">
                    <span className="material-symbols-outlined text-18">shield</span>
                    {isHighPriorityTriggered && (
                      <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-error rounded-full" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-12 text-primary font-semibold">
                      VoiceGuard Alert
                    </span>
                    <span className="text-secondary text-body-sm font-light">•</span>
                    <span className="font-label-sm text-10 text-secondary font-mono">now</span>
                    <span
                      className={`font-label-sm text-9 px-1.5 py-0.2 rounded font-mono font-bold ml-1 ${
                        isHighPriorityTriggered
                          ? 'bg-[#93000a] text-error-light'
                          : 'bg-elevated text-secondary'
                      }`}
                    >
                      {isHighPriorityTriggered ? 'PRIORITY: HIGH' : 'LOW PRIORITY'}
                    </span>
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined text-18 ${
                    isHighPriorityTriggered ? 'text-error' : 'text-muted'
                  }`}
                >
                  {isHighPriorityTriggered ? 'notification_important' : 'notifications'}
                </span>
              </div>

              {/* Title & Body */}
              <div className="mt-2">
                <h4 className="font-headline-sm text-14 text-primary font-semibold tracking-tight">
                  {isHighPriorityTriggered
                    ? `Suspicious Neural Voice Detected (${simulatedConfidence}%)`
                    : `Low-Confidence Audio Detected (${simulatedConfidence}%)`}
                </h4>
                <p className="mt-0.5 font-body-sm text-12 text-secondary leading-relaxed">
                  {isHighPriorityTriggered
                    ? `Confidence of ${simulatedConfidence}% surpasses your ≥${threshold}% high-priority threshold. Potential deepfake spoof attempt on live line.`
                    : `Confidence of ${simulatedConfidence}% is below your high-priority alert threshold (≥${threshold}%). Push alert silenced.`}
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-1">
                <button
                  onClick={onViewLatestIncident}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-elevated hover:bg-[#353a40] text-info font-label-md text-11 font-semibold transition-colors cursor-pointer border border-subtle"
                >
                  <span className="material-symbols-outlined text-16">query_stats</span>
                  <span>Review Telemetry</span>
                </button>

                <button
                  onClick={() => setStreamMuted(!streamMuted)}
                  className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-label-md text-11 font-semibold transition-colors cursor-pointer ${
                    streamMuted
                      ? 'bg-elevated text-primary'
                      : isHighPriorityTriggered
                      ? 'bg-[#93000a] hover:bg-[#93000a]/80 text-error-light'
                      : 'bg-elevated-hover text-secondary'
                  }`}
                >
                  <span className="material-symbols-outlined text-16">
                    {streamMuted ? 'volume_up' : 'mic_off'}
                  </span>
                  <span>{streamMuted ? 'Stream Muted' : 'Mute Stream'}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Diagnostic Network Status Pill */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-void text-secondary border border-subtle">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="font-label-sm text-11 font-medium">
                Acoustic Shield Neural Link: Synced (4.2ms)
              </span>
            </div>
            <span className="font-label-sm text-10 text-accent font-bold font-mono">
              v3.8-Live
            </span>
          </div>
        </div>

        {/* Right Column: Real-Time Protection Preferences */}
        <div className="flex flex-col space-y-4">
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-col">
                <h3 className="font-headline-sm text-15 text-primary font-semibold">
                  Real-Time Protection Settings
                </h3>
                <p className="font-body-sm text-12 text-secondary">
                  Acoustic forensic engine trigger conditions
                </p>
              </div>
              <span className="material-symbols-outlined text-accent text-[22px]">shield_lock</span>
            </div>

            {/* Toggle List Container */}
            <div className="flex flex-col gap-2">
              {/* Toggle 1: Live Call Acoustic Monitoring */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface transition-colors border border-subtle">
                <div className="flex items-start gap-2.5 max-w-[260px]">
                  <div className="p-2 rounded-lg bg-surface text-accent mt-0.5">
                    <span className="material-symbols-outlined text-20">phone_in_talk</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-13 text-primary font-medium">
                      Live Call Acoustic Monitoring
                    </span>
                    <span className="font-body-sm text-11 text-secondary leading-snug">
                      Real-time background deepfake voice detection during VoIP/phone calls
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle('liveMonitoring')}
                  aria-checked={Boolean(safeSettings.liveMonitoring)}
                  className={`toggle-btn relative w-12 h-6 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer ${
                    safeSettings.liveMonitoring
                      ? 'bg-accent shadow-glow'
                      : 'bg-elevated-hover'
                  }`}
                  role="switch"
                >
                  <span
                    className={`toggle-dot block w-5 h-5 rounded-full shadow transform transition-transform ${
                      safeSettings.liveMonitoring
                        ? 'translate-x-6 bg-white'
                        : 'translate-x-0 bg-secondary'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Instant Cloned Audio Alerts */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface transition-colors border border-subtle">
                <div className="flex items-start gap-2.5 max-w-[260px]">
                  <div className="p-2 rounded-lg bg-surface text-warning mt-0.5">
                    <span className="material-symbols-outlined text-20">e911_emergency</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-13 text-primary font-medium">
                      Instant Cloned Audio Alerts
                    </span>
                    <span className="font-body-sm text-11 text-secondary leading-snug">
                      Trigger slide-down banner and high-priority push warning immediately
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle('instantAlerts')}
                  aria-checked={Boolean(safeSettings.instantAlerts)}
                  className={`toggle-btn relative w-12 h-6 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer ${
                    safeSettings.instantAlerts
                      ? 'bg-accent shadow-glow'
                      : 'bg-elevated-hover'
                  }`}
                  role="switch"
                >
                  <span
                    className={`toggle-dot block w-5 h-5 rounded-full shadow transform transition-transform ${
                      safeSettings.instantAlerts
                        ? 'translate-x-6 bg-white'
                        : 'translate-x-0 bg-secondary'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Upload & File Analysis Completion */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface transition-colors border border-subtle">
                <div className="flex items-start gap-2.5 max-w-[260px]">
                  <div className="p-2 rounded-lg bg-surface text-info mt-0.5">
                    <span className="material-symbols-outlined text-20">cloud_done</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-13 text-primary font-medium">
                      Upload &amp; File Analysis
                    </span>
                    <span className="font-body-sm text-11 text-secondary leading-snug">
                      Notify when deep forensic scans finish processing multi-channel files
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle('uploadScanNotify')}
                  aria-checked={Boolean(safeSettings.uploadScanNotify)}
                  className={`toggle-btn relative w-12 h-6 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer ${
                    safeSettings.uploadScanNotify
                      ? 'bg-accent shadow-glow'
                      : 'bg-elevated-hover'
                  }`}
                  role="switch"
                >
                  <span
                    className={`toggle-dot block w-5 h-5 rounded-full shadow transform transition-transform ${
                      safeSettings.uploadScanNotify
                        ? 'translate-x-6 bg-white'
                        : 'translate-x-0 bg-secondary'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 4: Weekly Threat Intelligence Summary */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface transition-colors border border-subtle">
                <div className="flex items-start gap-2.5 max-w-[260px]">
                  <div className="p-2 rounded-lg bg-surface text-secondary mt-0.5">
                    <span className="material-symbols-outlined text-20">insights</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-13 text-primary font-medium">
                      Weekly Threat Summary
                    </span>
                    <span className="font-body-sm text-11 text-secondary leading-snug">
                      Digest of scanned clips, anomalies detected, and known model signatures
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle('weeklyThreatSummary')}
                  aria-checked={Boolean(safeSettings.weeklyThreatSummary)}
                  className={`toggle-btn relative w-12 h-6 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer ${
                    safeSettings.weeklyThreatSummary
                      ? 'bg-accent shadow-glow'
                      : 'bg-elevated-hover'
                  }`}
                  role="switch"
                >
                  <span
                    className={`toggle-dot block w-5 h-5 rounded-full shadow transform transition-transform ${
                      safeSettings.weeklyThreatSummary
                        ? 'translate-x-6 bg-white'
                        : 'translate-x-0 bg-secondary'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* CUSTOM THRESHOLD SETTING CARD: High-Priority Alert Confidence Threshold */}
            <div
              className="flex flex-col gap-3 p-4 rounded-xl bg-elevated border border-[#ffc37d]/20 shadow-md"
              id="highPriorityThresholdCard"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-void text-warning flex items-center justify-center border border-subtle-10">
                    <span className="material-symbols-outlined text-20">
                      notification_important
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-sm text-14 text-primary font-bold">
                        High-Priority Alert Threshold
                      </span>
                      <span className="font-label-sm text-9 bg-accent-dark text-accent px-1.5 py-0.2 rounded font-mono font-bold">
                        CUSTOM
                      </span>
                    </div>
                    <span className="font-body-sm text-11 text-secondary">
                      Confidence percentage required to trigger urgent notifications
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`font-label-sm text-10 px-2.5 py-1 rounded-full font-bold font-mono shrink-0 ${currentTier.badgeColor}`}
                >
                  {currentTier.label}
                </span>
              </div>

              {/* Explanatory description */}
              <p className="font-body-sm text-11 text-secondary leading-relaxed bg-void/60 p-2.5 rounded-lg border border-subtle">
                {currentTier.desc} Any synthetic speech detected at or above{' '}
                <span className="font-bold text-warning font-mono">{threshold}%</span> will
                immediately trigger the high-priority in-app alert banner and mobile push warnings.
              </p>

              {/* Stepper + Number Input + Interactive Range Slider */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-label-md text-12 text-primary font-semibold font-mono">
                    Trigger Percentage:
                  </span>

                  {/* Direct Numeric Input with Steppers */}
                  <div className="flex items-center gap-1 bg-void p-1 rounded-lg border border-subtle-10">
                    <button
                      type="button"
                      onClick={() => handleThresholdChange(threshold - 1)}
                      disabled={threshold <= 50}
                      className="w-7 h-7 rounded flex items-center justify-center bg-surface hover:bg-elevated text-primary disabled:opacity-40 cursor-pointer transition-colors"
                      title="Decrease threshold by 1%"
                    >
                      <span className="material-symbols-outlined text-16">remove</span>
                    </button>

                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="50"
                        max="99"
                        value={threshold}
                        onChange={(e) => handleThresholdChange(Number(e.target.value))}
                        className="w-12 bg-transparent text-center font-mono font-bold text-14 text-accent focus:outline-none"
                      />
                      <span className="font-mono font-bold text-13 text-accent pr-1.5">
                        %
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleThresholdChange(threshold + 1)}
                      disabled={threshold >= 99}
                      className="w-7 h-7 rounded flex items-center justify-center bg-surface hover:bg-elevated text-primary disabled:opacity-40 cursor-pointer transition-colors"
                      title="Increase threshold by 1%"
                    >
                      <span className="material-symbols-outlined text-16">add</span>
                    </button>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  id="highPriorityThresholdRange"
                  type="range"
                  min="50"
                  max="99"
                  value={threshold}
                  onChange={(e) => handleThresholdChange(Number(e.target.value))}
                  className="w-full h-2 bg-void rounded-lg appearance-none cursor-pointer accent-[#ffc37d]"
                />

                <div className="flex justify-between font-label-sm text-10 text-muted px-0.5 font-mono">
                  <span>50% (Permissive)</span>
                  <span>75% (Moderate)</span>
                  <span>90% (Strict)</span>
                  <span>99% (Maximum)</span>
                </div>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-subtle">
                <span className="font-label-sm text-10 uppercase font-bold text-muted font-mono tracking-wider">
                  Recommended Presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { label: '75% Moderate', val: 75 },
                    { label: '85% Balanced', val: 85 },
                    { label: '90% Strict', val: 90 },
                    { label: '95% Critical', val: 95 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleThresholdChange(preset.val)}
                      className={`px-2 py-1.5 rounded-lg text-11 font-mono font-semibold transition-all cursor-pointer border ${
                        threshold === preset.val
                          ? 'bg-[#ffc37d] text-[#462a00] border-[#ffc37d] shadow-sm'
                          : 'bg-void text-secondary hover:text-primary hover:bg-surface border-subtle'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sensitivity Slider Card */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-elevated border border-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-18 text-warning">tune</span>
                  <span className="font-headline-sm text-14 text-primary font-medium">
                    Detection Sensitivity
                  </span>
                </div>
                <span
                  className="font-label-sm text-10 px-2 py-0.5 rounded-full bg-[#f8a018] text-[#633c00] font-bold font-mono"
                  id="sensitivityBadge"
                >
                  {getSensitivityLabel(settings.sensitivity)}
                </span>
              </div>

              <p className="font-body-sm text-12 text-secondary" id="sensitivityDesc">
                Flags &gt;{settings.sensitivity}% synthetic probability. Recommends instant spectral breakdown.
              </p>

              {/* Custom Interactive Range Slider */}
              <div className="flex flex-col gap-1 pt-1">
                <input
                  id="sensitivityRange"
                  type="range"
                  min="50"
                  max="99"
                  value={safeSettings.sensitivity ?? 85}
                  onChange={(e) => handleSensitivityChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-void rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between font-label-sm text-10 text-secondary pt-1 px-0.5 font-mono">
                  <span>50% (Strict)</span>
                  <span>75% (Balanced)</span>
                  <span>95% (High Precision)</span>
                </div>
              </div>
            </div>

            {/* Cloud Persistence Indicator */}
            {user ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-void border border-accent-20 text-primary">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <div className="flex flex-col">
                    <span className="font-label-sm text-11 font-semibold text-primary">
                      Cloud Protection Sync Active
                    </span>
                    <span className="font-body-sm text-10 text-muted font-mono truncate max-w-[200px]">
                      {user.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-elevated hover:bg-[#353a40] text-accent font-label-sm text-10 font-bold font-mono transition-colors cursor-pointer border border-subtle"
                >
                  Manage Account
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-subtle text-secondary">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-info text-18">
                    sync_disabled
                  </span>
                  <span className="font-body-sm text-11">
                    Settings saved locally in session
                  </span>
                </div>
                <button
                  onClick={() => signIn()}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-elevated text-dark font-label-sm text-10 font-bold transition-all cursor-pointer"
                >
                  Sync to Cloud
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
