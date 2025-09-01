import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "regions.json")
    const fileContents = fs.readFileSync(filePath, "utf8")
    const regions = JSON.parse(fileContents)

    return Response.json(regions)
  } catch (error) {
    console.error("Error reading regions.json:", error)
    return Response.json({ error: "Failed to load regions" }, { status: 500 })
  }
}
