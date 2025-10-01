"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, CheckCircle, Lock, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface BasicChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BasicChangePasswordModal({ isOpen, onClose }: BasicChangePasswordModalProps) {
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
  const { user } = useAuth()

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
    
    const isValid = validateForm()
    
    if (!isValid) {
      return
    }
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to change your password",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${user.userId}/change-password`, {
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
          description: `Password has been updated for ${user.name}`,
          variant: "default",
        })
        
        // Reset form and close modal
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
        onClose()
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

  const resetForm = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Lock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Change Password</h2>
              <p className="text-sm text-gray-600">Update your password</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, currentPassword: e.target.value }))
                  }}
                  className={`w-full ${errors.currentPassword ? "border-red-500" : ""}`}
                  placeholder="Enter current password"
                  disabled={isSubmitting}
                  autoComplete="current-password"
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, newPassword: e.target.value }))
                  }}
                  className={`w-full ${errors.newPassword ? "border-red-500" : ""}`}
                placeholder="Enter new password (min 4 characters)"
                disabled={isSubmitting}
                autoComplete="new-password"
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))
                  }}
                  className={`w-full ${errors.confirmPassword ? "border-red-500" : ""}`}
                placeholder="Confirm new password (min 4 characters)"
                disabled={isSubmitting}
                autoComplete="new-password"
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


            {/* Buttons */}
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
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
