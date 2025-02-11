"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/database'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (userData: Partial<User> & { password: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Add retry logic for rate limits
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const retryWithBackoff = async (
    fn: () => Promise<any>,
    maxRetries = 3,
    baseDelay = 1000
  ) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error: any) {
        if (error?.message?.includes('rate limit') && i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i)
          toast.info(`Rate limit reached, retrying in ${delay/1000} seconds...`)
          await wait(delay)
          continue
        }
        throw error
      }
    }
  }

  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session?.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
          if (userError) throw userError
          
          setUser(userData)
          // Redirect based on user type
          if (userData.user_type === 'admin') {
            router.push('/admin-dashboard')
          } else {
            router.push('/client-dashboard')
          }
        }
      } catch (error) {
        console.error('Auth init error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
          if (!userError) {
            setUser(userData)
            // Redirect based on user type
            if (userData.user_type === 'admin') {
              router.push('/admin-dashboard')
            } else {
              router.push('/client-dashboard')
            }
          }
        } else {
          setUser(null)
          router.push('/')
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function verifyUserType(userId: string): Promise<'admin' | 'client' | null> {
    const { data, error } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single()

    if (error || !data) {
      console.error('Error verifying user type:', error)
      return null
    }

    return data.user_type as 'admin' | 'client'
  }

  async function fetchUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return
    }

    const userType = await verifyUserType(userId)
    if (!userType) {
      console.error('User type verification failed')
      return
    }

    setUser({ ...data, user_type: userType })
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (userError) throw userError

        setUser(userData)
        toast.success('Signed in successfully')
        
        // Redirect based on user type
        if (userData.user_type === 'admin') {
          router.push('/admin-dashboard')
        } else {
          router.push('/client-dashboard')
        }
      }
    } catch (error: any) {
      toast.error('Failed to sign in', {
        description: error.message
      })
      throw error
    }
  }

  const signUp = async (userData: Partial<User> & { password: string }) => {
    try {
      const { email, password, ...profileData } = userData

      // Always set user_type as client for new signups
      const { data: authData, error: authError } = await retryWithBackoff(() =>
        supabase.auth.signUp({
          email: email!,
          password,
          options: {
            data: {
              full_name: profileData.full_name,
              user_type: 'client' // Always client for new signups
            }
          }
        })
      )

      if (authError) throw authError

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .upsert([
            {
              id: authData.user.id,
              email,
              full_name: profileData.full_name,
              user_type: 'client', // Always client for new signups
              mobile: profileData.mobile
            }
          ], { onConflict: 'id' })

        if (profileError) throw profileError

        // Fetch the complete user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (userError) throw userError

        setUser(userData)
      }
    } catch (error: any) {
      if (error.message.includes('rate limit')) {
        throw new Error('Too many attempts. Please try again in a few minutes.')
      }
      throw error
    }
  }

  const signOut = async () => {
    try {
      setLoading(true) // Prevent multiple clicks
      
      // First clear the user state
      setUser(null)
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Use router.push with replace to prevent flash
      router.replace('/')
      
      toast.success('Signed out successfully')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out', {
        description: error.message
      })
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

export const useAuth = () => {
  return useContext(AuthContext)
} 