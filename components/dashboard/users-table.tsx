"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Key, Calendar, Shield } from "lucide-react"
import { AddUserForm } from "./add-user-form"
import { EditUserForm } from "./edit-user-form"
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
import { useToast } from "@/hooks/use-toast"
import { ProfilePicture } from "@/components/ui/profile-picture"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  userId: number
  name: string
  email: string
  role: string
  regionId: number | null
  createdAt: string
  updatedAt: string | null
  profile_picture?: string | null
  profile_picture_url?: string | null
}

interface Region {
  regionId: number
  regionName: string
  areaId: number
}

export function UsersTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("newest")
  const [roleFilter, setRoleFilter] = useState("all")
  const [users, setUsers] = useState<User[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [resettingUser, setResettingUser] = useState<User | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { toast } = useToast()

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/users")
      if (response.ok) {
        const userResponse = await response.json()
        const userData = userResponse?.data || userResponse || []
        setUsers(userData)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegions = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/regions")
      if (response.ok) {
        const regionsResponse = await response.json()
        const regionsData = regionsResponse?.data || regionsResponse || []
        setRegions(regionsData)
      }
    } catch (error) {
      console.error("Failed to fetch regions:", error)
    }
  }

  useEffect(() => {
    console.log('Initial date filter value:', dateFilter)
    fetchUsers()
    fetchRegions()
  }, [])

  const handleUserAdded = () => {
    fetchUsers()
  }

  const handleUserEdited = () => {
    fetchUsers()
    setShowEditDialog(false)
    setEditingUser(null)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowEditDialog(true)
  }

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user)
    setShowDeleteDialog(true)
  }

  const handleResetPassword = (user: User) => {
    setResettingUser(user)
    setShowResetDialog(true)
  }


  const confirmDeleteUser = async () => {
    if (!deletingUser) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${deletingUser.userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const result = await response.json()
        const message = result.message || "User deleted successfully"
        const preservedReports = result.data?.preserved_sales_reports || 0
        
        toast({
          title: "Success",
          description: message,
        })
        fetchUsers() // Refresh the table
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
      setShowDeleteDialog(false)
      setDeletingUser(null)
    }
  }

  const confirmResetPassword = async () => {
    if (!resettingUser) return

    setResetLoading(true)
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${resettingUser.userId}/reset-password`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          new_password: 'cclpi'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Password Reset",
          description: `Password has been reset to "cclpi" for ${resettingUser.name}`,
          variant: "default",
        })
      } else {
        throw new Error(data.message || "Failed to reset password")
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setResetLoading(false)
      setShowResetDialog(false)
      setResettingUser(null)
    }
  }

  const filteredUsers = users
    .filter(
      (user) =>
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.role?.toLowerCase() || '').includes(searchTerm.toLowerCase()),
    )
    .filter((user) => {
      if (roleFilter === "all") return true
      return (user.role?.toLowerCase() || '') === roleFilter.toLowerCase()
    })
    .sort((a, b) => {
      if (dateFilter === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (dateFilter === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return 0 // fallback
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDateFilterChange = (value: string) => {
    console.log('Date filter changing to:', value)
    setDateFilter(value)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const handleRoleFilterChange = (value: string) => {
    console.log('Role filter changing to:', value)
    setRoleFilter(value)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  // Get unique roles for the filter dropdown
  const uniqueRoles = Array.from(new Set(users.map(user => user.role).filter(Boolean)))

  const getRoleBadgeVariant = (role: string) => {
    switch ((role || '').toLowerCase()) {
      case "admin":
        return "destructive"
      case "systemadmin":
        return "outline"
      case "regionaluser":
        return "default"
      case "viewer":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRegionName = (regionId: number | null) => {
    if (!regionId) return "All Regions"
    const region = regions.find((r) => r.regionId === regionId)
    return region?.regionName || "Unknown"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading users...</div>
        </CardContent>
      </Card>
    )
  }

  if (showAddModal) {
    return (
      <div className="space-y-6">
        <AddUserForm 
          onSuccess={() => {
            setShowAddModal(false)
            handleUserAdded()
          }} 
          onCancel={() => {
            setShowAddModal(false)
          }} 
        />
      </div>
    )
  }

  if (showEditDialog && editingUser) {
    return (
      <div className="space-y-6">
        <EditUserForm 
          user={editingUser}
          onSuccess={() => {
            setShowEditDialog(false)
            handleUserEdited()
          }} 
          onCancel={() => {
            setShowEditDialog(false)
          }} 
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <CardTitle className="text-lg sm:text-xl">System Users</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage user accounts and permissions</CardDescription>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
          <div className="flex flex-col space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                  <SelectTrigger className="w-full sm:w-[180px] text-sm">
                    <SelectValue placeholder="Newest First" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                  <SelectTrigger className="w-full sm:w-[180px] text-sm">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {uniqueRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table Layout */}
          <div className="hidden 2xl:block overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Region</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</TableHead>
                  <TableHead className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <TableRow key={user.userId} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="px-4 py-4 text-sm font-medium text-gray-900 max-w-[200px] truncate" title={user.name}>
                      <div className="flex items-center space-x-3">
                        <ProfilePicture 
                          src={user.profile_picture_url} 
                          alt={user.name}
                          size="sm"
                          key={`${user.userId}-${user.updatedAt}`}
                        />
                        <span className="truncate">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-gray-600 max-w-[250px] truncate" title={user.email}>
                      {user.email}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge 
                        variant={getRoleBadgeVariant(user.role)} 
                        className="text-xs"
                        style={(user.role || '').toLowerCase() === 'systemadmin' ? {
                          backgroundColor: '#f3cf47',
                          color: '#013f99',
                          borderColor: '#f3cf47'
                        } : (user.role || '').toLowerCase() === 'viewer' ? {
                          backgroundColor: '#4cb1e9',
                          color: 'white',
                          borderColor: '#4cb1e9'
                        } : {}}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-gray-600">{getRegionName(user.regionId)}</TableCell>
                    <TableCell className="px-4 py-4 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right px-4 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditUser(user)} 
                          className="h-8 w-8 p-0 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" style={{ color: '#4cb1e9' }} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleResetPassword(user)} 
                          className="h-8 w-8 p-0 border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                          title="Reset Password to 'cclpi'"
                        >
                          <Key className="h-4 w-4" style={{ color: '#f97316' }} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteUser(user)} 
                          className="h-8 w-8 p-0 border-red-200 hover:border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" style={{ color: '#ef4444' }} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <p className="text-sm">No users found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Tablet Table Layout */}
          <div className="hidden md:block 2xl:hidden overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</TableHead>
                  <TableHead className="px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</TableHead>
                  <TableHead className="px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Region</TableHead>
                  <TableHead className="text-right px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <p className="text-sm">No users found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.userId} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="px-3 py-3 text-sm font-medium text-gray-900 max-w-[150px] truncate" title={user.name}>
                        <div className="flex items-center space-x-2">
                          <ProfilePicture 
                            src={user.profile_picture_url} 
                            alt={user.name}
                            size="sm"
                            key={`${user.userId}-${user.updatedAt}`}
                          />
                          <span className="truncate">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={user.email}>
                        {user.email}
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <Badge 
                          variant={getRoleBadgeVariant(user.role)} 
                          className="text-xs"
                          style={(user.role || '').toLowerCase() === 'systemadmin' ? {
                            backgroundColor: '#f3cf47',
                            color: '#013f99',
                            borderColor: '#f3cf47'
                          } : (user.role || '').toLowerCase() === 'viewer' ? {
                            backgroundColor: '#4cb1e9',
                            color: 'white',
                            borderColor: '#4cb1e9'
                          } : {}}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-sm text-gray-600 max-w-[120px] truncate" title={getRegionName(user.regionId)}>
                        {getRegionName(user.regionId)}
                      </TableCell>
                      <TableCell className="text-right px-3 py-3">
                        <div className="flex items-center justify-end space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditUser(user)} 
                            className="h-7 w-7 p-0 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                          >
                            <Edit className="h-3 w-3" style={{ color: '#4cb1e9' }} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleResetPassword(user)} 
                            className="h-7 w-7 p-0 border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                            title="Reset Password to 'cclpi'"
                          >
                            <Key className="h-3 w-3" style={{ color: '#f97316' }} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteUser(user)} 
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

          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-2">
            {paginatedUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-sm">No users found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms</p>
              </div>
            ) : (
              paginatedUsers.map((user) => (
                <Card key={user.userId} className="p-3 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    {/* Header with profile and role */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <ProfilePicture 
                            src={user.profile_picture_url} 
                            alt={user.name}
                            size="sm"
                            key={`${user.userId}-${user.updatedAt}`}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 truncate" title={user.name}>
                              {user.name}
                            </h3>
                            <p className="text-xs text-gray-600 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={getRoleBadgeVariant(user.role)} 
                        className="text-xs flex-shrink-0 ml-2"
                        style={(user.role || '').toLowerCase() === 'systemadmin' ? {
                          backgroundColor: '#f3cf47',
                          color: '#013f99',
                          borderColor: '#f3cf47'
                        } : (user.role || '').toLowerCase() === 'viewer' ? {
                          backgroundColor: '#4cb1e9',
                          color: 'white',
                          borderColor: '#4cb1e9'
                        } : {}}
                      >
                        {user.role}
                      </Badge>
                    </div>
                    
                    {/* Details grid */}
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-500 font-medium">Region:</span>
                        <span className="text-gray-900">{getRegionName(user.regionId)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-500 font-medium">Created:</span>
                        <span className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditUser(user)} 
                        className="h-8 w-8 p-0 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" style={{ color: '#4cb1e9' }} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleResetPassword(user)} 
                        className="h-8 w-8 p-0 border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                        title="Reset Password to 'cclpi'"
                      >
                        <Key className="h-4 w-4" style={{ color: '#f97316' }} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteUser(user)} 
                        className="h-8 w-8 p-0 border-red-200 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" style={{ color: '#ef4444' }} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-3 sm:space-y-0">
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <span className="font-medium">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} results
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
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
                    onClick={() => handlePageChange(page)}
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
                    onClick={() => handlePageChange(totalPages)}
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
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="text-xs sm:text-sm h-8 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
            <span className="block mt-2 text-sm text-muted-foreground">
              The user will be moved to trash. Any sales reports will be preserved to maintain KPI data integrity.
            </span>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the password for <strong>{resettingUser?.name}</strong> to <strong>"cclpi"</strong>?
            </AlertDialogDescription>
            <span className="block mt-2 text-sm text-muted-foreground">
              The user will need to use "cclpi" as their password to log in.
            </span>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmResetPassword}
              disabled={resetLoading}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {resetLoading ? "Resetting..." : "Reset Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
