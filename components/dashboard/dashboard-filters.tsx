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
    endDate: "",
    granularity: "monthly"
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
      endDate: "",
      granularity: "monthly"
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
    <div className="sticky top-0 z-10 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="space-y-2 min-w-[140px]">
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

        <div className="space-y-2 min-w-[120px]">
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

        <div className="space-y-2 min-w-[140px]">
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

        <div className="space-y-2 min-w-[160px]">
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

        <div className="space-y-2 min-w-[140px]">
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

        <div className="space-y-2 min-w-[140px]">
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

        <div className="space-y-2 min-w-[140px]">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Granularity</label>
          <Select value={filters.granularity} onValueChange={(value) => handleFilterChange("granularity", value)}>
            <SelectTrigger className="rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              <SelectValue placeholder="Select granularity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 ml-auto">
          <Button
            onClick={handleReset}
            variant="outline"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 border-gray-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleApplyFilter}
            disabled={!isDateRangeValid()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Filter className="w-4 h-4 mr-2" />
            Apply Filter
          </Button>
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
