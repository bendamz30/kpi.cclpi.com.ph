"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockSalesReps, mockUsers } from "@/lib/mock-data"

interface AddSalesReportFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function AddSalesReportForm({ onSuccess, onCancel }: AddSalesReportFormProps) {
  const [formData, setFormData] = useState({
    salesRepId: "",
    reportDate: "",
    premiumActual: "",
    salesCounselorActual: "",
    policySoldActual: "",
    agencyCoopActual: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Get RegionalUser sales reps
  const regionalUsers = mockUsers.filter((user) => user.role === "RegionalUser")
  const availableSalesReps = mockSalesReps.filter(
    (rep) => regionalUsers.some((user) => user.userId === rep.userId) || rep.userId === null,
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salesRepId: Number.parseInt(formData.salesRepId),
          reportDate: formData.reportDate,
          premiumActual: Number.parseFloat(formData.premiumActual),
          salesCounselorActual: Number.parseInt(formData.salesCounselorActual),
          policySoldActual: Number.parseInt(formData.policySoldActual),
          agencyCoopActual: Number.parseInt(formData.agencyCoopActual),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create sales report")
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Sales Report</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salesRepId">Sales Representative *</Label>
              <Select value={formData.salesRepId} onValueChange={(value) => handleInputChange("salesRepId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales rep" />
                </SelectTrigger>
                <SelectContent>
                  {availableSalesReps.map((rep) => (
                    <SelectItem key={rep.salesRepId} value={rep.salesRepId.toString()}>
                      {rep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportDate">Report Date *</Label>
              <Input
                id="reportDate"
                type="date"
                value={formData.reportDate}
                onChange={(e) => handleInputChange("reportDate", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="premiumActual">Premium Actual *</Label>
              <Input
                id="premiumActual"
                type="number"
                step="0.01"
                value={formData.premiumActual}
                onChange={(e) => handleInputChange("premiumActual", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesCounselorActual">Sales Counselor Actual *</Label>
              <Input
                id="salesCounselorActual"
                type="number"
                value={formData.salesCounselorActual}
                onChange={(e) => handleInputChange("salesCounselorActual", e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="policySoldActual">Policy Sold Actual *</Label>
              <Input
                id="policySoldActual"
                type="number"
                value={formData.policySoldActual}
                onChange={(e) => handleInputChange("policySoldActual", e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agencyCoopActual">Agency Coop Actual *</Label>
              <Input
                id="agencyCoopActual"
                type="number"
                value={formData.agencyCoopActual}
                onChange={(e) => handleInputChange("agencyCoopActual", e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Report"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
