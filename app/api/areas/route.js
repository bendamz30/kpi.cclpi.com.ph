import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "areas.json")
    const fileContents = fs.readFileSync(filePath, "utf8")
    const areas = JSON.parse(fileContents)

    return Response.json(areas)
  } catch (error) {
    console.error("Error reading areas.json:", error)
    return Response.json({ error: "Failed to load areas" }, { status: 500 })
  }
}
