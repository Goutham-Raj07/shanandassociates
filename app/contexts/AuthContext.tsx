"use client"

import React, { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  user_type: 'admin' | 'client'
  full_name?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (userData: {
    email: string
    password: string
    full_name: string
    mobile: string
    address: string
    user_type: 'client' | 'admin'
  }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isStuck, setIsStuck] = useState(false)
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null)

  useEffect(() => {
    // Check for stuck loading state
    if (loading) {
      setLoadingStartTime(Date.now())
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.log('Loading taking too long, refreshing...')
          window.location.reload()
        }
      }, 5000)
      return () => clearTimeout(timeoutId)
    }
  }, [loading])

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (session?.user) {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError) throw profileError

          setUser({
            id: session.user.id,
            email: session.user.email!,
            user_type: profile.user_type,
            full_name: profile.full_name
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        toast.error('Failed to initialize authentication')
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setUser({
          id: session.user.id,
          email: session.user.email!,
          user_type: profile?.user_type,
          full_name: profile?.full_name
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Get user profile after sign in
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      setUser({
        id: data.user.id,
        email: data.user.email!,
        user_type: profile.user_type,
        full_name: profile.full_name
      })

    } catch (error: any) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (userData: {
    email: string
    password: string
    full_name: string
    mobile: string
    address: string
    user_type: 'client' | 'admin'
  }) => {
    try {
      setLoading(true)
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      })

      if (error) throw error

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: data.user?.id,
          email: userData.email,
          full_name: userData.full_name,
          mobile: userData.mobile,
          address: userData.address,
          user_type: userData.user_type
        }])

      if (profileError) throw profileError

      toast.success('Account created successfully! Please verify your email.')
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast.error(error.message || 'Failed to create account')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error(error.message || 'Failed to sign out')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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