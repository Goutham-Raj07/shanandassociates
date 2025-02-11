"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, LogOut, User, Settings, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { AuthDialog } from "./AuthDialog"
import { useAuth } from "@/contexts/AuthContext"

interface NavbarProps {
  userType: 'client' | 'admin' | 'guest'
  userName?: string
  orgName?: string
}

export function Navbar({ userType, userName = '', orgName = 'Shan & Associates' }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const router = useRouter()
  const { signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleScroll = (elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isLoading) return // Prevent double clicks
    
    setIsLoading(true)
    try {
      // Disable navigation menu immediately
      setIsOpen(false)
      
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoading(false) // Only reset loading on error
    }
  }

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Org Name */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-semibold text-lg">{orgName}</span>
            </Link>
          </div>

          {/* Navigation Links - Only show for guests */}
          {userType === 'guest' && (
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => handleScroll('home')} 
                className="text-gray-600 hover:text-gray-900"
              >
                Home
              </button>
              <button 
                onClick={() => handleScroll('about')} 
                className="text-gray-600 hover:text-gray-900"
              >
                About
              </button>
              <button 
                onClick={() => handleScroll('services')} 
                className="text-gray-600 hover:text-gray-900"
              >
                Services
              </button>
              <button 
                onClick={() => handleScroll('contact')} 
                className="text-gray-600 hover:text-gray-900"
              >
                Contact
              </button>
            </div>
          )}

          {/* User Menu */}
          {userType !== 'guest' ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {userName}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Account</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Link href={`/${userType}-dashboard`} className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <div className="flex items-center text-red-600 w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Sign Out'
                      )}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={() => {
                  if (!showAuthDialog) {
                    setAuthMode('signin')
                    setShowAuthDialog(true)
                  }
                }}
              >
                Sign In
              </Button>
              <Button
                onClick={() => {
                  if (!showAuthDialog) {
                    setAuthMode('signup')
                    setShowAuthDialog(true)
                  }
                }}
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </div>

      {userType === 'guest' && (
        <AuthDialog 
          open={showAuthDialog}
          onOpenChangeAction={(open: boolean) => {
            setShowAuthDialog(open)
            if (!open) {
              setAuthMode('signin')
            }
          }}
          initialMode={authMode}
        />
      )}
    </nav>
  )
} 