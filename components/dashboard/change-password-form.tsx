"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, CheckCircle, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ChangePasswordFormProps {
  userId: number
  userName: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ChangePasswordForm({ userId, userName, onSuccess, onCancel }: ChangePasswordFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required"
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required"
    } else if (formData.newPassword.length < 4) {
      newErrors.newPassword = "New password must be at least 4 characters"
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password"
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "New password must be different from current password"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
          new_password_confirmation: formData.confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Password Changed Successfully",
          description: `Password has been updated for ${userName}`,
          variant: "default",
        })
        
        // Reset form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
        
        // Call success callback after a short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess()
          }
        }, 1500)
      } else {
        throw new Error(data.message || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-blue-100 rounded-full">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-xl">Change Password</CardTitle>
        <p className="text-sm text-gray-600">Update password for {userName}</p>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className={errors.currentPassword ? "border-red-500" : ""}
                placeholder="Enter current password"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
                disabled={isSubmitting}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-red-600">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                className={errors.newPassword ? "border-red-500" : ""}
                placeholder="Enter new password"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
                disabled={isSubmitting}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-red-600">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={errors.confirmPassword ? "border-red-500" : ""}
                placeholder="Confirm new password"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={isSubmitting}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Changing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}