// Session timeout configuration
export const SESSION_CONFIG = {
  // Timeout settings (in minutes)
  TIMEOUT_MINUTES: 30,        // Total session timeout
  WARNING_MINUTES: 5,         // Warning before timeout
  
  // Activity tracking events
  ACTIVITY_EVENTS: [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ],
  
  // Storage keys
  STORAGE_KEYS: {
    LAST_ACTIVITY: 'last_activity',
    SESSION_START: 'session_start'
  }
} as const

// Environment-based configuration
export const getSessionConfig = () => {
  // You can override these with environment variables
  const timeoutMinutes = process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES 
    ? parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES)
    : SESSION_CONFIG.TIMEOUT_MINUTES
    
  const warningMinutes = process.env.NEXT_PUBLIC_SESSION_WARNING_MINUTES
    ? parseInt(process.env.NEXT_PUBLIC_SESSION_WARNING_MINUTES) 
    : SESSION_CONFIG.WARNING_MINUTES

  return {
    timeoutMinutes,
    warningMinutes,
    activityEvents: SESSION_CONFIG.ACTIVITY_EVENTS,
    storageKeys: SESSION_CONFIG.STORAGE_KEYS
  }
}
