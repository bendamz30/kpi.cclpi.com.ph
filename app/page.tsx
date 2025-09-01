"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { SalesRepsTable } from "@/components/dashboard/sales-reps-table"
import { UsersTable } from "@/components/dashboard/users-table"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { DashboardKPICards, type KPIData } from "@/components/dashboard/dashboard-kpi-cards"
import { getStoredAuth, clearStoredAuth } from "@/lib/auth"
import type { User } from "@/lib/mock-data"

interface KpiType {
  key: string
  title: string
  actual: number
  target: number
  achievement: number
  variance: number
  status: string
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
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [kpis, setKpis] = useState<KpiType[]>([])
  const [kpiData, setKpiData] = useState<KPIData>({
    premiumActual: 0,
    premiumTarget: 0,
    salesCounselorActual: 0,
    salesCounselorTarget: 0,
    policySoldActual: 0,
    policySoldTarget: 0,
    agencyCoopActual: 0,
    agencyCoopTarget: 0,
  })
  const [loading, setLoading] = useState(false)
  const [mergedReports, setMergedReports] = useState<MergedReport[]>([])
  const [currentFilters, setCurrentFilters] = useState<FilterCriteria>({})

  useEffect(() => {
    const auth = getStoredAuth()
    if (auth.isAuthenticated && auth.user) {
      setUser(auth.user)
    }
  }, [])

  const applyFilters = (reports: MergedReport[], filters: FilterCriteria): MergedReport[] => {
    console.debug("[v0] Applying filters:", filters, " -> input reports:", reports.length)

    const filteredReports = reports.filter((report) => {
      // Type-safe numeric comparisons
      if (filters.areaId && filters.areaId !== "") {
        if (Number(report.areaId) !== Number(filters.areaId)) return false
      }

      if (filters.regionId && filters.regionId !== "") {
        if (Number(report.regionId) !== Number(filters.regionId)) return false
      }

      if (filters.salesTypeId && filters.salesTypeId !== "") {
        if (Number(report.salesTypeId) !== Number(filters.salesTypeId)) return false
      }

      if (filters.salesRepId && filters.salesRepId !== "") {
        if (Number(report.salesRepId) !== Number(filters.salesRepId)) return false
      }

      // Date range filtering
      if (filters.startDate && filters.startDate !== "") {
        const reportDate = new Date(report.reportDate)
        const startDate = new Date(filters.startDate)
        if (reportDate < startDate) return false
      }

      if (filters.endDate && filters.endDate !== "") {
        const reportDate = new Date(report.reportDate)
        const endDate = new Date(filters.endDate)
        if (reportDate > endDate) return false
      }

      return true
    })

    console.debug("[v0] Applying filters:", filters, " -> results:", filteredReports.length)
    return filteredReports
  }

  const aggregateReportsToKPIs = (reports: MergedReport[]): KpiType[] => {
    const totals = reports.reduce(
      (acc, report) => {
        acc.premiumActual += Number(report.premiumActual) || 0
        acc.salesCounselorActual += Number(report.salesCounselorActual) || 0
        acc.policySoldActual += Number(report.policySoldActual) || 0
        acc.agencyCoopActual += Number(report.agencyCoopActual) || 0
        acc.premiumTarget += Number(report.premiumTarget) || 0
        acc.salesCounselorTarget += Number(report.salesCounselorTarget) || 0
        acc.policySoldTarget += Number(report.policySoldTarget) || 0
        acc.agencyCoopTarget += Number(report.agencyCoopTarget) || 0
        return acc
      },
      {
        premiumActual: 0,
        premiumTarget: 0,
        salesCounselorActual: 0,
        salesCounselorTarget: 0,
        policySoldActual: 0,
        policySoldTarget: 0,
        agencyCoopActual: 0,
        agencyCoopTarget: 0,
      },
    )

    return [
      {
        key: "premium",
        title: "Premium",
        actual: totals.premiumActual,
        target: totals.premiumTarget,
        achievement: totals.premiumTarget > 0 ? (totals.premiumActual / totals.premiumTarget) * 100 : 0,
        variance: totals.premiumActual - totals.premiumTarget,
        status: totals.premiumActual >= totals.premiumTarget ? "success" : "danger",
      },
      {
        key: "salesCounselors",
        title: "Sales Counselors",
        actual: totals.salesCounselorActual,
        target: totals.salesCounselorTarget,
        achievement:
          totals.salesCounselorTarget > 0 ? (totals.salesCounselorActual / totals.salesCounselorTarget) * 100 : 0,
        variance: totals.salesCounselorActual - totals.salesCounselorTarget,
        status: totals.salesCounselorActual >= totals.salesCounselorTarget ? "success" : "danger",
      },
      {
        key: "policiesSold",
        title: "Policies Sold",
        actual: totals.policySoldActual,
        target: totals.policySoldTarget,
        achievement: totals.policySoldTarget > 0 ? (totals.policySoldActual / totals.policySoldTarget) * 100 : 0,
        variance: totals.policySoldActual - totals.policySoldTarget,
        status: totals.policySoldActual >= totals.policySoldTarget ? "success" : "danger",
      },
      {
        key: "agencyCoops",
        title: "Agency Coops",
        actual: totals.agencyCoopActual,
        target: totals.agencyCoopTarget,
        achievement: totals.agencyCoopTarget > 0 ? (totals.agencyCoopActual / totals.agencyCoopTarget) * 100 : 0,
        variance: totals.agencyCoopActual - totals.agencyCoopTarget,
        status: totals.agencyCoopActual >= totals.agencyCoopTarget ? "success" : "danger",
      },
    ]
  }

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        console.log("[v0] Loading initial dashboard data...")

        // Try to load merged reports first, fallback to merging on frontend
        let reports: MergedReport[] = []

        try {
          const mergedResponse = await fetch("/api/merged-reports")
          if (mergedResponse.ok) {
            reports = await mergedResponse.json()
            console.log("[v0] Loaded merged reports:", reports.length)
          }
        } catch (error) {
          console.log("[v0] No merged reports found, merging on frontend...")
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

          // Merge data on frontend
          reports = salesReports.map((report: any) => {
            const user = users.find((u: any) => Number(u.userId) === Number(report.salesRepId))
            const target = targets.find((t: any) => Number(t.salesRepId) === Number(report.salesRepId))
            const area = areas.find((a: any) => Number(a.areaId) === Number(user?.areaId))
            const region = regions.find((r: any) => Number(r.regionId) === Number(user?.regionId))
            const salesType = salesTypes.find((st: any) => Number(st.salesTypeId) === Number(user?.salesTypeId))

            return {
              ...report,
              areaId: Number(user?.areaId) || 0,
              regionId: Number(user?.regionId) || 0,
              salesTypeId: Number(user?.salesTypeId) || 0,
              areaName: area?.areaName || "Unknown",
              regionName: region?.regionName || "Unknown",
              salesTypeName: salesType?.salesTypeName || "Unknown",
              userName: user?.name || "Unknown",
              premiumTarget: Number(target?.premiumTarget) || 0,
              salesCounselorTarget: Number(target?.salesCounselorTarget) || 0,
              policySoldTarget: Number(target?.policySoldTarget) || 0,
              agencyCoopTarget: Number(target?.agencyCoopTarget) || 0,
            }
          })
        }

        setMergedReports(reports)

        // Apply initial filters (none) and compute KPIs
        const filteredReports = applyFilters(reports, {})
        const kpisArray = aggregateReportsToKPIs(filteredReports)
        setKpis(kpisArray)

        const convertedData = convertKpisToKpiData(kpisArray)
        setKpiData(convertedData)

        console.log("[v0] Initial data loaded successfully")
      } catch (error) {
        console.error("[v0] Error loading initial dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

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
      salesCounselorActual: 0,
      salesCounselorTarget: 0,
      policySoldActual: 0,
      policySoldTarget: 0,
      agencyCoopActual: 0,
      agencyCoopTarget: 0,
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
          break
        case "salesCounselors":
          result.salesCounselorActual = actual
          result.salesCounselorTarget = target
          break
        case "policiesSold":
          result.policySoldActual = actual
          result.policySoldTarget = target
          break
        case "agencyCoops":
          result.agencyCoopActual = actual
          result.agencyCoopTarget = target
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
      console.log("[v0] Applying filters:", filters)

      // Convert filter format to match our FilterCriteria interface
      const filterCriteria: FilterCriteria = {
        salesTypeId: filters.salesType || "",
        areaId: filters.area || "",
        regionId: filters.region || "",
        salesRepId: filters.salesOfficer || "",
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
