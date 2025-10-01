"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Filter, RotateCcw, Calendar, RefreshCw } from "lucide-react"

interface FilterProps {
  onFiltersChange: (filters: any) => void
  onRefreshDropdowns?: (refreshFn: () => void) => void
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

interface User {
  userId: number
  name: string
  regionId: number
  areaId: number
  role: string
  salesTypeId: number
}

export function DashboardFilters({ onFiltersChange, onRefreshDropdowns }: FilterProps) {
  const [areas, setAreas] = useState<Area[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [salesTypes, setSalesTypes] = useState<SalesType[]>([])
  const [salesOfficers, setSalesOfficers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Set default date range to August to December of current year
  const getDefaultDateRange = () => {
    const currentYear = new Date().getFullYear()
    return {
      startDate: `${currentYear}-08-01`, // August 1st
      endDate: `${currentYear}-12-31`    // December 31st
    }
  }

  const [filters, setFilters] = useState({
    salesType: "all",
    area: "all",
    region: "all",
    salesOfficer: "all",
    ...getDefaultDateRange()
  })

  const [filteredRegions, setFilteredRegions] = useState<Region[]>([])
  const [filteredSalesOfficers, setFilteredSalesOfficers] = useState<User[]>([])
  const isRefreshingRef = useRef(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchDropdownData()
  }, [])

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Create a stable refresh function
  const refreshDropdowns = useCallback(() => {
    if (isRefreshingRef.current) {
      console.log("[v0] ⏸️ Already refreshing, skipping...")
      return
    }
    isRefreshingRef.current = true
    console.log("[v0] 🔄 Refreshing dropdown data...")
    fetchDropdownData(true).finally(() => {
      isRefreshingRef.current = false
    })
  }, [])

  // Expose refresh function to parent component
  useEffect(() => {
    if (onRefreshDropdowns) {
      onRefreshDropdowns(refreshDropdowns)
    }
  }, [onRefreshDropdowns, refreshDropdowns])

  // Debug: Log areas state changes
  useEffect(() => {
    console.log("[v0] Areas state changed:", areas)
    console.log("[v0] Areas length:", areas.length)
  }, [areas])

  // Filter regions based on selected area
  useEffect(() => {
    if (filters.area && filters.area !== "all") {
      const filtered = regions.filter((region) => Number(region.areaId) === Number(filters.area))
      setFilteredRegions(filtered)
      
      // Clear region and sales officer if current selection is not valid
      if (filters.region && filters.region !== "all") {
        const regionExists = filtered.find((r) => (r.regionId == null ? '' : String(r.regionId)) === filters.region)
        if (!regionExists) {
          setFilters((prev) => ({ ...prev, region: "all", salesOfficer: "all" }))
        }
      }
    } else {
      setFilteredRegions([])
      // Clear region and sales officer when area is "all"
      setFilters((prev) => ({ ...prev, region: "all", salesOfficer: "all" }))
    }
  }, [filters.area, regions])

  // Filter sales officers based on all criteria
  useEffect(() => {
    console.log("[v0] 🔍 Filtering sales officers...")
    console.log("[v0] All sales officers:", salesOfficers)
    console.log("[v0] Current filters:", filters)
    
    let filtered = salesOfficers.filter((officer) => officer.role === "RegionalUser")
    console.log("[v0] After RegionalUser filter:", filtered)

    // Filter by sales type
    if (filters.salesType && filters.salesType !== "all") {
      filtered = filtered.filter((officer) => Number(officer.salesTypeId) === Number(filters.salesType))
      console.log("[v0] After sales type filter:", filtered)
    }

    // Filter by area
    if (filters.area && filters.area !== "all") {
      filtered = filtered.filter((officer) => Number(officer.areaId) === Number(filters.area))
      console.log("[v0] After area filter:", filtered)
    }

    // Filter by region
    if (filters.region && filters.region !== "all") {
      filtered = filtered.filter((officer) => Number(officer.regionId) === Number(filters.region))
      console.log("[v0] After region filter:", filtered)
    }

    console.log("[v0] Final filtered sales officers:", filtered)
    setFilteredSalesOfficers(filtered)

    // Clear sales officer selection if current selection is not in filtered list
    if (filters.salesOfficer && filters.salesOfficer !== "all") {
      const officerExists = filtered.find((o) => (o.userId == null ? '' : String(o.userId)) === filters.salesOfficer)
      if (!officerExists) {
        setFilters((prev) => ({ ...prev, salesOfficer: "all" }))
      }
    }
  }, [filters.salesType, filters.area, filters.region, salesOfficers])

  // Clear dependent filters when sales type changes
  useEffect(() => {
    if (filters.salesType !== "all") {
      setFilters((prev) => ({ ...prev, area: "all", region: "all", salesOfficer: "all" }))
    }
  }, [filters.salesType])

  const fetchDropdownData = async (forceRefresh = false) => {
    try {
      console.debug("[v0] Fetching dropdown data...", forceRefresh ? "(forced refresh)" : "")
      
      // Skip cache if force refresh is requested
      if (!forceRefresh) {
        // Check cache first (1 minute cache - reduced from 5 minutes)
        const cacheKey = 'dashboard-dropdown-data'
        const cached = localStorage.getItem(cacheKey)
        const cacheTime = localStorage.getItem(cacheKey + '-time')
        const now = Date.now()
        
        if (cached && cacheTime && (now - parseInt(cacheTime)) < 60000) { // 1 minute
          console.log("[v0] Using cached dropdown data")
          try {
            const data = JSON.parse(cached)
            setAreas(data.areas || [])
            setRegions(data.regions || [])
            setSalesTypes(data.salesTypes || [])
            setSalesOfficers(data.salesOfficers || [])
            setIsLoading(false)
            return
          } catch (error) {
            console.error("[v0] Error parsing cached dropdown data:", error)
            // Clear corrupted cache
            localStorage.removeItem('dropdown-data')
            localStorage.removeItem('dropdown-data-time')
          }
        }
      }
      
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
              throw new Error('Network error: ' + e.message);
            }
            
            if (response.status === 429) {
              // Rate limited - exponential backoff
              const waitTime = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
              console.warn(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`)
              await new Promise(r => setTimeout(r, waitTime))
              continue
            }
            
            if (!response.ok) {
              const text = await response.text()
              console.error(`HTTP ${response.status} for ${url}: ${text.slice(0, 200)}`)
              return { data: [] }
            }
            
            const contentType = response.headers.get('content-type') || ''
            if (!contentType.includes('application/json')) {
              const text = await response.text()
              console.error(`Non-JSON response from ${url}: ${text.slice(0, 200)}`)
              return { data: [] }
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

      // Use parallel requests for faster loading
      console.log("[v0] Starting parallel API requests...")
      const [areasRes, regionsRes, salesTypesRes, usersRes] = await Promise.allSettled([
        safeFetch("http://127.0.0.1:8000/api/areas"),
        safeFetch("http://127.0.0.1:8000/api/regions"),
        safeFetch("http://127.0.0.1:8000/api/sales-types"),
        safeFetch("http://127.0.0.1:8000/api/users")
      ])
      
      // Extract results from Promise.allSettled
      const areasData = areasRes.status === 'fulfilled' ? (areasRes.value?.data || areasRes.value || []) : []
      const regionsData = regionsRes.status === 'fulfilled' ? (regionsRes.value?.data || regionsRes.value || []) : []
      const salesTypesData = salesTypesRes.status === 'fulfilled' ? (salesTypesRes.value?.data || salesTypesRes.value || []) : []
      const usersData = usersRes.status === 'fulfilled' ? (usersRes.value?.data || usersRes.value || []) : []


      console.debug(
        "[v0] loaded counts: users=",
        usersData.length,
        ", areas=",
        areasData.length,
        ", regions=",
        regionsData.length,
        ", salesTypes=",
        salesTypesData.length,
      )
      
      // Debug: Log the users data
      console.log("[v0] Users data:", usersData)
      console.log("[v0] Users with RegionalUser role:", usersData.filter(u => u.role === "RegionalUser"))
      
      // Debug: Log the actual areas data
      console.log("[v0] Areas data:", areasData)
      console.log("[v0] Areas data type:", typeof areasData, "isArray:", Array.isArray(areasData))

      setAreas(areasData)
      setRegions(regionsData)
      setSalesTypes(salesTypesData)
      setSalesOfficers(usersData)
      
      // Cache the data for 1 minute
      const cacheData = {
        areas: areasData,
        regions: regionsData,
        salesTypes: salesTypesData,
        salesOfficers: usersData
      }
      const cacheKey = 'dashboard-dropdown-data'
      const now = Date.now()
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      localStorage.setItem(cacheKey + '-time', now.toString())
      setIsLoading(false)
    } catch (error) {
      console.error("[v0] Error fetching dropdown data:", error)
      
      // Fallback to mock data if API fails
      console.log("[v0] Using fallback mock data")
      setAreas([
        { areaId: 1, areaName: "Luzon" },
        { areaId: 2, areaName: "Visayas" },
        { areaId: 3, areaName: "Mindanao" }
      ])
      setRegions([])
      setSalesTypes([])
      setSalesOfficers([])
      setIsLoading(false)
    }
  }

  // Debounced filter update for real-time switching
  const debouncedFilterUpdate = useCallback((newFilters: any) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Set new timeout for debounced update
    debounceTimeoutRef.current = setTimeout(() => {
      console.debug("[v0] 🚀 Debounced filter update triggered:", newFilters)
      onFiltersChange(newFilters)
    }, 300) // 300ms debounce delay
  }, [onFiltersChange])

  const handleFilterChange = useCallback((key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Trigger debounced filter update for real-time switching
    debouncedFilterUpdate(newFilters)
  }, [filters, debouncedFilterUpdate])

  const handleReset = useCallback(() => {
    const resetFilters = {
      salesType: "all",
      area: "all",
      region: "all",
      salesOfficer: "all",
      startDate: "",
      endDate: ""
    }
    setFilters(resetFilters)
    
    // Clear any pending debounced updates and apply immediately
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    onFiltersChange(resetFilters)
  }, [onFiltersChange])

  const handleClearDateRange = useCallback(() => {
    const newFilters = {
      ...filters,
      startDate: "",
      endDate: ""
    }
    setFilters(newFilters)
    
    // Clear any pending debounced updates and apply immediately
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    onFiltersChange(newFilters)
  }, [filters, onFiltersChange])

  const handleResetToDefaultDateRange = useCallback(() => {
    const defaultRange = getDefaultDateRange()
    const newFilters = {
      ...filters,
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate
    }
    setFilters(newFilters)
    
    // Clear any pending debounced updates and apply immediately
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    onFiltersChange(newFilters)
  }, [filters, onFiltersChange])

  const handleApplyFilter = useCallback(() => {
    console.debug("[v0] applyFilters called with filters:", filters)
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  // Validate date range
  const isDateRangeValid = useMemo(() => {
    if (filters.startDate && filters.endDate) {
      return new Date(filters.startDate) <= new Date(filters.endDate)
    }
    return true
  }, [filters.startDate, filters.endDate])

  return (
    <div className="sticky top-1 sm:top-2 z-20 bg-gradient-to-br from-white via-primary-50/20 to-secondary-50/10 rounded-lg sm:rounded-xl border border-white/50 shadow-sm p-2.5 sm:p-4 lg:p-6 mb-2 sm:mb-3 lg:mb-6 backdrop-blur-sm">
      {/* Mobile Compact View */}
      <div className="block sm:hidden space-y-2.5">
        {/* Row 1: Sales Type & Area */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide leading-tight">Sales Type</label>
            <Select value={filters.salesType} onValueChange={(value) => handleFilterChange("salesType", value)}>
              <SelectTrigger className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {salesTypes.map((type, idx) => {
                  const raw = type.salesTypeId
                  const value = raw == null || String(raw) === '' ? `__unknown__-salesType-${idx}` : String(raw)
                  const label = type.salesTypeName ?? `Unknown (${idx})`
                  const itemKey = type.salesTypeId ?? `${value}-${idx}`
                  return (
                    <SelectItem key={itemKey} value={value} aria-label={label}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide leading-tight">Area</label>
            <Select value={filters.area} onValueChange={(value) => handleFilterChange("area", value)} disabled={isLoading}>
              <SelectTrigger className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200">
                <SelectValue placeholder={isLoading ? "Loading..." : "All"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading areas...</SelectItem>
                ) : (
                  areas.map((area, idx) => {
                  const raw = area.areaId
                  const value = raw == null || String(raw) === '' ? `__unknown__-area-${idx}` : String(raw)
                  const label = area.areaName ?? `Unknown (${idx})`
                  const itemKey = area.areaId ?? `${value}-${idx}`
                  return (
                    <SelectItem key={itemKey} value={value} aria-label={label}>
                      {label}
                    </SelectItem>
                  )
                })
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Region & Sales Officer */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide leading-tight">Region</label>
            <Select
              value={filters.region}
              onValueChange={(value) => handleFilterChange("region", value)}
              disabled={!filters.area || filters.area === "all"}
            >
              <SelectTrigger className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-400">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filteredRegions.map((region, idx) => {
                  const raw = region.regionId
                  const value = raw == null || String(raw) === '' ? `__unknown__-region-${idx}` : String(raw)
                  const label = region.regionName ?? `Unknown (${idx})`
                  const itemKey = region.regionId ?? `${value}-${idx}`
                  return (
                    <SelectItem key={itemKey} value={value} aria-label={label}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide leading-tight">Sales Officer</label>
            <Select
              value={filters.salesOfficer}
              onValueChange={(value) => handleFilterChange("salesOfficer", value)}
              disabled={filteredSalesOfficers.length === 0}
            >
              <SelectTrigger className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-400">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filteredSalesOfficers.map((officer, idx) => {
                  const raw = officer.userId
                  const value = raw == null || String(raw) === '' ? `__unknown__-officer-${idx}` : String(raw)
                  const label = officer.name ?? `Unknown (${idx})`
                  const itemKey = officer.userId ?? `${value}-${idx}`
                  return (
                    <SelectItem key={itemKey} value={value} aria-label={label}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide leading-tight">Start Date</label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className={`h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${!isDateRangeValid ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide leading-tight">End Date</label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className={`h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${!isDateRangeValid ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
            />
          </div>
        </div>

        {/* Row 4: Action Buttons - Full Width on Mobile */}
        <div className="flex flex-col gap-1.5 pt-1">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs border-gray-300 hover:bg-gray-50 w-full"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
          <Button
            onClick={handleClearDateRange}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs border-gray-300 hover:bg-gray-50 w-full"
            title="Clear date range filter"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Clear Dates
          </Button>
          <Button
            onClick={handleApplyFilter}
            disabled={!isDateRangeValid}
            size="sm"
            className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full"
          >
            <Filter className="w-3 h-3 mr-1" />
            Apply
          </Button>
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Sales Type</label>
            <Select value={filters.salesType} onValueChange={(value) => handleFilterChange("salesType", value)}>
              <SelectTrigger className="rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="Select sales type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {salesTypes.map((type, idx) => {
                  const raw = type.salesTypeId
                  const value = raw == null || String(raw) === '' ? `__unknown__-salesType-${idx}` : String(raw)
                  const label = type.salesTypeName ?? `Unknown (${idx})`
                  const itemKey = type.salesTypeId ?? `${value}-${idx}`
                  return (
                    <SelectItem key={itemKey} value={value} aria-label={label}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Area</label>
            <Select value={filters.area} onValueChange={(value) => handleFilterChange("area", value)}>
              <SelectTrigger className="rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {areas.map((area, idx) => {
                  const raw = area.areaId
                  const value = raw == null || String(raw) === '' ? `__unknown__-area-${idx}` : String(raw)
                  const label = area.areaName ?? `Unknown (${idx})`
                  const itemKey = area.areaId ?? `${value}-${idx}`
                  return (
                    <SelectItem key={itemKey} value={value} aria-label={label}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Region</label>
            <Select
              value={filters.region}
              onValueChange={(value) => handleFilterChange("region", value)}
              disabled={!filters.area || filters.area === "all"}
            >
              <SelectTrigger className="rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-400">
                <SelectValue
                  placeholder={filters.area && filters.area !== "all" ? "Select region" : "Select area first"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filteredRegions.map((region, idx) => {
                  const raw = region.regionId
                  const value = raw == null || String(raw) === '' ? `__unknown__-region-${idx}` : String(raw)
                  const label = region.regionName ?? `Unknown (${idx})`
                  const itemKey = region.regionId ?? `${value}-${idx}`
                  return (
                    <SelectItem key={itemKey} value={value} aria-label={label}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Sales Officer</label>
            <Select
              value={filters.salesOfficer}
              onValueChange={(value) => handleFilterChange("salesOfficer", value)}
              disabled={filteredSalesOfficers.length === 0}
            >
              <SelectTrigger className="rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-400">
                <SelectValue
                  placeholder={filteredSalesOfficers.length === 0 ? "No sales officers available" : "Select sales officer"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filteredSalesOfficers.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No sales officers available
                  </SelectItem>
                ) : (
                  filteredSalesOfficers.map((officer, idx) => {
                    const raw = officer.userId
                    const value = raw == null || String(raw) === '' ? `__unknown__-officer-${idx}` : String(raw)
                    const label = officer.name ?? `Unknown (${idx})`
                    const itemKey = officer.userId ?? `${value}-${idx}`
                    return (
                      <SelectItem key={itemKey} value={value} aria-label={label}>
                        {label}
                      </SelectItem>
                    )
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Start Date</label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className={`rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                !isDateRangeValid ? 'border-red-500' : ''
              }`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">End Date</label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className={`rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                !isDateRangeValid ? 'border-red-500' : ''
              }`}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:col-span-2 lg:col-span-1">
            <Button
              onClick={handleReset}
              variant="outline"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 border-gray-300 transition-colors text-sm flex-1 sm:flex-none"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleClearDateRange}
              variant="outline"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 border-gray-300 transition-colors text-sm flex-1 sm:flex-none"
              title="Clear date range filter"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Clear Dates
            </Button>
            <Button
              onClick={refreshDropdowns}
              variant="outline"
              className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 border-blue-300 transition-colors text-sm flex-1 sm:flex-none"
              title="Refresh dropdown data"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleApplyFilter}
              disabled={!isDateRangeValid}
              className="text-white px-4 py-2 rounded-lg shadow transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm flex-1 sm:flex-none"
              style={{ backgroundColor: '#013f99' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#012d73';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#013f99';
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filter
            </Button>
          </div>
        </div>
      </div>
      
      {!isDateRangeValid && (
        <div className="text-error-500 text-sm mt-2">
          Start date must be before or equal to end date
        </div>
      )}
    </div>
  )
}
