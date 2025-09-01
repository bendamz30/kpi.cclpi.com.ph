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

    console.log("[v0] Dashboard filters:", { salesType, area, region, salesOfficer, startDate, endDate })

    // Read data files
    const [reportsData, targetsData, usersData, regionsData, areasData] = await Promise.all([
      fs.readFile(path.join(process.cwd(), "data/salesReports.json"), "utf8"),
      fs.readFile(path.join(process.cwd(), "data/salesTargets.json"), "utf8"),
      fs.readFile(path.join(process.cwd(), "data/users.json"), "utf8"),
      fs.readFile(path.join(process.cwd(), "data/regions.json"), "utf8"),
      fs.readFile(path.join(process.cwd(), "data/areas.json"), "utf8"),
    ])

    const reports = JSON.parse(reportsData)
    const targets = JSON.parse(targetsData)
    const users = JSON.parse(usersData)
    const regions = JSON.parse(regionsData)
    const areas = JSON.parse(areasData)

    console.log("[v0] Total reports:", reports.length)
    console.log("[v0] Total users:", users.length)

    // Filter reports based on criteria
    const filteredReports = reports.filter((report) => {
      const reportDate = new Date(report.reportDate)
      const user = users.find((u) => u.userId === report.salesRepId)

      console.log("[v0] Checking report:", report.reportId, "for user:", user?.name)

      // Date range filter
      if (startDate && reportDate < new Date(startDate)) {
        console.log("[v0] Filtered out by start date")
        return false
      }
      if (endDate && reportDate > new Date(endDate)) {
        console.log("[v0] Filtered out by end date")
        return false
      }

      // Sales officer filter - match by name instead of ID
      if (salesOfficer && user?.name !== salesOfficer) {
        console.log("[v0] Filtered out by sales officer:", user?.name, "vs", salesOfficer)
        return false
      }

      // Region filter - match by name instead of ID
      if (region) {
        const userRegion = regions.find((r) => r.regionId === user?.regionId)
        if (userRegion?.regionName !== region) {
          console.log("[v0] Filtered out by region:", userRegion?.regionName, "vs", region)
          return false
        }
      }

      // Area filter - match by name through region
      if (area) {
        const userRegion = regions.find((r) => r.regionId === user?.regionId)
        const userArea = areas.find((a) => a.areaId === userRegion?.areaId)
        if (userArea?.areaName !== area) {
          console.log("[v0] Filtered out by area:", userArea?.areaName, "vs", area)
          return false
        }
      }

      // Sales type filter - match by name instead of ID
      if (salesType) {
        const salesTypes = [
          { salesTypeId: 1, salesTypeName: "Traditional" },
          { salesTypeId: 2, salesTypeName: "Hybrid" },
        ]
        const userSalesType = salesTypes.find((st) => st.salesTypeId === user?.salesTypeId)
        if (userSalesType?.salesTypeName !== salesType) {
          console.log("[v0] Filtered out by sales type:", userSalesType?.salesTypeName, "vs", salesType)
          return false
        }
      }

      console.log("[v0] Report passed all filters")
      return true
    })

    console.log("[v0] Filtered reports count:", filteredReports.length)

    // Filter targets based on same criteria
    const filteredTargets = targets.filter((target) => {
      const user = users.find((u) => u.userId === target.salesRepId)

      // Sales officer filter - match by name
      if (salesOfficer && user?.name !== salesOfficer) return false

      // Region filter - match by name
      if (region) {
        const userRegion = regions.find((r) => r.regionId === user?.regionId)
        if (userRegion?.regionName !== region) return false
      }

      // Area filter - match by name through region
      if (area) {
        const userRegion = regions.find((r) => r.regionId === user?.regionId)
        const userArea = areas.find((a) => a.areaId === userRegion?.areaId)
        if (userArea?.areaName !== area) return false
      }

      // Sales type filter - match by name
      if (salesType) {
        const salesTypes = [
          { salesTypeId: 1, salesTypeName: "Traditional" },
          { salesTypeId: 2, salesTypeName: "Hybrid" },
        ]
        const userSalesType = salesTypes.find((st) => st.salesTypeId === user?.salesTypeId)
        if (userSalesType?.salesTypeName !== salesType) return false
      }

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
