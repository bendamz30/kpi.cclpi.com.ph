"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2, RotateCcw, Search, Users, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProfilePicture } from "@/components/ui/profile-picture"
import apiService from "@/lib/api.js"

interface DeletedUser {
  id: number
  original_user_id: number
  name: string
  email: string
  username?: string
  contact_number?: string
  address?: string
  profile_picture?: string | null
  profile_picture_url?: string | null
  role: string
  regionId?: number
  areaId?: number
  salesTypeId?: number
  deleted_by: number
  deleted_at: string
  created_at: string
  updated_at: string
  deleted_by_user?: {
    name: string
    email: string
  }
}

interface DeletedSalesReport {
  id: number
  original_report_id: number
  salesRepId: number
  reportDate: string
  premiumActual: number
  salesCounselorActual: number
  policySoldActual: number
  agencyCoopActual: number
  createdBy: number
  deleted_by: number
  deleted_at: string
  created_at: string
  updated_at: string
  deleted_by_user?: {
    name: string
    email: string
  }
  sales_rep?: {
    name: string
    email: string
  }
  created_by_user?: {
    name: string
    email: string
  }
}

interface TrashStats {
  deleted_users_count: number
  deleted_sales_reports_count: number
  total_deleted_count: number
}

export function TrashBin() {
  const [activeTab, setActiveTab] = useState("users")
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([])
  const [deletedSalesReports, setDeletedSalesReports] = useState<DeletedSalesReport[]>([])
  const [trashStats, setTrashStats] = useState<TrashStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [usersPage, setUsersPage] = useState(1)
  const [reportsPage, setReportsPage] = useState(1)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [reportsTotalPages, setReportsTotalPages] = useState(1)
  const { toast } = useToast()

  // Fetch trash statistics
  const fetchTrashStats = async () => {
    try {
      const response = await apiService.fetchData('/trash/stats')
      setTrashStats(response.data)
    } catch (error) {
      console.error('Error fetching trash stats:', error)
    }
  }

  // Fetch deleted users
  const fetchDeletedUsers = async (page = 1, search = "") => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Only add non-empty parameters
      if (page) {
        params.append('page', page.toString())
      }
      params.append('per_page', '15')
      if (search && search.trim() !== '') {
        params.append('search', search.trim())
      }
      
      const response = await apiService.fetchData(`/trash/users?${params}`)
      setDeletedUsers(response.data.data)
      setUsersTotalPages(response.data.last_page)
      setUsersPage(page)
    } catch (error) {
      console.error('Error fetching deleted users:', error)
      toast({
        title: "Error",
        description: "Failed to fetch deleted users",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch deleted sales reports
  const fetchDeletedSalesReports = async (page = 1, search = "") => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Only add non-empty parameters
      if (page) {
        params.append('page', page.toString())
      }
      params.append('per_page', '15')
      if (search && search.trim() !== '') {
        params.append('search', search.trim())
      }
      
      const response = await apiService.fetchData(`/trash/sales-reports?${params}`)
      setDeletedSalesReports(response.data.data)
      setReportsTotalPages(response.data.last_page)
      setReportsPage(page)
    } catch (error) {
      console.error('Error fetching deleted sales reports:', error)
      toast({
        title: "Error",
        description: "Failed to fetch deleted sales reports",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Restore user
  const restoreUser = async (userId: number) => {
    try {
      const response = await apiService.fetchData(`/trash/users/${userId}/restore`, {
        method: 'POST'
      })
      
      const message = response.message || "User restored successfully"
      const reLinkedReports = response.re_linked_sales_reports || 0
      
      toast({
        title: "Success",
        description: message
      })
      
      // Refresh data
      fetchDeletedUsers(usersPage, searchTerm)
      fetchTrashStats()
    } catch (error) {
      console.error('Error restoring user:', error)
      toast({
        title: "Error",
        description: "Failed to restore user",
        variant: "destructive"
      })
    }
  }

  // Restore sales report
  const restoreSalesReport = async (reportId: number) => {
    try {
      await apiService.fetchData(`/trash/sales-reports/${reportId}/restore`, {
        method: 'POST'
      })
      
      toast({
        title: "Success",
        description: "Sales report restored successfully"
      })
      
      // Refresh data
      fetchDeletedSalesReports(reportsPage, searchTerm)
      fetchTrashStats()
    } catch (error) {
      console.error('Error restoring sales report:', error)
      toast({
        title: "Error",
        description: "Failed to restore sales report",
        variant: "destructive"
      })
    }
  }

  // Permanently delete user
  const permanentlyDeleteUser = async (userId: number) => {
    try {
      await apiService.fetchData(`/trash/users/${userId}`, {
        method: 'DELETE'
      })
      
      toast({
        title: "Success",
        description: "User permanently deleted"
      })
      
      // Refresh data
      fetchDeletedUsers(usersPage, searchTerm)
      fetchTrashStats()
    } catch (error) {
      console.error('Error permanently deleting user:', error)
      toast({
        title: "Error",
        description: "Failed to permanently delete user",
        variant: "destructive"
      })
    }
  }

  // Permanently delete sales report
  const permanentlyDeleteSalesReport = async (reportId: number) => {
    try {
      await apiService.fetchData(`/trash/sales-reports/${reportId}`, {
        method: 'DELETE'
      })
      
      toast({
        title: "Success",
        description: "Sales report permanently deleted"
      })
      
      // Refresh data
      fetchDeletedSalesReports(reportsPage, searchTerm)
      fetchTrashStats()
    } catch (error) {
      console.error('Error permanently deleting sales report:', error)
      toast({
        title: "Error",
        description: "Failed to permanently delete sales report",
        variant: "destructive"
      })
    }
  }

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (activeTab === "users") {
      fetchDeletedUsers(1, value)
    } else {
      fetchDeletedSalesReports(1, value)
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchTerm("")
    if (value === "users") {
      fetchDeletedUsers(1, "")
    } else {
      fetchDeletedSalesReports(1, "")
    }
  }

  // Initial load
  useEffect(() => {
    fetchTrashStats()
    fetchDeletedUsers()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SystemAdmin': return 'bg-red-100 text-red-800'
      case 'RegionalUser': return 'bg-blue-100 text-blue-800'
      case 'Viewer': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trash Bin</h1>
          <p className="text-gray-600 mt-1">Manage deleted users and sales reports</p>
        </div>
        {trashStats && (
          <div className="flex space-x-4">
            <Badge variant="outline" className="px-3 py-1">
              <Users className="w-4 h-4 mr-1" />
              {trashStats.deleted_users_count} Users
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <FileText className="w-4 h-4 mr-1" />
              {trashStats.deleted_sales_reports_count} Reports
            </Badge>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder={`Search deleted ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Deleted Users</span>
            {trashStats && (
              <Badge variant="secondary" className="ml-1">
                {trashStats.deleted_users_count}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Deleted Reports</span>
            {trashStats && (
              <Badge variant="secondary" className="ml-1">
                {trashStats.deleted_sales_reports_count}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Deleted Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            </div>
          ) : deletedUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Users className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted users</h3>
                <p className="text-gray-500 text-center">There are no deleted users in the trash bin.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {deletedUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <ProfilePicture 
                          src={user.profile_picture_url} 
                          alt={user.name}
                          size="sm"
                        />
                        <h3 className="font-semibold text-sm">{user.name}</h3>
                        <Badge variant="outline" className={`text-xs ${getRoleColor(user.role)}`}>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Email:</strong> {user.email}</p>
                        {user.username && <p><strong>Username:</strong> {user.username}</p>}
                        <p><strong>Deleted:</strong> {formatDate(user.deleted_at)}</p>
                        {user.deleted_by_user && (
                          <p><strong>Deleted by:</strong> {user.deleted_by_user.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Restore
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Restore User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to restore {user.name}? This will move them back to the active users list.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => restoreUser(user.id)}>
                              Restore
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete {user.name}? This action cannot be undone and will remove all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => permanentlyDeleteUser(user.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
              
              {/* Pagination for Users */}
              {usersTotalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDeletedUsers(usersPage - 1, searchTerm)}
                    disabled={usersPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm text-gray-600">
                    Page {usersPage} of {usersTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDeletedUsers(usersPage + 1, searchTerm)}
                    disabled={usersPage === usersTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Deleted Sales Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            </div>
          ) : deletedSalesReports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted sales reports</h3>
                <p className="text-gray-500 text-center">There are no deleted sales reports in the trash bin.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {deletedSalesReports.map((report) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-sm">Sales Report #{report.original_report_id}</h3>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(report.reportDate)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Sales Rep:</strong> {report.sales_rep?.name || 'Unknown'}</p>
                        <p><strong>Premium:</strong> ₱{report.premiumActual.toLocaleString()}</p>
                        <p><strong>Sales Counselors:</strong> {report.salesCounselorActual}</p>
                        <p><strong>Policies Sold:</strong> {report.policySoldActual}</p>
                        <p><strong>Agency Coop:</strong> {report.agencyCoopActual}</p>
                        <p><strong>Deleted:</strong> {formatDate(report.deleted_at)}</p>
                        {report.deleted_by_user && (
                          <p><strong>Deleted by:</strong> {report.deleted_by_user.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Restore
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Restore Sales Report</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to restore this sales report? This will move it back to the active sales reports list.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => restoreSalesReport(report.id)}>
                              Restore
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete Sales Report</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete this sales report? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => permanentlyDeleteSalesReport(report.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
              
              {/* Pagination for Reports */}
              {reportsTotalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDeletedSalesReports(reportsPage - 1, searchTerm)}
                    disabled={reportsPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm text-gray-600">
                    Page {reportsPage} of {reportsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDeletedSalesReports(reportsPage + 1, searchTerm)}
                    disabled={reportsPage === reportsTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}