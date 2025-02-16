'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Search, ArrowLeft, Building2, FileText, IndianRupee, Mail, Phone, MapPin, Briefcase, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface ClientDetails {
  name: string
  email: string
  phone: string
  address: string
  businessName: string
  registrationDate: string
  subscriptionStatus: string
  gstNumber: string
  panNumber: string
  paymentHistory: {
    amount: number
    date: string
    status: string
    method?: string
  }[]
  activeJobs: {
    id: number
    title: string
    type: string
    progress: number
    deadline: string
    latestUpdate: string
  }[]
  completedJobs: {
    id: number
    title: string
    type: string
    completedDate: string
  }[]
}

// Add this interface for search suggestions
interface SearchSuggestion {
  id: string
  full_name: string
  email: string
  mobile: string
}

export default function BusinessDetailsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Add this function to fetch suggestions
  const fetchSuggestions = async (query: string | null) => {
    // Return early if query is null or empty
    if (!query?.trim()) {
      setSuggestions([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, mobile')
        .eq('user_type', 'client')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,mobile.ilike.%${query}%`)
        .limit(5)

      if (error) throw error

      setSuggestions(data || [])
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    }
  }

  // Add debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearch = async (query: string) => {
    if (!query?.trim()) {
      toast.error('Please enter a search term')
      return
    }

    setIsLoading(true)
    setClientDetails(null)

    try {
      const response = await fetch(
        `/api/client-details?query=${encodeURIComponent(query.trim())}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('No client found with the given search criteria')
          return
        }
        throw new Error(data.error || 'Failed to fetch client details')
      }

      setClientDetails(data)
    } catch (error: any) {
      console.error('Error fetching client details:', error)
      toast.error('Client not found or error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href="/admin-dashboard" 
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold">Business Details</h1>
          </div>
          <p className="text-gray-500">Search and view comprehensive client business information</p>
        </div>

        {/* Search Section with Enhanced UI */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by client name, email, or phone number"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyPress={handleKeyPress}
                  className="pl-8"
                />
                
                {/* Enhanced Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white border rounded-md shadow-lg z-10">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                        onClick={() => {
                          setSearchQuery(suggestion.full_name)
                          setShowSuggestions(false)
                          handleSearch(suggestion.full_name)
                        }}
                      >
                        <div className="font-medium">{suggestion.full_name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {suggestion.email && (
                            <span className="inline-flex items-center mr-3">
                              <Mail className="h-3 w-3 mr-1" />
                              {suggestion.email}
                            </span>
                          )}
                          {suggestion.mobile && (
                            <span className="inline-flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {suggestion.mobile}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                onClick={() => handleSearch(searchQuery)} 
                disabled={isLoading}
                className="md:w-auto w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {clientDetails && (
          <div className="space-y-6">
            {/* Contact Information Card */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <CardTitle>Contact Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1"><Mail className="h-5 w-5 text-gray-400" /></div>
                      <div>
                        <p className="font-medium text-sm text-gray-500">Email Address</p>
                        <p>{clientDetails.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1"><Phone className="h-5 w-5 text-gray-400" /></div>
                      <div>
                        <p className="font-medium text-sm text-gray-500">Phone Number</p>
                        <p>{clientDetails.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1"><MapPin className="h-5 w-5 text-gray-400" /></div>
                      <div>
                        <p className="font-medium text-sm text-gray-500">Address</p>
                        <p>{clientDetails.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Information Card */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <CardTitle>Business Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Business Name</p>
                      <p className="mt-1">{clientDetails.businessName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Registration Date</p>
                      <p className="mt-1">{clientDetails.registrationDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm ${
                        clientDetails.subscriptionStatus === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {clientDetails.subscriptionStatus}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">GST Number</p>
                      <p className={`mt-1 ${clientDetails.gstNumber === 'Not Available' ? 'text-gray-500 italic' : ''}`}>
                        {clientDetails.gstNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">PAN Number</p>
                      <p className={`mt-1 ${clientDetails.panNumber === 'Not Available' ? 'text-gray-500 italic' : ''}`}>
                        {clientDetails.panNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jobs Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Active Jobs Card */}
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-gray-500" />
                      <CardTitle>Active Jobs</CardTitle>
                    </div>
                    {clientDetails.activeJobs.length > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {clientDetails.activeJobs.length} Active
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {clientDetails.activeJobs.length > 0 ? (
                    <div className="space-y-4">
                      {clientDetails.activeJobs.map((job) => (
                        <div key={job.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-medium">{job.title}</h3>
                              <p className="text-sm text-gray-500">{job.type}</p>
                            </div>
                            <div className="text-sm text-gray-500">
                              Deadline: {job.deadline}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full">
                                <div 
                                  className="h-2 bg-blue-600 rounded-full"
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{job.progress}%</span>
                            </div>
                            <p className="text-sm text-gray-600">{job.latestUpdate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Briefcase className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No active jobs</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Completed Jobs Card */}
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gray-500" />
                      <CardTitle>Completed Jobs</CardTitle>
                    </div>
                    {clientDetails.completedJobs.length > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {clientDetails.completedJobs.length} Completed
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {clientDetails.completedJobs.length > 0 ? (
                    <div className="space-y-4">
                      {clientDetails.completedJobs.map((job) => (
                        <div key={job.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{job.title}</h3>
                              <p className="text-sm text-gray-500">{job.type}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-gray-500">
                                Completed on:
                              </span>
                              <p className="text-sm font-medium">
                                {job.completedDate}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No completed jobs</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment History Card */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-gray-500" />
                    <CardTitle>Payment History</CardTitle>
                  </div>
                  {clientDetails?.paymentHistory.length > 0 && (
                    <div className="text-sm text-gray-500">
                      Total Payments: {clientDetails.paymentHistory.length}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {clientDetails?.paymentHistory.length > 0 ? (
                    <div className="divide-y">
                      {clientDetails.paymentHistory.map((payment, index) => (
                        <div key={index} className="py-4 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-lg">₹{payment.amount.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">{payment.date}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              payment.status === 'Paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.status}
                            </span>
                            {payment.method && (
                              <p className="text-sm text-gray-500 mt-1">{payment.method}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <IndianRupee className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No payment history found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && searchQuery && !clientDetails && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">No client found</p>
                <p className="text-sm">Try searching with a different name, email, or phone number</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Click outside handler */}
        {showSuggestions && (
          <div 
            className="fixed inset-0 z-0"
            onClick={() => setShowSuggestions(false)}
          />
        )}
      </div>
    </div>
  )
} 