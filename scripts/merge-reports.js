#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

// ==================== CLI ARGUMENTS ====================
const args = process.argv.slice(2)
const options = { group: null, start: null, end: null }

args.forEach((arg) => {
  if (arg.startsWith("--group=")) options.group = arg.split("=")[1]
  else if (arg.startsWith("--start=")) options.start = arg.split("=")[1]
  else if (arg.startsWith("--end=")) options.end = arg.split("=")[1]
})

// ==================== HELPERS ====================
function readJsonFile(filename) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", filename), "utf8"))
}

function safeNumber(value) {
  const n = Number.parseFloat(value)
  return isNaN(n) ? 0 : n
}

function calculatePercentage(actual, target) {
  if (!target) return null
  return Math.round((actual / target) * 100 * 100) / 100
}

function calculateVariance(actual, target) {
  if (!target) return null
  return actual - target
}

function extractYear(dateString) {
  return new Date(dateString).getFullYear()
}

function isDateInRange(dateString, startDate, endDate) {
  const date = new Date(dateString)
  if (startDate && date < new Date(startDate)) return false
  if (endDate && date > new Date(endDate)) return false
  return true
}

function getPeriodKey(dateString, groupBy) {
  const date = new Date(dateString)
  const year = date.getFullYear()

  if (groupBy === "monthly") {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    return `${year}-${month}`
  }
  if (groupBy === "weekly") {
    const startOfYear = new Date(year, 0, 1)
    const pastDaysOfYear = (date - startOfYear) / 86400000
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)
    return `${year}-W${String(weekNumber).padStart(2, "0")}`
  }
  return dateString
}

// ==================== MAIN ====================
async function main() {
  console.log("🚀 Starting merge reports...")

  // Load data
  const users = readJsonFile("users.json")
  const salesReports = readJsonFile("salesReports.json")
  const salesTargets = readJsonFile("salesTargets.json")
  const salesReps = readJsonFile("salesRepresentatives.json")
  const salesTypes = readJsonFile("salesTypes.json")
  const areas = readJsonFile("areas.json")
  const regions = readJsonFile("regions.json")

  // Maps
  const userMap = new Map(users.map((u) => [u.userId, u]))
  const repMap = new Map(salesReps.map((r) => [r.salesRepId, r]))
  const typeMap = new Map(salesTypes.map((t) => [t.salesTypeId, t.salesTypeName]))
  const areaMap = new Map(areas.map((a) => [a.areaId, a.areaName]))
  const regionMap = new Map(regions.map((r) => [r.regionId, r.regionName]))

  // Targets map
  const targetMap = new Map()
  salesTargets.forEach((t) => {
    targetMap.set(`${t.salesRepId}-${t.year}`, t)
  })

  // Step 1: Enrich reports (NO TARGETS YET)
  const enrichedReports = salesReports
    .filter((r) => isDateInRange(r.reportDate, options.start, options.end))
    .map((r) => {
      const rep = repMap.get(r.salesRepId) || {}
      const user = rep.userId ? userMap.get(rep.userId) : null
      return {
        reportId: r.reportId,
        reportDate: r.reportDate,
        salesRepId: r.salesRepId,
        salesRepName: user?.name || rep.name || "Unknown",
        areaId: rep.areaId,
        areaName: areaMap.get(rep.areaId) || null,
        regionId: rep.regionId,
        regionName: regionMap.get(rep.regionId) || null,
        salesTypeId: rep.salesTypeId,
        salesTypeName: typeMap.get(rep.salesTypeId) || null,
        premiumActual: safeNumber(r.premiumActual),
        salesCounselorActual: safeNumber(r.salesCounselorActual),
        policySoldActual: safeNumber(r.policySoldActual),
        agencyCoopActual: safeNumber(r.agencyCoopActual),
      }
    })

  // Step 2: Group reports
  let groupedReports
  if (options.group === "monthly" || options.group === "weekly") {
    const grouped = new Map()

    enrichedReports.forEach((r) => {
      const key = `${r.salesRepId}-${getPeriodKey(r.reportDate, options.group)}`

      if (!grouped.has(key)) {
        grouped.set(key, {
          period: getPeriodKey(r.reportDate, options.group),
          salesRepId: r.salesRepId,
          salesRepName: r.salesRepName,
          areaId: r.areaId,
          areaName: r.areaName,
          regionId: r.regionId,
          regionName: r.regionName,
          salesTypeId: r.salesTypeId,
          salesTypeName: r.salesTypeName,
          premiumActual: 0,
          salesCounselorActual: 0,
          policySoldActual: 0,
          agencyCoopActual: 0,
        })
      }

      const group = grouped.get(key)
      group.premiumActual += r.premiumActual
      group.salesCounselorActual += r.salesCounselorActual
      group.policySoldActual += r.policySoldActual
      group.agencyCoopActual += r.agencyCoopActual
    })

    // Step 3: Add targets to grouped reports
    groupedReports = Array.from(grouped.values()).map((g) => {
      const year = extractYear(g.period)
      const target = targetMap.get(`${g.salesRepId}-${year}`)

      let premiumTarget = 0
      let salesCounselorTarget = 0
      let policySoldTarget = 0
      let agencyCoopTarget = 0

      if (target) {
        if (options.group === "monthly") {
          premiumTarget = Math.round((target.premiumTarget / 12) * 100) / 100
          salesCounselorTarget = Math.round((target.salesCounselorTarget / 12) * 100) / 100
          policySoldTarget = Math.round((target.policySoldTarget / 12) * 100) / 100
          agencyCoopTarget = Math.round((target.agencyCoopTarget / 12) * 100) / 100
        } else if (options.group === "weekly") {
          premiumTarget = Math.round((target.premiumTarget / 48) * 100) / 100
          salesCounselorTarget = Math.round((target.salesCounselorTarget / 48) * 100) / 100
          policySoldTarget = Math.round((target.policySoldTarget / 48) * 100) / 100
          agencyCoopTarget = Math.round((target.agencyCoopTarget / 48) * 100) / 100
        }
      } else {
        console.warn(`⚠️ No target found for salesRepId ${g.salesRepId} in year ${year}`)
      }

      return {
        ...g,
        premiumTarget,
        salesCounselorTarget,
        policySoldTarget,
        agencyCoopTarget,
        premiumAchievement: calculatePercentage(g.premiumActual, premiumTarget),
        counselorAchievement: calculatePercentage(g.salesCounselorActual, salesCounselorTarget),
        policyAchievement: calculatePercentage(g.policySoldActual, policySoldTarget),
        agencyAchievement: calculatePercentage(g.agencyCoopActual, agencyCoopTarget),
        premiumVariance: calculateVariance(g.premiumActual, premiumTarget),
        counselorVariance: calculateVariance(g.salesCounselorActual, salesCounselorTarget),
        policyVariance: calculateVariance(g.policySoldActual, policySoldTarget),
        agencyVariance: calculateVariance(g.agencyCoopActual, agencyCoopTarget),
      }
    })
  } else {
    // No grouping - individual reports with targets
    groupedReports = enrichedReports.map((r) => {
      const year = extractYear(r.reportDate)
      const target = targetMap.get(`${r.salesRepId}-${year}`)

      let premiumTarget = 0
      let salesCounselorTarget = 0
      let policySoldTarget = 0
      let agencyCoopTarget = 0

      if (target) {
        premiumTarget = target.premiumTarget
        salesCounselorTarget = target.salesCounselorTarget
        policySoldTarget = target.policySoldTarget
        agencyCoopTarget = target.agencyCoopTarget
      } else {
        console.warn(`⚠️ No target found for salesRepId ${r.salesRepId} in year ${year}`)
      }

      return {
        ...r,
        premiumTarget,
        salesCounselorTarget,
        policySoldTarget,
        agencyCoopTarget,
        premiumAchievement: calculatePercentage(r.premiumActual, premiumTarget),
        counselorAchievement: calculatePercentage(r.salesCounselorActual, salesCounselorTarget),
        policyAchievement: calculatePercentage(r.policySoldActual, policySoldTarget),
        agencyAchievement: calculatePercentage(r.agencyCoopActual, agencyCoopTarget),
        premiumVariance: calculateVariance(r.premiumActual, premiumTarget),
        counselorVariance: calculateVariance(r.salesCounselorActual, salesCounselorTarget),
        policyVariance: calculateVariance(r.policySoldActual, policySoldTarget),
        agencyVariance: calculateVariance(r.agencyCoopActual, agencyCoopTarget),
      }
    })
  }

  // Step 4: Save merged reports
  const outputPath = path.join(__dirname, "..", "data", "mergedReports.json")
  fs.writeFileSync(outputPath, JSON.stringify(groupedReports, null, 2))

  console.log(`✅ Successfully merged ${groupedReports.length} reports`)
  console.log(`📁 Output saved to: ${outputPath}`)

  if (options.group) {
    console.log(`📊 Grouped by: ${options.group}`)
  }
  if (options.start || options.end) {
    console.log(`📅 Date range: ${options.start || "start"} to ${options.end || "end"}`)
  }
}

// Run the script
main().catch((error) => {
  console.error("❌ Error running merge reports:", error)
  process.exit(1)
})
