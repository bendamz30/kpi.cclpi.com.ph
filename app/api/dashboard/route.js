import { NextResponse } from "next/server"
import path from "path"
import { promises as fs } from "fs"

// Simple JSON store implementation for Next.js
class JsonStore {
  constructor(dataDir) {
    this.dataDir = dataDir
  }

  filePath(name) {
    return path.join(process.cwd(), this.dataDir, name + ".json")
  }

  async read(name) {
    const fp = this.filePath(name)
    try {
      const raw = await fs.readFile(fp, "utf8")
      return JSON.parse(raw || "null")
    } catch (error) {
      if (error.code === "ENOENT") return null
      throw error
    }
  }
}

const store = new JsonStore("data")

function monthsBetween(startDate, endDate) {
  const months = []
  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() })
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

function weeksBetween(startDate, endDate) {
  const weeks = []
  const cur = new Date(startDate)
  // Set to Monday of the week
  cur.setDate(cur.getDate() - cur.getDay() + 1)

  while (cur <= endDate) {
    weeks.push(new Date(cur))
    cur.setDate(cur.getDate() + 7)
  }
  return weeks
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")
    const granularity = searchParams.get("granularity") || "monthly"
    const groupBy = searchParams.get("groupBy") || "area"
    const salesTypeId = searchParams.get("salesTypeId")
    const areaId = searchParams.get("areaId")
    const regionId = searchParams.get("regionId")
    const salesRepId = searchParams.get("salesRepId")
    const kpi = searchParams.get("kpi") || "premium"
    const year = searchParams.get("year") || new Date().getFullYear()

    if (!start || !end) {
      return NextResponse.json({ error: "start and end required in YYYY-MM-DD" }, { status: 400 })
    }

    const startDate = new Date(start)
    const endDate = new Date(end)

    // Load all data
    const [areas, regions, reps, targets, reports, salesTypes] = await Promise.all([
      store.read("areas"),
      store.read("regions"),
      store.read("salesRepresentatives"),
      store.read("salesTargets"),
      store.read("salesReports"),
      store.read("salesTypes"),
    ])

    // Filter reps by criteria
    let repsFiltered = reps || []
    if (salesTypeId) repsFiltered = repsFiltered.filter((r) => r.salesTypeId === Number(salesTypeId))
    if (areaId) {
      const regionIds = (regions || []).filter((r) => r.areaId === Number(areaId)).map((r) => r.regionId)
      repsFiltered = repsFiltered.filter((r) => regionIds.includes(r.regionId))
    }
    if (regionId) repsFiltered = repsFiltered.filter((r) => r.regionId === Number(regionId))
    if (salesRepId) repsFiltered = repsFiltered.filter((r) => r.salesRepId === Number(salesRepId))

    // Per-rep aggregation
    const perRep = repsFiltered.map((rep) => {
      const repTargets = (targets || []).find((t) => t.salesRepId === rep.salesRepId && t.year === Number(year))

      const annual = repTargets
        ? {
            premium: Number(repTargets.premiumTarget || 0),
            sc: Number(repTargets.salesCounselorTarget || 0),
            policy: Number(repTargets.policySoldTarget || 0),
            agency: Number(repTargets.agencyCoopTarget || 0),
          }
        : { premium: null, sc: null, policy: null, agency: null }

      const repReports = (reports || []).filter(
        (r) => r.salesRepId === rep.salesRepId && r.reportDate >= start && r.reportDate <= end,
      )

      const actuals = repReports.reduce(
        (acc, r) => {
          acc.premium += Number(r.premiumActual || 0)
          acc.sc += Number(r.salesCounselorActual || 0)
          acc.policy += Number(r.policySoldActual || 0)
          acc.agency += Number(r.agencyCoopActual || 0)
          return acc
        },
        { premium: 0, sc: 0, policy: 0, agency: 0 },
      )

      return { rep, annual, actuals }
    })

    // Aggregate to groups
    const groups = {}
    const monthsNum = monthsBetween(startDate, endDate).length
    const weeksNum = weeksBetween(startDate, endDate).length

    function addToGroup(key, name, kpiKey, repAnnualValue, repActualValue) {
      if (!groups[key]) {
        groups[key] = { groupId: key, groupName: name, actual: 0, annualTarget: 0, budget: 0 }
      }
      groups[key].actual += repActualValue
      if (repAnnualValue != null) {
        groups[key].annualTarget += repAnnualValue
        const monthly = repAnnualValue / 12
        const weekly = repAnnualValue / 52
        if (granularity === "monthly") groups[key].budget += monthly * monthsNum
        else if (granularity === "weekly") groups[key].budget += weekly * weeksNum
        else groups[key].budget += repAnnualValue
      }
    }

    perRep.forEach((item) => {
      const rep = item.rep
      const regionObj = (regions || []).find((r) => r.regionId === rep.regionId)
      const area = (areas || []).find((a) => a.areaId === regionObj?.areaId)

      const kpiKey = kpi === "premium" ? "premium" : kpi === "sc" ? "sc" : kpi === "policy" ? "policy" : "agency"
      const repAnnualValue = item.annual[kpiKey]
      const repActualValue = item.actuals[kpiKey]

      if (groupBy === "salesRep") {
        addToGroup(rep.salesRepId, rep.name, kpiKey, repAnnualValue, repActualValue)
      } else if (groupBy === "region") {
        addToGroup(rep.regionId, regionObj?.regionName || "Unknown", kpiKey, repAnnualValue, repActualValue)
      } else {
        // area
        addToGroup(area?.areaId || 0, area?.areaName || "Unknown", kpiKey, repAnnualValue, repActualValue)
      }
    })

    // Build response
    const data = Object.values(groups).map((g) => {
      const percent = g.budget && g.budget > 0 ? (g.actual / g.budget) * 100 : null
      return {
        groupId: g.groupId,
        groupName: g.groupName,
        actual: Number(g.actual.toFixed(2)),
        annualTarget: g.annualTarget ? Number(g.annualTarget.toFixed(2)) : null,
        budgetForRange: g.budget ? Number(g.budget.toFixed(2)) : null,
        variance: g.budget ? Number((g.budget - g.actual).toFixed(2)) : null,
        percent: percent != null ? Number(percent.toFixed(1)) : null,
        breakdown: [],
      }
    })

    const meta = { start, end, granularity, groupBy, kpi }
    const totals = {
      actual: Number(
        Object.values(groups)
          .reduce((s, g) => s + g.actual, 0)
          .toFixed(2),
      ),
      budget: Number(
        Object.values(groups)
          .reduce((s, g) => s + (g.budget || 0), 0)
          .toFixed(2),
      ),
    }

    return NextResponse.json({ meta, data, totals })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
