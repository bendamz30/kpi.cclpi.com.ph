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

const TIME_PERIOD_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
]

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function SalesPerformanceChart({
  reports,
  selectedSalesOfficer,
  startDate,
  endDate,
}: SalesPerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState("premium")
  const [timePeriod, setTimePeriod] = useState("monthly")

  const selectedMetricConfig = METRIC_OPTIONS.find((option) => option.value === selectedMetric)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value)
  }

  const chartData = useMemo(() => {
    let filteredReports = reports
    if (selectedSalesOfficer && selectedSalesOfficer !== "all") {
      filteredReports = reports.filter((report) => Number(report.salesRepId) === Number(selectedSalesOfficer))
    }

    const timeData = new Map<string, number>()
    const selectedMetricConfig = METRIC_OPTIONS.find((m) => m.value === selectedMetric)
    const metricKey = selectedMetricConfig?.key as keyof MergedReport

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1)
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), 11, 31)

    if (timePeriod === "monthly") {
      for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        timeData.set(monthKey, 0)
      }

      filteredReports.forEach((report) => {
        const reportDate = new Date(report.reportDate)
        const monthKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, "0")}`

        if (timeData.has(monthKey)) {
          const currentValue = timeData.get(monthKey) || 0
          const reportValue = Number(report[metricKey]) || 0
          timeData.set(monthKey, currentValue + reportValue)
        }
      })
    } else {
      const startYear = start.getFullYear()
      const endYear = end.getFullYear()

      for (let year = startYear; year <= endYear; year++) {
        for (let week = 1; week <= 52; week++) {
          const weekKey = `${year}-W${String(week).padStart(2, "0")}`
          timeData.set(weekKey, 0)
        }
      }

      filteredReports.forEach((report) => {
        const reportDate = new Date(report.reportDate)
        const year = reportDate.getFullYear()
        const dayOfYear = Math.floor((reportDate.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24))
        const weekNumber = Math.min(52, Math.ceil(dayOfYear / 7))
        const weekKey = `${year}-W${String(weekNumber).padStart(2, "0")}`

        if (timeData.has(weekKey)) {
          const currentValue = timeData.get(weekKey) || 0
          const reportValue = Number(report[metricKey]) || 0
          timeData.set(weekKey, currentValue + reportValue)
        }
      })
    }

    return Array.from(timeData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timeKey, value]) => {
        if (timePeriod === "monthly") {
          const [year, month] = timeKey.split("-")
          const monthIndex = Number.parseInt(month) - 1
          return {
            period: MONTHS[monthIndex],
            value: value,
            fullPeriod: `${MONTHS[monthIndex]} ${year}`,
          }
        } else {
          const [year, week] = timeKey.split("-W")
          return {
            period: `W${week}`,
            value: value,
            fullPeriod: `Week ${week}, ${year}`,
          }
        }
      })
  }, [reports, selectedSalesOfficer, selectedMetric, startDate, endDate, timePeriod])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">Sales Performance</CardTitle>
          <CardDescription>
            {timePeriod === "monthly" ? "Monthly" : "Weekly"} performance trends for the selected period
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
              <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {timePeriod === "monthly" ? "Month" : "Week"}
                            </span>
                            <span className="font-bold text-muted-foreground">{data.fullPeriod}</span>
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
