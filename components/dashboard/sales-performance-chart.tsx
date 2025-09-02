"use client"

import { useState, useMemo } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface SalesPerformanceChartProps {
  reports: MergedReport[]
  selectedSalesOfficer?: string
  startDate?: string
  endDate?: string
}

const METRIC_OPTIONS = [
  { value: "premium", label: "Premium", key: "premiumActual" },
  { value: "salesCounselor", label: "Sales Counselor", key: "salesCounselorActual" },
  { value: "policySold", label: "Policy Sold", key: "policySoldActual" },
  { value: "agencyCoop", label: "Agency Coop", key: "agencyCoopActual" },
]

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function SalesPerformanceChart({
  reports,
  selectedSalesOfficer,
  startDate,
  endDate,
}: SalesPerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState("premium")

  const chartData = useMemo(() => {
    // Filter reports based on selected sales officer
    let filteredReports = reports
    if (selectedSalesOfficer && selectedSalesOfficer !== "all") {
      filteredReports = reports.filter((report) => Number(report.salesRepId) === Number(selectedSalesOfficer))
    }

    // Group reports by month
    const monthlyData = new Map<string, number>()

    // Initialize all months in the range with 0
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1)
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), 11, 31)

    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthlyData.set(monthKey, 0)
    }

    // Aggregate data by month
    const selectedMetricConfig = METRIC_OPTIONS.find((m) => m.value === selectedMetric)
    const metricKey = selectedMetricConfig?.key as keyof MergedReport

    filteredReports.forEach((report) => {
      const reportDate = new Date(report.reportDate)
      const monthKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, "0")}`

      if (monthlyData.has(monthKey)) {
        const currentValue = monthlyData.get(monthKey) || 0
        const reportValue = Number(report[metricKey]) || 0
        monthlyData.set(monthKey, currentValue + reportValue)
      }
    })

    // Convert to chart format
    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, value]) => {
        const [year, month] = monthKey.split("-")
        const monthIndex = Number.parseInt(month) - 1
        return {
          month: MONTHS[monthIndex],
          value: value,
          fullMonth: `${MONTHS[monthIndex]} ${year}`,
        }
      })
  }, [reports, selectedSalesOfficer, selectedMetric, startDate, endDate])

  const selectedMetricConfig = METRIC_OPTIONS.find((m) => m.value === selectedMetric)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">Sales Performance</CardTitle>
          <CardDescription>Monthly performance trends for the selected period</CardDescription>
        </div>
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            {METRIC_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
              <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Month</span>
                            <span className="font-bold text-muted-foreground">{data.fullMonth}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {selectedMetricConfig?.label}
                            </span>
                            <span className="font-bold">
                              {selectedMetric === "premium"
                                ? `₱${Number(payload[0].value).toLocaleString()}`
                                : Number(payload[0].value).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
