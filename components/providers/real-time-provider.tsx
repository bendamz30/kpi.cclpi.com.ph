"use client"

import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from "react"

interface RealTimeContextType {
  isConnected: boolean
  lastUpdate: number
  triggerRefresh: () => void
}

const RealTimeContext = createContext<RealTimeContextType>({
  isConnected: false,
  lastUpdate: 0,
  triggerRefresh: () => {},
})

export const useRealTime = () => useContext(RealTimeContext)

interface RealTimeProviderProps {
  children: ReactNode
}

export function RealTimeProvider({ children }: RealTimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [usePolling, setUsePolling] = useState(false)
  const [pollingInterval, setPollingInterval] = useState(600000) // Start with 10 minutes
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const [isPollingActive, setIsPollingActive] = useState(true)
  const [isPageVisible, setIsPageVisible] = useState(true)
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const triggerRefresh = useCallback(() => {
    setLastUpdate(Date.now())
  }, [])

  // Detect page visibility to pause polling when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const startPolling = () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current)
      }

      const poll = async () => {
        if (!isPollingActive || !isPageVisible) return // Stop if polling is disabled or page not visible
        
        try {
          // Only poll sales endpoint to reduce load
          const endpoint = "http://127.0.0.1:8000/api/sales"
          
          const response = await fetch(endpoint, {
            headers: { 'Accept': 'application/json' }
          })
          
                  if (response.ok) {
                    const data = await response.json()
                    const currentDataHash = JSON.stringify(data).length
                    const lastDataHash = localStorage.getItem('lastDataHash')
                    
                    // Only trigger refresh if data actually changed
                    if (lastDataHash !== currentDataHash.toString()) {
                      console.log(`[v0] Polling: ${endpoint} data changed, triggering refresh`)
                      setConsecutiveErrors(0)
                      setLastUpdate(Date.now())
                      localStorage.setItem('lastDataHash', currentDataHash.toString())
                    } else {
                      console.log(`[v0] Polling: ${endpoint} no data changes detected`)
                    }
                    // Reset to normal interval on success
                    setPollingInterval(600000) // 10 minutes
          } else if (response.status === 429) {
            console.warn(`[v0] Rate limited, backing off...`)
            setConsecutiveErrors(prev => prev + 1)
            // More aggressive backoff: 5m, 15m, 30m, 60m
            const backoffIntervals = [300000, 900000, 1800000, 3600000]
            const newInterval = backoffIntervals[Math.min(consecutiveErrors, backoffIntervals.length - 1)]
            setPollingInterval(newInterval)
            
            // Stop polling after 2 consecutive 429s
            if (consecutiveErrors >= 1) {
              console.warn(`[v0] Too many 429s, stopping polling for 30 minutes`)
              setIsPollingActive(false)
              setTimeout(() => {
                setIsPollingActive(true)
                setConsecutiveErrors(0)
              }, 1800000) // 30 minutes
              return
            }
          } else {
            console.warn(`[v0] Polling error for ${endpoint}: ${response.status}`)
            setConsecutiveErrors(prev => prev + 1)
          }
        } catch (error) {
          console.error("[v0] Polling error:", error)
          setConsecutiveErrors(prev => prev + 1)
          
          // Handle network errors with exponential backoff
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.warn(`[v0] Network error, backing off...`)
            const backoffIntervals = [300000, 900000, 1800000, 3600000]
            const newInterval = backoffIntervals[Math.min(consecutiveErrors, backoffIntervals.length - 1)]
            setPollingInterval(newInterval)
            
            // Stop polling after 2 consecutive network errors
            if (consecutiveErrors >= 1) {
              console.warn(`[v0] Too many network errors, stopping polling for 30 minutes`)
              setIsPollingActive(false)
              setTimeout(() => {
                setIsPollingActive(true)
                setConsecutiveErrors(0)
              }, 1800000) // 30 minutes
              return
            }
          }
        }
      }

      // Initial poll
      poll()
      
      // Set up interval with current polling interval
      pollingTimerRef.current = setInterval(poll, pollingInterval)
    }


    const connect = () => {
      if (typeof window === 'undefined') return // only run in browser
      
      try {
        // EventSource not implemented in Laravel backend yet
        // eventSource = new EventSource("/api/dashboard-stream")

        // Skip SSE setup since backend doesn't support it yet
        console.log("[v0] Using polling mode (SSE not implemented)")
        setUsePolling(true)
        startPolling()
      } catch (error) {
        console.error("[v0] Failed to create SSE connection:", error)
        setUsePolling(true)
        startPolling()
      }
    }

    connect()

    return () => {
      if (eventSource) {
        try { 
          eventSource.close() 
        } catch (e) { 
          /* ignore */ 
        }
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current)
      }
    }
  }, [])

  // Handle polling interval changes
  useEffect(() => {
    if (usePolling && pollingTimerRef.current && isPollingActive) {
      // Restart polling with new interval
      clearInterval(pollingTimerRef.current)
      pollingTimerRef.current = setInterval(async () => {
        if (!isPollingActive || !isPageVisible) return
        
        try {
          const endpoint = "http://127.0.0.1:8000/api/sales"
          
          const response = await fetch(endpoint, {
            headers: { 'Accept': 'application/json' }
          })
          
          if (response.ok) {
            const data = await response.json()
            const currentDataHash = JSON.stringify(data).length
            const lastDataHash = localStorage.getItem('lastDataHash')
            
            // Only trigger refresh if data actually changed
            if (lastDataHash !== currentDataHash.toString()) {
              console.log(`[v0] Polling: ${endpoint} data changed, triggering refresh`)
              setConsecutiveErrors(0)
              setLastUpdate(Date.now())
              localStorage.setItem('lastDataHash', currentDataHash.toString())
            } else {
              console.log(`[v0] Polling: ${endpoint} no data changes detected`)
            }
            setPollingInterval(600000) // 10 minutes
          } else if (response.status === 429) {
            console.warn(`[v0] Rate limited, backing off...`)
            setConsecutiveErrors(prev => prev + 1)
            const backoffIntervals = [300000, 900000, 1800000, 3600000]
            const newInterval = backoffIntervals[Math.min(consecutiveErrors, backoffIntervals.length - 1)]
            setPollingInterval(newInterval)
            
            if (consecutiveErrors >= 1) {
              console.warn(`[v0] Too many 429s, stopping polling for 30 minutes`)
              setIsPollingActive(false)
              setTimeout(() => {
                setIsPollingActive(true)
                setConsecutiveErrors(0)
              }, 1800000) // 30 minutes
              return
            }
          } else {
            console.warn(`[v0] Polling error for ${endpoint}: ${response.status}`)
            setConsecutiveErrors(prev => prev + 1)
          }
        } catch (error) {
          console.error("[v0] Polling error:", error)
          setConsecutiveErrors(prev => prev + 1)
          
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.warn(`[v0] Network error, backing off...`)
            const backoffIntervals = [300000, 900000, 1800000, 3600000]
            const newInterval = backoffIntervals[Math.min(consecutiveErrors, backoffIntervals.length - 1)]
            setPollingInterval(newInterval)
            
            if (consecutiveErrors >= 1) {
              console.warn(`[v0] Too many network errors, stopping polling for 30 minutes`)
              setIsPollingActive(false)
              setTimeout(() => {
                setIsPollingActive(true)
                setConsecutiveErrors(0)
              }, 1800000) // 30 minutes
              return
            }
          }
        }
      }, pollingInterval)
    }
  }, [pollingInterval, usePolling, isPollingActive, isPageVisible])

  return (
    <RealTimeContext.Provider value={{ isConnected, lastUpdate, triggerRefresh }}>{children}</RealTimeContext.Provider>
  )
}
