#!/usr/bin/env node
const fs = require("fs")
const path = require("path")

// ---------------- Helpers ----------------
function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", filename), "utf8"))
}
function safeNumber(v, d = 0) {
  const n = Number.parseFloat(v)
  return isNaN(n) ? d : n
}
function pct(actual, target) {
  if (!target) return 0
  return Math.round((actual / target) * 10000) / 100
}
function variance(actual, target) {
  return actual - target
}
function extractYear(dateStr) {
  return new Date(dateStr).getFullYear()
}
function inRange(dateStr, start, end) {
  if (!start && !end) return true
  const d = new Date(dateStr)
  if (start && d < new Date(start)) return false
  if (end && d > new Date(end)) return false
  return true
}
function getPeriodKey(dateStr, group) {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  if (group === "monthly") {
    return `${y}-${String(d.getMonth() + 1).padStart(2, "0")}`
  }
  if (group === "weekly") {
    const start = new Date(y, 0, 1)
    const diff = (d - start) / 86400000
    const week = Math.ceil((diff + start.getDay() + 1) / 7)
    return `${y}-W${String(week).padStart(2, "0")}`
  }
  return d.toISOString().split("T")[0]
}
function calcTarget(annual, start, end, mode) {
  if (!annual) return 0
  if (!start || !end) return annual
  const s = new Date(start)
  const e = new Date(end)
  const days = Math.ceil((e - s) / 86400000) + 1
  if (mode === "monthly") {
    const per = annual / 12
    const months = Math.max(1, Math.ceil(days / 30))
    return per * months
  }
  if (mode === "weekly") {
    const per = annual / 48
    const weeks = Math.max(1, Math.ceil(days / 7))
    return per * weeks
  }
  return annual
}

// ---------------- Main ----------------
async function main() {
  const args = process.argv.slice(2)
  const opts = { group: null, start: null, end: null }
  args.forEach((a) => {
    if (a.startsWith("--group=")) opts.group = a.split("=")[1]
    if (a.startsWith("--start=")) opts.start = a.split("=")[1]
    if (a.startsWith("--end=")) opts.end = a.split("=")[1]
  })

  // Load JSON
  const users = readJson("users.json")
  const reps = readJson("salesRepresentatives.json")
  const reports = readJson("salesReports.json")
  const targets = readJson("salesTargets.json")
  const types = readJson("salesTypes.json")
  const areas = readJson("areas.json")
  const regions = readJson("regions.json")

  // Maps
  const userMap = new Map(users.map((u) => [u.userId, u]))
  const repMap = new Map(reps.map((r) => [r.salesRepId, r]))
  const typeMap = new Map(types.map((t) => [t.salesTypeId, t.salesTypeName]))
  const areaMap = new Map(areas.map((a) => [a.areaId, a.areaName]))
  const regionMap = new Map(regions.map((r) => [r.regionId, r.regionName]))
  const targetMap = new Map(targets.map((t) => [`${t.salesRepId}-${t.year}`, t]))

  // Merge reports
  let merged = []
  for (const r of reports) {
    if (!inRange(r.reportDate, opts.start, opts.end)) continue
    const rep = repMap.get(r.salesRepId)
    if (!rep) continue
    const user = rep.userId ? userMap.get(rep.userId) : null
    const year = extractYear(r.reportDate)
    const target = targetMap.get(`${r.salesRepId}-${year}`)

    merged.push({
      reportId: r.reportId,
      period: opts.group ? getPeriodKey(r.reportDate, opts.group) : r.reportDate,
      reportDate: r.reportDate,
      salesRepId: r.salesRepId,
      salesRepName: user?.name || rep.name,
      userEmail: user?.email || null,
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
      target: target || null,
    })
  }

  // Group if requested
  if (opts.group) {
    const grouped = new Map()
    for (const r of merged) {
      const key = `${r.salesRepId}-${r.period}`
      if (!grouped.has(key)) {
        grouped.set(key, {
          period: r.period,
          salesRepId: r.salesRepId,
          salesRepName: r.salesRepName,
          areaName: r.areaName,
          regionName: r.regionName,
          salesTypeName: r.salesTypeName,
          premiumActual: 0,
          salesCounselorActual: 0,
          policySoldActual: 0,
          agencyCoopActual: 0,
          target: r.target,
        })
      }
      const g = grouped.get(key)
      g.premiumActual += r.premiumActual
      g.salesCounselorActual += r.salesCounselorActual
      g.policySoldActual += r.policySoldActual
      g.agencyCoopActual += r.agencyCoopActual
    }

    merged = Array.from(grouped.values()).map((g) => {
      const tgt = g.target
      let tPremium = 0,
        tCounselor = 0,
        tPolicy = 0,
        tAgency = 0
      if (tgt) {
        tPremium = calcTarget(tgt.premiumTarget, opts.start, opts.end, opts.group)
        tCounselor = calcTarget(tgt.salesCounselorTarget, opts.start, opts.end, opts.group)
        tPolicy = calcTarget(tgt.policySoldTarget, opts.start, opts.end, opts.group)
        tAgency = calcTarget(tgt.agencyCoopTarget, opts.start, opts.end, opts.group)
      }
      return {
        ...g,
        premiumTarget: tPremium,
        salesCounselorTarget: tCounselor,
        policySoldTarget: tPolicy,
        agencyCoopTarget: tAgency,
        premiumAchievement: pct(g.premiumActual, tPremium),
        counselorAchievement: pct(g.salesCounselorActual, tCounselor),
        policyAchievement: pct(g.policySoldActual, tPolicy),
        agencyAchievement: pct(g.agencyCoopActual, tAgency),
        premiumVariance: variance(g.premiumActual, tPremium),
        counselorVariance: variance(g.salesCounselorActual, tCounselor),
        policyVariance: variance(g.policySoldActual, tPolicy),
        agencyVariance: variance(g.agencyCoopActual, tAgency),
      }
    })
  }

  // Save
  const out = path.join(__dirname, "..", "data", "mergedReports.json")
  fs.writeFileSync(out, JSON.stringify(merged, null, 2))
  console.log(`✅ Saved ${merged.length} merged reports to ${out}`)
}

main().catch((err) => {
  console.error("❌ Fatal error:", err)
  process.exit(1)
})
