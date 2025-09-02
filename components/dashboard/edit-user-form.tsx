"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

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
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    password: "", // Changed from passwordHash to password for clarity
    role: user.role === "SystemAdmin" ? "admin" : user.role === "RegionalUser" ? "regionalUser" : "viewer",
    areaId: "", // Added missing areaId field
    regionId: user.regionId?.toString() || "",
    salesTypeId: user.salesTypeId?.toString() || "",
    annualTarget: user.annualTarget?.toString() || "",
    salesCounselorTarget: user.salesCounselorTarget?.toString() || "",
    policySoldTarget: user.policySoldTarget?.toString() || "",
    agencyCoopTarget: user.agencyCoopTarget?.toString() || "",
  })

  const [areas, setAreas] = useState<Area[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([])
  const [salesTypes, setSalesTypes] = useState<SalesType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDropdownData()
  }, [])

  useEffect(() => {
    if (formData.areaId) {
      const filtered = regions.filter((region) => region.areaId === Number.parseInt(formData.areaId))
      setFilteredRegions(filtered)
      // Don't clear regionId if it's valid for the selected area
      const currentRegion = regions.find((r) => r.regionId === Number.parseInt(formData.regionId))
      if (currentRegion && currentRegion.areaId !== Number.parseInt(formData.areaId)) {
        setFormData((prev) => ({ ...prev, regionId: "" }))
      }
    } else {
      setFilteredRegions([])
    }
  }, [formData.areaId, regions])

  useEffect(() => {
    if (user.regionId && regions.length > 0 && !formData.areaId) {
      const userRegion = regions.find((r) => r.regionId === user.regionId)
      if (userRegion) {
        setFormData((prev) => ({ ...prev, areaId: userRegion.areaId.toString() }))
      }
    }
  }, [user.regionId, regions, formData.areaId])

  const fetchDropdownData = async () => {
    try {
      const areasResponse = await fetch("/api/areas")
      if (areasResponse.ok) {
        const areasData = await areasResponse.json()
        setAreas(areasData)
      }

      const regionsResponse = await fetch("/api/regions")
      if (regionsResponse.ok) {
        const regionsData = await regionsResponse.json()
        setRegions(regionsData)
      }

      const salesTypesResponse = await fetch("/api/sales-types")
      if (salesTypesResponse.ok) {
        const salesTypesData = await salesTypesResponse.json()
        setSalesTypes(salesTypesData)
      }
    } catch (error) {
      console.error("Failed to fetch dropdown data:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        passwordHash: formData.password || user.passwordHash,
        role: formData.role === "admin" ? "SystemAdmin" : formData.role === "regionalUser" ? "RegionalUser" : "Viewer",
        areaId: formData.areaId ? Number.parseInt(formData.areaId) : null,
        regionId: formData.regionId ? Number.parseInt(formData.regionId) : null,
        salesTypeId: formData.salesTypeId ? Number.parseInt(formData.salesTypeId) : null,
        annualTarget: formData.annualTarget ? Number.parseFloat(formData.annualTarget) : undefined,
        ...(formData.role === "regionalUser" && {
          salesCounselorTarget: formData.salesCounselorTarget
            ? Number.parseInt(formData.salesCounselorTarget)
            : undefined,
          policySoldTarget: formData.policySoldTarget ? Number.parseInt(formData.policySoldTarget) : undefined,
          agencyCoopTarget: formData.agencyCoopTarget ? Number.parseInt(formData.agencyCoopTarget) : undefined,
        }),
      }

      const response = await fetch(`/api/users/${user.userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user")
      }

      toast({
        title: "Success",
        description: `User ${result.user.name} has been updated successfully.`,
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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

  return (
    <div className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">User Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                ref={nameInputRef}
                id="name"
                aria-label="User full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                aria-label="User email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                aria-label="User password"
                placeholder="Leave empty to keep current"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger aria-label="Select user role" aria-describedby="role-description">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="regionalUser">Regional User</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <div id="role-description" className="sr-only">
                Select the user's role. Regional User role will show additional assignment and target fields.
              </div>
            </div>
          </div>
        </div>

        <div className={`space-y-4 ${formData.role !== "regionalUser" ? "hidden" : ""}`}>
          <h3 className="text-lg font-medium">Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="areaId">Area</Label>
              <Select value={formData.areaId} onValueChange={handleAreaChange}>
                <SelectTrigger aria-label="Select area" aria-describedby="area-description">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.areaId} value={area.areaId.toString()}>
                      {area.areaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div id="area-description" className="sr-only">
                Select the area. This will filter available regions.
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="regionId">Region</Label>
              <Select value={formData.regionId} onValueChange={handleRegionChange} disabled={!formData.areaId}>
                <SelectTrigger aria-label="Select region" aria-describedby="region-description">
                  <SelectValue placeholder={!formData.areaId ? "Select area first" : "Select region"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredRegions.map((region) => (
                    <SelectItem key={region.regionId} value={region.regionId.toString()}>
                      {region.regionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div id="region-description" className="sr-only">
                Select the region within the chosen area.
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salesTypeId">Sales Type</Label>
              <Select
                value={formData.salesTypeId}
                onValueChange={(value) => setFormData({ ...formData, salesTypeId: value })}
              >
                <SelectTrigger aria-label="Select sales type" aria-describedby="salestype-description">
                  <SelectValue placeholder="Select sales type" />
                </SelectTrigger>
                <SelectContent>
                  {salesTypes.map((type) => (
                    <SelectItem key={type.salesTypeId} value={type.salesTypeId.toString()}>
                      {type.salesTypeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div id="salestype-description" className="sr-only">
                Select the sales type for this user.
              </div>
            </div>
          </div>
        </div>

        <div className={`space-y-4 ${formData.role !== "regionalUser" ? "hidden" : ""}`}>
          <h3 className="text-lg font-medium">Sales Targets</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="annualTarget">Annual Premium Target *</Label>
              <Input
                id="annualTarget"
                type="number"
                aria-label="Annual premium target amount"
                placeholder="12000000"
                value={formData.annualTarget}
                onChange={(e) => setFormData({ ...formData, annualTarget: e.target.value })}
                required={formData.role === "regionalUser"}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salesCounselorTarget">Sales Counselor Target *</Label>
                <Input
                  id="salesCounselorTarget"
                  type="number"
                  aria-label="Sales counselor target count"
                  placeholder="165"
                  value={formData.salesCounselorTarget}
                  onChange={(e) => setFormData({ ...formData, salesCounselorTarget: e.target.value })}
                  required={formData.role === "regionalUser"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policySoldTarget">Policy Sold Target *</Label>
                <Input
                  id="policySoldTarget"
                  type="number"
                  aria-label="Policy sold target count"
                  placeholder="1362"
                  value={formData.policySoldTarget}
                  onChange={(e) => setFormData({ ...formData, policySoldTarget: e.target.value })}
                  required={formData.role === "regionalUser"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencyCoopTarget">Agency Coop Target *</Label>
                <Input
                  id="agencyCoopTarget"
                  type="number"
                  aria-label="Agency cooperation target count"
                  placeholder="12"
                  value={formData.agencyCoopTarget}
                  onChange={(e) => setFormData({ ...formData, agencyCoopTarget: e.target.value })}
                  required={formData.role === "regionalUser"}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update User"}
          </Button>
        </div>
      </form>
    </div>
  )
}
