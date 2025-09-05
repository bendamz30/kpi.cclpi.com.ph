"use client"

import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Clock, LogOut } from 'lucide-react'

interface SessionTimeoutDialogProps {
  isOpen: boolean
  timeRemaining: number
  onExtendSession: () => void
  onLogout: () => void
}

export function SessionTimeoutDialog({
  isOpen,
  timeRemaining,
  onExtendSession,
  onLogout
}: SessionTimeoutDialogProps) {
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    setMinutes(Math.floor(timeRemaining / 60))
    setSeconds(timeRemaining % 60)
  }, [timeRemaining])

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0')
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={() => {}}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg">Session Timeout Warning</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                Your session will expire soon due to inactivity.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="py-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {formatTime(minutes)}:{formatTime(seconds)}
            </div>
            <p className="text-sm text-muted-foreground">
              You will be automatically logged out in {minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''} and ` : ''}{seconds} second{seconds !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              onClick={onLogout}
              className="w-full sm:w-auto"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout Now
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={onExtendSession}
              className="w-full sm:w-auto"
            >
              Stay Logged In
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
