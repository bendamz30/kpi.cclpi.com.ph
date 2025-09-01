"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Area {
  areaId: number
  areaName: string
}

interface SalesType {
  salesTypeId: number
  typeName: string
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
    passwordHash: "",
    role: "",
    areaId: "",
    region: "",
    salesTypeId: "",
    annualTarget: "",
    salesCounselorTarget: "",
    policySoldTarget: "",
    agencyCoopTarget: "",
  })
  const [areas, setAreas] = useState<Area[]>([])
  const [salesTypes, setSalesTypes] = useState<SalesType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchDropdownData()
    }
  }, [open])

  const fetchDropdownData = async () => {
    try {
      // Fetch areas from areas.json
      const areasResponse = await fetch("/data/areas.json")
      if (areasResponse.ok) {
        const areasData = await areasResponse.json()
        setAreas(areasData)
      }

      // Fetch sales types from salesTypes.json
      const salesTypesResponse = await fetch("/data/salesTypes.json")
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
        passwordHash: formData.passwordHash || "PLEASE_REPLACE_WITH_HASH",
        role: formData.role,
        areaId: formData.areaId ? Number.parseInt(formData.areaId) : null,
        region: formData.region,
        salesTypeId: formData.salesTypeId ? Number.parseInt(formData.salesTypeId) : null,
        annualTarget: formData.annualTarget ? Number.parseFloat(formData.annualTarget) : undefined,
        ...(formData.role === "RegionalUser" && {
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
        passwordHash: "",
        role: "",
        areaId: "",
        region: "",
        salesTypeId: "",
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
      passwordHash: "",
      role: "",
      areaId: "",
      region: "",
      salesTypeId: "",
      annualTarget: "",
      salesCounselorTarget: "",
      policySoldTarget: "",
      agencyCoopTarget: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">User Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passwordHash">Password</Label>
                <Input
                  id="passwordHash"
                  type="password"
                  placeholder="Leave empty for default"
                  value={formData.passwordHash}
                  onChange={(e) => setFormData({ ...formData, passwordHash: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SystemAdmin">System Admin</SelectItem>
                    <SelectItem value="RegionalUser">Regional User</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
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
                  <SelectTrigger>
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
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Enter region"
                />
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
                      <SelectItem key={type.salesTypeId} value={type.salesTypeId.toString()}>
                        {type.typeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {formData.role === "RegionalUser" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Targets</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="annualTarget">Annual Premium Target *</Label>
                  <Input
                    id="annualTarget"
                    type="number"
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
