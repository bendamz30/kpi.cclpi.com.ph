"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{email?: string, password?: string}>({})
  const { login, isLoading, loginError } = useAuth()


  const validateForm = () => {
    const errors: {email?: string, password?: string} = {}
    
    if (!email.trim()) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address"
    }
    
    if (!password.trim()) {
      errors.password = "Password is required"
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (!validateForm()) {
      return
    }

    const result = await login(email, password)
    
    if (!result.success) {
      // Error will be handled by context and displayed automatically
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)' }}>
      <Card className="w-full max-w-md shadow-2xl border-2" style={{ borderColor: '#4cb1e9' }}>
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200">
            <Image
              src="/cclpi-plans-logo.png"
              alt="CCLPI PLANS Logo"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold" style={{ color: '#013f99' }}>CCLPI PLANS</CardTitle>
            <CardDescription className="mt-1" style={{ color: '#4cb1e9' }}>Sales Dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) {
                    setFieldErrors(prev => ({ ...prev, email: undefined }))
                  }
                }}
                placeholder="Enter your email"
                className={`h-11 ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: undefined }))
                    }
                  }}
                  placeholder="Enter your password"
                  className={`h-11 pr-10 ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.password}
                </p>
              )}
            </div>
            
            {loginError && (
              <div className="flex items-start space-x-2 p-4 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Login Failed</p>
                  <p className="text-sm text-red-600 mt-1">{loginError}</p>
                </div>
              </div>
            )}
            
            
            <Button 
              type="submit" 
              className="w-full h-11 text-white font-medium" 
              style={{ backgroundColor: '#013f99' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#012d73';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#013f99';
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
