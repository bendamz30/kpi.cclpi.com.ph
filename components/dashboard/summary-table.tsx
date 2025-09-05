"use client"

import { useMemo } from "react"
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

interface AreaSummary {
  area: string
  actual: number
  annualTarget: number
  budgetPerMonth: number
  achievement: number
  variance: number
}

export function SummaryTable({ reports, currentFilters, selectedMetric = "premium" }: SummaryTableProps) {
  // Export functions
  const handleExportPDF = () => {
    const exportData: ExportSummary = {
      areaSummaries: summaryData.areaSummaries,
      totals: summaryData.totals,
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
      areaSummaries: summaryData.areaSummaries,
      totals: summaryData.totals,
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

    // Group reports by area
    const areaGroups = new Map<string, MergedReport[]>()

    reports.forEach((report) => {
      const areaName = report.areaName || "Unknown"
      if (!areaGroups.has(areaName)) {
        areaGroups.set(areaName, [])
      }
      areaGroups.get(areaName)!.push(report)
    })

    const areaSummaries: AreaSummary[] = []
    let totalActual = 0
    let totalAnnualTarget = 0
    let totalBudgetPerMonth = 0

    areaGroups.forEach((areaReports, areaName) => {
      // Group by sales rep to avoid double counting targets
      const repGroups = new Map<number, MergedReport[]>()
      areaReports.forEach((report) => {
        const repId = Number(report.salesRepId)
        if (!repGroups.has(repId)) {
          repGroups.set(repId, [])
        }
        repGroups.get(repId)!.push(report)
      })

      let areaActual = 0
      let areaAnnualTarget = 0

      repGroups.forEach((repReports) => {
        // Sum actuals for this rep
        const repActual = repReports.reduce((sum, report) => {
          switch (selectedMetric) {
            case "premium":
              return sum + (Number(report.premiumActual) || 0)
            case "salesCounselor":
              return sum + (Number(report.salesCounselorActual) || 0)
            case "policySold":
              return sum + (Number(report.policySoldActual) || 0)
            case "agencyCoop":
              return sum + (Number(report.agencyCoopActual) || 0)
            default:
              return sum + (Number(report.premiumActual) || 0)
          }
        }, 0)

        // Get annual target for this rep (only count once per rep)
        const firstReport = repReports[0]
        let repAnnualTarget = 0
        switch (selectedMetric) {
          case "premium":
            repAnnualTarget = Number(firstReport._annualPremiumTarget) || 0
            break
          case "salesCounselor":
            repAnnualTarget = Number(firstReport._annualSalesCounselorTarget) || 0
            break
          case "policySold":
            repAnnualTarget = Number(firstReport._annualPolicySoldTarget) || 0
            break
          case "agencyCoop":
            repAnnualTarget = Number(firstReport._annualAgencyCoopTarget) || 0
            break
          default:
            repAnnualTarget = Number(firstReport._annualPremiumTarget) || 0
        }

        areaActual += repActual
        areaAnnualTarget += repAnnualTarget
      })

      const areaBudgetPerMonth = Math.round((areaAnnualTarget / 12) * monthsInRange * 100) / 100
      const areaAchievement =
        areaBudgetPerMonth > 0 ? Math.round((areaActual / areaBudgetPerMonth) * 100 * 100) / 100 : 0
      const areaVariance = areaActual - areaBudgetPerMonth

      areaSummaries.push({
        area: areaName,
        actual: areaActual,
        annualTarget: areaAnnualTarget,
        budgetPerMonth: areaBudgetPerMonth,
        achievement: areaAchievement,
        variance: areaVariance,
      })

      totalActual += areaActual
      totalAnnualTarget += areaAnnualTarget
      totalBudgetPerMonth += areaBudgetPerMonth
    })

    // Sort by custom order: Luzon, Visayas, Mindanao
    const areaOrder = { "Luzon": 1, "Visayas": 2, "Mindanao": 3 }
    areaSummaries.sort((a, b) => {
      const orderA = areaOrder[a.area as keyof typeof areaOrder] || 999
      const orderB = areaOrder[b.area as keyof typeof areaOrder] || 999
      return orderA - orderB
    })

    const totalAchievement =
      totalBudgetPerMonth > 0 ? Math.round((totalActual / totalBudgetPerMonth) * 100 * 100) / 100 : 0
    const totalVariance = totalActual - totalBudgetPerMonth

    return {
      areaSummaries,
      totals: {
        area: "Total",
        actual: totalActual,
        annualTarget: totalAnnualTarget,
        budgetPerMonth: totalBudgetPerMonth,
        achievement: totalAchievement,
        variance: totalVariance,
      },
      monthsInRange,
    }
  }, [reports, currentFilters, selectedMetric])

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

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Summary by Area</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {getMetricLabel()} performance aggregated by area ({summaryData.monthsInRange} months)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Table className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Excel</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {getMetricLabel()} (Actual)
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target (Annual)
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget per Month
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Achievement %
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {summaryData.areaSummaries.map((summary, index) => (
              <tr key={summary.area} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{summary.area}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 text-right font-medium">
                  {formatNumber(summary.actual)}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 text-right">
                  {formatNumber(summary.annualTarget)}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 text-right">
                  {formatNumber(summary.budgetPerMonth)}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right">
                  <span
                    className={`font-medium ${
                      summary.achievement >= 100
                        ? "text-green-600"
                        : summary.achievement >= 80
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {formatPercentage(summary.achievement)}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right">
                  <span className={`font-medium ${summary.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatNumber(summary.variance)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 border-t-2 border-gray-300">
            <tr>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-900">{summaryData.totals.area}</td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 text-right font-bold">
                {formatNumber(summaryData.totals.actual)}
              </td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 text-right font-bold">
                {formatNumber(summaryData.totals.annualTarget)}
              </td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 text-right font-bold">
                {formatNumber(summaryData.totals.budgetPerMonth)}
              </td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right">
                <span
                  className={`font-bold ${
                    summaryData.totals.achievement >= 100
                      ? "text-green-600"
                      : summaryData.totals.achievement >= 80
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {formatPercentage(summaryData.totals.achievement)}
                </span>
              </td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right">
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
