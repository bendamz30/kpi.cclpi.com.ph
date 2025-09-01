import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "mergedReports.json")

    // Check if merged reports file exists
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, "utf8")
      const data = JSON.parse(fileContents)
      return Response.json(data)
    } else {
      // Return empty array if file doesn't exist
      return Response.json([])
    }
  } catch (error) {
    console.error("Error reading merged reports:", error)
    return Response.json([])
  }
}
