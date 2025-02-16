"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { CheckIcon } from "lucide-react"
import { ArrowRight, ArrowLeft, User, MapPin, Lock } from "lucide-react"

type SignupData = {
  // Step 1: Personal Info
  full_name: string
  email: string
  mobile: string
  
  // Step 2: Address
  address: string
  address_line2: string
  city: string
  state: string
  pincode: string
  
  // Step 3: Security
  password: string
  confirm_password: string
}

export function SignupWizard({ 
  onSuccessAction,
  onBackToSignInAction
}: { 
  onSuccessAction: () => void
  onBackToSignInAction: () => void 
}) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  
  const [formData, setFormData] = useState<SignupData>({
    full_name: "",
    email: "",
    mobile: "",
    address: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    password: "",
    confirm_password: ""
  })

  const [errors, setErrors] = useState<Partial<SignupData>>({})

  const validateStep1 = () => {
    const newErrors: Partial<SignupData> = {}
    
    if (!formData.full_name.trim()) newErrors.full_name = "Name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format"
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required"
    else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = "Invalid mobile number"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Partial<SignupData> = {}
    
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.state.trim()) newErrors.state = "State is required"
    if (!formData.pincode.trim()) newErrors.pincode = "PIN code is required"
    else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = "Invalid PIN code"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors: Partial<SignupData> = {}
    
    if (!formData.password) newErrors.password = "Password is required"
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters"
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const handleBack = () => {
    if (step === 1) {
      onBackToSignInAction()
    } else {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep3()) return

    setIsLoading(true)
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        mobile: formData.mobile,
        address_line1: formData.address,
        address_line2: formData.address_line2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      })
      
      toast.success('Account created successfully!')
      onSuccessAction()
    } catch (error: any) {
      toast.error('Failed to create account', {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl">
      {/* Header Section */}
      <div className="px-8 py-4 text-white">
        <h2 className="text-xl font-semibold text-center mb-4">Create an account</h2>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div 
                className={`h-8 w-8 rounded-full flex items-center justify-center
                  ${step >= num 
                    ? 'bg-white text-blue-600' 
                    : 'bg-blue-500/50 text-white'
                  } text-sm font-medium`}
              >
                {step > num ? <CheckIcon className="h-4 w-4" /> : num}
              </div>
              {num < 3 && (
                <div 
                  className={`w-12 h-[2px] mx-1
                    ${step > num ? 'bg-white' : 'bg-blue-500/50'}`} 
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Section - Updated border radius */}
      <div className="bg-gray-50 px-8 py-6 rounded-b-xl">
        {/* Step Title */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {step === 1 && "Personal Information"}
            {step === 2 && "Address Details"}
            {step === 3 && "Create Password"}
          </h2>
          <p className="text-gray-500 mt-1">
            {step === 1 && "Enter your personal details"}
            {step === 2 && "Tell us where you live"}
            {step === 3 && "Set up your account security"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1 Form */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={errors.full_name ? "border-red-500" : ""}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-500">{errors.full_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className={errors.mobile ? "border-red-500" : ""}
                />
                {errors.mobile && (
                  <p className="text-sm text-red-500">{errors.mobile}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2 Form */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address Line 1</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  className={errors.address_line2 ? "border-red-500" : ""}
                />
                {errors.address_line2 && (
                  <p className="text-sm text-red-500">{errors.address_line2}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500">{errors.city}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className={errors.state ? "border-red-500" : ""}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-500">{errors.state}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">PIN Code</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className={errors.pincode ? "border-red-500" : ""}
                />
                {errors.pincode && (
                  <p className="text-sm text-red-500">{errors.pincode}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3 Form */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className={errors.confirm_password ? "border-red-500" : ""}
                />
                {errors.confirm_password && (
                  <p className="text-sm text-red-500">{errors.confirm_password}</p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-800"
              >
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={onBackToSignInAction}
                className="text-gray-600 hover:text-gray-800"
              >
                Back to Sign in
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            )}
          </div>
        </form>

        {/* Progress Text */}
        <div className="text-center text-sm text-gray-500 mt-6">
          Step {step} of 3
        </div>
      </div>
    </div>
  )
} 