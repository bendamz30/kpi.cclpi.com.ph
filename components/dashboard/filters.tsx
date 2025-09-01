"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter } from "lucide-react"
import { format } from "date-fns"
import { mockAreas, mockRegions, mockSalesTypes } from "@/lib/mock-data"

interface FiltersProps {
  onFiltersChange: (filters: any) => void
}

export function Filters({ onFiltersChange }: FiltersProps) {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedArea, setSelectedArea] = useState<string>("")
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [selectedSalesType, setSelectedSalesType] = useState<string>("")

  const handleApplyFilters = () => {
    const filters = {
      startDate,
      endDate,
      areaId: selectedArea,
      regionId: selectedRegion,
      salesTypeId: selectedSalesType,
    }
    onFiltersChange(filters)
  }

  const handleClearFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setSelectedArea("")
    setSelectedRegion("")
    setSelectedSalesType("")
    onFiltersChange({})
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Area</Label>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {mockAreas.map((area) => (
                  <SelectItem key={area.areaId.toString()} value={area.areaId.toString()}>
                    {area.areaName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Region</Label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {mockRegions.map((region) => (
                  <SelectItem key={region.regionId.toString()} value={region.regionId.toString()}>
                    {region.regionName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sales Type</Label>
            <Select value={selectedSalesType} onValueChange={setSelectedSalesType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {mockSalesTypes.map((type) => (
                  <SelectItem key={type.salesTypeId.toString()} value={type.salesTypeId.toString()}>
                    {type.typeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
