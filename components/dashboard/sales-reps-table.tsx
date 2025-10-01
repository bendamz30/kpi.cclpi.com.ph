"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown, Edit, Trash2 } from "lucide-react"
import { AddSalesReportForm } from "./add-sales-report-form"
import { EditSalesReportForm } from "./edit-sales-report-form"
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
  salesTypeId: number
  salesTypeName: string
}

type SortField =
  | "reportId"
  | "salesRepName"
  | "reportDate"
  | "salesTypeName"
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
  const [editingReport, setEditingReport] = useState<SalesReport | null>(null)
  const [deletingReport, setDeletingReport] = useState<SalesReport | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>("reportDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const { lastUpdate, triggerRefresh } = useRealTime()

  const reportsPerPage = 10

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      
      // Check cache first (1 minute cache for sales reports)
      const cacheKey = 'sales-reports-data'
      const cached = localStorage.getItem(cacheKey)
      const cacheTime = localStorage.getItem(cacheKey + '-time')
      const now = Date.now()
      
      if (cached && cacheTime && (now - parseInt(cacheTime)) < 60000) { // 1 minute
        console.log("[SalesRepsTable] Using cached reports data")
        try {
          const data = JSON.parse(cached)
          setReports(data)
          setLoading(false)
          return
        } catch (error) {
          console.error("[SalesRepsTable] Error parsing cached data:", error)
          // Clear corrupted cache
          localStorage.removeItem(cacheKey)
          localStorage.removeItem(cacheKey + '-time')
        }
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`)
      if (response.ok) {
        const responseData = await response.json()
        const data = responseData?.data || responseData || []
        setReports(data)
        
        // Cache the data for 1 minute
        localStorage.setItem(cacheKey, JSON.stringify(data))
        localStorage.setItem(cacheKey + '-time', now.toString())
      } else {
        console.error("Failed to fetch reports")
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    if (lastUpdate > 0 && reports.length > 0) {
      // Only refetch if we haven't refetched recently (debounce)
      const lastRefetch = localStorage.getItem('lastSalesRefetch')
      const now = Date.now()
      if (!lastRefetch || now - parseInt(lastRefetch) > 30000) { // 30 seconds debounce
        console.log("[v0] Real-time update detected in sales reps table, refreshing data...")
        fetchReports()
        localStorage.setItem('lastSalesRefetch', now.toString())
      }
    }
  }, [lastUpdate, reports.length, fetchReports])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const filteredReports = useMemo(() => {
    return reports.filter(
      (report) =>
        (report.salesRepName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (report.reportDate || '').includes(searchTerm) ||
        (report.salesTypeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()),
    )
  }, [reports, searchTerm])

  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
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
  }, [filteredReports, sortField, sortDirection])

  const { totalPages, paginatedReports, startIndex } = useMemo(() => {
    const totalPages = Math.ceil(sortedReports.length / reportsPerPage)
    const startIndex = (currentPage - 1) * reportsPerPage
    const paginatedReports = sortedReports.slice(startIndex, startIndex + reportsPerPage)
    return { totalPages, paginatedReports, startIndex }
  }, [sortedReports, currentPage, reportsPerPage])

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
    // Clear cache to ensure fresh data
    localStorage.removeItem('sales-reports-data')
    localStorage.removeItem('sales-reports-data-time')
    localStorage.removeItem('lastSalesRefetch')
    fetchReports() // Refresh data
    setMessage({ type: "success", text: "Sales report added successfully!" })
  }

  const handleEditSuccess = () => {
    setEditingReport(null)
    // Clear cache to ensure fresh data
    localStorage.removeItem('sales-reports-data')
    localStorage.removeItem('sales-reports-data-time')
    localStorage.removeItem('lastSalesRefetch')
    fetchReports()
    setMessage({ type: "success", text: "Sales report updated successfully!" })
  }

  const handleDeleteConfirm = async () => {
    if (!deletingReport) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${deletingReport.reportId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Sales report deleted successfully!" })
        // Clear cache to ensure fresh data
        localStorage.removeItem('sales-reports-data')
        localStorage.removeItem('sales-reports-data-time')
        localStorage.removeItem('lastSalesRefetch')
        // Trigger real-time refresh to update dashboard
        console.log("[v0] Sales report deleted, triggering dashboard refresh")
        triggerRefresh()
        fetchReports()
      } else {
        const result = await response.json()
        setMessage({ type: "error", text: result.error || "Failed to delete report" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setDeleteLoading(false)
      setDeletingReport(null)
    }
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

  if (editingReport) {
    return (
      <div className="space-y-6">
        <EditSalesReportForm
          report={editingReport}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingReport(null)}
        />
      </div>
    )
  }

  if (showAddReport) {
    return (
      <div className="space-y-6">
        <AddSalesReportForm onSuccess={handleReportSuccess} onCancel={() => setShowAddReport(false)} />
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <CardTitle className="text-lg sm:text-xl">Sales Reports</CardTitle>
              <CardDescription className="text-xs sm:text-sm">View and manage sales performance reports</CardDescription>
            </div>
            <Button onClick={() => setShowAddReport(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Sales Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <div
              className={`mb-4 px-4 py-3 rounded ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by sales rep name, sales type, or report date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading reports...</div>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-2">
                {paginatedReports.map((report) => (
                  <Card key={report.reportId} className="p-3 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      {/* Header with sales rep name and sales type */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 truncate" title={report.salesRepName}>
                            {report.salesRepName}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">ID: {report.reportId} • {formatDate(report.reportDate)}</p>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0 ml-2">
                          {report.salesTypeName}
                        </span>
                      </div>
                      
                      {/* Compact metrics grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded">
                          <span className="text-gray-500">Premium:</span>
                          <span className="text-gray-900 font-semibold">{formatCurrency(report.premiumActual)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded">
                          <span className="text-gray-500">Counselor:</span>
                          <span className="text-gray-900">{report.salesCounselorActual}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded">
                          <span className="text-gray-500">Policy:</span>
                          <span className="text-gray-900">{report.policySoldActual}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded">
                          <span className="text-gray-500">Agency:</span>
                          <span className="text-gray-900">{report.agencyCoopActual}</span>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingReport(report)} 
                          className="h-8 w-8 p-0 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" style={{ color: '#4cb1e9' }} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setDeletingReport(report)} 
                          className="h-8 w-8 p-0 border-red-200 hover:border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" style={{ color: '#ef4444' }} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {sortedReports.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm">No reports found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms or filters</p>
                  </div>
                )}
              </div>

              {/* Medium Table Layout (Tablets) */}
              <div className="hidden md:block lg:hidden overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-16 px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</TableHead>
                      <TableHead className="w-32 px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Rep</TableHead>
                      <TableHead className="w-20 px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</TableHead>
                      <TableHead className="w-20 px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</TableHead>
                      <TableHead className="w-24 text-right px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Premium</TableHead>
                      <TableHead className="w-16 text-right px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Counselor</TableHead>
                      <TableHead className="w-16 text-right px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Policy</TableHead>
                      <TableHead className="w-16 text-right px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Agency</TableHead>
                      <TableHead className="w-16 text-right px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white divide-y divide-gray-200">
                    {paginatedReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          <div className="text-gray-400 mb-2">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-sm">No reports found</p>
                          <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms or filters</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedReports.map((report) => (
                        <TableRow key={report.reportId} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="px-2 py-3 text-sm font-medium text-gray-900">{report.reportId}</TableCell>
                          <TableCell className="px-2 py-3 text-sm text-gray-600 truncate" title={report.salesRepName}>
                            {report.salesRepName}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-sm text-gray-600">{formatDate(report.reportDate)}</TableCell>
                          <TableCell className="px-2 py-3">
                            <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {report.salesTypeName}
                            </span>
                          </TableCell>
                          <TableCell className="text-right px-2 py-3 text-sm text-gray-900 font-semibold">{formatCurrency(report.premiumActual)}</TableCell>
                          <TableCell className="text-right px-2 py-3 text-sm text-gray-900 font-semibold">{report.salesCounselorActual}</TableCell>
                          <TableCell className="text-right px-2 py-3 text-sm text-gray-900 font-semibold">{report.policySoldActual}</TableCell>
                          <TableCell className="text-right px-2 py-3 text-sm text-gray-900 font-semibold">{report.agencyCoopActual}</TableCell>
                          <TableCell className="text-right px-2 py-3">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingReport(report)}
                                className="h-7 w-7 p-0 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                              >
                                <Edit className="h-3 w-3" style={{ color: '#4cb1e9' }} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingReport(report)}
                                className="h-7 w-7 p-0 border-red-200 hover:border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" style={{ color: '#ef4444' }} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden lg:block overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-20 px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</TableHead>
                      <TableHead className="w-48 px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Sales Rep</TableHead>
                      <TableHead className="w-24 px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</TableHead>
                      <TableHead className="w-24 px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</TableHead>
                      <TableHead className="w-28 text-right px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Premium</TableHead>
                      <TableHead className="w-20 text-right px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Counselor</TableHead>
                      <TableHead className="w-20 text-right px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Policy</TableHead>
                      <TableHead className="w-20 text-right px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Agency</TableHead>
                      <TableHead className="w-20 text-right px-2 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white divide-y divide-gray-200">
                    {paginatedReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          <div className="text-gray-400 mb-2">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-sm">No reports found</p>
                          <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms or filters</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedReports.map((report) => (
                        <TableRow key={report.reportId} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="px-2 py-3 text-sm font-medium text-gray-900">{report.reportId}</TableCell>
                          <TableCell className="px-2 py-3 text-sm text-gray-600 truncate" title={report.salesRepName}>
                            {report.salesRepName}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-sm text-gray-600">{formatDate(report.reportDate)}</TableCell>
                          <TableCell className="px-2 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {report.salesTypeName}
                            </span>
                          </TableCell>
                          <TableCell className="text-right px-2 py-3 text-sm text-gray-900 font-semibold">{formatCurrency(report.premiumActual)}</TableCell>
                          <TableCell className="text-right px-2 py-3 text-sm text-gray-900 font-semibold">{report.salesCounselorActual}</TableCell>
                          <TableCell className="text-right px-2 py-3 text-sm text-gray-900 font-semibold">{report.policySoldActual}</TableCell>
                          <TableCell className="text-right px-2 py-3 text-sm text-gray-900 font-semibold">{report.agencyCoopActual}</TableCell>
                          <TableCell className="text-right px-2 py-3">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingReport(report)}
                                className="h-8 w-8 p-0 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" style={{ color: '#4cb1e9' }} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingReport(report)}
                                className="h-8 w-8 p-0 border-red-200 hover:border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" style={{ color: '#ef4444' }} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-3 sm:space-y-0">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">
                      Showing {startIndex + 1} to {Math.min(startIndex + reportsPerPage, sortedReports.length)} of{" "}
                      {sortedReports.length} results
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="text-xs sm:text-sm h-8 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0 text-xs sm:text-sm"
                          >
                            {page}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && (
                        <>
                          <span className="text-gray-400 text-xs">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-8 h-8 p-0 text-xs sm:text-sm"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="text-xs sm:text-sm h-8 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingReport} onOpenChange={() => setDeletingReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sales Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sales report for {deletingReport?.salesRepName}? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? "Deleting..." : "Delete Report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
