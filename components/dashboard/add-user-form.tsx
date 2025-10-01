"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRealTime } from "@/components/providers/real-time-provider"

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

interface AddUserFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function AddUserForm({ onSuccess, onCancel }: AddUserFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    contact_number: "",
    address: "",
    profile_picture: null as File | null,
    role: "",
    areaId: "",
    regionId: "",
    salesTypeId: "",
    annualTarget: "",
    salesCounselorTarget: "",
    policySoldTarget: "",
    agencyCoopTarget: "",
  })
  const [areas, setAreas] = useState<Area[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([])
  const [salesTypes, setSalesTypes] = useState<SalesType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { triggerRefresh } = useRealTime()

  useEffect(() => {
    fetchDropdownData()
  }, [])

  useEffect(() => {
    if (formData.areaId) {
      const filtered = regions.filter((region) => region.areaId === Number.parseInt(formData.areaId))
      setFilteredRegions(filtered)
      setFormData((prev) => ({ ...prev, regionId: "" }))
    } else {
      setFilteredRegions([])
    }
  }, [formData.areaId, regions])

  useEffect(() => {
    if (formData.role && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [formData.role])

  const fetchDropdownData = async () => {
    try {
      const areasResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/areas`)
      if (areasResponse.ok) {
        const areasResponseData = await areasResponse.json()
        setAreas(areasResponseData.data || [])
      }

      const regionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/regions`)
      if (regionsResponse.ok) {
        const regionsResponseData = await regionsResponse.json()
        setRegions(regionsResponseData.data || [])
      }

      const salesTypesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales-types`)
      if (salesTypesResponse.ok) {
        const salesTypesResponseData = await salesTypesResponse.json()
        setSalesTypes(salesTypesResponseData.data || [])
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccessMessage("")

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('username', formData.username)
      formDataToSend.append('contact_number', formData.contact_number)
      formDataToSend.append('address', formData.address)
      if (formData.profile_picture) {
        formDataToSend.append('profile_picture', formData.profile_picture)
      }
      formDataToSend.append('role', formData.role)
      // Only append numeric fields if they have values
      if (formData.areaId) formDataToSend.append('areaId', formData.areaId)
      if (formData.regionId) formDataToSend.append('regionId', formData.regionId)
      if (formData.salesTypeId) formDataToSend.append('salesTypeId', formData.salesTypeId)
      if (formData.annualTarget) formDataToSend.append('annualTarget', formData.annualTarget)
      if (formData.salesCounselorTarget) formDataToSend.append('salesCounselorTarget', formData.salesCounselorTarget)
      if (formData.policySoldTarget) formDataToSend.append('policySoldTarget', formData.policySoldTarget)
      if (formData.agencyCoopTarget) formDataToSend.append('agencyCoopTarget', formData.agencyCoopTarget)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: "POST",
        body: formDataToSend,
      })

      if (response.ok) {
        setSuccessMessage("User created successfully!")
        triggerRefresh()
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to create user")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add user")
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}
          {successMessage && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">{successMessage}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                ref={nameInputRef}
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter full name"
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
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Enter username"
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
                placeholder="Enter contact number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter address"
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
            {formData.profile_picture && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Selected: {formData.profile_picture.name}</p>
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(formData.profile_picture)}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-full border"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SystemAdmin">System Admin</SelectItem>
                <SelectItem value="RegionalUser">Regional User</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === "RegionalUser" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Select value={formData.areaId} onValueChange={(value) => handleInputChange("areaId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an area" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Select value={formData.regionId} onValueChange={(value) => handleInputChange("regionId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRegions.map((region) => (
                      <SelectItem key={region.regionId} value={region.regionId.toString()}>
                        {region.regionName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salesType">Sales Type</Label>
                <Select value={formData.salesTypeId} onValueChange={(value) => handleInputChange("salesTypeId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sales type" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesTypes.map((salesType) => (
                      <SelectItem key={salesType.salesTypeId} value={salesType.salesTypeId.toString()}>
                        {salesType.salesTypeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualTarget">Annual Target</Label>
                  <Input
                    id="annualTarget"
                    type="number"
                    value={formData.annualTarget}
                    onChange={(e) => handleInputChange("annualTarget", e.target.value)}
                    placeholder="Enter annual target"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salesCounselorTarget">Sales Counselor Target</Label>
                  <Input
                    id="salesCounselorTarget"
                    type="number"
                    value={formData.salesCounselorTarget}
                    onChange={(e) => handleInputChange("salesCounselorTarget", e.target.value)}
                    placeholder="Enter sales counselor target"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policySoldTarget">Policy Sold Target</Label>
                  <Input
                    id="policySoldTarget"
                    type="number"
                    value={formData.policySoldTarget}
                    onChange={(e) => handleInputChange("policySoldTarget", e.target.value)}
                    placeholder="Enter policy sold target"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agencyCoopTarget">Agency Coop Target</Label>
                  <Input
                    id="agencyCoopTarget"
                    type="number"
                    value={formData.agencyCoopTarget}
                    onChange={(e) => handleInputChange("agencyCoopTarget", e.target.value)}
                    placeholder="Enter agency coop target"
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
              {isSubmitting ? "Saving..." : "Create User"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}