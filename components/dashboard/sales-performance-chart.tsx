"use client"

import { useState, useMemo, useEffect } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRealTime } from "@/components/providers/real-time-provider"

interface SalesReport {
  reportId: number
  salesRepId: number
  salesRepName: string
  reportDate: string
  premiumActual: number
  salesCounselorActual: number
  policySoldActual: number
  agencyCoopActual: number
}

interface User {
  userId: number
  name: string
  role: string
  regionId: number | null
  areaId: number | null
  salesTypeId: number | null
}

interface Area {
  areaId: number
  areaName: string
}

interface Region {
  regionId: number
  regionName: string
  areaId: number
}

interface SalesType {
  salesTypeId: number
  salesTypeName: string
}

interface SalesPerformanceChartProps {
  selectedSalesOfficer?: string
  startDate?: string
  endDate?: string
  salesType?: string
  area?: string
  region?: string
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
  selectedSalesOfficer,
  startDate,
  endDate,
  salesType,
  area,
  region,
}: SalesPerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState("premium")
  const [timePeriod, setTimePeriod] = useState("monthly")
  const [reports, setReports] = useState<SalesReport[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [salesTypes, setSalesTypes] = useState<SalesType[]>([])
  const [loading, setLoading] = useState(true)
  const { lastUpdate } = useRealTime()

  const selectedMetricConfig = METRIC_OPTIONS.find((option) => option.value === selectedMetric)

  // Fetch all required data
  const fetchData = async () => {
    try {
      setLoading(true)
      const [reportsRes, usersRes, areasRes, regionsRes, salesTypesRes] = await Promise.all([
        fetch("/api/sales-reports-data"),
        fetch("/api/users"),
        fetch("/api/areas"),
        fetch("/api/regions"),
        fetch("/api/sales-types")
      ])

      if (reportsRes.ok && usersRes.ok && areasRes.ok && regionsRes.ok && salesTypesRes.ok) {
        const [reportsData, usersData, areasData, regionsData, salesTypesData] = await Promise.all([
          reportsRes.json(),
          usersRes.json(),
          areasRes.json(),
          regionsRes.json(),
          salesTypesRes.json()
        ])
        
        setReports(reportsData)
        setUsers(usersData)
        setAreas(areasData)
        setRegions(regionsData)
        setSalesTypes(salesTypesData)
      } else {
        console.error("Failed to fetch data")
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Real-time updates
  useEffect(() => {
    if (lastUpdate > 0 && reports.length > 0) {
      console.log("[v0] Real-time update detected in sales performance chart, refreshing data...")
      fetchData()
    }
  }, [lastUpdate])

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

    // Apply all filters
    filteredReports = reports.filter((report) => {
      const user = users.find((u) => u.userId === report.salesRepId)
      if (!user) return false

      // Sales officer filter
      if (selectedSalesOfficer && selectedSalesOfficer !== "all") {
        const reportSalesRepId = Number(report.salesRepId)
        const selectedOfficerId = Number(selectedSalesOfficer)
        const matchesId = reportSalesRepId === selectedOfficerId
        const matchesName = report.salesRepName === selectedSalesOfficer
        if (!(matchesId || matchesName)) return false
      }

      // Sales type filter
      if (salesType && salesType !== "all") {
        const userSalesType = salesTypes.find((st) => st.salesTypeId === user.salesTypeId)
        if (userSalesType?.salesTypeName !== salesType) return false
      }

      // Region filter
      if (region && region !== "all") {
        const userRegion = regions.find((r) => r.regionId === user.regionId)
        if (userRegion?.regionName !== region) return false
      }

      // Area filter
      if (area && area !== "all") {
        const userRegion = regions.find((r) => r.regionId === user.regionId)
        const userArea = areas.find((a) => a.areaId === userRegion?.areaId)
        if (userArea?.areaName !== area) return false
      }

      // Date range filter
      if (startDate && startDate !== "") {
        const reportDate = new Date(report.reportDate)
        if (reportDate < new Date(startDate)) return false
      }
      if (endDate && endDate !== "") {
        const reportDate = new Date(report.reportDate)
        if (reportDate > new Date(endDate)) return false
      }

      return true
    })

    console.log("[Chart] Processing reports:", {
      totalReports: reports.length,
      filteredReports: filteredReports.length,
      filters: { selectedSalesOfficer, salesType, area, region, startDate, endDate },
      reports: filteredReports.map(r => ({
        id: r.reportId,
        date: r.reportDate,
        premium: r.premiumActual,
        salesRep: r.salesRepName
      }))
    })

    // Debug: Check specifically for Jazcyl's August report
    const jazcylReports = filteredReports.filter(r => r.salesRepName === "Jazcyl Periodico")
    console.log("[Chart] Jazcyl reports:", jazcylReports.map(r => ({
      id: r.reportId,
      date: r.reportDate,
      premium: r.premiumActual,
      month: new Date(r.reportDate).getMonth() + 1
    })))


    const timeData = new Map<string, number>()
    const selectedMetricConfig = METRIC_OPTIONS.find((m) => m.value === selectedMetric)
    const metricKey = selectedMetricConfig?.key as keyof SalesReport

    // Use the actual date range from the data when no dates are specified
    let start: Date
    let end: Date
    
    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      // Find the actual date range from the reports
      const reportDates = filteredReports.map(r => new Date(r.reportDate))
      if (reportDates.length > 0) {
        start = new Date(Math.min(...reportDates.map(d => d.getTime())))
        end = new Date(Math.max(...reportDates.map(d => d.getTime())))
        // Extend range to include full months
        start = new Date(start.getFullYear(), start.getMonth(), 1)
        end = new Date(end.getFullYear(), end.getMonth() + 1, 0)
      } else {
        // Fallback to current year if no reports
        const currentYear = new Date().getFullYear()
        start = new Date(currentYear, 0, 1)
        end = new Date(currentYear, 11, 31)
      }
    }

    if (timePeriod === "monthly") {
      for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        timeData.set(monthKey, 0)
      }

      filteredReports.forEach((report) => {
        const reportDate = new Date(report.reportDate)
        const monthKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, "0")}`

        // Always process the report, even if the month key doesn't exist in timeData
        // This handles cases where reports exist outside the default date range
        if (!timeData.has(monthKey)) {
          timeData.set(monthKey, 0)
        }
        
        const currentValue = timeData.get(monthKey) || 0
        const reportValue = Number(report[metricKey]) || 0
        timeData.set(monthKey, currentValue + reportValue)

        // Debug: Log Jazcyl's August report processing
        if (report.salesRepName === "Jazcyl Periodico" && reportDate.getMonth() === 7) { // August is month 7 (0-indexed)
          console.log("[Chart] Processing Jazcyl August report:", {
            reportId: report.reportId,
            date: report.reportDate,
            monthKey,
            reportValue,
            currentValue,
            newValue: currentValue + reportValue
          })
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

    const finalData = Array.from(timeData.entries())
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
          const weekNumber = parseInt(week)
          
          // Calculate the start and end dates for this week
          const startOfYear = new Date(parseInt(year), 0, 1)
          const startOfWeek = new Date(startOfYear.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000)
          const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
          
          // Format dates
          const startDateStr = startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          const endDateStr = endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          
          return {
            period: `W${week}`,
            value: value,
            fullPeriod: `${startDateStr} - ${endDateStr}, ${year}`,
          }
        }
      })

    console.log("[Chart] Final chart data:", {
      timeDataEntries: Array.from(timeData.entries()),
      finalData,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      selectedSalesOfficer,
      startDate,
      endDate
    })

    return finalData
  }, [reports, users, areas, regions, salesTypes, selectedSalesOfficer, salesType, area, region, selectedMetric, startDate, endDate, timePeriod])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Sales Performance</CardTitle>
          <CardDescription className="text-sm">Loading sales performance data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col space-y-4 pb-4">
        <div>
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">Sales Performance</CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600 mt-1">
            {timePeriod === "monthly" ? "Monthly" : "Weekly"} performance trends for the selected period
          </CardDescription>
        </div>
        <div className="flex flex-col xs:flex-row gap-3 w-full">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-full xs:w-auto xs:min-w-[120px] h-11 text-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
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
            <SelectTrigger className="w-full xs:w-auto xs:min-w-[160px] h-11 text-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
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
      <CardContent className="pt-0">
        <div className="h-[280px] sm:h-[320px] lg:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: 15, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis 
                dataKey="period" 
                className="text-xs fill-gray-600" 
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                className="text-xs fill-gray-600" 
                tick={{ fontSize: 11 }}
                width={45}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                        <div className="space-y-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              {timePeriod === "monthly" ? "Month" : "Date Range"}
                            </span>
                            <span className="font-semibold text-gray-900 text-sm">{data.fullPeriod}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              {selectedMetricConfig?.label}
                            </span>
                            <span className="font-bold text-blue-600 text-sm">
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
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#2563eb", strokeWidth: 2, fill: "#ffffff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
