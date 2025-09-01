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
    console.debug(
      "[v0] computeOfficerOptions -> areaId=",
      filters.area,
      "regionId=",
      filters.region,
      "salesType=",
      filters.salesType,
    )

    let filtered = salesOfficers

    if (filters.salesType && filters.salesType !== "all") {
      filtered = filtered.filter((officer) => Number(officer.salesTypeId) === Number(filters.salesType))
      console.debug("[v0] After sales type filter:", filtered.length, "officers")
    }

    // Filter by Area if selected
    if (filters.area && filters.area !== "all") {
      filtered = filtered.filter((officer) => Number(officer.areaId) === Number(filters.area))
      console.debug("[v0] After area filter:", filtered.length, "officers")
    }

    // Then filter by Region if selected
    if (filters.region && filters.region !== "all") {
      filtered = filtered.filter((officer) => Number(officer.regionId) === Number(filters.region))
      console.debug("[v0] After region filter:", filtered.length, "officers")
    }

    console.debug("[v0] computeOfficerOptions -> optionsCount=", filtered.length)
    setFilteredSalesOfficers(filtered)

    // Clear sales officer selection if current selection is not in filtered list
    if (
      filters.salesOfficer &&
      filters.salesOfficer !== "all" &&
      !filtered.find((o) => o.userId.toString() === filters.salesOfficer)
    ) {
      console.debug("[v0] Clearing sales officer selection - not in filtered list")
      setFilters((prev) => ({ ...prev, salesOfficer: "all" }))
    }
  }, [filters.area, filters.region, filters.salesType, salesOfficers])

  useEffect(() => {
    setFilters((prev) => ({ ...prev, salesOfficer: "all" }))
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

      const regionalUsers = usersData.filter((user: User) => user.role === "RegionalUser")
      console.debug(
        "[v0] loaded counts: users=",
        usersData.length,
        ", reports=N/A, targets=N/A, areas=",
        areasData.length,
        ", regions=",
        regionsData.length,
        ", salesTypes=",
        salesTypesData.length,
      )
      console.debug("[v0] RegionalUser officers:", regionalUsers.length)

      setAreas(areasData)
      setRegions(regionsData)
      setSalesTypes(salesTypesData)
      setSalesOfficers(regionalUsers)
    } catch (error) {
      console.error("[v0] Error fetching dropdown data:", error)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleApplyFilter = () => {
    console.debug("[v0] applyFilters called with filters:", filters)
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
            <Label htmlFor="area">Area</Label>
            <Select value={filters.area} onValueChange={(value) => handleFilterChange("area", value)}>
              <SelectTrigger>
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
            <Label htmlFor="region">Region</Label>
            <Select
              value={filters.region}
              onValueChange={(value) => handleFilterChange("region", value)}
              disabled={!filters.area || filters.area === "all"}
            >
              <SelectTrigger>
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
            <Label htmlFor="salesOfficer">Sales Officer</Label>
            <Select
              value={filters.salesOfficer}
              onValueChange={(value) => handleFilterChange("salesOfficer", value)}
              disabled={filteredSalesOfficers.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={filteredSalesOfficers.length === 0 ? "No sales officers" : "Select sales officer"}
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
