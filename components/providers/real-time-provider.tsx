"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

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

  const triggerRefresh = () => {
    setLastUpdate(Date.now())
  }

  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout
    let pollingInterval: NodeJS.Timeout

    const startPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }

      pollingInterval = setInterval(async () => {
        try {
          // Check multiple endpoints for data changes
          const endpoints = ["/api/sales-reports-data", "/api/users", "/api/sales-targets"]

          for (const endpoint of endpoints) {
            try {
              const response = await fetch(endpoint)
              if (response.ok) {
                console.log(`[v0] Polling: ${endpoint} refreshed`)
              }
            } catch (endpointError) {
              console.warn(`[v0] Polling error for ${endpoint}:`, endpointError)
            }
          }

          setLastUpdate(Date.now())
        } catch (error) {
          console.error("[v0] Polling error:", error)
        }
      }, 5000)
    }

    const connect = () => {
      try {
        eventSource = new EventSource("/api/dashboard-stream")

        eventSource.onopen = () => {
          console.log("[v0] SSE connected")
          setIsConnected(true)
          setUsePolling(false)

          // Clear polling when SSE is connected
          if (pollingInterval) {
            clearInterval(pollingInterval)
          }
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === "data-updated") {
              console.log(`[v0] ${data.file} updated, triggering refresh`)
              setLastUpdate(Date.now())
            }
          } catch (error) {
            console.error("[v0] Error parsing SSE message:", error)
          }
        }

        eventSource.onerror = (error) => {
          console.error("[v0] SSE error:", error)
          setIsConnected(false)

          if (eventSource) {
            eventSource.close()
          }

          // Fallback to polling after SSE failure
          setUsePolling(true)
          startPolling()

          // Attempt to reconnect after 10 seconds
          reconnectTimeout = setTimeout(connect, 10000)
        }
      } catch (error) {
        console.error("[v0] Failed to create SSE connection:", error)
        setUsePolling(true)
        startPolling()
      }
    }

    connect()

    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [])

  return (
    <RealTimeContext.Provider value={{ isConnected, lastUpdate, triggerRefresh }}>{children}</RealTimeContext.Provider>
  )
}
