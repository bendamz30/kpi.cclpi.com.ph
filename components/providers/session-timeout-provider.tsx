"use client"

import { ReactNode } from 'react'
import { useSessionTimeout } from '@/hooks/use-session-timeout'
import { SessionTimeoutDialog } from '@/components/auth/session-timeout-dialog'
import { useAuth } from '@/contexts/auth-context'
import { getSessionConfig } from '@/lib/session-config'

interface SessionTimeoutProviderProps {
  children: ReactNode
}

export function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const { isAuthenticated, isLoading } = useAuth()
  
  // Don't render anything if auth is still loading or user is not authenticated
  if (isLoading || !isAuthenticated) {
    return <>{children}</>
  }

  return <SessionTimeoutWrapper>{children}</SessionTimeoutWrapper>
}

function SessionTimeoutWrapper({ children }: { children: ReactNode }) {
  const config = getSessionConfig()
  
  const {
    showWarning,
    timeRemaining,
    extendSession,
    handleLogout
  } = useSessionTimeout({
    timeoutMinutes: config.timeoutMinutes,
    warningMinutes: config.warningMinutes,
    onWarning: () => {
      console.log('Session timeout warning triggered')
    },
    onLogout: () => {
      console.log('Session timeout - user logged out')
    }
  })

  return (
    <>
      {children}
      <SessionTimeoutDialog
        isOpen={showWarning}
        timeRemaining={timeRemaining}
        onExtendSession={extendSession}
        onLogout={handleLogout}
      />
    </>
  )
}
