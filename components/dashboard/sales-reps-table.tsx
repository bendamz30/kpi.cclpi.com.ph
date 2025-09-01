"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, Search } from "lucide-react"
import { AddSalesReportForm } from "./add-sales-report-form"
import { mockSalesReps, mockRegions, mockSalesTypes, mockSalesTargets, mockSalesReports } from "@/lib/mock-data"

export function SalesRepsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [salesReps] = useState(mockSalesReps)
  const [showAddReport, setShowAddReport] = useState(false)

  const filteredReps = salesReps.filter(
    (rep) =>
      rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRegionName = (regionId: number) => {
    return mockRegions.find((r) => r.regionId === regionId)?.regionName || "Unknown"
  }

  const getSalesTypeName = (salesTypeId: number) => {
    return mockSalesTypes.find((t) => t.salesTypeId === salesTypeId)?.typeName || "Unknown"
  }

  const getRepPerformance = (repId: number) => {
    const target = mockSalesTargets.find((t) => t.salesRepId === repId)
    const report = mockSalesReports.find((r) => r.salesRepId === repId)

    if (!target || !report) return { achievement: 0, status: "No Data" }

    const achievement = (report.premiumActual / target.premiumTarget) * 100
    const status = achievement >= 100 ? "Exceeded" : achievement >= 80 ? "On Track" : "Below Target"

    return { achievement: Math.round(achievement), status }
  }

  const handleReportSuccess = () => {
    setShowAddReport(false)
    // In a real app, you would refresh the data here
    console.log("[v0] Sales report created successfully")
  }

  if (showAddReport) {
    return (
      <div className="space-y-6">
        <AddSalesReportForm onSuccess={handleReportSuccess} onCancel={() => setShowAddReport(false)} />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sales Representatives</CardTitle>
            <CardDescription>Manage your sales team and track performance</CardDescription>
          </div>
          <Button onClick={() => setShowAddReport(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sales Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search representatives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Sales Type</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReps.map((rep) => {
                const performance = getRepPerformance(rep.salesRepId)
                return (
                  <TableRow key={rep.salesRepId}>
                    <TableCell className="font-medium">{rep.name}</TableCell>
                    <TableCell>{getRegionName(rep.regionId)}</TableCell>
                    <TableCell>{getSalesTypeName(rep.salesTypeId)}</TableCell>
                    <TableCell>{performance.achievement}%</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          performance.status === "Exceeded"
                            ? "default"
                            : performance.status === "On Track"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {performance.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
