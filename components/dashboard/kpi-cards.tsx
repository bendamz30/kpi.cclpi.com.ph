"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, Users, DollarSign, Calendar } from "lucide-react"

interface KPIData {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ReactNode
}

export function KPICards() {
  const kpiData: KPIData[] = [
    {
      title: "Total Revenue",
      value: "$2,847,500",
      change: "+12.5%",
      trend: "up",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Active Sales Reps",
      value: "24",
      change: "+2",
      trend: "up",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Target Achievement",
      value: "87.3%",
      change: "-2.1%",
      trend: "down",
      icon: <Target className="h-4 w-4" />,
    },
    {
      title: "This Month",
      value: "$485,200",
      change: "+8.2%",
      trend: "up",
      icon: <Calendar className="h-4 w-4" />,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
            <div className="text-muted-foreground">{kpi.icon}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="flex items-center text-xs">
              {kpi.trend === "up" ? (
                <TrendingUp className="mr-1 h-3 w-3 text-secondary" />
              ) : kpi.trend === "down" ? (
                <TrendingDown className="mr-1 h-3 w-3 text-destructive" />
              ) : null}
              <span
                className={
                  kpi.trend === "up"
                    ? "text-secondary"
                    : kpi.trend === "down"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }
              >
                {kpi.change} from last month
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
