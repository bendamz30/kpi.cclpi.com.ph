"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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

interface AddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserAdded: () => void
}

export function AddUserModal({ open, onOpenChange, onUserAdded }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", // Changed from passwordHash to password for clarity
    role: "",
    areaId: "",
    regionId: "",
    salesType: "", // Changed to salesType string instead of salesTypeId
    annualTarget: "",
    salesCounselorTarget: "",
    policySoldTarget: "",
    agencyCoopTarget: "",
  })
  const [areas, setAreas] = useState<Area[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const salesTypeOptions = ["Life Plan", "Memorial Plan", "Insurance"]

  useEffect(() => {
    if (open) {
      fetchDropdownData()
    }
  }, [open])

  useEffect(() => {
    if (formData.areaId) {
      const filtered = regions.filter((region) => region.areaId === Number.parseInt(formData.areaId))
      setFilteredRegions(filtered)
      setFormData((prev) => ({ ...prev, regionId: "" }))
    } else {
      setFilteredRegions([])
    }
  }, [formData.areaId, regions])

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
        passwordHash: formData.password || "PLEASE_REPLACE_WITH_HASH", // Map password to passwordHash for API
        role: formData.role === "admin" ? "SystemAdmin" : formData.role === "regionalUser" ? "RegionalUser" : "Viewer", // Map role values
        areaId: formData.areaId ? Number.parseInt(formData.areaId) : null,
        regionId: formData.regionId ? Number.parseInt(formData.regionId) : null,
        salesType: formData.salesType, // Send salesType as string
        annualTarget: formData.annualTarget ? Number.parseFloat(formData.annualTarget) : undefined,
        ...(formData.role === "regionalUser" && {
          // Check for regionalUser instead of RegionalUser
          salesCounselorTarget: formData.salesCounselorTarget
            ? Number.parseInt(formData.salesCounselorTarget)
            : undefined,
          policySoldTarget: formData.policySoldTarget ? Number.parseInt(formData.policySoldTarget) : undefined,
          agencyCoopTarget: formData.agencyCoopTarget ? Number.parseInt(formData.agencyCoopTarget) : undefined,
        }),
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to add user")
      }

      toast({
        title: "Success",
        description: `User ${result.user.name} has been added successfully.`,
      })

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
        areaId: "",
        regionId: "",
        salesType: "",
        annualTarget: "",
        salesCounselorTarget: "",
        policySoldTarget: "",
        agencyCoopTarget: "",
      })

      onUserAdded()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "",
      areaId: "",
      regionId: "",
      salesType: "",
      annualTarget: "",
      salesCounselorTarget: "",
      policySoldTarget: "",
      agencyCoopTarget: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="add-user-description">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription id="add-user-description">
            Create a new user account with role-based access and regional assignments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
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
                  placeholder="Leave empty for default"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger aria-label="Select user role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="regionalUser">Regional User</SelectItem>
                    <SelectItem value="salesUser">Sales User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="areaId">Area</Label>
                <Select value={formData.areaId} onValueChange={(value) => setFormData({ ...formData, areaId: value })}>
                  <SelectTrigger aria-label="Select area">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="regionId">Region</Label>
                <Select
                  value={formData.regionId}
                  onValueChange={(value) => setFormData({ ...formData, regionId: value })}
                  disabled={!formData.areaId}
                >
                  <SelectTrigger aria-label="Select region">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesType">Sales Type</Label>
                <Select
                  value={formData.salesType}
                  onValueChange={(value) => setFormData({ ...formData, salesType: value })}
                >
                  <SelectTrigger aria-label="Select sales type">
                    <SelectValue placeholder="Select sales type" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {formData.role === "regionalUser" && (
            <div className="space-y-4">
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
                    required
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
                      required
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
                      required
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
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
