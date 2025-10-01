"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRealTime } from "@/components/providers/real-time-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import type { User } from "@/lib/mock-data"

interface AddSalesReportFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function AddSalesReportForm({ onSuccess, onCancel }: AddSalesReportFormProps) {
  const { hasPermission, user } = useAuth()
  const { triggerRefresh } = useRealTime()
  const [formData, setFormData] = useState({
    salesRepId: "",
    reportDate: new Date().toISOString().split("T")[0], // Default to today's date
    premiumActual: "",
    salesCounselorActual: "",
    policySoldActual: "",
    agencyCoopActual: "",
  })
  const [regionalUsers, setRegionalUsers] = useState<User[]>([]) // Fetch users dynamically
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const fetchRegionalUsers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
        if (response.ok) {
          const usersResponse = await response.json()
          const users = usersResponse?.data || usersResponse || []
          const regUsers = users.filter((user: User) => user.role === "RegionalUser")
          setRegionalUsers(regUsers)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }
    fetchRegionalUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccessMessage("")

    if (
      !formData.salesRepId ||
      !formData.reportDate ||
      !formData.premiumActual ||
      !formData.salesCounselorActual ||
      !formData.policySoldActual ||
      !formData.agencyCoopActual
    ) {
      setError("Please complete all fields.")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, {
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
          createdBy: user?.userId || 113, // Use current user's ID, fallback to admin user
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create sales report")
      }

      setSuccessMessage(result.message)
      setFormData({
        salesRepId: "",
        reportDate: new Date().toISOString().split("T")[0],
        premiumActual: "",
        salesCounselorActual: "",
        policySoldActual: "",
        agencyCoopActual: "",
      })

      // Trigger real-time refresh to update dashboard
      console.log("[v0] Sales report created, triggering dashboard refresh")
      triggerRefresh()

      // Call onSuccess after a brief delay to show the message
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear messages when user starts typing
    if (error) setError("")
    if (successMessage) setSuccessMessage("")
  }

  const ConfirmSubmit = ({ children }: { children: React.ReactNode }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Sales Report</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to save this sales report? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit}>{isSubmitting ? "Saving..." : "Save Report"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  // Check if user has permission to create reports
  if (!hasPermission('reports:create')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Add Sales Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">You don't have permission to create sales reports.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Sales Report</CardTitle>
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
              <Label htmlFor="salesRepId">Sales Representative *</Label>
              <Select value={formData.salesRepId} onValueChange={(value) => handleInputChange("salesRepId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales rep" />
                </SelectTrigger>
                <SelectContent>
                  {regionalUsers.map((user: User) => (
                    <SelectItem key={user.userId || user.id} value={(user.userId || user.id || '').toString()}>
                      {user.name}
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
            <ConfirmSubmit>
              <Button type="button" disabled={isSubmitting || !formData.salesRepId}>
                {isSubmitting ? "Saving..." : "Create Report"}
              </Button>
            </ConfirmSubmit>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
