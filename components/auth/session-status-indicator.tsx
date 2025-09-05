"use client"

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle } from 'lucide-react'
import { useSessionTimeout } from '@/hooks/use-session-timeout'
import { useAuth } from '@/contexts/auth-context'

export function SessionStatusIndicator() {
  const { isAuthenticated, isLoading } = useAuth()
  const { showWarning, timeRemaining } = useSessionTimeout()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show if user is authenticated and not loading
    if (!isAuthenticated || isLoading) {
      setIsVisible(false)
      return
    }
    
    // Show indicator when warning is active or when there's less than 10 minutes left
    setIsVisible(showWarning || timeRemaining < 600) // 600 seconds = 10 minutes
  }, [isAuthenticated, isLoading, showWarning, timeRemaining])

  if (!isAuthenticated || isLoading || !isVisible) return null

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  return (
    <Badge 
      variant={showWarning ? "destructive" : "secondary"}
      className="flex items-center gap-1 text-xs"
    >
      {showWarning ? (
        <>
          <Clock className="h-3 w-3" />
          {minutes}:{seconds.toString().padStart(2, '0')}
        </>
      ) : (
        <>
          <CheckCircle className="h-3 w-3" />
          {minutes}m left
        </>
      )}
    </Badge>
  )
}
