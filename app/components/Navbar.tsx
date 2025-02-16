"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, LogOut, User, Settings, Loader2, IndianRupee, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { AuthDialog } from "./AuthDialog"
import { useAuth } from "@/contexts/AuthContext"
import Image from 'next/image'

interface NavbarProps {
  userType: 'guest' | 'client' | 'admin'
  userName?: string
  orgName: React.ReactNode
}

export function Navbar({ userType, userName = '', orgName }: NavbarProps) {
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

  const menuItems = [
    {
      label: "Profile Settings",
      href: "/profile",
      icon: Settings
    },
    {
      label: "Payment Confirmations",
      href: "/admin-dashboard/payments",
      icon: IndianRupee
    }
  ]

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Org Name */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              {(userType === 'admin' || userType === 'client') && (
                <Image
                  src="https://images.seeklogo.com/logo-png/13/1/the-institute-of-chartered-accountants-of-india-logo-png_seeklogo-138618.png"
                  alt="CA Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                  unoptimized
                />
              )}
              {orgName}
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
                  {userType === 'admin' && (
                    <>
                      <DropdownMenuItem>
                        <Link href="/admin-dashboard/payments" className="flex items-center w-full">
                          <IndianRupee className="mr-2 h-4 w-4" />
                          Payment Requests
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/admin-dashboard/business-details" className="flex items-center w-full">
                          <Building2 className="mr-2 h-4 w-4" />
                          Business Details
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile
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
                Sign Up
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