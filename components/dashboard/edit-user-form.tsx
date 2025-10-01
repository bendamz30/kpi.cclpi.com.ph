"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useRealTime } from "@/components/providers/real-time-provider"
import { useAuth } from "@/contexts/auth-context"

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

interface EditUserFormProps {
  user: any
  onSuccess: () => void
  onCancel: () => void
}

export function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
  const { refreshUser } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    contact_number: "",
    address: "",
    profile_picture: null as File | null,
    profile_picture_url: "",
    password: "",
    role: "",
    areaId: "",
    regionId: "",
    salesTypeId: "",
    annualTarget: "",
    salesCounselorTarget: "",
    policySoldTarget: "",
    agencyCoopTarget: "",
  })
  const [isLoading, setIsLoading] = useState(true)

  const [areas, setAreas] = useState<Area[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([])
  const [salesTypes, setSalesTypes] = useState<SalesType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const { toast } = useToast()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { triggerRefresh } = useRealTime()

  useEffect(() => {
    fetchUserData()
    fetchDropdownData()
  }, [user.userId])

  useEffect(() => {
    if (formData.areaId) {
      const filtered = regions.filter((region) => region.areaId === Number.parseInt(formData.areaId))
      setFilteredRegions(filtered)
      const currentRegion = regions.find((r) => r.regionId === Number.parseInt(formData.regionId))
      if (currentRegion && currentRegion.areaId !== Number.parseInt(formData.areaId)) {
        setFormData((prev) => ({ ...prev, regionId: "" }))
      }
    } else {
      setFilteredRegions([])
    }
  }, [formData.areaId, regions])

  useEffect(() => {
    if (formData.regionId && regions.length > 0 && !formData.areaId) {
      const userRegion = regions.find((r) => r.regionId === Number.parseInt(formData.regionId))
      if (userRegion) {
        setFormData((prev) => ({ ...prev, areaId: (userRegion.areaId || '').toString() }))
      }
    }
  }, [formData.regionId, regions, formData.areaId])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`http://127.0.0.1:8000/api/users/${user.userId}`)
      if (response.ok) {
        const result = await response.json()
        const userData = result.data
        
        setFormData({
          name: userData?.name || "",
          email: userData?.email || "",
          username: userData?.username || "",
          contact_number: userData?.contact_number || "",
          address: userData?.address || "",
          profile_picture: null,
          profile_picture_url: userData?.profile_picture_url || "",
          password: "",
          role: userData?.role === "SystemAdmin" ? "admin" : userData?.role === "RegionalUser" ? "regionalUser" : "viewer",
          areaId: "",
          regionId: userData?.regionId?.toString() || "",
          salesTypeId: userData?.salesTypeId?.toString() || "",
          annualTarget: userData?.annualTarget ? userData.annualTarget.toString() : "",
          salesCounselorTarget: userData?.salesCounselorTarget ? userData.salesCounselorTarget.toString() : "",
          policySoldTarget: userData?.policySoldTarget ? userData.policySoldTarget.toString() : "",
          agencyCoopTarget: userData?.agencyCoopTarget ? userData.agencyCoopTarget.toString() : "",
        })
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error)
      setError("Failed to load user data")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const areasResponse = await fetch("http://127.0.0.1:8000/api/areas")
      if (areasResponse.ok) {
        const areasResponseData = await areasResponse.json()
        const areasData = areasResponseData?.data || areasResponseData || []
        setAreas(areasData)
      }

      const regionsResponse = await fetch("http://127.0.0.1:8000/api/regions")
      if (regionsResponse.ok) {
        const regionsResponseData = await regionsResponse.json()
        const regionsData = regionsResponseData?.data || regionsResponseData || []
        setRegions(regionsData)
      }

      const salesTypesResponse = await fetch("http://127.0.0.1:8000/api/sales-types")
      if (salesTypesResponse.ok) {
        const salesTypesResponseData = await salesTypesResponse.json()
        const salesTypesData = salesTypesResponseData?.data || salesTypesResponseData || []
        setSalesTypes(salesTypesData)
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.username || !formData.role) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      let response;
      
      // If there's a profile picture to upload, use FormData
      if (formData.profile_picture) {
        const formDataToSend = new FormData()
        formDataToSend.append('name', formData.name)
        formDataToSend.append('email', formData.email)
        formDataToSend.append('username', formData.username)
        formDataToSend.append('contact_number', formData.contact_number)
        formDataToSend.append('address', formData.address)
        formDataToSend.append('profile_picture', formData.profile_picture)
        formDataToSend.append('passwordHash', formData.password || user.passwordHash)
        formDataToSend.append('role', formData.role === "admin" ? "SystemAdmin" : formData.role === "regionalUser" ? "RegionalUser" : "Viewer")
        // Only append numeric fields if they have values
        if (formData.areaId) formDataToSend.append('areaId', formData.areaId)
        if (formData.regionId) formDataToSend.append('regionId', formData.regionId)
        if (formData.salesTypeId) formDataToSend.append('salesTypeId', formData.salesTypeId)
        if (formData.annualTarget) formDataToSend.append('annualTarget', formData.annualTarget)
        
        if (formData.role === "regionalUser") {
          if (formData.salesCounselorTarget) formDataToSend.append('salesCounselorTarget', formData.salesCounselorTarget)
          if (formData.policySoldTarget) formDataToSend.append('policySoldTarget', formData.policySoldTarget)
          if (formData.agencyCoopTarget) formDataToSend.append('agencyCoopTarget', formData.agencyCoopTarget)
        }

        // Add _method field for Laravel to recognize this as a PUT request
        formDataToSend.append('_method', 'PUT')
        
        response = await fetch(`http://127.0.0.1:8000/api/users/${user.userId}`, {
          method: "POST",
          body: formDataToSend,
        })
      } else {
        // No profile picture, use JSON
        const requestData: any = {
          name: formData.name,
          email: formData.email,
          username: formData.username,
          contact_number: formData.contact_number,
          address: formData.address,
          passwordHash: formData.password || user.passwordHash,
          role: formData.role === "admin" ? "SystemAdmin" : formData.role === "regionalUser" ? "RegionalUser" : "Viewer"
        }
        
        // Only include numeric fields if they have values
        if (formData.areaId) requestData.areaId = formData.areaId
        if (formData.regionId) requestData.regionId = formData.regionId
        if (formData.salesTypeId) requestData.salesTypeId = formData.salesTypeId
        if (formData.annualTarget) requestData.annualTarget = formData.annualTarget
        
        if (formData.role === "regionalUser") {
          if (formData.salesCounselorTarget) requestData.salesCounselorTarget = formData.salesCounselorTarget
          if (formData.policySoldTarget) requestData.policySoldTarget = formData.policySoldTarget
          if (formData.agencyCoopTarget) requestData.agencyCoopTarget = formData.agencyCoopTarget
        }

        response = await fetch(`http://127.0.0.1:8000/api/users/${user.userId}`, {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestData),
        })
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user")
      }

      setSuccessMessage(`User ${result.data?.name || 'Unknown'} has been updated successfully.`)
      
      // Refresh user data in auth context if this is the current user
      if (result.data && result.data.userId === user.userId) {
        console.log('Refreshing user data after profile update')
        await refreshUser()
      }
      
      if (formData.role === "regionalUser" && formData.annualTarget) {
        console.log("[v0] User targets updated, triggering dashboard refresh")
        triggerRefresh()
      }

      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
    if (successMessage) setSuccessMessage("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, profile_picture: file }))
    if (error) setError("")
    if (successMessage) setSuccessMessage("")
  }

  const handleAreaChange = (value: string) => {
    setFormData({ ...formData, areaId: value, regionId: "" })
  }

  const handleRegionChange = (value: string) => {
    setFormData({ ...formData, regionId: value })
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
      areaId: "",
      regionId: "",
      salesTypeId: "",
      annualTarget: "",
      salesCounselorTarget: "",
      policySoldTarget: "",
      agencyCoopTarget: "",
    }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading user data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}
          {successMessage && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                ref={nameInputRef}
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_number">Contact Number</Label>
              <Input
                id="contact_number"
                type="tel"
                value={formData.contact_number}
                onChange={(e) => handleInputChange("contact_number", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile_picture">Profile Picture</Label>
            <Input
              id="profile_picture"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {formData.profile_picture ? (
              <div className="mt-2">
                <p className="text-sm text-gray-600">New file: {formData.profile_picture.name}</p>
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(formData.profile_picture)}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-full border"
                  />
                </div>
              </div>
            ) : formData.profile_picture_url ? (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Current profile picture:</p>
                <div className="mt-2">
                  <img
                    src={formData.profile_picture_url}
                    alt="Current profile"
                    className="w-20 h-20 object-cover rounded-full border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave empty to keep current password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="regionalUser">Regional User</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.role === "regionalUser" && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="areaId">Area</Label>
                  <Select value={formData.areaId} onValueChange={handleAreaChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area?.areaId || area?.id} value={(area?.areaId || area?.id || '').toString()}>
                          {area?.areaName || 'Unknown Area'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regionId">Region</Label>
                  <Select value={formData.regionId} onValueChange={handleRegionChange} disabled={!formData.areaId}>
                    <SelectTrigger>
                      <SelectValue placeholder={!formData.areaId ? "Select area first" : "Select region"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRegions.map((region) => (
                        <SelectItem key={region?.regionId || region?.id} value={(region?.regionId || region?.id || '').toString()}>
                          {region?.regionName || 'Unknown Region'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesTypeId">Sales Type</Label>
                  <Select
                    value={formData.salesTypeId}
                    onValueChange={(value) => setFormData({ ...formData, salesTypeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sales type" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesTypes.map((type) => (
                        <SelectItem key={type?.salesTypeId || type?.id} value={(type?.salesTypeId || type?.id || '').toString()}>
                          {type?.salesTypeName || 'Unknown Type'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualTarget">Annual Premium Target *</Label>
                <Input
                  id="annualTarget"
                  type="number"
                  placeholder="0"
                  value={formData.annualTarget}
                  onChange={(e) => handleInputChange("annualTarget", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salesCounselorTarget">Sales Counselor Target *</Label>
                  <Input
                    id="salesCounselorTarget"
                    type="number"
                    placeholder="0"
                    value={formData.salesCounselorTarget}
                    onChange={(e) => handleInputChange("salesCounselorTarget", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policySoldTarget">Policy Sold Target *</Label>
                  <Input
                    id="policySoldTarget"
                    type="number"
                    placeholder="0"
                    value={formData.policySoldTarget}
                    onChange={(e) => handleInputChange("policySoldTarget", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agencyCoopTarget">Agency Coop Target *</Label>
                  <Input
                    id="agencyCoopTarget"
                    type="number"
                    placeholder="0"
                    value={formData.agencyCoopTarget}
                    onChange={(e) => handleInputChange("agencyCoopTarget", e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !formData.name || !formData.email || !formData.username || !formData.role}>
              {isSubmitting ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}