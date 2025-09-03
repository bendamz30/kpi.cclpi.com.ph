"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import useSWR from "swr"

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

  // SWR fallback with 5-second polling
  const { mutate } = useSWR(usePolling ? "/api/sales-reports-data" : null, null, {
    refreshInterval: 5000,
    onSuccess: () => {
      setLastUpdate(Date.now())
    },
  })

  const triggerRefresh = () => {
    setLastUpdate(Date.now())
    if (usePolling) {
      mutate()
    }
  }

  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout

    const connect = () => {
      try {
        eventSource = new EventSource("/api/dashboard-stream")

        eventSource.onopen = () => {
          console.log("[v0] SSE connected")
          setIsConnected(true)
          setUsePolling(false)
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === "data-updated") {
              console.log("[v0] Data updated, triggering refresh")
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

          // Attempt to reconnect after 10 seconds
          reconnectTimeout = setTimeout(connect, 10000)
        }
      } catch (error) {
        console.error("[v0] Failed to create SSE connection:", error)
        setUsePolling(true)
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
    }
  }, [])

  return (
    <RealTimeContext.Provider value={{ isConnected, lastUpdate, triggerRefresh }}>{children}</RealTimeContext.Provider>
  )
}
