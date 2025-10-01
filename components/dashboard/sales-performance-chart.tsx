"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRealTime } from '@/components/providers/real-time-provider'

interface SalesReport {
  reportId: number
  salesRepId: number
  salesRepName: string
  reportDate: string
  salesTypeId: number
  salesTypeName: string
  premiumActual: number
  salesCounselorActual: number
  policySoldActual: number
  agencyCoopActual: number
  createdBy: number
  createdAt: string
  updatedAt: string
  deletedBy?: number
}

interface User {
  userId: number
  name: string
  email: string
  role: string
  areaId?: number
  regionId?: number
  salesTypeId?: number
  annualTarget?: number
  salesCounselorTarget?: number
  policySoldTarget?: number
  agencyCoopTarget?: number
}

interface Area {
  areaId: number
  name: string
}

interface Region {
  regionId: number
  name: string
  areaId: number
}

interface SalesType {
  salesTypeId: number
  name: string
}

interface SalesPerformanceChartProps {
  selectedSalesOfficer: string
  startDate: string
  endDate: string
  salesType: string
  area: string
  region: string
}

const METRIC_OPTIONS = [
  { value: 'premiumActual', label: 'Premium' },
  { value: 'salesCounselorActual', label: 'Sales Counselor' },
  { value: 'policySoldActual', label: 'Policy Sold' },
  { value: 'agencyCoopActual', label: 'Agency Coop' }
]

const TREND_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' }
]

function SalesPerformanceChart({
  selectedSalesOfficer,
  startDate,
  endDate,
  salesType,
  area,
  region
}: SalesPerformanceChartProps) {
  console.log('[SalesPerformanceChart] Component rendered with props:', {
    selectedSalesOfficer,
    startDate,
    endDate,
    salesType,
    area,
    region
  })
  
  const [reports, setReports] = useState<SalesReport[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [salesTypes, setSalesTypes] = useState<SalesType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState('premiumActual')
  const [selectedTrend, setSelectedTrend] = useState('monthly')
  const { lastUpdate } = useRealTime()

  // Fetch all required data
  const fetchData = useCallback(async () => {
    console.log('[SalesPerformanceChart] fetchData called')
    try {
      setLoading(true)
      
      // Check cache first (2 minute cache for chart data) - DISABLED FOR DEBUGGING
      const cacheKey = 'sales-performance-chart-data'
      // const cached = localStorage.getItem(cacheKey)
      // const cacheTime = localStorage.getItem(cacheKey + '-time')
      // const now = Date.now()
      
      // Clear cache for debugging
      localStorage.removeItem(cacheKey)
      localStorage.removeItem(cacheKey + '-time')
      
      // if (cached && cacheTime && (now - parseInt(cacheTime)) < 120000) { // 2 minutes
      //   console.log("[SalesPerformanceChart] Using cached chart data")
      //   try {
      //     const data = JSON.parse(cached)
      //     setReports(data.reports || [])
      //     setUsers(data.users || [])
      //     setAreas(data.areas || [])
      //     setRegions(data.regions || [])
      //     setSalesTypes(data.salesTypes || [])
      //     setLoading(false)
      //     return
      //   } catch (error) {
      //     console.error("[SalesPerformanceChart] Error parsing cached chart data:", error)
      //     // Clear corrupted cache
      //     localStorage.removeItem(cacheKey)
      //     localStorage.removeItem(cacheKey + '-time')
      //   }
      // }
      
      // Helper function to safely fetch with proper error handling
      const safeFetch = async (url: string, retries = 3): Promise<any> => {
        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            let response;
            try {
              response = await fetch(url, {
                headers: { 
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });
            } catch (e) {
              throw new Error('Network error: ' + (e as Error).message);
            }
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json()
          } catch (error) {
            console.error(`Fetch error for ${url} (attempt ${attempt + 1}):`, error)
            if (attempt === retries - 1) {
              return { data: [] }
            }
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
          }
        }
        return { data: [] }
      }

      // Use sequential requests with proper error handling
      const reportsRes = await safeFetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`)
      await new Promise(r => setTimeout(r, 200)) // small delay between requests
      
      const usersRes = await safeFetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
      await new Promise(r => setTimeout(r, 200)) // small delay between requests
      
      const areasRes = await safeFetch(`${process.env.NEXT_PUBLIC_API_URL}/areas`)
      await new Promise(r => setTimeout(r, 200)) // small delay between requests
      
      const regionsRes = await safeFetch(`${process.env.NEXT_PUBLIC_API_URL}/regions`)
      await new Promise(r => setTimeout(r, 200)) // small delay between requests
      
      const salesTypesRes = await safeFetch(`${process.env.NEXT_PUBLIC_API_URL}/sales-types`)
      
      // Extract data from Laravel API response format
      const reportsData = reportsRes?.data || reportsRes || [];
      const usersData = usersRes?.data || usersRes || [];
      const areasData = areasRes?.data || areasRes || [];
      const regionsData = regionsRes?.data || regionsRes || [];
      const salesTypesData = salesTypesRes?.data || salesTypesRes || [];
      
      console.log('[SalesPerformanceChart] Loaded data:', {
        reports: reportsData.length,
        users: usersData.length,
        areas: areasData.length,
        regions: regionsData.length,
        salesTypes: salesTypesData.length
      })
        
        setReports(reportsData)
        setUsers(usersData)
        setAreas(areasData)
        setRegions(regionsData)
        setSalesTypes(salesTypesData)
      
      // Cache the data for 2 minutes
      const now = Date.now()
      const cacheData = {
        reports: reportsData,
        users: usersData,
        areas: areasData,
        regions: regionsData,
        salesTypes: salesTypesData
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      localStorage.setItem(cacheKey + '-time', now.toString())
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedSalesOfficer, startDate, endDate, salesType, area, region])

  useEffect(() => {
    console.log('[SalesPerformanceChart] useEffect called - mounting component')
    fetchData()
  }, [])

  // Real-time updates
  useEffect(() => {
    if (lastUpdate > 0 && reports.length > 0) {
      console.log("[SalesPerformanceChart] Real-time update detected, refreshing data")
      fetchData()
    }
  }, [lastUpdate, fetchData])

  const selectedMetricConfig = METRIC_OPTIONS.find((option) => option.value === selectedMetric)

  // Filter reports based on selected filters
  const filteredReports = useMemo(() => {
    console.log('[SalesPerformanceChart] Total reports:', reports.length)
    console.log('[SalesPerformanceChart] Filter values:', {
      selectedSalesOfficer,
      startDate,
      endDate,
      salesType,
      area,
      region
    })
    if (!reports.length) return []

    const filtered = reports.filter((report) => {
      // Use reportDate for filtering (the actual sales date)
      const reportDate = new Date(report.reportDate)
      const currentYear = new Date().getFullYear()
      const reportYear = reportDate.getFullYear()
      
      console.log('[SalesPerformanceChart] Checking report:', {
        reportDate: report.reportDate,
        parsedDate: reportDate,
        reportYear,
        currentYear,
        isValid: !isNaN(reportDate.getTime())
      })
      
      // Only show current year data
      if (reportYear !== currentYear) {
        console.log('[SalesPerformanceChart] Filtered out due to year mismatch')
        return false
      }

      // Apply date range filters
      if (startDate && startDate !== "") {
        const filterStartDate = new Date(startDate)
        filterStartDate.setHours(0, 0, 0, 0)
        if (reportDate < filterStartDate) {
          console.log('[SalesPerformanceChart] Filtered out due to start date:', {
            reportDate: report.reportDate,
            filterStartDate: startDate,
            reportDateObj: reportDate,
            filterStartDateObj: filterStartDate
          })
          return false
        }
      }

      if (endDate && endDate !== "") {
        const filterEndDate = new Date(endDate)
        filterEndDate.setHours(23, 59, 59, 999) // Make end date inclusive
        if (reportDate > filterEndDate) {
          console.log('[SalesPerformanceChart] Filtered out due to end date:', {
            reportDate: report.reportDate,
            filterEndDate: endDate,
            reportDateObj: reportDate,
            filterEndDateObj: filterEndDate
          })
          return false
        }
      }

      // Apply other filters - treat empty strings as 'all'
      if (selectedSalesOfficer && selectedSalesOfficer !== 'all' && report.salesRepId !== parseInt(selectedSalesOfficer)) {
        console.log('[SalesPerformanceChart] Filtered out due to sales officer mismatch:', {
          selectedSalesOfficer,
          reportSalesRepId: report.salesRepId
        })
        return false
      }

      if (salesType && salesType !== 'all' && report.salesTypeId !== parseInt(salesType)) {
        console.log('[SalesPerformanceChart] Filtered out due to sales type mismatch:', {
          salesType,
          reportSalesTypeId: report.salesTypeId
        })
        return false
      }

      // Note: Sales reports don't have direct areaId/regionId, 
      // they are linked through salesRepId -> User -> areaId/regionId
      // For now, we'll skip these filters in the chart
      // TODO: Implement proper filtering through user relationships

      console.log('[SalesPerformanceChart] Report passed all filters:', report.reportId)
      return true
    })

    console.log('[SalesPerformanceChart] Filtered reports:', filtered.length)
    return filtered
  }, [reports, selectedSalesOfficer, startDate, endDate, salesType, area, region])

  // Group reports by month/week and calculate totals
  const chartData = useMemo(() => {
    console.log('[SalesPerformanceChart] Generating chart data from', filteredReports.length, 'reports')
    if (!filteredReports.length) return []

    if (selectedTrend === 'monthly') {
      const monthlyData: { [key: string]: any } = {}
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
      const monthAbbrevs = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ]

      // Initialize all months with zero values
      monthNames.forEach((month, index) => {
        monthlyData[month] = {
          period: monthAbbrevs[index],
          fullPeriod: month,
          premiumActual: 0,
          salesCounselorActual: 0,
          policySoldActual: 0,
          agencyCoopActual: 0
        }
      })

      // Aggregate data by month
      filteredReports.forEach((report) => {
        const reportDate = new Date(report.reportDate)
        const monthName = monthNames[reportDate.getMonth()]
        
        if (monthlyData[monthName]) {
          monthlyData[monthName].premiumActual += report.premiumActual || 0
          monthlyData[monthName].salesCounselorActual += report.salesCounselorActual || 0
          monthlyData[monthName].policySoldActual += report.policySoldActual || 0
          monthlyData[monthName].agencyCoopActual += report.agencyCoopActual || 0
        }
      })

      const result = monthNames.map(month => monthlyData[month])
      console.log('[SalesPerformanceChart] Generated monthly chart data:', result)
      return result
    } else {
      // Weekly view
      const weeklyData: { [key: string]: any } = {}
      
      // Get current year and generate weeks
      const currentYear = new Date().getFullYear()
      const weeks = []
      
      // Generate 52 weeks for the year
        for (let week = 1; week <= 52; week++) {
        const weekStart = new Date(currentYear, 0, 1 + (week - 1) * 7)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        
        const weekLabel = `Week ${week}`
        weeks.push(weekLabel)
        
        weeklyData[weekLabel] = {
          period: weekLabel,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          premiumActual: 0,
          salesCounselorActual: 0,
          policySoldActual: 0,
          agencyCoopActual: 0
        }
      }

      // Aggregate data by week
      filteredReports.forEach((report) => {
        const reportDate = new Date(report.reportDate)
        const year = reportDate.getFullYear()
        
        if (year === currentYear) {
          const startOfYear = new Date(year, 0, 1)
          const diffTime = reportDate.getTime() - startOfYear.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          const weekNumber = Math.ceil(diffDays / 7)
          
          if (weekNumber >= 1 && weekNumber <= 52) {
            const weekLabel = `Week ${weekNumber}`
            
            if (weeklyData[weekLabel]) {
              weeklyData[weekLabel].premiumActual += report.premiumActual || 0
              weeklyData[weekLabel].salesCounselorActual += report.salesCounselorActual || 0
              weeklyData[weekLabel].policySoldActual += report.policySoldActual || 0
              weeklyData[weekLabel].agencyCoopActual += report.agencyCoopActual || 0
              // Preserve the date range information
              if (!weeklyData[weekLabel].weekStart) {
                const weekStart = new Date(currentYear, 0, 1 + (weekNumber - 1) * 7)
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekEnd.getDate() + 6)
                weeklyData[weekLabel].weekStart = weekStart.toISOString()
                weeklyData[weekLabel].weekEnd = weekEnd.toISOString()
              }
            }
          }
        }
      })

      const result = weeks.map(week => weeklyData[week])
      console.log('[SalesPerformanceChart] Generated weekly chart data:', result)
      return result
    }
  }, [filteredReports, selectedTrend])

  const getMetricLabel = () => {
    return selectedMetricConfig?.label || 'Premium'
  }

  const getMetricValue = (data: any) => {
    return data[selectedMetric] || 0
  }

  const formatValue = (value: number) => {
    if (selectedMetric === 'premiumActual') {
      return `₱${value.toLocaleString()}`
    }
    return value.toLocaleString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Performance Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading chart data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4">
          {/* Header with title and description */}
          <div className="flex items-center justify-between">
        <div>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="w-1 h-8 rounded-full mr-3" style={{ background: 'linear-gradient(to bottom, #013f99, #4cb1e9)' }}></div>
                Sales Performance Chart
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Track your sales performance over time with detailed analytics
              </p>
            </div>
        </div>
          
          {/* Controls Section */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Trend Filter */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="trend-select" className="text-sm font-semibold text-gray-700 flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#013f99' }}></div>
                  View Period
                </label>
                <Select value={selectedTrend} onValueChange={setSelectedTrend}>
                  <SelectTrigger className="w-full sm:w-32 bg-gray-50 border-gray-300 focus:ring-2 focus:border-[#013f99]" style={{ '--tw-ring-color': '#013f99' } as any}>
                    <SelectValue />
            </SelectTrigger>
            <SelectContent>
                    {TREND_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="hover:bg-blue-50">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
              </div>
              
              {/* Metric Filter */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="metric-select" className="text-sm font-semibold text-gray-700 flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#4cb1e9' }}></div>
                  Performance Metric
                </label>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-full sm:w-40 bg-gray-50 border-gray-300 focus:ring-2 focus:border-[#4cb1e9]" style={{ '--tw-ring-color': '#4cb1e9' } as any}>
                    <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRIC_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="hover:bg-blue-50">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
              </div>
            </div>
            
            {/* Chart Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#013f99' }}></div>
                <span>{selectedTrend === 'monthly' ? 'Monthly' : 'Weekly'} View</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4cb1e9' }}></div>
                <span>{selectedMetricConfig?.label || 'Premium'}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">No data available for the selected filters. Try adjusting your filter criteria.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#013f99" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4cb1e9" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="period" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(value) => {
                      if (selectedMetric === 'premiumActual') {
                        return `₱${(value / 1000).toFixed(0)}k`
                      }
                      return value.toLocaleString()
                    }}
              />
              <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value: number, name, props) => {
                      const payload = props.payload;
                      let dateRange = '';
                      
                      if (selectedTrend === 'weekly' && payload?.weekStart && payload?.weekEnd) {
                        const startDate = new Date(payload.weekStart);
                        const endDate = new Date(payload.weekEnd);
                        dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                      }
                      
                      return [
                        <div key="tooltip-content">
                          <div className="font-semibold text-gray-900">{formatValue(value)}</div>
                          <div className="text-sm text-gray-600">{getMetricLabel()}</div>
                          {dateRange && (
                            <div className="text-xs mt-1 border-t pt-1" style={{ color: '#4cb1e9' }}>
                              📅 {dateRange}
                          </div>
                          )}
                        </div>
                      ];
                    }}
                    labelFormatter={(label) => `${selectedTrend === 'monthly' ? 'Month' : 'Week'}: ${label}`}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
              />
              <Line
                type="monotone"
                    dataKey={selectedMetric} 
                    stroke="#013f99" 
                    strokeWidth={3}
                    dot={{ fill: '#013f99', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, stroke: '#013f99', strokeWidth: 3, fill: 'white' }}
                    name={getMetricLabel()}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
            
            {/* Chart Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg p-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#013f99' }}>Total {getMetricLabel()}</p>
                    <p className="text-2xl font-bold" style={{ color: '#013f99' }}>
                      {formatValue(chartData.reduce((sum, item) => sum + (item[selectedMetric] || 0), 0))}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e6f2ff' }}>
                    <svg className="w-5 h-5" style={{ color: '#013f99' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg p-4" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#4cb1e9' }}>Peak {getMetricLabel()}</p>
                    <p className="text-2xl font-bold" style={{ color: '#4cb1e9' }}>
                      {formatValue(Math.max(...chartData.map(item => item[selectedMetric] || 0)))}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e0f2fe' }}>
                    <svg className="w-5 h-5" style={{ color: '#4cb1e9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { SalesPerformanceChart }
export default SalesPerformanceChart