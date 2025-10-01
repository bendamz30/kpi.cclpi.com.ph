"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { SalesRepsTable } from "@/components/dashboard/sales-reps-table"
import { UsersTable } from "@/components/dashboard/users-table"
import { TrashBin } from "@/components/dashboard/trash-bin"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { DashboardKPICards, type KPIData } from "@/components/dashboard/dashboard-kpi-cards"
import { SalesPerformanceChart } from "@/components/dashboard/sales-performance-chart"
import { RealTimeProvider, useRealTime } from "@/components/providers/real-time-provider"
import { SessionTimeoutProvider } from "@/components/providers/session-timeout-provider"
import { SummaryTable } from "@/components/dashboard/summary-table"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { AuthProvider } from "@/contexts/auth-context"
import { useMergedReports } from "@/hooks/use-api"

interface KpiType {
  key: string
  title: string
  actual: number
  target: number
  achievement: number
  variance: number
  status: string
  budgetMonthly: number
  budgetWeekly: number
}

interface FilterCriteria {
  salesTypeId?: string
  areaId?: string
  regionId?: string
  salesRepId?: string
  startDate?: string
  endDate?: string
  granularity?: string
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
  premiumTarget: number
  salesCounselorTarget: number
  policySoldTarget: number
  agencyCoopTarget: number
  _annualPremiumTarget: number
  _annualSalesCounselorTarget: number
  _annualPolicySoldTarget: number
  _annualAgencyCoopTarget: number
}

function DashboardContent() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [kpis, setKpis] = useState<KpiType[]>([])
  const [kpiData, setKpiData] = useState<KPIData>({
    premiumActual: 0,
    premiumTarget: 0,
    premiumBudgetMonthly: 0,
    premiumBudgetWeekly: 0,
    salesCounselorActual: 0,
    salesCounselorTarget: 0,
    salesCounselorBudgetMonthly: 0,
    salesCounselorBudgetWeekly: 0,
    policySoldActual: 0,
    policySoldTarget: 0,
    policySoldBudgetMonthly: 0,
    policySoldBudgetWeekly: 0,
    agencyCoopActual: 0,
    agencyCoopTarget: 0,
    agencyCoopBudgetMonthly: 0,
    agencyCoopBudgetWeekly: 0,
  })
  const [currentFilters, setCurrentFilters] = useState<FilterCriteria>({})
  const [refreshDropdowns, setRefreshDropdowns] = useState<(() => void) | null>(null)
  const { lastUpdate } = useRealTime()
  
  // Route protection for RegionalUser
  const handleTabChange = (tab: string) => {
    if (user?.role === 'RegionalUser' && (tab === 'sales-reps' || tab === 'users' || tab === 'trash-bin')) {
      // Redirect RegionalUser to dashboard if they try to access restricted pages
      setActiveTab("dashboard")
      return
    }
    setActiveTab(tab)
  }
  
  // Use the new API hook for fetching merged reports
  const { data: mergedReports, loading, error, refetch } = useMergedReports()

  // Refresh dropdowns when real-time data updates (e.g., when users are added)
  useEffect(() => {
    if (lastUpdate && refreshDropdowns) {
      console.log("[v0] 🔄 Real-time update detected, refreshing dropdowns...")
      refreshDropdowns()
    }
  }, [lastUpdate, refreshDropdowns])

  const calculateMonthsInRange = useCallback((startDate?: string, endDate?: string): number => {
    if (!startDate || !endDate) return 12 // Default to full year if no range specified

    const start = new Date(startDate)
    const end = new Date(endDate)

    const yearDiff = end.getFullYear() - start.getFullYear()
    const monthDiff = end.getMonth() - start.getMonth()

    return Math.max(1, yearDiff * 12 + monthDiff + 1) // +1 to include both start and end months
  }, [])

  const calculateWeeksInRange = useCallback((startDate?: string, endDate?: string): number => {
    if (!startDate || !endDate) return 48 // Default to full year if no range specified

    const start = new Date(startDate)
    const end = new Date(endDate)

    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.ceil(diffDays / 7)

    return Math.max(1, diffWeeks + 1) // +1 to include both start and end weeks
  }, [])

  const applyFilters = useCallback((reports: MergedReport[], filters: FilterCriteria): MergedReport[] => {
    console.log("[v0] 🔍 applyFilters called with:", {
      totalReports: reports.length,
      filters: filters
    })
    
    const filteredReports = reports.filter((report) => {
      // Normalize filter values - treat empty string or "all" as null (no filter)
      const fSalesType =
        filters.salesTypeId === "" || filters.salesTypeId === "all" ? null : Number(filters.salesTypeId)
      const fArea = filters.areaId === "" || filters.areaId === "all" ? null : Number(filters.areaId)
      const fRegion = filters.regionId === "" || filters.regionId === "all" ? null : Number(filters.regionId)
      const fSalesRep = filters.salesRepId === "" || filters.salesRepId === "all" ? null : Number(filters.salesRepId)

      if (fSalesType !== null) {
        if (Number(report.salesTypeId) !== fSalesType) {
          return false
        }
      }

      // Area filtering
      if (fArea !== null) {
        if (Number(report.areaId) !== fArea) {
          return false
        }
      }

      // Region filtering
      if (fRegion !== null) {
        if (Number(report.regionId) !== fRegion) {
          return false
        }
      }

      // Sales Rep filtering
      if (fSalesRep !== null) {
        if (Number(report.salesRepId) !== fSalesRep) {
          return false
        }
      }

      // Date filtering
      if (filters.startDate && filters.startDate !== "") {
        const reportDate = new Date(report.reportDate)
        const startDate = new Date(filters.startDate)
        if (reportDate < startDate) {
          return false
        }
      }

      if (filters.endDate && filters.endDate !== "") {
        const reportDate = new Date(report.reportDate)
        const endDate = new Date(filters.endDate)
        // Make end date inclusive by setting to end of day
        endDate.setHours(23, 59, 59, 999)
        if (reportDate > endDate) {
          return false
        }
      }

      return true
    })

    console.log("[v0] 🔍 applyFilters result:", {
      filteredReports: filteredReports.length,
      sampleFilteredReport: filteredReports[0]
    })

    return filteredReports
  }, [])

  const aggregateReportsToKPIs = useCallback(async (reports: MergedReport[], filters?: FilterCriteria): Promise<KpiType[]> => {
    const activeFilters = filters || currentFilters
    
    console.log("[v0] 🚀 aggregateReportsToKPIs called with:", {
      reportsCount: reports.length,
      filters: activeFilters,
      passedFilters: filters,
      usingCurrentFilters: !filters
    })
    
    // If a specific sales rep is selected, get dynamic targets from API
    console.log("[v0] 🔍 Checking if specific user selected:", {
      salesRepId: activeFilters.salesRepId,
      hasSalesRepId: !!(activeFilters.salesRepId && activeFilters.salesRepId !== "" && activeFilters.salesRepId !== "all"),
      startDate: activeFilters.startDate,
      endDate: activeFilters.endDate
    })
    
    // Use hierarchical API for all filtering scenarios
    try {
      console.log("[v0] 🎯 Using hierarchical KPI API with filters:", {
        salesTypeId: activeFilters.salesTypeId,
        areaId: activeFilters.areaId,
        regionId: activeFilters.regionId,
        salesRepId: activeFilters.salesRepId,
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate
      })
      
      // Build query parameters for hierarchical API - only include non-empty values
      const params = new URLSearchParams()
      
      // Add required date parameters only if they have values
      if (activeFilters.startDate) {
        params.append('start', activeFilters.startDate)
      }
      if (activeFilters.endDate) {
        params.append('end', activeFilters.endDate)
      }
      params.append('year', new Date().getFullYear().toString())
      
      // Add filter parameters if they're not "all", null, undefined, or empty
      if (activeFilters.salesTypeId && activeFilters.salesTypeId !== 'all' && activeFilters.salesTypeId !== '') {
        params.append('salesTypeId', activeFilters.salesTypeId)
      }
      if (activeFilters.areaId && activeFilters.areaId !== 'all' && activeFilters.areaId !== '') {
        params.append('areaId', activeFilters.areaId)
      }
      if (activeFilters.regionId && activeFilters.regionId !== 'all' && activeFilters.regionId !== '') {
        params.append('regionId', activeFilters.regionId)
      }
      if (activeFilters.salesRepId && activeFilters.salesRepId !== 'all' && activeFilters.salesRepId !== '') {
        params.append('salesRepId', activeFilters.salesRepId)
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kpi-targets?${params.toString()}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const dynamicTargets = data.data.dynamicTargets
        const filterLevel = data.data.filterLevel
        
        console.log("[v0] 📊 Reports being processed for actuals:", reports.length)
        console.log("[v0] 📊 Filter level:", filterLevel)
        console.log("[v0] 📊 Sample report:", reports[0])
        
        // Calculate actuals from filtered reports
        const actuals = reports.reduce((acc, report) => {
          acc.premiumActual += Number(report.premiumActual) || 0
          acc.salesCounselorActual += Number(report.salesCounselorActual) || 0
          acc.policySoldActual += Number(report.policySoldActual) || 0
          acc.agencyCoopActual += Number(report.agencyCoopActual) || 0
          return acc
        }, { premiumActual: 0, salesCounselorActual: 0, policySoldActual: 0, agencyCoopActual: 0 })
        
        console.log("[v0] ✅ Hierarchical KPI targets received:", dynamicTargets)
        console.log("[v0] Actuals calculated:", actuals)
        console.log("[v0] 🎯 Using hierarchical aggregated targets!")
        
        return [
          {
            key: "premium",
            title: "Premium",
            actual: actuals.premiumActual,
            target: dynamicTargets.premiumTarget,
            achievement: dynamicTargets.premiumTarget > 0 ? (actuals.premiumActual / dynamicTargets.premiumTarget) * 100 : 0,
            variance: actuals.premiumActual - dynamicTargets.premiumTarget,
            status: actuals.premiumActual >= dynamicTargets.premiumTarget ? "achieved" : "pending",
            budgetMonthly: data.data.monthlyTargets.premiumTarget,
            budgetWeekly: data.data.monthlyTargets.premiumTarget / 4,
          },
          {
            key: "salesCounselors",
            title: "Sales Counselors",
            actual: actuals.salesCounselorActual,
            target: dynamicTargets.salesCounselorTarget,
            achievement: dynamicTargets.salesCounselorTarget > 0 ? (actuals.salesCounselorActual / dynamicTargets.salesCounselorTarget) * 100 : 0,
            variance: actuals.salesCounselorActual - dynamicTargets.salesCounselorTarget,
            status: actuals.salesCounselorActual >= dynamicTargets.salesCounselorTarget ? "achieved" : "pending",
            budgetMonthly: data.data.monthlyTargets.salesCounselorTarget,
            budgetWeekly: data.data.monthlyTargets.salesCounselorTarget / 4,
          },
          {
            key: "policySold",
            title: "Policy Sold",
            actual: actuals.policySoldActual,
            target: dynamicTargets.policySoldTarget,
            achievement: dynamicTargets.policySoldTarget > 0 ? (actuals.policySoldActual / dynamicTargets.policySoldTarget) * 100 : 0,
            variance: actuals.policySoldActual - dynamicTargets.policySoldTarget,
            status: actuals.policySoldActual >= dynamicTargets.policySoldTarget ? "achieved" : "pending",
            budgetMonthly: data.data.monthlyTargets.policySoldTarget,
            budgetWeekly: data.data.monthlyTargets.policySoldTarget / 4,
          },
          {
            key: "agencyCoop",
            title: "Agency Coop",
            actual: actuals.agencyCoopActual,
            target: dynamicTargets.agencyCoopTarget,
            achievement: dynamicTargets.agencyCoopTarget > 0 ? (actuals.agencyCoopActual / dynamicTargets.agencyCoopTarget) * 100 : 0,
            variance: actuals.agencyCoopActual - dynamicTargets.agencyCoopTarget,
            status: actuals.agencyCoopActual >= dynamicTargets.agencyCoopTarget ? "achieved" : "pending",
            budgetMonthly: data.data.monthlyTargets.agencyCoopTarget,
            budgetWeekly: data.data.monthlyTargets.agencyCoopTarget / 4,
          },
        ]
      } else {
        console.log("[v0] ❌ Hierarchical API response not successful:", data)
      }
    } catch (error) {
      console.error("[v0] ❌ Error fetching hierarchical KPI targets:", error)
    }
    
    // Fallback to original logic for "All" users or if API call fails
    console.log("[v0] 🔄 Using fallback logic (All users or API call failed)")
    const repGroups = new Map<number, MergedReport[]>()
    reports.forEach((report) => {
      const repId = Number(report.salesRepId)
      
      if (!repGroups.has(repId)) {
        repGroups.set(repId, [])
      }
      repGroups.get(repId)!.push(report)
    })
    const monthsInRange = calculateMonthsInRange(activeFilters.startDate, activeFilters.endDate)
    const weeksInRange = calculateWeeksInRange(activeFilters.startDate, activeFilters.endDate)
    const hasDateFilter = activeFilters.startDate && activeFilters.endDate
    const hasEmptyDateFilter = !activeFilters.startDate && !activeFilters.endDate
    const granularity = activeFilters.granularity || "monthly"
    
    // Debug logging for target calculations
      console.log("[v0] Date range calculation:", {
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
        monthsInRange,
        weeksInRange,
        hasDateFilter,
        hasEmptyDateFilter,
        granularity,
        willUseDynamicCalculation: hasDateFilter || hasEmptyDateFilter
      })

    const totals = {
      premiumActual: 0,
      premiumTarget: 0,
      premiumBudgetMonthly: 0,
      premiumBudgetWeekly: 0,
      salesCounselorActual: 0,
      salesCounselorTarget: 0,
      salesCounselorBudgetMonthly: 0,
      salesCounselorBudgetWeekly: 0,
      policySoldActual: 0,
      policySoldTarget: 0,
      policySoldBudgetMonthly: 0,
      policySoldBudgetWeekly: 0,
      agencyCoopActual: 0,
      agencyCoopTarget: 0,
      agencyCoopBudgetMonthly: 0,
      agencyCoopBudgetWeekly: 0,
    }

    console.log("[v0] Processing KPI calculation for sales reps:", {
      totalReps: repGroups.size,
      repIds: Array.from(repGroups.keys()),
      selectedSalesRep: activeFilters.salesRepId,
      hasSpecificUserSelected: !!(activeFilters.salesRepId && activeFilters.salesRepId !== "" && activeFilters.salesRepId !== "all")
    })

    repGroups.forEach((repReports, repId) => {
      // Sum actuals for this rep
      const repActuals = repReports.reduce(
        (acc, report) => {
          acc.premiumActual += Number(report.premiumActual) || 0
          acc.salesCounselorActual += Number(report.salesCounselorActual) || 0
          acc.policySoldActual += Number(report.policySoldActual) || 0
          acc.agencyCoopActual += Number(report.agencyCoopActual) || 0
          return acc
        },
        {
          premiumActual: 0,
          salesCounselorActual: 0,
          policySoldActual: 0,
          agencyCoopActual: 0,
        },
      )

      const firstReport = repReports[0]
      const annualPremiumTarget = (firstReport as any)._annualPremiumTarget || 0
      const annualSalesCounselorTarget = (firstReport as any)._annualSalesCounselorTarget || 0
      const annualPolicySoldTarget = (firstReport as any)._annualPolicySoldTarget || 0
      const annualAgencyCoopTarget = (firstReport as any)._annualAgencyCoopTarget || 0
      
      // Debug logging for annual targets
      console.log("[v0] Annual targets for rep", repId, ":", {
        annualPremiumTarget,
        annualSalesCounselorTarget,
        annualPolicySoldTarget,
        annualAgencyCoopTarget,
        firstReport: firstReport,
        hasTargetData: !!(firstReport as any)._annualPremiumTarget
      })

      // Calculate targets based on filter and granularity
      let repTargets
      console.log("[v0] Target calculation decision:", {
        hasDateFilter,
        hasEmptyDateFilter,
        granularity,
        monthsInRange,
        weeksInRange
      })
      
      if (hasDateFilter || hasEmptyDateFilter) {
        if (granularity === "weekly") {
          // Weekly mode: Annual Target ÷ 48 × number of weeks in range
          repTargets = {
            premiumTarget: Math.round((annualPremiumTarget / 48) * weeksInRange * 100) / 100,
            salesCounselorTarget: Math.round((annualSalesCounselorTarget / 48) * weeksInRange * 100) / 100,
            policySoldTarget: Math.round((annualPolicySoldTarget / 48) * weeksInRange * 100) / 100,
            agencyCoopTarget: Math.round((annualAgencyCoopTarget / 48) * weeksInRange * 100) / 100,
          }
        } else {
          // Monthly mode: Annual Target ÷ 12 × number of months in range
          // But if we have a specific date range, calculate based on actual months in range
          const actualMonthsInRange = monthsInRange
          const monthlyPremiumTarget = annualPremiumTarget / 12
          const calculatedPremiumTarget = Math.round(monthlyPremiumTarget * actualMonthsInRange * 100) / 100
          
          repTargets = {
            premiumTarget: calculatedPremiumTarget,
            salesCounselorTarget: Math.round((annualSalesCounselorTarget / 12) * actualMonthsInRange * 100) / 100,
            policySoldTarget: Math.round((annualPolicySoldTarget / 12) * actualMonthsInRange * 100) / 100,
            agencyCoopTarget: Math.round((annualAgencyCoopTarget / 12) * actualMonthsInRange * 100) / 100,
          }
          
          // Debug logging for target calculation
          console.log("[v0] Dynamic KPI Target Calculation for rep", repId, ":", {
            formula: "KPI Target = (Annual Target ÷ 12) × (Number of months in selected date range)",
            annualPremiumTarget,
            monthlyPremiumTarget: `${annualPremiumTarget} ÷ 12 = ${monthlyPremiumTarget}`,
            actualMonthsInRange: `${actualMonthsInRange} months in selected range`,
            calculation: `${monthlyPremiumTarget} × ${actualMonthsInRange} = ${calculatedPremiumTarget}`,
            finalTarget: repTargets.premiumTarget,
            dateRange: `${activeFilters.startDate} to ${activeFilters.endDate}`
          })
        }
      } else {
        // Fallback case (should not happen in normal usage)
        console.log("[v0] Using fallback targets for rep", repId)
        repTargets = {
          premiumTarget: annualPremiumTarget,
          salesCounselorTarget: annualSalesCounselorTarget,
          policySoldTarget: annualPolicySoldTarget,
          agencyCoopTarget: annualAgencyCoopTarget,
        }
      }

      // Budget targets (always monthly and weekly, not affected by filters)
      const repBudgets = {
        premiumBudgetMonthly: Math.round((annualPremiumTarget / 12) * 100) / 100,
        premiumBudgetWeekly: Math.round((annualPremiumTarget / 48) * 100) / 100,
        salesCounselorBudgetMonthly: Math.round((annualSalesCounselorTarget / 12) * 100) / 100,
        salesCounselorBudgetWeekly: Math.round((annualSalesCounselorTarget / 48) * 100) / 100,
        policySoldBudgetMonthly: Math.round((annualPolicySoldTarget / 12) * 100) / 100,
        policySoldBudgetWeekly: Math.round((annualPolicySoldTarget / 48) * 100) / 100,
        agencyCoopBudgetMonthly: Math.round((annualAgencyCoopTarget / 12) * 100) / 100,
        agencyCoopBudgetWeekly: Math.round((annualAgencyCoopTarget / 48) * 100) / 100,
      }

      // Add to totals
      totals.premiumActual += repActuals.premiumActual
      totals.salesCounselorActual += repActuals.salesCounselorActual
      totals.policySoldActual += repActuals.policySoldActual
      totals.agencyCoopActual += repActuals.agencyCoopActual
      totals.premiumTarget += repTargets.premiumTarget
      totals.salesCounselorTarget += repTargets.salesCounselorTarget
      totals.policySoldTarget += repTargets.policySoldTarget
      totals.agencyCoopTarget += repTargets.agencyCoopTarget
      totals.premiumBudgetMonthly += repBudgets.premiumBudgetMonthly
      totals.premiumBudgetWeekly += repBudgets.premiumBudgetWeekly
      totals.salesCounselorBudgetMonthly += repBudgets.salesCounselorBudgetMonthly
      totals.salesCounselorBudgetWeekly += repBudgets.salesCounselorBudgetWeekly
      totals.policySoldBudgetMonthly += repBudgets.policySoldBudgetMonthly
      totals.policySoldBudgetWeekly += repBudgets.policySoldBudgetWeekly
      totals.agencyCoopBudgetMonthly += repBudgets.agencyCoopBudgetMonthly
      totals.agencyCoopBudgetWeekly += repBudgets.agencyCoopBudgetWeekly
    })

    const calculateAchievement = (actual: number, target: number): number => {
      return target > 0 ? Math.round((actual / target) * 100 * 100) / 100 : 0 // Round to 2 decimals
    }

    const calculateStatus = (achievement: number): string => {
      if (achievement >= 100) return "success"
      if (achievement >= 80) return "warning"
      return "danger"
    }

    const kpis = [
      {
        key: "premium",
        title: "Premium",
        actual: totals.premiumActual,
        target: totals.premiumTarget,
        achievement: calculateAchievement(totals.premiumActual, totals.premiumTarget),
        variance: totals.premiumActual - totals.premiumTarget,
        status: calculateStatus(calculateAchievement(totals.premiumActual, totals.premiumTarget)),
        budgetMonthly: totals.premiumBudgetMonthly,
        budgetWeekly: totals.premiumBudgetWeekly,
      },
      {
        key: "salesCounselors",
        title: "Sales Counselors",
        actual: totals.salesCounselorActual,
        target: totals.salesCounselorTarget,
        achievement: calculateAchievement(totals.salesCounselorActual, totals.salesCounselorTarget),
        variance: totals.salesCounselorActual - totals.salesCounselorTarget,
        status: calculateStatus(calculateAchievement(totals.salesCounselorActual, totals.salesCounselorTarget)),
        budgetMonthly: totals.salesCounselorBudgetMonthly,
        budgetWeekly: totals.salesCounselorBudgetWeekly,
      },
      {
        key: "policiesSold",
        title: "Policies Sold",
        actual: totals.policySoldActual,
        target: totals.policySoldTarget,
        achievement: calculateAchievement(totals.policySoldActual, totals.policySoldTarget),
        variance: totals.policySoldActual - totals.policySoldTarget,
        status: calculateStatus(calculateAchievement(totals.policySoldActual, totals.policySoldTarget)),
        budgetMonthly: totals.policySoldBudgetMonthly,
        budgetWeekly: totals.policySoldBudgetWeekly,
      },
      {
        key: "agencyCoops",
        title: "Agency Coops",
        actual: totals.agencyCoopActual,
        target: totals.agencyCoopTarget,
        achievement: calculateAchievement(totals.agencyCoopActual, totals.agencyCoopTarget),
        variance: totals.agencyCoopActual - totals.agencyCoopTarget,
        status: calculateStatus(calculateAchievement(totals.agencyCoopActual, totals.agencyCoopTarget)),
        budgetMonthly: totals.agencyCoopBudgetMonthly,
        budgetWeekly: totals.agencyCoopBudgetWeekly,
      },
    ]

    return kpis
  }, [calculateMonthsInRange, calculateWeeksInRange])

  const convertKpisToKpiData = useCallback((kpisArray: KpiType[]): KPIData => {
    const defaultData: KPIData = {
      premiumActual: 0,
      premiumTarget: 0,
      premiumBudgetMonthly: 0,
      premiumBudgetWeekly: 0,
      salesCounselorActual: 0,
      salesCounselorTarget: 0,
      salesCounselorBudgetMonthly: 0,
      salesCounselorBudgetWeekly: 0,
      policySoldActual: 0,
      policySoldTarget: 0,
      policySoldBudgetMonthly: 0,
      policySoldBudgetWeekly: 0,
      agencyCoopActual: 0,
      agencyCoopTarget: 0,
      agencyCoopBudgetMonthly: 0,
      agencyCoopBudgetWeekly: 0,
    }

    if (!Array.isArray(kpisArray) || kpisArray.length === 0) {
      return defaultData
    }

    const result = { ...defaultData }

    kpisArray.forEach((kpi) => {
      const actual = Number(kpi.actual) || 0
      const target = Number(kpi.target) || 0

      // Debug logging for KPI conversion
      console.log("[v0] Converting KPI:", kpi.key, {
        actual,
        target,
        budgetMonthly: kpi.budgetMonthly,
        budgetWeekly: kpi.budgetWeekly,
        isDynamicTarget: target !== (kpi.key === "premium" ? 36000000 : kpi.key === "salesCounselors" ? 250 : 0)
      })

      switch (kpi.key) {
        case "premium":
          result.premiumActual = actual
          result.premiumTarget = target
          result.premiumBudgetMonthly = kpi.budgetMonthly
          result.premiumBudgetWeekly = kpi.budgetWeekly
          break
        case "salesCounselors":
          result.salesCounselorActual = actual
          result.salesCounselorTarget = target
          result.salesCounselorBudgetMonthly = kpi.budgetMonthly
          result.salesCounselorBudgetWeekly = kpi.budgetWeekly
          break
        case "policySold":
          result.policySoldActual = actual
          result.policySoldTarget = target
          result.policySoldBudgetMonthly = kpi.budgetMonthly
          result.policySoldBudgetWeekly = kpi.budgetWeekly
          break
        case "agencyCoops":
          result.agencyCoopActual = actual
          result.agencyCoopTarget = target
          result.agencyCoopBudgetMonthly = kpi.budgetMonthly
          result.agencyCoopBudgetWeekly = kpi.budgetWeekly
          break
        default:
        // Unknown KPI key
      }
    })

    // Debug logging for final result
    console.log("[v0] Final KPI data result:", result)
    console.log("[v0] Premium target check:", {
      premiumTarget: result.premiumTarget,
      isDynamic: result.premiumTarget !== 36000000,
      expectedFor7Months: Math.round((36000000 / 12) * 7)
    })

    return result
  }, [])

  useEffect(() => {
    if (lastUpdate > 0 && mergedReports && mergedReports.length > 0) {
      // Only refetch if we haven't refetched recently (debounce)
      const lastRefetch = localStorage.getItem('lastRefetch')
      const now = Date.now()
      if (!lastRefetch || now - parseInt(lastRefetch) > 30000) { // 30 seconds debounce
        console.log("[v0] Real-time update: refetching merged reports")
        refetch()
        localStorage.setItem('lastRefetch', now.toString())
      }
    }
  }, [lastUpdate, refetch, mergedReports])

  useEffect(() => {
    if (mergedReports && mergedReports.length > 0) {
      // Set default date range to August-December of current year
      const currentYear = new Date().getFullYear()
      const defaultStartDate = `${currentYear}-08-01`
      const defaultEndDate = `${currentYear}-12-31`
      
      const initialFilters: FilterCriteria = {
        salesTypeId: "",
        areaId: "",
        regionId: "",
        salesRepId: "",
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        granularity: "monthly",
      }
      setCurrentFilters(initialFilters)

      const filteredReports = applyFilters(mergedReports, initialFilters)
      
      // Handle async aggregateReportsToKPIs
      aggregateReportsToKPIs(filteredReports, initialFilters).then((kpisArray) => {
        setKpis(kpisArray)
        const convertedData = convertKpisToKpiData(kpisArray)
        setKpiData(convertedData)
      }).catch((error) => {
        console.error("[v0] Error in initial KPI calculation:", error)
      })
    }
  }, [mergedReports, applyFilters, aggregateReportsToKPIs, convertKpisToKpiData])

  useEffect(() => {
    if (mergedReports.length > 0) {
      console.log("[v0] 🔄 useEffect triggered - recalculating KPIs")
      console.log("[v0] 📊 Current filters when recalculating KPIs:", currentFilters)
      console.log("[v0] 👤 Sales Rep ID in filters:", currentFilters.salesRepId)
      
      // Use requestIdleCallback for better performance if available
      const calculateKPIs = () => {
        const filteredReports = applyFilters(mergedReports, currentFilters)
        
        // Handle async aggregateReportsToKPIs
        aggregateReportsToKPIs(filteredReports, currentFilters).then((kpisArray) => {
          setKpis(kpisArray)
          const convertedData = convertKpisToKpiData(kpisArray)
          setKpiData(convertedData)
        }).catch((error) => {
          console.error("[v0] Error in KPI calculation:", error)
        })
      }
      
      // Use requestIdleCallback for better performance, fallback to setTimeout
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(calculateKPIs, { timeout: 100 })
      } else {
        setTimeout(calculateKPIs, 0)
      }
    }
  }, [mergedReports, currentFilters, applyFilters, aggregateReportsToKPIs, convertKpisToKpiData])

  const handleFiltersChange = useCallback(async (filters: any) => {
    try {
      const filterCriteria: FilterCriteria = {
        salesTypeId: !filters.salesType || filters.salesType === "all" ? "" : filters.salesType,
        areaId: !filters.area || filters.area === "all" ? "" : filters.area,
        regionId: !filters.region || filters.region === "all" ? "" : filters.region,
        salesRepId: !filters.salesOfficer || filters.salesOfficer === "all" ? "" : filters.salesOfficer,
        startDate: filters.startDate || "",
        endDate: filters.endDate || "",
        granularity: filters.granularity || "monthly",
      }

      console.log("[v0] 🚀 Real-time filter update:", filters)
      console.log("[v0] 🎯 Setting currentFilters to:", filterCriteria)
      console.log("[v0] 👤 Sales Officer selected:", filters.salesOfficer, "→ salesRepId:", filterCriteria.salesRepId)
      
      // Use React's batching to update state efficiently
      setCurrentFilters(filterCriteria)
    } catch (error) {
      console.error("[v0] Error applying filters:", error)
    }
  }, [])

  const renderContent = () => {
    // Handle error state
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-xl font-semibold mb-4">Error Loading Data</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button 
              onClick={refetch}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    // Apply current filters to get filtered reports
    const filteredReports = mergedReports ? applyFilters(mergedReports, currentFilters) : []
    
    switch (activeTab) {
      case "dashboard":
        return (
          <ProtectedRoute requiredPermission="dashboard:view">
            <div className="space-y-2 sm:space-y-3 lg:space-y-6">
              <div className="px-0 animate-slide-up">
                <h2 className="text-lg sm:text-xl lg:text-3xl font-bold tracking-tight leading-tight" style={{ color: '#023f99' }}>Dashboard</h2>
                <p className="text-muted-foreground text-xs sm:text-sm lg:text-base leading-relaxed">
                  Monitor sales performance and track key metrics.
                </p>
              </div>
              <div className="animate-fade-in">
                <DashboardFilters 
                  onFiltersChange={handleFiltersChange} 
                  onRefreshDropdowns={setRefreshDropdowns}
                />
              </div>
              <div className="animate-scale-in">
                <DashboardKPICards data={kpiData} loading={loading} />
              </div>
              <div className="animate-slide-up">
                <SummaryTable reports={filteredReports} currentFilters={currentFilters} selectedMetric="premium" />
              </div>
              <div className="animate-fade-in">
                <SalesPerformanceChart
                  key={`chart-${currentFilters.salesRepId}-${currentFilters.startDate}-${currentFilters.endDate}-${currentFilters.salesTypeId}-${currentFilters.areaId}-${currentFilters.regionId}`}
                  selectedSalesOfficer={currentFilters.salesRepId || ''}
                  startDate={currentFilters.startDate || ''}
                  endDate={currentFilters.endDate || ''}
                  salesType={currentFilters.salesTypeId || ''}
                  area={currentFilters.areaId || ''}
                  region={currentFilters.regionId || ''}
                />
              </div>
            </div>
          </ProtectedRoute>
        )
      case "sales-reps":
        return (
          <ProtectedRoute requiredPermission="sales-reps:view">
            <div className="space-y-2 sm:space-y-3 lg:space-y-6">
              <div className="px-0 animate-slide-up">
                <h2 className="text-lg sm:text-xl lg:text-3xl font-bold tracking-tight leading-tight" style={{ color: '#023f99' }}>Sales Representatives</h2>
                <p className="text-muted-foreground text-xs sm:text-sm lg:text-base leading-relaxed">
                  Manage your sales team and track their performance.
                </p>
              </div>
              <div className="animate-fade-in">
                <SalesRepsTable />
              </div>
            </div>
          </ProtectedRoute>
        )
      case "users":
        return (
          <ProtectedRoute requiredPermission="users:view">
            <div className="space-y-2 sm:space-y-3 lg:space-y-6">
              <div className="px-0 animate-slide-up">
                <h2 className="text-lg sm:text-xl lg:text-3xl font-bold tracking-tight leading-tight" style={{ color: '#023f99' }}>Users</h2>
                <p className="text-muted-foreground text-xs sm:text-sm lg:text-base leading-relaxed">
                  Manage system users and their access permissions.
                </p>
              </div>
              <div className="animate-fade-in">
                <UsersTable />
              </div>
            </div>
          </ProtectedRoute>
        )
      case "trash-bin":
        return (
          <ProtectedRoute requiredPermission="trash-bin:view">
            <div className="space-y-2 sm:space-y-3 lg:space-y-6">
              <div className="px-0 animate-slide-up">
                <h2 className="text-lg sm:text-xl lg:text-3xl font-bold tracking-tight leading-tight" style={{ color: '#023f99' }}>Trash Bin</h2>
                <p className="text-muted-foreground text-xs sm:text-sm lg:text-base leading-relaxed">
                  Recover accidentally deleted users and reports.
                </p>
              </div>
              <div className="animate-fade-in">
                <TrashBin />
              </div>
            </div>
          </ProtectedRoute>
        )
      default:
        return null
    }
  }

  // Debug authentication state
  console.log('Dashboard render state:', { isAuthenticated, isLoading, loading, user })

  // Show loading state only for authentication, not for API data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Authenticating...</div>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    console.log('Showing login form - not authenticated')
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/10 to-secondary-50/5">
      <Header 
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <div className="flex">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          isMobileOpen={isMobileMenuOpen}
          onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="flex-1 px-2 sm:px-3 lg:px-6 pt-2 sm:pt-3 lg:pt-8 pb-2 sm:pb-3 lg:pb-6 lg:ml-0 animate-fade-in">
          {loading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-600">Loading dashboard data...</span>
              </div>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <AuthProvider>
      <SessionTimeoutProvider>
        <RealTimeProvider>
          <DashboardContent />
        </RealTimeProvider>
      </SessionTimeoutProvider>
    </AuthProvider>
  )
}
