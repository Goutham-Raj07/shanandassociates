"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/database'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (userData: Partial<User> & { password: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

// Add retry logic helper
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      if (error?.message?.includes('rate limit') && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries reached')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUser(data)
          })
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/')
      } else if (session?.user) {
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUser(data)
          })
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Signed in successfully')
    } catch (error: any) {
      toast.error('Failed to sign in', { description: error.message })
      throw error
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
    } catch (error: any) {
      toast.error('Failed to sign out', { description: error.message })
    }
  }

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

  const signUp = async (userData: Partial<User> & { password: string }) => {
    try {
      const { email, password, ...profileData } = userData

      const { data: authData, error: authError } = await retryWithBackoff(async () => 
        supabase.auth.signUp({
          email: email!,
          password,
          options: {
            data: {
              full_name: profileData.full_name,
              user_type: 'client'
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
              user_type: 'client',
              mobile: profileData.mobile,
              address_line1: profileData.address_line1,
              address_line2: profileData.address_line2,
              city: profileData.city,
              state: profileData.state,
              pincode: profileData.pincode
            }
          ], { onConflict: 'id' })

        if (profileError) throw profileError

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (userError) throw userError

        setUser(userData)
        toast.success('Account created successfully!')
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      if (error.message.includes('rate limit')) {
        throw new Error('Too many attempts. Please try again in a few minutes.')
      }
      throw error
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
