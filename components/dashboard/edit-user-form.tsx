"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { regions, salesTypes } from "@/lib/mock-data"

interface EditUserFormProps {
  user: any
  onSuccess: () => void
  onCancel: () => void
}

export function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    passwordHash: "",
    role: user.role || "Viewer",
    regionId: user.regionId || "",
    salesTypeId: user.salesTypeId || "",
    annualTarget: user.annualTarget || "",
    salesCounselorTarget: user.salesCounselorTarget || "",
    policySoldTarget: user.policySoldTarget || "",
    agencyCoopTarget: user.agencyCoopTarget || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        passwordHash: formData.passwordHash || user.passwordHash,
        role: formData.role,
        regionId: formData.regionId ? Number.parseInt(formData.regionId) : null,
        salesTypeId: formData.salesTypeId ? Number.parseInt(formData.salesTypeId) : null,
        annualTarget: formData.role === "RegionalUser" ? Number.parseFloat(formData.annualTarget) : null,
        salesCounselorTarget: formData.role === "RegionalUser" ? Number.parseInt(formData.salesCounselorTarget) : null,
        policySoldTarget: formData.role === "RegionalUser" ? Number.parseInt(formData.policySoldTarget) : null,
        agencyCoopTarget: formData.role === "RegionalUser" ? Number.parseInt(formData.agencyCoopTarget) : null,
      }

      const response = await fetch(`/api/users/${user.userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update user")
      }
    } catch (error) {
      setError("Network error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Edit User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">New Password (leave blank to keep current)</Label>
            <Input
              id="password"
              type="password"
              value={formData.passwordHash}
              onChange={(e) => setFormData({ ...formData, passwordHash: e.target.value })}
              placeholder="Enter new password or leave blank"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                  <SelectItem value="RegionalUser">Regional User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Select
                value={formData.regionId.toString()}
                onValueChange={(value) => setFormData({ ...formData, regionId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No Region</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.regionId} value={region.regionId.toString()}>
                      {region.regionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.role === "RegionalUser" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-sm text-gray-700">Regional User Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salesType">Sales Type</Label>
                  <Select
                    value={formData.salesTypeId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, salesTypeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sales type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Sales Type</SelectItem>
                      {salesTypes.map((type) => (
                        <SelectItem key={type.salesTypeId} value={type.salesTypeId.toString()}>
                          {type.typeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="annualTarget">Annual Target (₱)</Label>
                  <Input
                    id="annualTarget"
                    type="number"
                    value={formData.annualTarget}
                    onChange={(e) => setFormData({ ...formData, annualTarget: e.target.value })}
                    placeholder="e.g., 1000000"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="salesCounselorTarget">Sales Counselor Target</Label>
                  <Input
                    id="salesCounselorTarget"
                    type="number"
                    value={formData.salesCounselorTarget}
                    onChange={(e) => setFormData({ ...formData, salesCounselorTarget: e.target.value })}
                    placeholder="e.g., 165"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="policySoldTarget">Policy Sold Target</Label>
                  <Input
                    id="policySoldTarget"
                    type="number"
                    value={formData.policySoldTarget}
                    onChange={(e) => setFormData({ ...formData, policySoldTarget: e.target.value })}
                    placeholder="e.g., 1362"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="agencyCoopTarget">Agency Coop Target</Label>
                  <Input
                    id="agencyCoopTarget"
                    type="number"
                    value={formData.agencyCoopTarget}
                    onChange={(e) => setFormData({ ...formData, agencyCoopTarget: e.target.value })}
                    placeholder="e.g., 12"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update User"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
