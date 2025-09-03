import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  const encoder = new TextEncoder()

  let lastModified = 0

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`
      controller.enqueue(encoder.encode(data))

      // Check for file changes every 2 seconds
      const interval = setInterval(async () => {
        try {
          const salesReportsPath = path.join(process.cwd(), "data", "salesReports.json")
          const stats = await fs.stat(salesReportsPath)
          const currentModified = stats.mtime.getTime()

          if (currentModified > lastModified) {
            lastModified = currentModified

            // Send update notification
            const updateData = `data: ${JSON.stringify({
              type: "data-updated",
              timestamp: Date.now(),
              file: "salesReports.json",
            })}\n\n`
            controller.enqueue(encoder.encode(updateData))
          }
        } catch (error) {
          console.error("Error checking file changes:", error)
        }
      }, 2000)

      // Cleanup on close
      return () => {
        clearInterval(interval)
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
