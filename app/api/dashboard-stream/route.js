import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  const encoder = new TextEncoder()

  const lastModifiedTimes = {
    salesReports: 0,
    users: 0,
    salesTargets: 0,
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`
      controller.enqueue(encoder.encode(data))

      const interval = setInterval(async () => {
        try {
          const filesToWatch = [
            { key: "salesReports", path: path.join(process.cwd(), "data", "salesReports.json") },
            { key: "users", path: path.join(process.cwd(), "data", "users.json") },
            { key: "salesTargets", path: path.join(process.cwd(), "data", "salesTargets.json") },
          ]

          for (const file of filesToWatch) {
            try {
              const stats = await fs.stat(file.path)
              const currentModified = stats.mtime.getTime()

              if (currentModified > lastModifiedTimes[file.key]) {
                lastModifiedTimes[file.key] = currentModified

                // Send update notification
                const updateData = `data: ${JSON.stringify({
                  type: "data-updated",
                  timestamp: Date.now(),
                  file: `${file.key}.json`,
                })}\n\n`
                controller.enqueue(encoder.encode(updateData))
              }
            } catch (fileError) {
              // File might not exist yet, continue checking other files
              console.warn(`File ${file.path} not found:`, fileError.message)
            }
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
