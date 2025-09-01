"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
import { AddSalesReportForm } from "./add-sales-report-form"

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

type SortField =
  | "reportId"
  | "salesRepName"
  | "reportDate"
  | "premiumActual"
  | "salesCounselorActual"
  | "policySoldActual"
  | "agencyCoopActual"
type SortDirection = "asc" | "desc"

export function SalesRepsTable() {
  const [reports, setReports] = useState<SalesReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddReport, setShowAddReport] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>("reportDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const reportsPerPage = 10

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/sales-reports-data")
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      } else {
        console.error("Failed to fetch reports")
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const filteredReports = reports.filter(
    (report) =>
      report.salesRepName.toLowerCase().includes(searchTerm.toLowerCase()) || report.reportDate.includes(searchTerm),
  )

  const sortedReports = [...filteredReports].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]

    if (sortField === "reportDate") {
      aValue = new Date(aValue as string).getTime()
      bValue = new Date(bValue as string).getTime()
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const totalPages = Math.ceil(sortedReports.length / reportsPerPage)
  const startIndex = (currentPage - 1) * reportsPerPage
  const paginatedReports = sortedReports.slice(startIndex, startIndex + reportsPerPage)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleReportSuccess = () => {
    setShowAddReport(false)
    fetchReports() // Refresh data
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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
            <CardTitle>Sales Reports</CardTitle>
            <CardDescription>View and manage sales performance reports</CardDescription>
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
              placeholder="Search by sales rep name or report date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading reports...</div>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("reportId")}
                        className="h-auto p-0 font-semibold"
                      >
                        Report ID <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("salesRepName")}
                        className="h-auto p-0 font-semibold"
                      >
                        Sales Rep Name <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("reportDate")}
                        className="h-auto p-0 font-semibold"
                      >
                        Report Date <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("premiumActual")}
                        className="h-auto p-0 font-semibold"
                      >
                        Premium Actual <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("salesCounselorActual")}
                        className="h-auto p-0 font-semibold"
                      >
                        Sales Counselor <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("policySoldActual")}
                        className="h-auto p-0 font-semibold"
                      >
                        Policy Sold <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("agencyCoopActual")}
                        className="h-auto p-0 font-semibold"
                      >
                        Agency Coop <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No reports available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedReports.map((report) => (
                      <TableRow key={report.reportId}>
                        <TableCell className="font-medium">{report.reportId}</TableCell>
                        <TableCell>{report.salesRepName}</TableCell>
                        <TableCell>{formatDate(report.reportDate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.premiumActual)}</TableCell>
                        <TableCell className="text-right">{report.salesCounselorActual}</TableCell>
                        <TableCell className="text-right">{report.policySoldActual}</TableCell>
                        <TableCell className="text-right">{report.agencyCoopActual}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + reportsPerPage, sortedReports.length)} of{" "}
                  {sortedReports.length} reports
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
