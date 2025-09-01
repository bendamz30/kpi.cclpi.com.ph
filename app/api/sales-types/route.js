import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "salesTypes.json")
    const fileContents = fs.readFileSync(filePath, "utf8")
    const salesTypes = JSON.parse(fileContents)

    return Response.json(salesTypes)
  } catch (error) {
    console.error("Error reading salesTypes.json:", error)
    return Response.json({ error: "Failed to load sales types" }, { status: 500 })
  }
}
