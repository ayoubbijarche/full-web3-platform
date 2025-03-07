'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { pb } from '@/lib/pb'

interface AuthContextType {
  isAuthenticated: boolean
  user: any | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    // Check if user is already authenticated
    const authData = pb.authStore.model
    if (authData) {
      setIsAuthenticated(true)
      setUser(authData)
    }

    // Subscribe to auth state changes
    pb.authStore.onChange((token, model) => {
      setIsAuthenticated(!!model)
      setUser(model)
    })
  }, [])

  const login = async (username: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(username, password)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = () => {
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
