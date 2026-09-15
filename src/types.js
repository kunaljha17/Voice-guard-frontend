/**
 * VoiceGuard AI - Core constants and schema definitions in plain JavaScript
 */

export const SCREEN_TYPES = {
  HOME: 'home',
  SCAN_RECORD: 'scan_record',
  ANALYZE_UPLOAD: 'analyze_upload',
  SCANNING_STREAM: 'scanning_stream',
  INCIDENT_REPORT: 'incident_report',
  SAMPLES: 'samples',
  ALERTS: 'alerts',
  TRANSCRIBE: 'transcribe',
};

export const DEFAULT_PROTECTION_SETTINGS = {
  liveMonitoring: true,
  instantAlerts: true,
  uploadScanNotify: true,
  weeklyThreatSummary: false,
  sensitivity: 85,
  highPriorityThreshold: 90,
};
