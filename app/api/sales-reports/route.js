import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")

// Helper function to read JSON file
function readJsonFile(filename) {
  const filePath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filePath)) {
    return []
  }
  const data = fs.readFileSync(filePath, "utf8")
  return JSON.parse(data)
}

// Helper function to write JSON file
function writeJsonFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { salesRepId, reportDate, premiumActual, salesCounselorActual, policySoldActual, agencyCoopActual } = body

    // Validate required fields
    if (
      !salesRepId ||
      !reportDate ||
      premiumActual === undefined ||
      salesCounselorActual === undefined ||
      policySoldActual === undefined ||
      agencyCoopActual === undefined
    ) {
      return Response.json({ error: "Please complete all fields." }, { status: 400 })
    }

    // Validate salesRepId exists and is RegionalUser
    const users = readJsonFile("users.json")
    const salesRep = users.find((user) => user.userId === salesRepId)

    if (!salesRep || salesRep.role !== "RegionalUser") {
      return Response.json({ error: "Invalid Sales Rep. Must be a Regional User." }, { status: 400 })
    }

    // Read existing reports and auto-increment reportId
    const reports = readJsonFile("salesReports.json")
    const maxReportId = reports.length > 0 ? Math.max(...reports.map((r) => r.reportId)) : 0
    const newReportId = maxReportId + 1

    // Create new report
    const newReport = {
      reportId: newReportId,
      salesRepId: salesRepId,
      reportDate: reportDate,
      premiumActual: Number(premiumActual),
      salesCounselorActual: Number(salesCounselorActual),
      policySoldActual: Number(policySoldActual),
      agencyCoopActual: Number(agencyCoopActual),
      createdBy: 1,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    }

    // Add to reports array and save
    reports.push(newReport)
    writeJsonFile("salesReports.json", reports)

    return Response.json(
      {
        message: "Report added successfully!",
        report: newReport,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating sales report:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
