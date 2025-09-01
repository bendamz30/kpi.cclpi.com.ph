"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { regions } from "@/lib/mock-data"

interface AddUserFormProps {
  onUserAdded: () => void
}

export function AddUserForm({ onUserAdded }: AddUserFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    passwordHash: "",
    role: "",
    regionId: "",
    annualTarget: "",
    salesCounselorTarget: "",
    policySoldTarget: "",
    agencyCoopTarget: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        passwordHash: formData.passwordHash || "PLEASE_REPLACE_WITH_HASH",
        role: formData.role,
        regionId: formData.regionId ? Number.parseInt(formData.regionId) : null,
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
        regionId: "",
        annualTarget: "",
        salesCounselorTarget: "",
        policySoldTarget: "",
        agencyCoopTarget: "",
      })

      onUserAdded()
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New User</CardTitle>
        <CardDescription>Create a new user account with appropriate role and permissions.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
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
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                  <SelectItem value="RegionalUser">Regional User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === "RegionalUser" && (
              <div className="space-y-2">
                <Label htmlFor="regionId">Region *</Label>
                <Select
                  value={formData.regionId}
                  onValueChange={(value) => setFormData({ ...formData, regionId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.regionId} value={region.regionId.toString()}>
                        {region.regionName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {formData.role === "RegionalUser" && (
            <>
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
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="passwordHash">Temporary Password</Label>
            <Input
              id="passwordHash"
              type="password"
              placeholder="Leave empty for default"
              value={formData.passwordHash}
              onChange={(e) => setFormData({ ...formData, passwordHash: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Adding User..." : "Add User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
