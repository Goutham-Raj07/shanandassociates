"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { SignupWizard } from "./SignupWizard"

interface AuthDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  initialMode?: 'signin' | 'signup'
}

type UserType = 'client' | 'admin'
type SignInMethod = 'email' | 'mobile'

export function AuthDialog({ open, onOpenChangeAction, initialMode = 'signin' }: AuthDialogProps) {
  const router = useRouter()
  const { signIn, signUp, user } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    mobile: '',
    address: '',
    userType: 'client' as 'client' | 'admin'
  })
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (user) {
      onOpenChangeAction(false)
      const dashboardRoute = user.user_type === 'admin' ? '/admin-dashboard' : '/client-dashboard'
      router.push(dashboardRoute)
    }
  }, [user, router, onOpenChangeAction])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleAuth = async (action: () => Promise<void>) => {
    if (!isHydrated) {
      toast.error('Please wait...')
      return
    }
    
    setIsLoading(true)
    try {
      await action()
    } catch (error) {
      console.error('Auth error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await handleAuth(async () => {
      await signIn(formData.email, formData.password)
      toast.success("Successfully signed in!")
    })
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    await handleAuth(async () => {
      await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        mobile: formData.mobile,
        user_type: 'client'
      })
      toast.success("Account created successfully!")
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const resetDialog = () => {
    setStep(1)
    setIsLoading(false)
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      mobile: '',
      address: '',
      userType: 'client'
    })
  }

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setMode(newMode)
    resetDialog() // Reset form data when switching modes
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(open) => {
        onOpenChangeAction(open)
        if (!open) {
          resetDialog()
          setMode('signin') // Reset to signin mode when dialog closes
        }
      }}
    >
      <DialogContent className="p-0 border-none bg-transparent shadow-none">
        {mode === 'signin' ? (
          <div className="bg-white rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
              <h1 className="text-2xl font-semibold text-center">Welcome back</h1>
              <p className="text-blue-100 text-center mt-2">Sign in to your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignIn} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-gray-700">Password</Label>
                    <Button 
                      variant="link" 
                      className="p-0 text-sm text-blue-600 hover:text-blue-700"
                      onClick={() => {/* Add forgot password logic */}}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your password"
                    className="h-11"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading || !isHydrated}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">
                    Don't have an account?
                  </span>
                </div>
              </div>

              <Button 
                type="button"
                variant="outline"
                className="w-full h-11 border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => handleModeChange('signup')}
              >
                Create an account
              </Button>
            </form>
          </div>
        ) : (
          <SignupWizard 
            onSuccessAction={() => handleModeChange('signin')}
            onBackToSignInAction={() => handleModeChange('signin')}
          />
        )}
      </DialogContent>
    </Dialog>
  )
} 