"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { SalesRepsTable } from "@/components/dashboard/sales-reps-table"
import { UsersTable } from "@/components/dashboard/users-table"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { DashboardKPICards, type KPIData } from "@/components/dashboard/dashboard-kpi-cards"
import { SalesPerformanceChart } from "@/components/dashboard/sales-performance-chart"
import { RealTimeProvider, useRealTime } from "@/components/providers/real-time-provider"
import { getStoredAuth, clearStoredAuth } from "@/lib/auth"
import { SummaryTable } from "@/components/dashboard/summary-table"
import type { User } from "@/lib/mock-data"

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
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
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
  const [loading, setLoading] = useState(false)
  const [mergedReports, setMergedReports] = useState<MergedReport[]>([])
  const [currentFilters, setCurrentFilters] = useState<FilterCriteria>({})
  const { lastUpdate } = useRealTime()

  useEffect(() => {
    const auth = getStoredAuth()
    if (auth.isAuthenticated && auth.user) {
      setUser(auth.user)
    }
  }, [])

  const calculateMonthsInRange = (startDate?: string, endDate?: string): number => {
    if (!startDate || !endDate) return 12 // Default to full year if no range specified

    const start = new Date(startDate)
    const end = new Date(endDate)

    const yearDiff = end.getFullYear() - start.getFullYear()
    const monthDiff = end.getMonth() - start.getMonth()

    return Math.max(1, yearDiff * 12 + monthDiff + 1) // +1 to include both start and end months
  }

  const applyFilters = (reports: MergedReport[], filters: FilterCriteria): MergedReport[] => {
    console.debug("[v0] applyFilters called with filters:", filters)
    console.debug("[v0] Input reports count:", reports.length)

    console.debug("[v0] Sales Type filter debug:")
    console.debug("- Raw salesTypeId filter:", filters.salesTypeId)
    console.debug(
      "- Normalized salesTypeId filter:",
      filters.salesTypeId === "" || filters.salesTypeId === "all" ? null : Number(filters.salesTypeId),
    )

    // Check what salesTypeId values exist in reports
    const uniqueSalesTypeIds = [...new Set(reports.map((r) => r.salesTypeId))]
    console.debug("- Unique salesTypeId values in reports:", uniqueSalesTypeIds)

    // Check specific users' salesTypeId values
    const userSalesTypes = reports.reduce(
      (acc, r) => {
        if (!acc[r.salesRepId]) {
          acc[r.salesRepId] = { userName: r.userName, salesTypeId: r.salesTypeId }
        }
        return acc
      },
      {} as Record<number, { userName: string; salesTypeId: number }>,
    )
    console.debug("- User salesTypeId mapping:", userSalesTypes)

    const dianneReport = reports.find((r) => r.salesRepId === 105)
    if (dianneReport) {
      console.debug("[v0] Found Dianne's report:", dianneReport)
    } else {
      console.debug("[v0] Dianne's report (salesRepId: 105) not found in reports")
    }

    const filteredReports = reports.filter((report) => {
      if (report.salesRepId === 105) {
        console.debug("[v0] Checking Dianne's report against filters...")
      }

      // Normalize filter values - treat empty string or "all" as null (no filter)
      const fSalesType =
        filters.salesTypeId === "" || filters.salesTypeId === "all" ? null : Number(filters.salesTypeId)
      const fArea = filters.areaId === "" || filters.areaId === "all" ? null : Number(filters.areaId)
      const fRegion = filters.regionId === "" || filters.regionId === "all" ? null : Number(filters.regionId)
      const fSalesRep = filters.salesRepId === "" || filters.salesRepId === "all" ? null : Number(filters.salesRepId)

      if (fSalesType !== null) {
        console.debug(
          `[v0] Filtering by salesType: ${fSalesType}, report salesTypeId: ${report.salesTypeId} (${report.userName})`,
        )
        if (Number(report.salesTypeId) !== fSalesType) {
          console.debug(
            `[v0] ${report.userName} filtered out by sales type: report=${report.salesTypeId}, filter=${fSalesType}`,
          )
          return false
        } else {
          console.debug(`[v0] ${report.userName} passed sales type filter`)
        }
      }

      // Area filtering
      if (fArea !== null) {
        if (Number(report.areaId) !== fArea) {
          if (report.salesRepId === 105) {
            console.debug("[v0] Dianne filtered out by area:", {
              reportAreaId: report.areaId,
              filterAreaId: fArea,
            })
          }
          return false
        }
      }

      // Region filtering
      if (fRegion !== null) {
        if (Number(report.regionId) !== fRegion) {
          if (report.salesRepId === 105) {
            console.debug("[v0] Dianne filtered out by region:", {
              reportRegionId: report.regionId,
              filterRegionId: fRegion,
            })
          }
          return false
        }
      }

      // Sales Rep filtering
      if (fSalesRep !== null) {
        if (Number(report.salesRepId) !== fSalesRep) {
          if (report.salesRepId === 105) {
            console.debug("[v0] Dianne filtered out by sales rep:", {
              reportSalesRepId: report.salesRepId,
              filterSalesRepId: fSalesRep,
            })
          }
          return false
        }
      }

      if (report.salesRepId === 105) {
        console.debug("[v0] Dianne's report passed all filters!")
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

    console.debug("[v0] Filtered reports count:", filteredReports.length)
    const filteredUsers = [
      ...new Set(filteredReports.map((r) => `${r.userName} (salesTypeId: ${r.salesTypeId})`)),
    ].sort()
    console.debug("[v0] Users in filtered results:", filteredUsers)

    const dianneInFiltered = filteredReports.find((r) => r.salesRepId === 105)
    if (dianneInFiltered) {
      console.debug("[v0] Dianne's report included in filtered results")
    } else {
      console.debug("[v0] Dianne's report NOT included in filtered results")
    }

    return filteredReports
  }

  const aggregateReportsToKPIs = (reports: MergedReport[]): KpiType[] => {
    console.debug("[v0] Aggregating KPIs from", reports.length, "reports")

    const repGroups = new Map<number, MergedReport[]>()
    reports.forEach((report) => {
      const repId = Number(report.salesRepId)
      if (!repGroups.has(repId)) {
        repGroups.set(repId, [])
      }
      repGroups.get(repId)!.push(report)
    })

    const monthsInRange = calculateMonthsInRange(currentFilters.startDate, currentFilters.endDate)
    const hasDateFilter = currentFilters.startDate && currentFilters.endDate
    console.debug("[v0] Months in selected range:", monthsInRange, "Has date filter:", hasDateFilter)

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

      // Calculate targets based on filter
      let repTargets
      if (hasDateFilter) {
        // When date filter is applied, calculate based on months in range
        repTargets = {
          premiumTarget: Math.round((annualPremiumTarget / 12) * monthsInRange * 100) / 100,
          salesCounselorTarget: Math.round((annualSalesCounselorTarget / 12) * monthsInRange * 100) / 100,
          policySoldTarget: Math.round((annualPolicySoldTarget / 12) * monthsInRange * 100) / 100,
          agencyCoopTarget: Math.round((annualAgencyCoopTarget / 12) * monthsInRange * 100) / 100,
        }
      } else {
        // Default (no filter) - show sum of all annual targets
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

      console.debug("[v0] Rep", repId, "targets:", {
        annual: annualPremiumTarget,
        monthsInRange: monthsInRange,
        hasDateFilter: hasDateFilter,
        calculatedTarget: repTargets.premiumTarget,
        monthlyBudget: repBudgets.premiumBudgetMonthly,
        weeklyBudget: repBudgets.premiumBudgetWeekly,
      })

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

    console.debug("[v0] KPIs computed:", kpis)
    return kpis
  }

  useEffect(() => {
    if (lastUpdate > 0 && mergedReports.length > 0) {
      console.log("[v0] Real-time update detected, reloading data...")
      loadInitialData()
    }
  }, [lastUpdate])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      console.debug("[v0] Loading initial dashboard data...")

      let reports: MergedReport[] = []

      try {
        const mergedResponse = await fetch("/api/merged-reports")
        if (mergedResponse.ok) {
          reports = await mergedResponse.json()
          console.debug("[v0] Loaded merged reports:", reports.length)
        }
      } catch (error) {
        console.debug("[v0] No merged reports found, merging on frontend...")
      }

      // If no merged reports, merge on frontend
      if (reports.length === 0) {
        const [salesReportsRes, usersRes, targetsRes, areasRes, regionsRes, salesTypesRes] = await Promise.all([
          fetch("/api/sales-reports-data"),
          fetch("/api/users"),
          fetch("/api/sales-targets"),
          fetch("/api/areas"),
          fetch("/api/regions"),
          fetch("/api/sales-types"),
        ])

        const [salesReports, users, targets, areas, regions, salesTypes] = await Promise.all([
          salesReportsRes.json(),
          usersRes.json(),
          targetsRes.json(),
          areasRes.json(),
          regionsRes.json(),
          salesTypesRes.json(),
        ])

        console.debug(
          "[v0] Loaded counts: users=",
          users.length,
          ", reports=",
          salesReports.length,
          ", targets=",
          targets.length,
          ", areas=",
          areas.length,
          ", regions=",
          regions.length,
          ", salesTypes=",
          salesTypes.length,
        )

        reports = salesReports.map((report: any) => {
          const user = users.find((u: any) => Number(u.userId) === Number(report.salesRepId))
          const reportYear = new Date(report.reportDate).getFullYear()
          const target = targets.find(
            (t: any) => Number(t.salesRepId) === Number(report.salesRepId) && Number(t.year) === reportYear,
          )
          const area = areas.find((a: any) => Number(a.areaId) === Number(user?.areaId))
          const region = regions.find((r: any) => Number(r.regionId) === Number(user?.regionId))
          const salesType = salesTypes.find((st: any) => Number(st.salesTypeId) === Number(user?.salesTypeId))

          if (!user) {
            console.debug(`[v0] Missing user for salesRepId: ${report.salesRepId}`)
          } else {
            if (!user.areaId) {
              console.debug(`[v0] Missing areaId for user: ${user.name} (userId: ${user.userId})`)
            }
            if (!user.regionId) {
              console.debug(`[v0] Missing regionId for user: ${user.name} (userId: ${user.userId})`)
            }
            if (!user.salesTypeId) {
              console.debug(`[v0] Missing salesTypeId for user: ${user.name} (userId: ${user.userId})`)
            }
          }

          if (!target) {
            console.debug(`[v0] Missing salesTarget for salesRepId: ${report.salesRepId}, year: ${reportYear}`)
          }

          // Set targets to 0 for individual reports to prevent multiplication
          const mergedReport = {
            ...report,
            areaId: Number(user?.areaId) || 0,
            regionId: Number(user?.regionId) || 0,
            salesTypeId: Number(user?.salesTypeId) || 0,
            areaName: area?.areaName || "Unknown",
            regionName: region?.regionName || "Unknown",
            salesTypeName: salesType?.salesTypeName || "Unknown",
            userName: user?.name || "Unknown",
            // Set targets to 0 for individual reports to prevent multiplication
            premiumTarget: 0,
            salesCounselorTarget: 0,
            policySoldTarget: 0,
            agencyCoopTarget: 0,
            // Store annual targets for later calculation
            _annualPremiumTarget: Number(target?.premiumTarget) || 0,
            _annualSalesCounselorTarget: Number(target?.salesCounselorTarget) || 0,
            _annualPolicySoldTarget: Number(target?.policySoldTarget) || 0,
            _annualAgencyCoopTarget: Number(target?.agencyCoopTarget) || 0,
          }

          if (report.salesRepId === 105) {
            console.debug("[v0] Dianne's merged report:", mergedReport)
          }

          return mergedReport
        })
      }

      setMergedReports(reports)

      const initialFilters: FilterCriteria = {
        salesTypeId: "",
        areaId: "",
        regionId: "",
        salesRepId: "",
        startDate: "",
        endDate: "",
        granularity: "monthly",
      }
      setCurrentFilters(initialFilters)

      const filteredReports = applyFilters(reports, initialFilters)
      const kpisArray = aggregateReportsToKPIs(filteredReports)
      setKpis(kpisArray)

      const convertedData = convertKpisToKpiData(kpisArray)
      setKpiData(convertedData)

      console.debug("[v0] Initial data loaded successfully with all data displayed")
    } catch (error) {
      console.error("[v0] Error loading initial dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (mergedReports.length > 0) {
      const filteredReports = applyFilters(mergedReports, currentFilters)
      const kpisArray = aggregateReportsToKPIs(filteredReports)
      setKpis(kpisArray)

      const convertedData = convertKpisToKpiData(kpisArray)
      setKpiData(convertedData)
    }
  }, [mergedReports, currentFilters])

  const convertKpisToKpiData = (kpisArray: KpiType[]): KPIData => {
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
      console.debug("[v0] No KPIs to convert, using defaults")
      return defaultData
    }

    const result = { ...defaultData }

    kpisArray.forEach((kpi) => {
      const actual = Number(kpi.actual) || 0
      const target = Number(kpi.target) || 0

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
        case "policiesSold":
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
          console.debug("[v0] Unknown KPI key:", kpi.key)
      }
    })

    console.debug("[v0] Converted KPIs to KPIData:", result)
    return result
  }

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser)
  }

  const handleLogout = () => {
    clearStoredAuth()
    setUser(null)
    setActiveTab("dashboard")
  }

  const handleFiltersChange = async (filters: any) => {
    setLoading(true)
    try {
      console.debug("[v0] Applying filters:", filters)

      const filterCriteria: FilterCriteria = {
        salesTypeId: !filters.salesType || filters.salesType === "all" ? "" : filters.salesType,
        areaId: !filters.area || filters.area === "all" ? "" : filters.area,
        regionId: !filters.region || filters.region === "all" ? "" : filters.region,
        salesRepId: !filters.salesOfficer || filters.salesOfficer === "all" ? "" : filters.salesOfficer,
        startDate: filters.startDate || "",
        endDate: filters.endDate || "",
        granularity: filters.granularity || "monthly",
      }

      setCurrentFilters(filterCriteria)
    } catch (error) {
      console.error("[v0] Error applying filters:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">
                Monitor sales performance and track key metrics across your organization.
              </p>
            </div>
            <DashboardFilters onFiltersChange={handleFiltersChange} />
            <DashboardKPICards data={kpiData} loading={loading} />
            <SummaryTable reports={mergedReports} currentFilters={currentFilters} selectedMetric="premium" />
            <SalesPerformanceChart
              reports={mergedReports}
              selectedSalesOfficer={currentFilters.salesRepId}
              startDate={currentFilters.startDate}
              endDate={currentFilters.endDate}
            />
          </div>
        )
      case "sales-reps":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Sales Representatives</h2>
              <p className="text-muted-foreground">Manage your sales team and track their performance.</p>
            </div>
            <SalesRepsTable />
          </div>
        )
      case "users":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Users</h2>
              <p className="text-muted-foreground">Manage system users and their access permissions.</p>
            </div>
            <UsersTable />
          </div>
        )
      default:
        return null
    }
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} />
      <div className="flex">
        <Sidebar user={user} activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6">{renderContent()}</main>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <RealTimeProvider>
      <DashboardContent />
    </RealTimeProvider>
  )
}
