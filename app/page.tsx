"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { Filters } from "@/components/dashboard/filters"
import { SalesRepsTable } from "@/components/dashboard/sales-reps-table"
import { UsersTable } from "@/components/dashboard/users-table"
import { getStoredAuth, clearStoredAuth } from "@/lib/auth"
import type { User } from "@/lib/mock-data"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [filters, setFilters] = useState({})

  useEffect(() => {
    const auth = getStoredAuth()
    if (auth.isAuthenticated && auth.user) {
      setUser(auth.user)
    }
  }, [])

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser)
  }

  const handleLogout = () => {
    clearStoredAuth()
    setUser(null)
    setActiveTab("dashboard")
  }

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
    console.log("[v0] Filters applied:", newFilters)
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">Welcome back, {user.name}! Here's your sales overview.</p>
            </div>
            <Filters onFiltersChange={handleFiltersChange} />
            <KPICards />
            <SalesChart />
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
