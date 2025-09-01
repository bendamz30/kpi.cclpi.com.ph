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
    const [reportsData, targetsData, usersData, regionsData, areasData, salesTypesData] = await Promise.all([
      fs.readFile(path.join(process.cwd(), "data/salesReports.json"), "utf8"),
      fs.readFile(path.join(process.cwd(), "data/salesTargets.json"), "utf8"),
      fs.readFile(path.join(process.cwd(), "data/users.json"), "utf8"),
      fs.readFile(path.join(process.cwd(), "data/regions.json"), "utf8"),
      fs.readFile(path.join(process.cwd(), "data/areas.json"), "utf8"),
      fs.readFile(path.join(process.cwd(), "data/salesTypes.json"), "utf8"),
    ])

    const reports = JSON.parse(reportsData)
    const targets = JSON.parse(targetsData)
    const users = JSON.parse(usersData)
    const regions = JSON.parse(regionsData)
    const areas = JSON.parse(areasData)
    const salesTypes = JSON.parse(salesTypesData)

    console.log("[v0] Loaded data - Reports:", reports.length, "Targets:", targets.length, "Users:", users.length)
    console.log("[v0] Sample report:", reports[0])
    console.log("[v0] Sample target:", targets[0])

    const filteredReports = reports.filter((report) => {
      const reportDate = new Date(report.reportDate)
      const user = users.find((u) => u.userId === report.salesRepId)

      if (report.reportId === 306) {
        console.log("[v0] DEBUG Report 306 (Dianne):")
        console.log("  - Report:", report)
        console.log("  - Found user:", user)
        console.log("  - Filter values:", { salesType, area, region, salesOfficer })
      }

      // Date range filter - only apply if dates are provided
      if (startDate && startDate !== "" && reportDate < new Date(startDate)) {
        if (report.reportId === 306) console.log("  - FILTERED OUT: Start date")
        return false
      }
      if (endDate && endDate !== "" && reportDate > new Date(endDate)) {
        if (report.reportId === 306) console.log("  - FILTERED OUT: End date")
        return false
      }

      // Sales officer filter - only apply if specific officer is selected
      if (salesOfficer && salesOfficer !== "" && salesOfficer !== "All" && user?.name !== salesOfficer) {
        if (report.reportId === 306) console.log("  - FILTERED OUT: Sales officer", user?.name, "!==", salesOfficer)
        return false
      }

      // Region filter - only apply if specific region is selected
      if (region && region !== "" && region !== "All") {
        const userRegion = regions.find((r) => r.regionId === user?.regionId)
        if (userRegion?.regionName !== region) {
          if (report.reportId === 306) console.log("  - FILTERED OUT: Region", userRegion?.regionName, "!==", region)
          return false
        }
      }

      // Area filter - only apply if specific area is selected
      if (area && area !== "" && area !== "All") {
        const userRegion = regions.find((r) => r.regionId === user?.regionId)
        const userArea = areas.find((a) => a.areaId === userRegion?.areaId)
        if (userArea?.areaName !== area) {
          if (report.reportId === 306) console.log("  - FILTERED OUT: Area", userArea?.areaName, "!==", area)
          return false
        }
      }

      // Sales type filter - only apply if specific type is selected
      if (salesType && salesType !== "" && salesType !== "All") {
        const userSalesType = salesTypes.find((st) => st.salesTypeId === user?.salesTypeId)
        if (userSalesType?.salesTypeName !== salesType) {
          if (report.reportId === 306)
            console.log("  - FILTERED OUT: Sales type", userSalesType?.salesTypeName, "!==", salesType)
          return false
        }
      }

      if (report.reportId === 306) console.log("  - PASSED ALL FILTERS")
      return true
    })

    const filteredTargets = targets.filter((target) => {
      const user = users.find((u) => u.userId === target.salesRepId)

      // Sales officer filter - only apply if specific officer is selected
      if (salesOfficer && salesOfficer !== "" && salesOfficer !== "All" && user?.name !== salesOfficer) {
        return false
      }

      // Region filter - only apply if specific region is selected
      if (region && region !== "" && region !== "All") {
        const userRegion = regions.find((r) => r.regionId === user?.regionId)
        if (userRegion?.regionName !== region) {
          return false
        }
      }

      // Area filter - only apply if specific area is selected
      if (area && area !== "" && area !== "All") {
        const userRegion = regions.find((r) => r.regionId === user?.regionId)
        const userArea = areas.find((a) => a.areaId === userRegion?.areaId)
        if (userArea?.areaName !== area) {
          return false
        }
      }

      // Sales type filter - only apply if specific type is selected
      if (salesType && salesType !== "" && salesType !== "All") {
        const userSalesType = salesTypes.find((st) => st.salesTypeId === user?.salesTypeId)
        if (userSalesType?.salesTypeName !== salesType) {
          return false
        }
      }

      return true
    })

    console.log("[v0] Filtered results - Reports:", filteredReports.length, "Targets:", filteredTargets.length)

    if (filteredReports.length === 0 && filteredTargets.length === 0) {
      console.log("[v0] No data found for the selected filters")
      return Response.json({
        kpis: [],
        message: "No data found for the selected filters.",
        hasData: false,
      })
    }

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

    console.log("[v0] Aggregated data:", aggregatedData)

    // Calculate KPIs
    const kpis = Object.entries(aggregatedData).map(([key, data]) => {
      const achievement = data.target > 0 ? (data.actual / data.target) * 100 : data.actual > 0 ? null : 0
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
        achievement: achievement !== null ? Math.round(achievement * 100) / 100 : null,
        variance,
        status:
          achievement === null ? "info" : achievement >= 100 ? "success" : achievement >= 80 ? "warning" : "danger",
      }
    })

    console.log("[v0] Final KPIs:", kpis)

    return Response.json({ kpis, hasData: true })
  } catch (error) {
    console.error("[v0] Dashboard data error:", error)
    return Response.json(
      {
        error: "Error loading data. Please check salesReports.json and salesTargets.json.",
        kpis: [],
        hasData: false,
      },
      { status: 500 },
    )
  }
}
