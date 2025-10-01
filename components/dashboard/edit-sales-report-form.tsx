"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/components/ui/alert-dialog"

interface EditSalesReportFormProps {
  report: {
    reportId: number
    salesRepId: number
    salesRepName: string
    reportDate: string
    premiumActual: number
    salesCounselorActual: number
    policySoldActual: number
    agencyCoopActual: number
  }
  onSuccess: () => void
  onCancel: () => void
}

export function EditSalesReportForm({ report, onSuccess, onCancel }: EditSalesReportFormProps) {
  const { triggerRefresh } = useRealTime()
  const [formData, setFormData] = useState({
    reportDate: report.reportDate.split("T")[0], // Convert to YYYY-MM-DD format
    premiumActual: (report.premiumActual || 0).toString(),
    salesCounselorActual: (report.salesCounselorActual || 0).toString(),
    policySoldActual: (report.policySoldActual || 0).toString(),
    agencyCoopActual: (report.agencyCoopActual || 0).toString(),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const validateForm = () => {
    if (
      !formData.reportDate ||
      !formData.premiumActual ||
      !formData.salesCounselorActual ||
      !formData.policySoldActual ||
      !formData.agencyCoopActual
    ) {
      setError("All fields are required")
      return false
    }

    if (
      Number.parseFloat(formData.premiumActual) < 0 ||
      Number.parseInt(formData.salesCounselorActual) < 0 ||
      Number.parseInt(formData.policySoldActual) < 0 ||
      Number.parseInt(formData.agencyCoopActual) < 0
    ) {
      setError("All values must be non-negative")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/sales/${report.reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        // Trigger real-time refresh to update dashboard
        console.log("[v0] Sales report updated, triggering dashboard refresh")
        triggerRefresh()
        onSuccess()
      } else {
        setError(result.error || "Failed to update report")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
      setShowConfirmDialog(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Edit Sales Report</CardTitle>
          <CardDescription>
            Update sales report for {report.salesRepName} (Report ID: {report.reportId})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="premiumActual">Premium Actual (PHP) *</Label>
              <Input
                id="premiumActual"
                type="number"
                step="0.01"
                min="0"
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
                min="0"
                value={formData.salesCounselorActual}
                onChange={(e) => handleInputChange("salesCounselorActual", e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="policySoldActual">Policy Sold Actual *</Label>
              <Input
                id="policySoldActual"
                type="number"
                min="0"
                value={formData.policySoldActual}
                onChange={(e) => handleInputChange("policySoldActual", e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agencyCoopActual">Agency Cooperation Actual *</Label>
              <Input
                id="agencyCoopActual"
                type="number"
                min="0"
                value={formData.agencyCoopActual}
                onChange={(e) => handleInputChange("agencyCoopActual", e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={() => setShowConfirmDialog(true)} disabled={loading}>
              {loading ? "Updating..." : "Update Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this sales report? This action will modify the data permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={loading}>
              {loading ? "Updating..." : "Update Report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
