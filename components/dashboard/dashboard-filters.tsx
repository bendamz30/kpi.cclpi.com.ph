"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Filter, RotateCcw } from "lucide-react"

interface FilterProps {
  onFiltersChange: (filters: any) => void
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

export function DashboardFilters({ onFiltersChange }: FilterProps) {
  const [areas, setAreas] = useState<Area[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [salesTypes, setSalesTypes] = useState<SalesType[]>([])
  const [salesOfficers, setSalesOfficers] = useState<User[]>([])

  const [filters, setFilters] = useState({
    salesType: "all",
    area: "all",
    region: "all",
    salesOfficer: "all",
    startDate: "",
    endDate: ""
  })

  const [filteredRegions, setFilteredRegions] = useState<Region[]>([])
  const [filteredSalesOfficers, setFilteredSalesOfficers] = useState<User[]>([])

  useEffect(() => {
    fetchDropdownData()
  }, [])

  // Filter regions based on selected area
  useEffect(() => {
    if (filters.area && filters.area !== "all") {
      const filtered = regions.filter((region) => Number(region.areaId) === Number(filters.area))
      setFilteredRegions(filtered)
      
      // Clear region and sales officer if current selection is not valid
      if (filters.region && filters.region !== "all") {
        const regionExists = filtered.find((r) => r.regionId.toString() === filters.region)
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
    let filtered = salesOfficers.filter((officer) => officer.role === "RegionalUser")

    // Filter by sales type
    if (filters.salesType && filters.salesType !== "all") {
      filtered = filtered.filter((officer) => Number(officer.salesTypeId) === Number(filters.salesType))
    }

    // Filter by area
    if (filters.area && filters.area !== "all") {
      filtered = filtered.filter((officer) => Number(officer.areaId) === Number(filters.area))
    }

    // Filter by region
    if (filters.region && filters.region !== "all") {
      filtered = filtered.filter((officer) => Number(officer.regionId) === Number(filters.region))
    }

    setFilteredSalesOfficers(filtered)

    // Clear sales officer selection if current selection is not in filtered list
    if (filters.salesOfficer && filters.salesOfficer !== "all") {
      const officerExists = filtered.find((o) => o.userId.toString() === filters.salesOfficer)
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

  const fetchDropdownData = async () => {
    try {
      console.debug("[v0] Fetching dropdown data...")
      const [areasRes, regionsRes, salesTypesRes, usersRes] = await Promise.all([
        fetch("/api/areas"),
        fetch("/api/regions"),
        fetch("/api/sales-types"),
        fetch("/api/users"),
      ])

      const [areasData, regionsData, salesTypesData, usersData] = await Promise.all([
        areasRes.json(),
        regionsRes.json(),
        salesTypesRes.json(),
        usersRes.json(),
      ])

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

      setAreas(areasData)
      setRegions(regionsData)
      setSalesTypes(salesTypesData)
      setSalesOfficers(usersData)
    } catch (error) {
      console.error("[v0] Error fetching dropdown data:", error)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    const resetFilters = {
      salesType: "all",
      area: "all",
      region: "all",
      salesOfficer: "all",
      startDate: "",
      endDate: ""
    }
    setFilters(resetFilters)
  }

  const handleApplyFilter = () => {
    console.debug("[v0] applyFilters called with filters:", filters)
    onFiltersChange(filters)
  }

  // Validate date range
  const isDateRangeValid = () => {
    if (filters.startDate && filters.endDate) {
      return new Date(filters.startDate) <= new Date(filters.endDate)
    }
    return true
  }

  return (
    <div className="sticky top-1 sm:top-2 z-20 bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm p-2.5 sm:p-4 lg:p-6 mb-2 sm:mb-3 lg:mb-6">
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
                {salesTypes.map((type) => (
                  <SelectItem key={type.salesTypeId} value={type.salesTypeId.toString()}>
                    {type.salesTypeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide leading-tight">Area</label>
            <Select value={filters.area} onValueChange={(value) => handleFilterChange("area", value)}>
              <SelectTrigger className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.areaId} value={area.areaId.toString()}>
                    {area.areaName}
                  </SelectItem>
                ))}
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
                {filteredRegions.map((region) => (
                  <SelectItem key={region.regionId} value={region.regionId.toString()}>
                    {region.regionName}
                  </SelectItem>
                ))}
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
                {filteredSalesOfficers.map((officer) => (
                  <SelectItem key={officer.userId} value={officer.userId.toString()}>
                    {officer.name}
                  </SelectItem>
                ))}
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
              className={`h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${!isDateRangeValid() ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide leading-tight">End Date</label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className={`h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${!isDateRangeValid() ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
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
            onClick={handleApplyFilter}
            disabled={!isDateRangeValid()}
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
                {salesTypes.map((type) => (
                  <SelectItem key={type.salesTypeId} value={type.salesTypeId.toString()}>
                    {type.salesTypeName}
                  </SelectItem>
                ))}
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
                {areas.map((area) => (
                  <SelectItem key={area.areaId} value={area.areaId.toString()}>
                    {area.areaName}
                  </SelectItem>
                ))}
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
                {filteredRegions.map((region) => (
                  <SelectItem key={region.regionId} value={region.regionId.toString()}>
                    {region.regionName}
                  </SelectItem>
                ))}
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
                  filteredSalesOfficers.map((officer) => (
                    <SelectItem key={officer.userId} value={officer.userId.toString()}>
                      {officer.name}
                    </SelectItem>
                  ))
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
                !isDateRangeValid() ? 'border-red-500' : ''
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
                !isDateRangeValid() ? 'border-red-500' : ''
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
              onClick={handleApplyFilter}
              disabled={!isDateRangeValid()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm flex-1 sm:flex-none"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filter
            </Button>
          </div>
        </div>
      </div>
      
      {!isDateRangeValid() && (
        <div className="text-red-500 text-sm mt-2">
          Start date must be before or equal to end date
        </div>
      )}
    </div>
  )
}
