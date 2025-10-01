"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText, Table } from "lucide-react"
import { exportToPDF, exportToExcel, ExportSummary } from "@/lib/export-utils"

interface SummaryTableProps {
  reports: MergedReport[]
  currentFilters: FilterCriteria
  selectedMetric?: string
}

interface MergedReport {
  reportId: number
  salesRepId: number
  reportDate: string
  premiumActual: number
  salesCounselorActual: number
  policySoldActual: number
  agencyCoopActual: number
  areaId: number
  regionId: number
  salesTypeId: number
  areaName: string
  regionName: string
  salesTypeName: string
  userName: string
  _annualPremiumTarget: number
  _annualSalesCounselorTarget: number
  _annualPolicySoldTarget: number
  _annualAgencyCoopTarget: number
}

interface FilterCriteria {
  salesTypeId?: string
  areaId?: string
  regionId?: string
  salesRepId?: string
  startDate?: string
  endDate?: string
}

interface SummaryItem {
  name: string
  actual: number
  annualTarget: number
  budgetPerMonth: number
  achievement: number
  variance: number
}

export function SummaryTable({ reports, currentFilters, selectedMetric = "premium" }: SummaryTableProps) {
  // State for column filter selection
  const [columnFilter, setColumnFilter] = useState<"area" | "region" | "salesOfficer">("area")

  // Helper functions to determine filter level and column headers
  const getFilterLevel = () => {
    // Use the selected column filter instead of auto-detecting from currentFilters
    return columnFilter
  }

  const getColumnHeader = () => {
    const level = getFilterLevel()
    switch (level) {
      case "salesOfficer":
        return "Sales Officer"
      case "region":
        return "Region"
      case "area":
      default:
        return "Area"
    }
  }

  const getTitle = () => {
    const level = getFilterLevel()
    switch (level) {
      case "salesOfficer":
        return "Summary by Sales Officer"
      case "region":
        return "Summary by Region"
      case "area":
      default:
        return "Summary by Area"
    }
  }

  const calculateMonthsInRange = (startDate?: string, endDate?: string): number => {
    if (!startDate || !endDate) return 12 // Default to full year if no range specified

    const start = new Date(startDate)
    const end = new Date(endDate)

    const yearDiff = end.getFullYear() - start.getFullYear()
    const monthDiff = end.getMonth() - start.getMonth()

    return Math.max(1, yearDiff * 12 + monthDiff + 1) // +1 to include both start and end months
  }

  const summaryData = useMemo(() => {
    const monthsInRange = calculateMonthsInRange(currentFilters.startDate, currentFilters.endDate)
    const filterLevel = getFilterLevel()

    // Helper function to get metric value from report
    const getMetricValue = (report: MergedReport, type: 'actual' | 'target') => {
      switch (selectedMetric) {
        case "premium":
          return type === 'actual' ? Number(report.premiumActual) || 0 : Number(report._annualPremiumTarget) || 0
        case "salesCounselor":
          return type === 'actual' ? Number(report.salesCounselorActual) || 0 : Number(report._annualSalesCounselorTarget) || 0
        case "policySold":
          return type === 'actual' ? Number(report.policySoldActual) || 0 : Number(report._annualPolicySoldTarget) || 0
        case "agencyCoop":
          return type === 'actual' ? Number(report.agencyCoopActual) || 0 : Number(report._annualAgencyCoopTarget) || 0
        default:
          return type === 'actual' ? Number(report.premiumActual) || 0 : Number(report._annualPremiumTarget) || 0
      }
    }

    // Group reports based on column filter level
    const groups = new Map<string, MergedReport[]>()

    reports.forEach((report) => {
      let groupKey = ""
      let groupName = ""

      switch (filterLevel) {
        case "salesOfficer":
          groupKey = `${report.salesRepId}-${report.userName}`
          groupName = report.userName || "Unknown"
          break
        case "region":
          groupKey = `${report.regionId}-${report.regionName}`
          groupName = report.regionName || "Unknown"
          break
        case "area":
        default:
          groupKey = `${report.areaId}-${report.areaName}`
          groupName = report.areaName || "Unknown"
          break
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(report)
    })

    const summaries: SummaryItem[] = []
    let totalActual = 0
    let totalAnnualTarget = 0
    let totalBudgetPerMonth = 0

    groups.forEach((groupReports, groupKey) => {
      // Group by sales rep to avoid double counting targets
      const repGroups = new Map<number, MergedReport[]>()
      groupReports.forEach((report) => {
        const repId = Number(report.salesRepId)
        if (!repGroups.has(repId)) {
          repGroups.set(repId, [])
        }
        repGroups.get(repId)!.push(report)
      })

      let groupActual = 0
      let groupAnnualTarget = 0

      repGroups.forEach((repReports) => {
        // Sum actuals for this rep
        const repActual = repReports.reduce((sum, report) => {
          return sum + getMetricValue(report, 'actual')
        }, 0)

        // Get annual target for this rep (only count once per rep)
        const firstReport = repReports[0]
        const repAnnualTarget = getMetricValue(firstReport, 'target')

        groupActual += repActual
        groupAnnualTarget += repAnnualTarget
      })

      const groupBudgetPerMonth = Math.round((groupAnnualTarget / 12) * monthsInRange * 100) / 100
      const groupAchievement =
        groupBudgetPerMonth > 0 ? Math.round((groupActual / groupBudgetPerMonth) * 100 * 100) / 100 : 0
      const groupVariance = groupActual - groupBudgetPerMonth

      // Get the appropriate name based on filter level
      let displayName = "Unknown"
      const firstReport = groupReports[0]
      switch (filterLevel) {
        case "salesOfficer":
          displayName = firstReport.userName || "Unknown"
          break
        case "region":
          displayName = firstReport.regionName || "Unknown"
          break
        case "area":
        default:
          displayName = firstReport.areaName || "Unknown"
          break
      }
      
      summaries.push({
        name: displayName,
        actual: groupActual,
        annualTarget: groupAnnualTarget,
        budgetPerMonth: groupBudgetPerMonth,
        achievement: groupAchievement,
        variance: groupVariance,
      })

      totalActual += groupActual
      totalAnnualTarget += groupAnnualTarget
      totalBudgetPerMonth += groupBudgetPerMonth
    })

    // Sort based on filter level
    summaries.sort((a, b) => {
      if (filterLevel === "area") {
        // Sort by custom order: Luzon, Visayas, Mindanao
        const areaOrder = { "Luzon": 1, "Visayas": 2, "Mindanao": 3 }
        const orderA = areaOrder[a.name as keyof typeof areaOrder] || 999
        const orderB = areaOrder[b.name as keyof typeof areaOrder] || 999
        return orderA - orderB
      } else {
        // Sort alphabetically for regions and sales officers
        return a.name.localeCompare(b.name)
      }
    })

    const totalAchievement =
      totalBudgetPerMonth > 0 ? Math.round((totalActual / totalBudgetPerMonth) * 100 * 100) / 100 : 0
    const totalVariance = totalActual - totalBudgetPerMonth

    return {
      summaries,
      totals: {
        name: "Total",
        actual: totalActual,
        annualTarget: totalAnnualTarget,
        budgetPerMonth: totalBudgetPerMonth,
        achievement: totalAchievement,
        variance: totalVariance,
      },
      monthsInRange,
    }
  }, [reports, currentFilters, selectedMetric, columnFilter])

  const formatNumber = (value: number): string => {
    if (selectedMetric === "premium") {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }
    return new Intl.NumberFormat("en-US").format(value)
  }

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`
  }

  const getMetricLabel = (): string => {
    switch (selectedMetric) {
      case "premium":
        return "Premium"
      case "salesCounselor":
        return "Sales Counselor"
      case "policySold":
        return "Policy Sold"
      case "agencyCoop":
        return "Agency Coop"
      default:
        return "Premium"
    }
  }

  // Export functions
  const handleExportPDF = () => {
    const exportData: ExportSummary = {
      areaSummaries: summaryData.summaries.map(item => ({
        area: item.name,
        actual: item.actual,
        annualTarget: item.annualTarget,
        budgetPerMonth: item.budgetPerMonth,
        achievement: item.achievement,
        variance: item.variance,
      })),
      totals: {
        area: summaryData.totals.name,
        actual: summaryData.totals.actual,
        annualTarget: summaryData.totals.annualTarget,
        budgetPerMonth: summaryData.totals.budgetPerMonth,
        achievement: summaryData.totals.achievement,
        variance: summaryData.totals.variance,
      },
      monthsInRange: summaryData.monthsInRange,
      filters: {
        startDate: currentFilters.startDate,
        endDate: currentFilters.endDate,
        area: currentFilters.areaId,
        region: currentFilters.regionId,
        salesRepId: currentFilters.salesRepId ? parseInt(currentFilters.salesRepId) : undefined,
        salesType: currentFilters.salesTypeId,
      }
    }
    exportToPDF(exportData, selectedMetric)
  }

  const handleExportExcel = () => {
    const exportData: ExportSummary = {
      areaSummaries: summaryData.summaries.map(item => ({
        area: item.name,
        actual: item.actual,
        annualTarget: item.annualTarget,
        budgetPerMonth: item.budgetPerMonth,
        achievement: item.achievement,
        variance: item.variance,
      })),
      totals: {
        area: summaryData.totals.name,
        actual: summaryData.totals.actual,
        annualTarget: summaryData.totals.annualTarget,
        budgetPerMonth: summaryData.totals.budgetPerMonth,
        achievement: summaryData.totals.achievement,
        variance: summaryData.totals.variance,
      },
      monthsInRange: summaryData.monthsInRange,
      filters: {
        startDate: currentFilters.startDate,
        endDate: currentFilters.endDate,
        area: currentFilters.areaId,
        region: currentFilters.regionId,
        salesRepId: currentFilters.salesRepId ? parseInt(currentFilters.salesRepId) : undefined,
        salesType: currentFilters.salesTypeId,
      }
    }
    exportToExcel(exportData, selectedMetric)
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-6 sm:px-8 py-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <div className="w-1 h-8 rounded-full mr-3" style={{ background: 'linear-gradient(to bottom, #013f99, #4cb1e9)' }}></div>
              <h3 className="text-xl font-bold text-gray-900">{getTitle()}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {getMetricLabel()} performance aggregated by {getColumnHeader().toLowerCase()} ({summaryData.monthsInRange} months)
            </p>
            
            {/* Column Filter Dropdown */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <label className="text-sm font-semibold text-gray-700 flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#013f99' }}></div>
                Group by:
              </label>
              <select
                value={columnFilter}
                onChange={(e) => setColumnFilter(e.target.value as "area" | "region" | "salesOfficer")}
                className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:border-[#013f99]" 
                style={{ '--tw-ring-color': '#013f99' } as any}
              >
                <option value="area">Area</option>
                <option value="region">Region</option>
                <option value="salesOfficer">Sales Officer</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-sm font-medium border-2 hover:shadow-md transition-all duration-200"
              style={{ 
                backgroundColor: '#fefce8', 
                color: '#f3cf47',
                borderColor: '#fde68a'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef3c7';
                e.currentTarget.style.borderColor = '#fbbf24';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fefce8';
                e.currentTarget.style.borderColor = '#fde68a';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FileText className="h-4 w-4" style={{ color: '#f3cf47' }} />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-sm font-medium border-2 hover:shadow-md transition-all duration-200"
              style={{ 
                backgroundColor: '#f0f9ff', 
                color: '#4cb1e9',
                borderColor: '#bae6fd'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e0f2fe';
                e.currentTarget.style.borderColor = '#7dd3fc';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f9ff';
                e.currentTarget.style.borderColor = '#bae6fd';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Table className="h-4 w-4" style={{ color: '#4cb1e9' }} />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Excel</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="block lg:hidden space-y-4 p-4">
        {summaryData.summaries.map((summary, index) => {
          const stableKey = summary.name ? `${summary.name}-${index}` : `summary-${index}`
          return (
          <div key={stableKey} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-gray-900 flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#013f99' }}></div>
                {summary.name}
              </h4>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  summary.achievement >= 100
                    ? "text-green-800"
                    : summary.achievement >= 80
                      ? "text-yellow-800"
                      : "text-red-800"
                }`}
                style={{
                  backgroundColor: summary.achievement >= 100
                    ? '#dcfce7'
                    : summary.achievement >= 80
                      ? '#fef3c7'
                      : '#fecaca'
                }}
              >
                {formatPercentage(summary.achievement)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600 mb-1 font-medium">Actual</p>
                <p className="font-bold text-gray-900 text-lg">{formatNumber(summary.actual)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600 mb-1 font-medium">TARGET</p>
                <p className="font-bold text-gray-900 text-lg">{formatNumber(summary.budgetPerMonth)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-gray-600 mb-1 font-medium">Variance</p>
                <p className={`font-bold text-lg ${summary.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatNumber(summary.variance)}
                </p>
              </div>
            </div>
          </div>
          )
        })}
        
        {/* Mobile Totals Card */}
        <div className="rounded-xl p-5 shadow-lg border-2" style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
          borderColor: '#4cb1e9'
        }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900 flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#013f99' }}></div>
              {summaryData.totals.name}
            </h4>
            <span
              className={`text-sm font-bold px-4 py-2 rounded-full ${
                summaryData.totals.achievement >= 100
                  ? "text-green-800"
                  : summaryData.totals.achievement >= 80
                    ? "text-yellow-800"
                    : "text-red-800"
              }`}
              style={{
                backgroundColor: summaryData.totals.achievement >= 100
                  ? '#dcfce7'
                  : summaryData.totals.achievement >= 80
                    ? '#fef3c7'
                    : '#fecaca'
              }}
            >
              {formatPercentage(summaryData.totals.achievement)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-gray-600 mb-1 font-medium">Actual</p>
              <p className="font-bold text-gray-900 text-lg">{formatNumber(summaryData.totals.actual)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-gray-600 mb-1 font-medium">TARGET</p>
              <p className="font-bold text-gray-900 text-lg">{formatNumber(summaryData.totals.budgetPerMonth)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 col-span-2">
              <p className="text-gray-600 mb-1 font-medium">Variance</p>
              <p className={`font-bold text-lg ${summaryData.totals.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatNumber(summaryData.totals.variance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #e0f2fe 100%)' }}>
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2" style={{ borderColor: '#013f99' }}>
                {getColumnHeader()}
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2" style={{ borderColor: '#013f99' }}>
                {getMetricLabel()} (Actual)
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2" style={{ borderColor: '#013f99' }}>
                TARGET
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2" style={{ borderColor: '#013f99' }}>
                Achievement %
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2" style={{ borderColor: '#013f99' }}>
                Variance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {summaryData.summaries.map((summary, index) => {
              const stableKey = summary.name ? `${summary.name}-${index}` : `summary-${index}`
              return (
              <tr key={stableKey} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#4cb1e9' }}></div>
                  {summary.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                  {formatNumber(summary.actual)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                  {formatNumber(summary.budgetPerMonth)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span
                    className={`font-bold px-3 py-1 rounded-full text-xs ${
                      summary.achievement >= 100
                        ? "text-green-800"
                        : summary.achievement >= 80
                          ? "text-yellow-800"
                          : "text-red-800"
                    }`}
                    style={{
                      backgroundColor: summary.achievement >= 100
                        ? '#dcfce7'
                        : summary.achievement >= 80
                          ? '#fef3c7'
                          : '#fecaca'
                    }}
                  >
                    {formatPercentage(summary.achievement)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className={`font-semibold ${summary.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatNumber(summary.variance)}
                  </span>
                </td>
              </tr>
              )
            })}
          </tbody>
          <tfoot style={{ background: 'linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
            <tr className="border-t-2" style={{ borderColor: '#4cb1e9' }}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#013f99' }}></div>
                {summaryData.totals.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                {formatNumber(summaryData.totals.actual)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                {formatNumber(summaryData.totals.budgetPerMonth)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                <span
                  className={`font-bold px-4 py-2 rounded-full text-sm ${
                    summaryData.totals.achievement >= 100
                      ? "text-green-800"
                      : summaryData.totals.achievement >= 80
                        ? "text-yellow-800"
                        : "text-red-800"
                  }`}
                  style={{
                    backgroundColor: summaryData.totals.achievement >= 100
                      ? '#dcfce7'
                      : summaryData.totals.achievement >= 80
                        ? '#fef3c7'
                        : '#fecaca'
                  }}
                >
                  {formatPercentage(summaryData.totals.achievement)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                <span className={`font-bold ${summaryData.totals.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatNumber(summaryData.totals.variance)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
