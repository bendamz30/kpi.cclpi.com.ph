"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Filter } from "lucide-react"

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
  role: string
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
    granularity: "monthly",
  })

  const [filteredRegions, setFilteredRegions] = useState<Region[]>([])
  const [filteredSalesOfficers, setFilteredSalesOfficers] = useState<User[]>([])

  useEffect(() => {
    fetchDropdownData()
  }, [])

  useEffect(() => {
    // Filter regions by selected area
    if (filters.area && filters.area !== "all") {
      const filtered = regions.filter((region) => Number(region.areaId) === Number(filters.area))
      setFilteredRegions(filtered)

      // Clear region if it's not in the new filtered list
      if (filters.region && !filtered.find((r) => r.regionId.toString() === filters.region)) {
        setFilters((prev) => ({ ...prev, region: "all", salesOfficer: "all" }))
      }
    } else {
      setFilteredRegions([])
      setFilters((prev) => ({ ...prev, region: "all", salesOfficer: "all" }))
    }
  }, [filters.area, regions])

  useEffect(() => {
    // Filter sales officers by selected region
    if (filters.region && filters.region !== "all") {
      const filtered = salesOfficers.filter((officer) => Number(officer.regionId) === Number(filters.region))
      setFilteredSalesOfficers(filtered)

      // Clear sales officer if it's not in the new filtered list
      if (filters.salesOfficer && !filtered.find((o) => o.userId.toString() === filters.salesOfficer)) {
        setFilters((prev) => ({ ...prev, salesOfficer: "all" }))
      }
    } else {
      setFilteredSalesOfficers([])
      setFilters((prev) => ({ ...prev, salesOfficer: "all" }))
    }
  }, [filters.region, salesOfficers])

  const fetchDropdownData = async () => {
    try {
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

      setAreas(areasData)
      setRegions(regionsData)
      setSalesTypes(salesTypesData)
      setSalesOfficers(usersData.filter((user: User) => user.role === "RegionalUser"))
    } catch (error) {
      console.error("Error fetching dropdown data:", error)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleApplyFilter = () => {
    console.debug("[v0] Applying filters:", filters, " -> results: pending...")
    onFiltersChange(filters)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="salesType">Sales Type</Label>
            <Select value={filters.salesType} onValueChange={(value) => handleFilterChange("salesType", value)}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="area">Area</Label>
            <Select value={filters.area} onValueChange={(value) => handleFilterChange("area", value)}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select
              value={filters.region}
              onValueChange={(value) => handleFilterChange("region", value)}
              disabled={!filters.area || filters.area === "all"}
            >
              <SelectTrigger>
                <SelectValue placeholder={filters.area && filters.area !== "all" ? "All" : "Select area first"} />
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
            <Label htmlFor="salesOfficer">Sales Officer</Label>
            <Select
              value={filters.salesOfficer}
              onValueChange={(value) => handleFilterChange("salesOfficer", value)}
              disabled={!filters.region || filters.region === "all"}
            >
              <SelectTrigger>
                <SelectValue placeholder={filters.region && filters.region !== "all" ? "All" : "Select region first"} />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="granularity">Time Granularity</Label>
            <Select value={filters.granularity} onValueChange={(value) => handleFilterChange("granularity", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleApplyFilter} className="w-full md:w-auto">
          <Filter className="w-4 h-4 mr-2" />
          Apply Filter
        </Button>
      </CardContent>
    </Card>
  )
}
