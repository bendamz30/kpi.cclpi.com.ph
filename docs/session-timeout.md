# Session Timeout Feature

## Overview
The session timeout feature automatically logs out users after a period of inactivity to improve security and prevent unauthorized access.

## Features

### 🔒 Automatic Logout
- Users are automatically logged out after 30 minutes of inactivity
- Configurable timeout duration via environment variables

### ⚠️ Warning System
- Shows a warning dialog 5 minutes before logout
- Real-time countdown timer
- Option to extend session or logout immediately

### 📊 Activity Tracking
- Tracks user activity including:
  - Mouse movements and clicks
  - Keyboard input
  - Scrolling
  - Touch events
- Resets timeout on any detected activity

### 🎯 Visual Indicators
- Session status indicator in header
- Shows remaining time when session is close to expiring
- Color-coded warnings (green for normal, red for critical)

## Configuration

### Environment Variables
```bash
# Session timeout in minutes (default: 30)
NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES=30

# Warning time in minutes (default: 5)
NEXT_PUBLIC_SESSION_WARNING_MINUTES=5
```

### Code Configuration
Edit `lib/session-config.ts` to modify:
- Timeout duration
- Warning duration
- Activity tracking events
- Storage keys

## Usage

### For Users
1. **Normal Operation**: No action required - session automatically extends with activity
2. **Warning Dialog**: When warning appears:
   - Click "Stay Logged In" to extend session
   - Click "Logout Now" to logout immediately
   - Wait for automatic logout if no action taken

### For Developers
The session timeout is automatically enabled for all authenticated users. No additional setup required.

## Components

- `useSessionTimeout` - Hook for session management
- `SessionTimeoutDialog` - Warning dialog component
- `SessionTimeoutProvider` - Provider component
- `SessionStatusIndicator` - Header status indicator

## Security Benefits

- Prevents unauthorized access from unattended sessions
- Reduces risk of session hijacking
- Complies with security best practices
- Automatic cleanup of expired sessions
