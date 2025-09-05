"use client"

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface SessionTimeoutOptions {
  timeoutMinutes?: number
  warningMinutes?: number
  onWarning?: () => void
  onLogout?: () => void
}

export function useSessionTimeout({
  timeoutMinutes = 30, // 30 minutes of inactivity
  warningMinutes = 5,  // Show warning 5 minutes before logout
  onWarning,
  onLogout
}: SessionTimeoutOptions = {}) {
  const { logout, isAuthenticated } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningCountdownRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Activity tracking events
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ]

  const resetTimeout = () => {
    lastActivityRef.current = Date.now()
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
    }
    if (warningCountdownRef.current) {
      clearInterval(warningCountdownRef.current)
    }

    // Hide warning if it was showing
    setShowWarning(false)

    if (!isAuthenticated) return

    // Set warning timeout (show warning before logout)
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true)
      setTimeRemaining(warningMinutes * 60) // seconds
      onWarning?.()

      // Start countdown
      warningCountdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up, logout
            handleLogout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, warningTime)

    // Set logout timeout
    const logoutTime = timeoutMinutes * 60 * 1000
    timeoutRef.current = setTimeout(() => {
      handleLogout()
    }, logoutTime)
  }

  const handleLogout = () => {
    // Clear all timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
    }
    if (warningCountdownRef.current) {
      clearInterval(warningCountdownRef.current)
    }

    setShowWarning(false)
    logout()
    onLogout?.()
  }

  const extendSession = () => {
    resetTimeout()
  }

  // Add activity listeners
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timeouts when not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
        warningTimeoutRef.current = null
      }
      if (warningCountdownRef.current) {
        clearInterval(warningCountdownRef.current)
        warningCountdownRef.current = null
      }
      setShowWarning(false)
      return
    }

    const handleActivity = () => {
      resetTimeout()
    }

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Initialize timeout
    resetTimeout()

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
      if (warningCountdownRef.current) {
        clearInterval(warningCountdownRef.current)
      }
    }
  }, [isAuthenticated, timeoutMinutes, warningMinutes])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
      if (warningCountdownRef.current) {
        clearInterval(warningCountdownRef.current)
      }
    }
  }, [])

  return {
    showWarning,
    timeRemaining,
    extendSession,
    handleLogout
  }
}
