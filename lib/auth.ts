import type { User } from "./mock-data"

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

export const getStoredAuth = (): AuthState => {
  if (typeof window === "undefined") {
    return { user: null, isAuthenticated: false }
  }

  const stored = localStorage.getItem("auth")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error("Error parsing auth data:", error)
      localStorage.removeItem("auth")
    }
  }
  return { user: null, isAuthenticated: false }
}

export const setStoredAuth = (auth: AuthState) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth", JSON.stringify(auth))
  }
}

export const clearStoredAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth")
  }
}
