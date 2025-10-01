"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '@/lib/mock-data'

export type UserRole = 'Admin' | 'SystemAdmin' | 'Viewer' | 'RegionalUser'

export interface AuthUser extends User {
  role: UserRole
  areaId?: number | null
  regionId?: number | null
  salesTypeId?: number | null
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  loginError: string
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  hasPermission: (permission: string) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// Mock users for authentication
const mockUsers: AuthUser[] = [
  {
    userId: 1,
    name: 'Admin User',
    email: 'admin@cclpi.com',
    passwordHash: 'hashed_password',
    role: 'SystemAdmin',
    areaId: null,
    regionId: null,
    salesTypeId: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: null,
  },
  {
    userId: 2,
    name: 'Regional Manager',
    email: 'regional@cclpi.com',
    passwordHash: 'hashed_password',
    role: 'RegionalUser',
    areaId: 1,
    regionId: 1,
    salesTypeId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: null,
  },
  {
    userId: 3,
    name: 'Viewer User',
    email: 'viewer@cclpi.com',
    passwordHash: 'hashed_password',
    role: 'Viewer',
    areaId: null,
    regionId: null,
    salesTypeId: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: null,
  },
  {
    userId: 4,
    name: 'Diana User',
    email: 'diana@cclpi.com.ph',
    passwordHash: 'hashed_password',
    role: 'RegionalUser',
    areaId: 1,
    regionId: 1,
    salesTypeId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: null,
  }
]

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string>("")

  useEffect(() => {
    // Check for existing authentication on mount
    const checkAuth = () => {
      try {
        const storedToken = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('auth_user')
        console.log('Auth check on mount:', { storedToken, storedUser })
        
        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser)
          console.log('Restoring auth state:', userData)
          setUser(userData)
          setToken(storedToken)
          setIsAuthenticated(true)
        } else {
          console.log('No stored auth data found')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Clear storage on error
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      setLoginError("") // Clear any previous error
      console.log('Login attempt:', { email, password })
      
      // Call the real Laravel API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        const errorMessage = data.message || 'Login failed'
        setLoginError(errorMessage)
        return { 
          success: false, 
          error: errorMessage
        }
      }

      const { user: userData, token } = data.data
      
      // Debug: Log the user data to see if profile_picture is included
      console.log('Login API response user data:', userData)
      console.log('Profile picture URL:', userData.profile_picture_url)
      
      // Store authentication data
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      
      setUser(userData)
      setToken(token)
      setIsAuthenticated(true)
      setLoginError("") // Clear error on successful login
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = 'Login failed. Please try again.'
      setLoginError(errorMessage)
      return { 
        success: false, 
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Clear authentication data
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    
    // Simple permission logic based on user role
    switch (user.role) {
      case 'SystemAdmin':
        return true // SystemAdmin has all permissions
      case 'Admin':
        return permission === 'dashboard:view' || permission === 'sales-reps:view' || permission === 'users:view'
      case 'RegionalUser':
        return permission === 'dashboard:view' // RegionalUser can only view dashboard
      case 'Viewer':
        return permission === 'dashboard:view' || permission === 'sales-reps:view'
      default:
        return false
    }
  }

  const refreshUser = async (): Promise<void> => {
    if (!user || !token) return
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const updatedUser = data.data
          console.log('Refreshed user data:', updatedUser)
          console.log('New profile picture URL:', updatedUser.profile_picture_url)
          
          // Update localStorage and state
          localStorage.setItem('auth_user', JSON.stringify(updatedUser))
          setUser(updatedUser)
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    token,
    loginError,
    login,
    logout,
    hasPermission,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}