"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogOut } from "lucide-react"

export function Header() {
  const router = useRouter()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<string | null>(null)
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    userType: ""
  })

  useEffect(() => {
    const storedUserType = localStorage.getItem('userType')
    if (storedUserType) {
      setIsAuthenticated(true)
      setUserType(storedUserType)
    }
  }, [])

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setLoginData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleUserTypeChange = (value: string) => {
    setLoginData(prev => ({
      ...prev,
      userType: value
    }))
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('userType', loginData.userType)
    setIsAuthenticated(true)
    setUserType(loginData.userType)
    
    if (loginData.userType === "admin") {
      router.push("/admin-dashboard")
    } else if (loginData.userType === "client") {
      router.push("/client-dashboard")
    }
    setIsLoginOpen(false)
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSignUpOpen(false)
  }

  const handleSignOut = () => {
    localStorage.removeItem('userType')
    setIsAuthenticated(false)
    setUserType(null)
    router.push("/")
  }

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          Shan Associations
        </Link>
        <div className="space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {userType === 'admin' ? 'Admin' : 'Client'}
              </span>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <DialogTrigger asChild>
                  <button className="text-gray-600 hover:text-blue-600">Login</button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Login to your account</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userType">Login As</Label>
                      <Select onValueChange={handleUserTypeChange} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email" 
                        value={loginData.email}
                        onChange={handleLoginChange}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Enter your password" 
                        value={loginData.password}
                        onChange={handleLoginChange}
                        required 
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Button type="submit" className="w-full">
                      Login
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
                <DialogTrigger asChild>
                  <Button>Sign Up</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create an account</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userType">Register As</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" type="text" placeholder="Enter your full name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">Email</Label>
                      <Input id="signupEmail" type="email" placeholder="Enter your email" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobileNumber">Mobile Number</Label>
                      <Input 
                        id="mobileNumber" 
                        type="tel" 
                        placeholder="Enter your mobile number" 
                        pattern="[0-9]{10}"
                        title="Please enter a valid 10-digit mobile number"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupPassword">Password</Label>
                      <Input id="signupPassword" type="password" placeholder="Create a password" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input id="confirmPassword" type="password" placeholder="Confirm your password" required />
                    </div>
                    <Button type="submit" className="w-full">
                      Create Account
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

