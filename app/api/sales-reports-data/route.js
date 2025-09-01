import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Read JSON files
    const dataDir = path.join(process.cwd(), "data")
    const reportsData = JSON.parse(fs.readFileSync(path.join(dataDir, "salesReports.json"), "utf8"))
    const usersData = JSON.parse(fs.readFileSync(path.join(dataDir, "users.json"), "utf8"))

    // Join reports with RegionalUser data
    const reportsWithUserData = reportsData
      .map((report) => {
        const user = usersData.find((u) => u.userId === report.salesRepId && u.role === "RegionalUser")
        if (!user) return null // Skip if not a RegionalUser

        return {
          ...report,
          salesRepName: user.name,
        }
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate)) // Sort by date desc

    return Response.json(reportsWithUserData)
  } catch (error) {
    console.error("Error fetching sales reports:", error)
    return Response.json({ error: "Failed to fetch sales reports" }, { status: 500 })
  }
}
