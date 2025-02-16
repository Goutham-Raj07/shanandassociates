"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Navbar } from "../../components/Navbar"
import { Footer } from "../../components/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { createNewUser } from './actions'
import { useRouter } from 'next/navigation'

type UserData = {
  email: string
  full_name: string
  mobile: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  pincode: string
  company_name: string
  gst_number: string
  pan_number: string
}

export default function AddUser() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userData, setUserData] = useState<UserData>({
    email: "",
    full_name: "",
    mobile: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    company_name: "",
    gst_number: "",
    pan_number: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single()

      if (existingUser) {
        toast.error('A user with this email already exists')
        return
      }

      // Create user through server action with email as password
      const result = await createNewUser({
        ...userData,
        password: userData.email, // Use email as password
      })

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to create user')
      }

      toast.success('Client added successfully!')
      router.push('/admin-dashboard')
    } catch (error: any) {
      console.error('Error adding client:', error)
      toast.error('Failed to add client', { 
        description: error.message 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar userType="admin" orgName="Shan & Associates" />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Add New Client</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={userData.full_name}
                      onChange={(e) => setUserData(prev => ({ ...prev, full_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      value={userData.mobile}
                      onChange={(e) => setUserData(prev => ({ ...prev, mobile: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address Information (Optional)</h3>
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input
                      id="address_line1"
                      value={userData.address_line1}
                      onChange={(e) => setUserData(prev => ({ ...prev, address_line1: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={userData.address_line2}
                      onChange={(e) => setUserData(prev => ({ ...prev, address_line2: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={userData.city}
                        onChange={(e) => setUserData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={userData.state}
                        onChange={(e) => setUserData(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        value={userData.pincode}
                        onChange={(e) => setUserData(prev => ({ ...prev, pincode: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Business Information (Optional)</h3>
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={userData.company_name}
                      onChange={(e) => setUserData(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gst_number">GST Number</Label>
                      <Input
                        id="gst_number"
                        value={userData.gst_number}
                        onChange={(e) => setUserData(prev => ({ ...prev, gst_number: e.target.value }))}
                        placeholder="Enter GST number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pan_number">PAN Number</Label>
                      <Input
                        id="pan_number"
                        value={userData.pan_number}
                        onChange={(e) => setUserData(prev => ({ ...prev, pan_number: e.target.value }))}
                        placeholder="Enter PAN number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Field (Email) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Information</h3>
                <div className="relative">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="text" 
                    value={userData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <div className="absolute right-3 top-9 text-xs text-gray-500">
                    Password will be same as email
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Client...
                  </>
                ) : (
                  'Add Client'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
} 