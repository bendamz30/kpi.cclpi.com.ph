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
import { SummaryTable } from "@/components/dashboard/summary-table"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { AuthProvider } from "@/contexts/auth-context"

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
  const { isAuthenticated, isLoading } = useAuth()
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

  const calculateMonthsInRange = (startDate?: string, endDate?: string): number => {
    if (!startDate || !endDate) return 12 // Default to full year if no range specified

    const start = new Date(startDate)
    const end = new Date(endDate)

    const yearDiff = end.getFullYear() - start.getFullYear()
    const monthDiff = end.getMonth() - start.getMonth()

    return Math.max(1, yearDiff * 12 + monthDiff + 1) // +1 to include both start and end months
  }

  const calculateWeeksInRange = (startDate?: string, endDate?: string): number => {
    if (!startDate || !endDate) return 48 // Default to full year if no range specified

    const start = new Date(startDate)
    const end = new Date(endDate)

    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.ceil(diffDays / 7)

    return Math.max(1, diffWeeks + 1) // +1 to include both start and end weeks
  }

  const applyFilters = (reports: MergedReport[], filters: FilterCriteria): MergedReport[] => {
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

    return filteredReports
  }

  const aggregateReportsToKPIs = (reports: MergedReport[]): KpiType[] => {
    const repGroups = new Map<number, MergedReport[]>()
    reports.forEach((report) => {
      const repId = Number(report.salesRepId)
      if (!repGroups.has(repId)) {
        repGroups.set(repId, [])
      }
      repGroups.get(repId)!.push(report)
    })

    const monthsInRange = calculateMonthsInRange(currentFilters.startDate, currentFilters.endDate)
    const weeksInRange = calculateWeeksInRange(currentFilters.startDate, currentFilters.endDate)
    const hasDateFilter = currentFilters.startDate && currentFilters.endDate
    const granularity = currentFilters.granularity || "monthly"

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

      // Calculate targets based on filter and granularity
      let repTargets
      if (hasDateFilter) {
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
          repTargets = {
            premiumTarget: Math.round((annualPremiumTarget / 12) * monthsInRange * 100) / 100,
            salesCounselorTarget: Math.round((annualSalesCounselorTarget / 12) * monthsInRange * 100) / 100,
            policySoldTarget: Math.round((annualPolicySoldTarget / 12) * monthsInRange * 100) / 100,
            agencyCoopTarget: Math.round((annualAgencyCoopTarget / 12) * monthsInRange * 100) / 100,
          }
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
  }

  useEffect(() => {
    if (lastUpdate > 0 && mergedReports.length > 0) {
      loadInitialData()
    }
  }, [lastUpdate])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      let reports: MergedReport[] = []

      try {
        const mergedResponse = await fetch("/api/merged-reports")
        if (mergedResponse.ok) {
          reports = await mergedResponse.json()
        }
      } catch (error) {
        // Fallback to frontend merging
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

        reports = salesReports.map((report: any) => {
          const user = users.find((u: any) => Number(u.userId) === Number(report.salesRepId))
          const reportYear = new Date(report.reportDate).getFullYear()
          const target = targets.find(
            (t: any) => Number(t.salesRepId) === Number(report.salesRepId) && Number(t.year) === reportYear,
          )
          const area = areas.find((a: any) => Number(a.areaId) === Number(user?.areaId))
          const region = regions.find((r: any) => Number(r.regionId) === Number(user?.regionId))
          const salesType = salesTypes.find((st: any) => Number(st.salesTypeId) === Number(user?.salesTypeId))

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

          return mergedReport
        })

        // Add placeholder reports for users who have targets but no actual reports
        const usersWithTargetsOnly = users.filter((user: any) => {
          const hasReports = salesReports.some((report: any) => Number(report.salesRepId) === Number(user.userId))
          const hasTargets = targets.some((target: any) => Number(target.salesRepId) === Number(user.userId))
          return !hasReports && hasTargets && user.role === "RegionalUser"
        })

        const placeholderReports = usersWithTargetsOnly.map((user: any) => {
          const target = targets.find((t: any) => Number(t.salesRepId) === Number(user.userId))
          const area = areas.find((a: any) => Number(a.areaId) === Number(user.areaId))
          const region = regions.find((r: any) => Number(r.regionId) === Number(user.regionId))
          const salesType = salesTypes.find((st: any) => Number(st.salesTypeId) === Number(user.salesTypeId))

          return {
            reportId: `placeholder-${user.userId}`,
            salesRepId: Number(user.userId),
            reportDate: new Date().toISOString().split('T')[0],
            premiumActual: 0,
            salesCounselorActual: 0,
            policySoldActual: 0,
            agencyCoopActual: 0,
            areaId: Number(user.areaId) || 0,
            regionId: Number(user.regionId) || 0,
            salesTypeId: Number(user.salesTypeId) || 0,
            areaName: area?.areaName || "Unknown",
            regionName: region?.regionName || "Unknown",
            salesTypeName: salesType?.salesTypeName || "Unknown",
            userName: user.name || "Unknown",
            premiumTarget: 0,
            salesCounselorTarget: 0,
            policySoldTarget: 0,
            agencyCoopTarget: 0,
            _annualPremiumTarget: Number(target?.premiumTarget) || 0,
            _annualSalesCounselorTarget: Number(target?.salesCounselorTarget) || 0,
            _annualPolicySoldTarget: Number(target?.policySoldTarget) || 0,
            _annualAgencyCoopTarget: Number(target?.agencyCoopTarget) || 0,
          }
        })

        reports = [...reports, ...placeholderReports]
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
        // Unknown KPI key
      }
    })

    return result
  }


  const handleFiltersChange = async (filters: any) => {
    setLoading(true)
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

      setCurrentFilters(filterCriteria)
    } catch (error) {
      console.error("[v0] Error applying filters:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    // Apply current filters to get filtered reports
    const filteredReports = applyFilters(mergedReports, currentFilters)
    
    switch (activeTab) {
      case "dashboard":
        return (
          <ProtectedRoute requiredPermission="dashboard:view">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                  Monitor sales performance and track key metrics across your organization.
                </p>
              </div>
              <DashboardFilters onFiltersChange={handleFiltersChange} />
              <DashboardKPICards data={kpiData} loading={loading} />
              <SummaryTable reports={filteredReports} currentFilters={currentFilters} selectedMetric="premium" />
              <SalesPerformanceChart
                reports={filteredReports}
                selectedSalesOfficer={currentFilters.salesRepId}
                startDate={currentFilters.startDate}
                endDate={currentFilters.endDate}
              />
            </div>
          </ProtectedRoute>
        )
      case "sales-reps":
        return (
          <ProtectedRoute requiredPermission="sales-reps:view">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Sales Representatives</h2>
                <p className="text-muted-foreground">Manage your sales team and track their performance.</p>
              </div>
              <SalesRepsTable />
            </div>
          </ProtectedRoute>
        )
      case "users":
        return (
          <ProtectedRoute requiredPermission="users:view">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                <p className="text-muted-foreground">Manage system users and their access permissions.</p>
              </div>
              <UsersTable />
            </div>
          </ProtectedRoute>
        )
      default:
        return null
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6 pt-8">{renderContent()}</main>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <AuthProvider>
      <RealTimeProvider>
        <DashboardContent />
      </RealTimeProvider>
    </AuthProvider>
  )
}
