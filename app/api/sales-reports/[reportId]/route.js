import { promises as fs } from "fs"
import path from "path"

// PUT - Update a sales report
export async function PUT(request, { params }) {
  try {
    const { reportId } = params
    const body = await request.json()
    const { reportDate, premiumActual, salesCounselorActual, policySoldActual, agencyCoopActual } = body

    // Validate required fields
    if (
      !reportDate ||
      premiumActual === undefined ||
      salesCounselorActual === undefined ||
      policySoldActual === undefined ||
      agencyCoopActual === undefined
    ) {
      return Response.json({ error: "All fields are required" }, { status: 400 })
    }

    // Read current sales reports
    const reportsPath = path.join(process.cwd(), "data", "salesReports.json")
    const reportsData = await fs.readFile(reportsPath, "utf8")
    const reports = JSON.parse(reportsData)

    // Find the report to update
    const reportIndex = reports.findIndex((report) => report.reportId === Number.parseInt(reportId))
    if (reportIndex === -1) {
      return Response.json({ error: "Report not found" }, { status: 404 })
    }

    // Update the report
    reports[reportIndex] = {
      ...reports[reportIndex],
      reportDate,
      premiumActual: Number.parseFloat(premiumActual),
      salesCounselorActual: Number.parseInt(salesCounselorActual),
      policySoldActual: Number.parseInt(policySoldActual),
      agencyCoopActual: Number.parseInt(agencyCoopActual),
      updatedAt: new Date().toISOString(),
    }

    // Write back to file
    await fs.writeFile(reportsPath, JSON.stringify(reports, null, 2))

    return Response.json({
      message: "Report updated successfully",
      report: reports[reportIndex],
    })
  } catch (error) {
    console.error("Error updating report:", error)
    return Response.json({ error: "Failed to update report" }, { status: 500 })
  }
}

// DELETE - Delete a sales report
export async function DELETE(request, { params }) {
  try {
    const { reportId } = params

    // Read current sales reports
    const reportsPath = path.join(process.cwd(), "data", "salesReports.json")
    const reportsData = await fs.readFile(reportsPath, "utf8")
    const reports = JSON.parse(reportsData)

    // Find the report to delete
    const reportIndex = reports.findIndex((report) => report.reportId === Number.parseInt(reportId))
    if (reportIndex === -1) {
      return Response.json({ error: "Report not found" }, { status: 404 })
    }

    // Remove the report
    const deletedReport = reports.splice(reportIndex, 1)[0]

    // Write back to file
    await fs.writeFile(reportsPath, JSON.stringify(reports, null, 2))

    return Response.json({
      message: "Report deleted successfully",
      deletedReport,
    })
  } catch (error) {
    console.error("Error deleting report:", error)
    return Response.json({ error: "Failed to delete report" }, { status: 500 })
  }
}
