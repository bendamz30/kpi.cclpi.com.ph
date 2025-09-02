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

/**
 * Calculate target based on annual target and filter context
 * @param {number} annualTarget - The annual target value
 * @param {Object} filterContext - Contains granularity and date range info
 * @param {string} filterContext.granularity - 'monthly', 'weekly', or 'annual'
 * @param {string} filterContext.startDate - Start date (optional)
 * @param {string} filterContext.endDate - End date (optional)
 * @returns {number} Adjusted target value
 */
function calculateTarget(annualTarget, filterContext) {
  if (!annualTarget || annualTarget === 0) return 0

  const { granularity = "monthly", startDate, endDate } = filterContext

  if (!startDate || !endDate) {
    return annualTarget
  }

  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Include both start and end dates

    if (granularity === "monthly") {
      // Calculate number of months more accurately
      const diffMonths = Math.ceil(diffDays / 30.44) // Average days per month
      const monthlyTarget = annualTarget / 12
      return Math.round(monthlyTarget * diffMonths * 100) / 100
    } else if (granularity === "weekly") {
      // Calculate number of weeks
      const diffWeeks = Math.ceil(diffDays / 7)
      const weeklyTarget = annualTarget / 52
      return Math.round(weeklyTarget * diffWeeks * 100) / 100
    }
  } catch (error) {
    console.warn(`⚠️  Invalid date range for target calculation: ${startDate} - ${endDate}`)
  }

  // Default to annual target if calculation fails
  return annualTarget
}

async function main() {
  console.log("🚀 Starting merge reports process...\n")

  console.log("📖 Reading JSON files...")
  const users = readJsonFile("users.json")
  const salesReports = readJsonFile("salesReports.json")
  const salesTargets = readJsonFile("salesTargets.json")
  const salesRepresentatives = readJsonFile("salesRepresentatives.json")
  const salesTypes = readJsonFile("salesTypes.json")
  const areas = readJsonFile("areas.json")
  const regions = readJsonFile("regions.json")

  console.log(`✅ Loaded ${users.length} users`)
  console.log(`✅ Loaded ${salesReports.length} sales reports`)
  console.log(`✅ Loaded ${salesTargets.length} sales targets`)
  console.log(`✅ Loaded ${salesRepresentatives.length} sales representatives`)
  console.log(`✅ Loaded ${salesTypes.length} sales types`)
  console.log(`✅ Loaded ${areas.length} areas`)
  console.log(`✅ Loaded ${regions.length} regions\n`)

  const userMap = new Map(users.map((user) => [user.userId, user]))
  const salesRepMap = new Map(salesRepresentatives.map((rep) => [rep.salesRepId, rep]))
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

      const salesRep = salesRepMap.get(report.salesRepId)
      if (!salesRep) {
        console.warn(`⚠️  Sales representative not found for salesRepId: ${report.salesRepId}`)
        return
      }

      let enrichedUserData = null
      if (salesRep.userId) {
        enrichedUserData = userMap.get(salesRep.userId)
        if (!enrichedUserData) {
          console.warn(`⚠️  User not found for userId: ${salesRep.userId} (salesRepId: ${report.salesRepId})`)
        }
      }

      if (!salesRep.areaId) {
        console.warn(`⚠️  Missing areaId for salesRepId: ${report.salesRepId}`)
      }
      if (!salesRep.regionId) {
        console.warn(`⚠️  Missing regionId for salesRepId: ${report.salesRepId}`)
      }
      if (!salesRep.salesTypeId) {
        console.warn(`⚠️  Missing salesTypeId for salesRepId: ${report.salesRepId}`)
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

      if (!targetExists) {
        console.warn(`⚠️  No sales target found for salesRepId: ${report.salesRepId}, year: ${reportYear}`)
      }

      if (targetExists) {
        reportsWithTargets++
      } else {
        reportsWithoutTargets++
      }

      const mergedReport = {
        // Report fields
        reportId: report.reportId,
        reportDate: report.reportDate,
        salesRepId: report.salesRepId,
        salesRepName: enrichedUserData ? enrichedUserData.name : salesRep.name,

        areaId: salesRep.areaId,
        areaName: salesRep.areaId ? areaMap.get(salesRep.areaId) || "Unknown" : null,
        regionId: salesRep.regionId,
        regionName: salesRep.regionId ? regionMap.get(salesRep.regionId) || "Unknown" : null,
        salesTypeId: salesRep.salesTypeId,
        salesTypeName: salesRep.salesTypeId ? salesTypeMap.get(salesRep.salesTypeId) || "Unknown" : null,

        userEmail: enrichedUserData ? enrichedUserData.email : null,
        userId: salesRep.userId,

        // Actuals only (no target calculations here!)
        premiumActual: safeNumber(report.premiumActual),
        salesCounselorActual: safeNumber(report.salesCounselorActual),
        policySoldActual: safeNumber(report.policySoldActual),
        agencyCoopActual: safeNumber(report.agencyCoopActual),

        // Fill placeholders for targets (will be computed later in grouping)
        premiumTarget: 0,
        salesCounselorTarget: 0,
        policySoldTarget: 0,
        agencyCoopTarget: 0,

        premiumAchievementPercent: 0,
        salesCounselorAchievementPercent: 0,
        policySoldAchievementPercent: 0,
        agencyCoopAchievementPercent: 0,

        premiumVariance: 0,
        salesCounselorVariance: 0,
        policySoldVariance: 0,
        agencyCoopVariance: 0,

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
      const groupKey = `${report.salesRepId}-${periodKey}` // Unique key per rep per period

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
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
          salesCounselorActual: 0,
          policySoldActual: 0,
          agencyCoopActual: 0,
          reportCount: 0,
          targetExists: false,
          reportDate: report.reportDate, // Keep for year extraction
        })
      }

      const group = grouped.get(groupKey)

      // Sum actuals only
      group.premiumActual += report.premiumActual || 0
      group.salesCounselorActual += report.salesCounselorActual || 0
      group.policySoldActual += report.policySoldActual || 0
      group.agencyCoopActual += report.agencyCoopActual || 0
      group.reportCount++

      if (report.targetExists) {
        group.targetExists = true
      }
    })

    mergedReports = Array.from(grouped.values()).map((group) => {
      const reportYear = extractYear(group.reportDate)
      const targetKey = `${group.salesRepId}-${reportYear}`
      const annualTarget = targetsMap.get(targetKey)

      let groupTargets = {
        premiumTarget: 0,
        salesCounselorTarget: 0,
        policySoldTarget: 0,
        agencyCoopTarget: 0,
      }

      if (annualTarget) {
        const filterContext = {
          granularity: options.group || "monthly",
          startDate: options.start,
          endDate: options.end,
        }

        groupTargets = {
          premiumTarget: calculateTarget(safeNumber(annualTarget.premiumTarget), filterContext),
          salesCounselorTarget: calculateTarget(safeNumber(annualTarget.salesCounselorTarget), filterContext),
          policySoldTarget: calculateTarget(safeNumber(annualTarget.policySoldTarget), filterContext),
          agencyCoopTarget: calculateTarget(safeNumber(annualTarget.agencyCoopTarget), filterContext),
        }
      }

      return {
        ...group,
        // Targets (calculated once per sales rep for the selected range)
        ...groupTargets,
        // KPI calculations
        premiumAchievementPercent: calculatePercentage(group.premiumActual, groupTargets.premiumTarget),
        premiumVariance: calculateVariance(group.premiumActual, groupTargets.premiumTarget),
        salesCounselorAchievementPercent: calculatePercentage(
          group.salesCounselorActual,
          groupTargets.salesCounselorTarget,
        ),
        salesCounselorVariance: calculateVariance(group.salesCounselorActual, groupTargets.salesCounselorTarget),
        policySoldAchievementPercent: calculatePercentage(group.policySoldActual, groupTargets.policySoldTarget),
        policySoldVariance: calculateVariance(group.policySoldActual, groupTargets.policySoldTarget),
        agencyCoopAchievementPercent: calculatePercentage(group.agencyCoopActual, groupTargets.agencyCoopTarget),
        agencyCoopVariance: calculateVariance(group.agencyCoopActual, groupTargets.agencyCoopTarget),
      }
    })
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
