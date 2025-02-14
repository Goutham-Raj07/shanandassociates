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

  return (
    <Dialog 
      open={open} 
      onOpenChange={(open) => {
        onOpenChangeAction(open)
        if (!open) resetDialog()
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
          </DialogTitle>
          {mode === 'signup' && (
            <div className="flex justify-center space-x-2 pt-2">
              <div className={`h-2 w-16 rounded ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`h-2 w-16 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
          )}
        </DialogHeader>

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Button 
                  variant="link" 
                  className="p-0 text-sm"
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
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !isHydrated}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-500">Don't have an account?</span>{" "}
              <Button 
                variant="link" 
                className="p-0" 
                onClick={() => setMode('signup')}
              >
                Sign up
              </Button>
            </div>
          </form>
        ) : (
          <SignupWizard onSuccessAction={() => setMode('signin')} />
        )}
      </DialogContent>
    </Dialog>
  )
} 