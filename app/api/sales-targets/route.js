import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "salesTargets.json")
    const fileContents = fs.readFileSync(filePath, "utf8")
    const data = JSON.parse(fileContents)

    return Response.json(data)
  } catch (error) {
    console.error("Error reading sales targets:", error)
    return Response.json({ error: "Failed to load sales targets" }, { status: 500 })
  }
}
