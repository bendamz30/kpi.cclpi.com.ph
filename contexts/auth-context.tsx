"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '@/lib/mock-data'

export type UserRole = 'Admin' | 'SystemAdmin' | 'Viewer' | 'RegionalUser'

export interface AuthUser extends User {
  role: UserRole
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Role-based permissions
const ROLE_PERMISSIONS = {
  Admin: [
    'dashboard:view',
    'dashboard:edit',
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    'sales-reps:view',
    'sales-reps:create',
    'sales-reps:edit',
    'sales-reps:delete',
    'reports:view',
    'reports:create',
    'reports:edit',
    'reports:delete',
    'settings:view',
    'settings:edit'
  ],
  SystemAdmin: [
    'dashboard:view',
    'dashboard:edit',
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    'sales-reps:view',
    'sales-reps:create',
    'sales-reps:edit',
    'sales-reps:delete',
    'reports:view',
    'reports:create',
    'reports:edit',
    'reports:delete',
    'settings:view',
    'settings:edit'
  ],
  Viewer: [
    'dashboard:view'
  ],
  RegionalUser: [
    'dashboard:view'
  ]
}

// Generate a simple JWT-like token (for demo purposes)
const generateToken = (user: AuthUser): string => {
  const payload = {
    userId: user.userId,
    email: user.email,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  }
  
  // Simple base64 encoding (in production, use proper JWT)
  return btoa(JSON.stringify(payload))
}

// Decode token
const decodeToken = (token: string): any => {
  try {
    return JSON.parse(atob(token))
  } catch {
    return null
  }
}

// Check if token is valid
const isTokenValid = (token: string): boolean => {
  const decoded = decodeToken(token)
  if (!decoded) return false
  
  return decoded.exp > Date.now()
}

// Secure storage helpers
const setSecureStorage = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value)
  }
}

const getSecureStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(key)
}

const removeSecureStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key)
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null
  })

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = getSecureStorage('auth_token')
      const storedUser = getSecureStorage('auth_user')
      
      if (storedToken && storedUser && isTokenValid(storedToken)) {
        try {
          const user = JSON.parse(storedUser)
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            token: storedToken
          })
        } catch {
          // Invalid stored data, clear it
          removeSecureStorage('auth_token')
          removeSecureStorage('auth_user')
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            token: null
          })
        }
      } else {
        // Clear invalid tokens
        removeSecureStorage('auth_token')
        removeSecureStorage('auth_user')
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          token: null
        })
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Fetch users from API
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const users = await response.json()
      const user = users.find((u: any) => u.email === email)
      
      if (!user) {
        return { success: false, error: 'Invalid email or password' }
      }
      
      // For demo purposes, accept "password" and "cclpi" as valid passwords
      // In production, you would hash and compare passwords
      if (password !== 'password' && password !== 'cclpi') {
        return { success: false, error: 'Invalid email or password' }
      }
      
      const authUser: AuthUser = {
        ...user,
        role: user.role as UserRole
      }
      
      const token = generateToken(authUser)
      
      // Store in secure storage
      setSecureStorage('auth_token', token)
      setSecureStorage('auth_user', JSON.stringify(authUser))
      
      setAuthState({
        user: authUser,
        isAuthenticated: true,
        isLoading: false,
        token
      })
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed. Please try again.' }
    }
  }

  const logout = () => {
    // Clear storage
    removeSecureStorage('auth_token')
    removeSecureStorage('auth_user')
    
    // Reset state
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null
    })
  }

  const hasPermission = (permission: string): boolean => {
    if (!authState.user) return false
    
    const userPermissions = ROLE_PERMISSIONS[authState.user.role] || []
    return userPermissions.includes(permission)
  }

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!authState.user) return false
    
    if (Array.isArray(role)) {
      return role.includes(authState.user.role)
    }
    
    return authState.user.role === role
  }

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    hasPermission,
    hasRole
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
