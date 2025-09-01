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

  useEffect(() => {
    const auth = getStoredAuth()
    if (auth.isAuthenticated && auth.user) {
      setUser(auth.user)
    }
  }, [])

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        console.log("[v0] Loading initial dashboard data...")
        const response = await fetch("/api/dashboard-data")
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Initial dashboard data loaded:", data)

          if (data.kpis) {
            setKpis(data.kpis || [])
            console.debug("[v0] kpis set:", data.kpis)

            const convertedData = convertKpisToKpiData(data.kpis)
            setKpiData(convertedData)
          } else {
            console.warn("[v0] No kpis found in response, using direct data mapping")
            setKpiData(data)
          }
        } else {
          console.error("[v0] Failed to load initial data:", response.status, response.statusText)
        }
      } catch (error) {
        console.error("[v0] Error loading initial dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

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
      const queryParams = new URLSearchParams()
      if (filters.areaId) queryParams.append("areaId", filters.areaId.toString())
      if (filters.regionId) queryParams.append("regionId", filters.regionId.toString())
      if (filters.salesTypeId) queryParams.append("salesTypeId", filters.salesTypeId.toString())
      if (filters.salesRepId) queryParams.append("salesRepId", filters.salesRepId.toString())
      if (filters.startDate) queryParams.append("startDate", filters.startDate)
      if (filters.endDate) queryParams.append("endDate", filters.endDate)

      const response = await fetch(`/api/dashboard-data?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Filtered dashboard data:", data)

        if (data.kpis) {
          setKpis(data.kpis || [])
          console.debug("[v0] filtered kpis set:", data.kpis)

          const convertedData = convertKpisToKpiData(data.kpis)
          setKpiData(convertedData)
        } else {
          console.warn("[v0] No kpis found in filtered response, using direct data mapping")
          setKpiData(data)
        }
      } else {
        console.error("[v0] Failed to load filtered data:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("[v0] Error fetching dashboard data:", error)
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
