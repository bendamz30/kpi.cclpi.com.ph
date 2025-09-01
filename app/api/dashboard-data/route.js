const fs = require("fs").promises
const path = require("path")

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const salesType = searchParams.get("salesType")
    const area = searchParams.get("area")
    const region = searchParams.get("region")
    const salesOfficer = searchParams.get("salesOfficer")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const granularity = searchParams.get("granularity") || "monthly"

    // Read data files
    const [reportsData, targetsData, usersData] = await Promise.all([
      fs.readFile(path.join(process.cwd(), "data/salesReports.json"), "utf8"),
      fs.readFile(path.join(process.cwd(), "data/salesTargets.json"), "utf8"),
      fs.readFile(path.join(process.cwd(), "data/users.json"), "utf8"),
    ])

    const reports = JSON.parse(reportsData)
    const targets = JSON.parse(targetsData)
    const users = JSON.parse(usersData)

    // Filter reports based on criteria
    const filteredReports = reports.filter((report) => {
      const reportDate = new Date(report.reportDate)
      const user = users.find((u) => u.userId === report.salesRepId)

      // Date range filter
      if (startDate && reportDate < new Date(startDate)) return false
      if (endDate && reportDate > new Date(endDate)) return false

      // Sales officer filter
      if (salesOfficer && report.salesRepId !== Number.parseInt(salesOfficer)) return false

      // Region filter (through user)
      if (region && user?.regionId !== Number.parseInt(region)) return false

      // Area filter (through user - would need to join with regions)
      // Sales type filter (through user)
      if (salesType && user?.salesTypeId !== Number.parseInt(salesType)) return false

      return true
    })

    // Filter targets based on same criteria
    const filteredTargets = targets.filter((target) => {
      const user = users.find((u) => u.userId === target.salesRepId)

      // Sales officer filter
      if (salesOfficer && target.salesRepId !== Number.parseInt(salesOfficer)) return false

      // Region filter
      if (region && user?.regionId !== Number.parseInt(region)) return false

      // Sales type filter
      if (salesType && user?.salesTypeId !== Number.parseInt(salesType)) return false

      return true
    })

    // Aggregate data
    const aggregatedData = {
      premium: {
        actual: filteredReports.reduce((sum, r) => sum + (r.premiumActual || 0), 0),
        target: filteredTargets.reduce((sum, t) => sum + (t.premiumTarget || 0), 0),
      },
      salesCounselors: {
        actual: filteredReports.reduce((sum, r) => sum + (r.salesCounselorActual || 0), 0),
        target: filteredTargets.reduce((sum, t) => sum + (t.salesCounselorTarget || 0), 0),
      },
      policiesSold: {
        actual: filteredReports.reduce((sum, r) => sum + (r.policySoldActual || 0), 0),
        target: filteredTargets.reduce((sum, t) => sum + (t.policySoldTarget || 0), 0),
      },
      agencyCoops: {
        actual: filteredReports.reduce((sum, r) => sum + (r.agencyCoopActual || 0), 0),
        target: filteredTargets.reduce((sum, t) => sum + (t.agencyCoopTarget || 0), 0),
      },
    }

    // Calculate KPIs
    const kpis = Object.entries(aggregatedData).map(([key, data]) => {
      const achievement = data.target > 0 ? (data.actual / data.target) * 100 : 0
      const variance = data.actual - data.target

      return {
        key,
        title:
          key === "premium"
            ? "Premium"
            : key === "salesCounselors"
              ? "Sales Counselors"
              : key === "policiesSold"
                ? "Policies Sold"
                : "Agency Coops",
        actual: data.actual,
        target: data.target,
        achievement: Math.round(achievement * 100) / 100,
        variance,
        status: achievement >= 100 ? "success" : achievement >= 80 ? "warning" : "danger",
      }
    })

    return Response.json({ kpis })
  } catch (error) {
    console.error("Dashboard data error:", error)
    return Response.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
