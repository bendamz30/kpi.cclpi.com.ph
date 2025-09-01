#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

/**
 * Merge Reports Script
 *
 * Reads JSON files from /data folder and produces a merged JSON array
 * that joins sales reports with user info and their yearly targets.
 *
 * Usage:
 *   node scripts/merge-reports.js
 *   node scripts/merge-reports.js --group=monthly
 *   node scripts/merge-reports.js --start=2025-01-01 --end=2025-12-31
 */

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  group: null,
  start: null,
  end: null,
}

args.forEach((arg) => {
  if (arg.startsWith("--group=")) {
    options.group = arg.split("=")[1]
  } else if (arg.startsWith("--start=")) {
    options.start = arg.split("=")[1]
  } else if (arg.startsWith("--end=")) {
    options.end = arg.split("=")[1]
  }
})

// Helper function to read and parse JSON file
function readJsonFile(filename) {
  const filePath = path.join(__dirname, "..", "data", filename)

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File ${filename} not found at ${filePath}`)
    process.exit(1)
  }

  try {
    const content = fs.readFileSync(filePath, "utf8")
    return JSON.parse(content)
  } catch (error) {
    console.error(`❌ Error parsing ${filename}:`, error.message)
    process.exit(1)
  }
}

// Helper function to safely convert to number
function safeNumber(value, defaultValue = 0) {
  const num = Number.parseFloat(value)
  return isNaN(num) ? defaultValue : num
}

// Helper function to calculate percentage
function calculatePercentage(actual, target) {
  if (!target || target === 0) return null
  return Math.round((actual / target) * 100 * 100) / 100 // Round to 2 decimals
}

// Helper function to calculate variance
function calculateVariance(actual, target) {
  if (target === null || target === undefined) return null
  return actual - target
}

// Helper function to extract year from date string
function extractYear(dateString) {
  try {
    const date = new Date(dateString)
    return date.getFullYear()
  } catch (error) {
    console.warn(`⚠️  Invalid date format: ${dateString}`)
    return null
  }
}

// Helper function to check if date is within range
function isDateInRange(dateString, startDate, endDate) {
  if (!startDate && !endDate) return true

  try {
    const date = new Date(dateString)
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    if (start && date < start) return false
    if (end && date > end) return false

    return true
  } catch (error) {
    console.warn(`⚠️  Invalid date comparison: ${dateString}`)
    return false
  }
}

// Helper function to get period key for grouping
function getPeriodKey(dateString, groupBy) {
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()

    if (groupBy === "monthly") {
      const month = String(date.getMonth() + 1).padStart(2, "0")
      return `${year}-${month}`
    } else if (groupBy === "weekly") {
      // Get ISO week number
      const startOfYear = new Date(year, 0, 1)
      const pastDaysOfYear = (date - startOfYear) / 86400000
      const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)
      return `${year}-W${String(weekNumber).padStart(2, "0")}`
    }

    return dateString
  } catch (error) {
    console.warn(`⚠️  Invalid date for grouping: ${dateString}`)
    return "unknown"
  }
}

async function main() {
  console.log("🚀 Starting merge reports process...\n")

  // Read all JSON files
  console.log("📖 Reading JSON files...")
  const users = readJsonFile("users.json")
  const salesReports = readJsonFile("salesReports.json")
  const salesTargets = readJsonFile("salesTargets.json")
  const salesTypes = readJsonFile("salesTypes.json")
  const areas = readJsonFile("areas.json")
  const regions = readJsonFile("regions.json")

  console.log(`✅ Loaded ${users.length} users`)
  console.log(`✅ Loaded ${salesReports.length} sales reports`)
  console.log(`✅ Loaded ${salesTargets.length} sales targets`)
  console.log(`✅ Loaded ${salesTypes.length} sales types`)
  console.log(`✅ Loaded ${areas.length} areas`)
  console.log(`✅ Loaded ${regions.length} regions\n`)

  // Create lookup maps for faster access
  const userMap = new Map(users.map((user) => [user.userId, user]))
  const salesTypeMap = new Map(salesTypes.map((type) => [type.salesTypeId, type.salesTypeName]))
  const areaMap = new Map(areas.map((area) => [area.areaId, area.areaName]))
  const regionMap = new Map(regions.map((region) => [region.regionId, region.regionName]))

  // Create targets lookup by salesRepId and year
  const targetsMap = new Map()
  salesTargets.forEach((target) => {
    const key = `${target.salesRepId}-${target.year}`
    targetsMap.set(key, target)
  })

  console.log("🔄 Processing sales reports...")

  let mergedReports = []
  let reportsWithTargets = 0
  let reportsWithoutTargets = 0

  // Process each sales report
  salesReports.forEach((report, index) => {
    try {
      // Apply date range filter if specified
      if (!isDateInRange(report.reportDate, options.start, options.end)) {
        return // Skip this report
      }

      // Lookup user information
      const user = userMap.get(report.salesRepId)
      if (!user) {
        console.warn(`⚠️  User not found for salesRepId: ${report.salesRepId}`)
      }

      // Extract year from report date
      const reportYear = extractYear(report.reportDate)
      if (!reportYear) {
        console.warn(`⚠️  Invalid report date: ${report.reportDate}`)
        return
      }

      // Lookup target for this sales rep and year
      const targetKey = `${report.salesRepId}-${reportYear}`
      const target = targetsMap.get(targetKey)
      const targetExists = !!target

      if (targetExists) {
        reportsWithTargets++
      } else {
        reportsWithoutTargets++
      }

      // Build merged object
      const mergedReport = {
        // Report fields
        reportId: report.reportId,
        reportDate: report.reportDate,
        salesRepId: report.salesRepId,
        salesRepName: user ? user.name : "Unknown",

        // Location and type information
        areaId: user ? user.areaId : null,
        areaName: user && user.areaId ? areaMap.get(user.areaId) || "Unknown" : null,
        regionId: user ? user.regionId : null,
        regionName: user && user.regionId ? regionMap.get(user.regionId) || "Unknown" : null,
        salesTypeId: user ? user.salesTypeId : null,
        salesTypeName: user && user.salesTypeId ? salesTypeMap.get(user.salesTypeId) || "Unknown" : null,

        // Premium metrics
        premiumActual: safeNumber(report.premiumActual),
        premiumTarget: target ? safeNumber(target.premiumTarget) : null,
        premiumAchievementPercent: calculatePercentage(
          safeNumber(report.premiumActual),
          target ? safeNumber(target.premiumTarget) : null,
        ),
        premiumVariance: calculateVariance(
          safeNumber(report.premiumActual),
          target ? safeNumber(target.premiumTarget) : null,
        ),

        // Sales Counselor metrics
        salesCounselorActual: safeNumber(report.salesCounselorActual),
        salesCounselorTarget: target ? safeNumber(target.salesCounselorTarget) : null,
        salesCounselorAchievementPercent: calculatePercentage(
          safeNumber(report.salesCounselorActual),
          target ? safeNumber(target.salesCounselorTarget) : null,
        ),
        salesCounselorVariance: calculateVariance(
          safeNumber(report.salesCounselorActual),
          target ? safeNumber(target.salesCounselorTarget) : null,
        ),

        // Policy Sold metrics
        policySoldActual: safeNumber(report.policySoldActual),
        policySoldTarget: target ? safeNumber(target.policySoldTarget) : null,
        policySoldAchievementPercent: calculatePercentage(
          safeNumber(report.policySoldActual),
          target ? safeNumber(target.policySoldTarget) : null,
        ),
        policySoldVariance: calculateVariance(
          safeNumber(report.policySoldActual),
          target ? safeNumber(target.policySoldTarget) : null,
        ),

        // Agency Coop metrics
        agencyCoopActual: safeNumber(report.agencyCoopActual),
        agencyCoopTarget: target ? safeNumber(target.agencyCoopTarget) : null,
        agencyCoopAchievementPercent: calculatePercentage(
          safeNumber(report.agencyCoopActual),
          target ? safeNumber(target.agencyCoopTarget) : null,
        ),
        agencyCoopVariance: calculateVariance(
          safeNumber(report.agencyCoopActual),
          target ? safeNumber(target.agencyCoopTarget) : null,
        ),

        // Metadata
        createdAt: report.createdAt,
        updatedAt: report.updatedAt || null,
        targetExists: targetExists,
      }

      mergedReports.push(mergedReport)
    } catch (error) {
      console.error(`❌ Error processing report ${index + 1}:`, error.message)
    }
  })

  // Apply grouping if specified
  if (options.group && (options.group === "weekly" || options.group === "monthly")) {
    console.log(`📊 Grouping by ${options.group}...`)

    const grouped = new Map()

    mergedReports.forEach((report) => {
      const periodKey = getPeriodKey(report.reportDate, options.group)

      if (!grouped.has(periodKey)) {
        grouped.set(periodKey, {
          period: periodKey,
          salesRepId: report.salesRepId,
          salesRepName: report.salesRepName,
          areaId: report.areaId,
          areaName: report.areaName,
          regionId: report.regionId,
          regionName: report.regionName,
          salesTypeId: report.salesTypeId,
          salesTypeName: report.salesTypeName,
          premiumActual: 0,
          premiumTarget: 0,
          salesCounselorActual: 0,
          salesCounselorTarget: 0,
          policySoldActual: 0,
          policySoldTarget: 0,
          agencyCoopActual: 0,
          agencyCoopTarget: 0,
          reportCount: 0,
          targetExists: false,
        })
      }

      const group = grouped.get(periodKey)

      // Sum actuals and targets
      group.premiumActual += report.premiumActual || 0
      group.premiumTarget += report.premiumTarget || 0
      group.salesCounselorActual += report.salesCounselorActual || 0
      group.salesCounselorTarget += report.salesCounselorTarget || 0
      group.policySoldActual += report.policySoldActual || 0
      group.policySoldTarget += report.policySoldTarget || 0
      group.agencyCoopActual += report.agencyCoopActual || 0
      group.agencyCoopTarget += report.agencyCoopTarget || 0
      group.reportCount++

      if (report.targetExists) {
        group.targetExists = true
      }
    })

    // Calculate percentages and variances for grouped data
    mergedReports = Array.from(grouped.values()).map((group) => ({
      ...group,
      premiumAchievementPercent: calculatePercentage(group.premiumActual, group.premiumTarget),
      premiumVariance: calculateVariance(group.premiumActual, group.premiumTarget),
      salesCounselorAchievementPercent: calculatePercentage(group.salesCounselorActual, group.salesCounselorTarget),
      salesCounselorVariance: calculateVariance(group.salesCounselorActual, group.salesCounselorTarget),
      policySoldAchievementPercent: calculatePercentage(group.policySoldActual, group.policySoldTarget),
      policySoldVariance: calculateVariance(group.policySoldActual, group.policySoldTarget),
      agencyCoopAchievementPercent: calculatePercentage(group.agencyCoopActual, group.agencyCoopTarget),
      agencyCoopVariance: calculateVariance(group.agencyCoopActual, group.agencyCoopTarget),
    }))
  }

  // Save merged reports to file
  const outputPath = path.join(__dirname, "..", "data", "mergedReports.json")
  fs.writeFileSync(outputPath, JSON.stringify(mergedReports, null, 2))

  // Print summary
  console.log("\n📊 Processing Summary:")
  console.log(`✅ Total reports processed: ${mergedReports.length}`)
  console.log(`🎯 Reports with targets: ${reportsWithTargets}`)
  console.log(`❌ Reports without targets: ${reportsWithoutTargets}`)
  console.log(`💾 Output saved to: ${outputPath}\n`)

  // Debug: Show first 3 merged records
  if (mergedReports.length > 0) {
    console.log("🔍 Debug: First 3 merged records:")
    mergedReports.slice(0, 3).forEach((record, index) => {
      console.log(`\n--- Record ${index + 1} ---`)
      console.log(`Report ID: ${record.reportId}`)
      console.log(`Sales Rep: ${record.salesRepName} (ID: ${record.salesRepId})`)
      console.log(`Date: ${record.reportDate}`)
      console.log(`Area: ${record.areaName} | Region: ${record.regionName} | Type: ${record.salesTypeName}`)
      console.log(`Premium: ₱${record.premiumActual} / ₱${record.premiumTarget} (${record.premiumAchievementPercent}%)`)
      console.log(`Target Exists: ${record.targetExists}`)
    })
  }

  console.log("\n🎉 Merge reports process completed successfully!")
}

// Run the script
main().catch((error) => {
  console.error("❌ Fatal error:", error)
  process.exit(1)
})
