"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { jobsApi, paymentsApi, documentsApi, jobRequestsApi } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Send, Download, MessageCircle, MessageSquare, ChevronRight, ChevronLeft, FileText, IndianRupee } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { apiRequest } from '@/lib/api-helpers'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Add these type definitions at the top
type MessageWizardStep = 1 | 2 | 3
type MessageChannel = 'email' | 'message'

interface JobUpdate {
  status: 'In Progress' | 'Completed'
  progress: number
  latestUpdate: string
}

interface Document {
  id: number
  clientName: string
  name: string
  uploadedAt: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Verified' | 'Uploaded'
  feedback?: string
  file_name?: string
  client?: {
    full_name: string
    email: string
  }
}

interface Payment {
  amount: string
  description: string
}

interface ButtonStates {
  [key: string]: boolean
}

interface DocumentLoadingState {
  [key: string]: {
    action: 'preview' | 'download' | null
  }
}

// Add this type definition
type JobMessage = {
  id: number
  content: string
  from_admin: boolean
  created_at: string
}

// Update the Job interface
interface Job {
  id: number
  client_id: string
  title: string
  type: string
  status: 'In Progress' | 'Completed'
  deadline: string
  progress: number
  latest_update: string
  amount: number
  created_at: string
  client?: {
    full_name: string
    email: string
  }
  payment_status?: string
  messages?: JobMessage[]
  payments?: {
    status: string
    amount: number
    created_at: string
  }[]
}

type JobRequest = {
  id: number
  title: string
  type: string
  description: string
  deadline: string
  budget?: string
  status: 'Pending' | 'Approved' | 'Rejected'
  clientName: string
  createdAt: string
}

// Add this type definition
type Client = {
  id: string
  email: string
  full_name: string
  mobile: string
  created_at: string
  status: 'Active' | 'Pending'
  total_jobs: number
  pending_payments: number
}

// Add these type definitions for the event handlers
interface DocumentRequest {
  name: string
  description: string
  deadline: string
}

// Add this helper functions before the AdminDashboard component
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const formatSimpleDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const isNewClient = (createdAt: string) => {
  const clientDate = new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - clientDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 7 // Consider clients from last 7 days as new
}

// Add this helper function to format time ago
const formatTimeAgo = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } else if (days > 0) {
    return `${days}d ago`
  } else if (hours > 0) {
    return `${hours}h ago`
  } else if (minutes > 0) {
    return `${minutes}m ago`
  } else {
    return 'Just now'
  }
}

interface SupabaseResponse<T> {
  data: T | null
  error: any
}

interface ApiResponse {
  success: boolean
  error?: string
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [clients, setClients] = useState<Client[]>([])

  const [jobs, setJobs] = useState<Job[]>([
    { 
      id: 1, 
      client_id: "1", 
      title: "Tax Filing", 
      type: "Tax Filing", 
      status: "In Progress",
      deadline: "2024-03-31",
      progress: 50,
      latest_update: "Initial setup completed",
      amount: 1000,
      created_at: "2024-02-15T10:00:00"
    },
    { 
      id: 2, 
      client_id: "2", 
      title: "Audit", 
      type: "Audit", 
      status: "Completed",
      deadline: "2024-02-28",
      progress: 100,
      latest_update: "Audit completed successfully",
      amount: 2000,
      created_at: "2024-02-20T10:00:00"
    },
  ])

  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [newMessage, setNewMessage] = useState("")

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<MessageWizardStep>(1)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [jobUpdate, setJobUpdate] = useState<JobUpdate>({
    status: 'In Progress',
    progress: 0,
    latestUpdate: ''
  })

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState<Payment>({
    amount: '',
    description: ''
  })

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 1,
      clientName: "John Doe",
      name: "Tax_Return_2023.pdf",
      uploadedAt: "2024-02-15",
      status: "Pending"
    },
    {
      id: 2,
      clientName: "Jane Smith",
      name: "Balance_Sheet_Q4.pdf",
      uploadedAt: "2024-02-14",
      status: "Approved"
    }
  ])

  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [feedback, setFeedback] = useState("")

  const [jobRequests, setJobRequests] = useState<JobRequest[]>([])

  const [selectedTab, setSelectedTab] = useState('clients')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [hasError, setHasError] = useState(false)

  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [documentRequest, setDocumentRequest] = useState<DocumentRequest>({
    name: '',
    description: '',
    deadline: ''
  })

  // Add state for preview dialog
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const [clientSearchQuery, setClientSearchQuery] = useState('')

  // Add this near your other state declarations
  const JOB_TYPES = [
    "Tax Filing",
    "GST Filing",
    "Audit",
    "Accounting",
    "Financial Planning",
    "Business Registration",
    "Compliance",
    "Consulting"
  ]

  // First, add the search state for job titles
  const [jobTitleSearch, setJobTitleSearch] = useState('')

  // First, add the search state for job requests
  const [jobRequestSearch, setJobRequestSearch] = useState('')

  // Get active clients (clients with active jobs)
  const activeClients = useMemo(() => {
    const clientsWithActiveJobs = jobs
      .filter(job => job.status === 'In Progress')
      .map(job => ({
        id: job.client_id,
        full_name: job.client?.full_name || 'Unknown Client'
      }))
    
    // Remove duplicates
    return Array.from(new Map(clientsWithActiveJobs.map(c => [c.id, c])).values())
  }, [jobs])

  // Add these states
  const [messageWizardOpen, setMessageWizardOpen] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<MessageChannel[]>([])
  const [messageContent, setMessageContent] = useState('')
  const [isSending, setIsSending] = useState(false)

  // First add this state at the top with other states
  const [showMessageSection, setShowMessageSection] = useState(false)

  // Add gateway status check
  const [gatewayStatus, setGatewayStatus] = useState(false)

  // Add this state for button loading
  const [buttonStates, setButtonStates] = useState<ButtonStates>({})

  // Add this state for tracking loading states per document
  const [documentLoadingStates, setDocumentLoadingStates] = useState<DocumentLoadingState>({})

  // Create a wrapper function for button clicks
  const handleButtonClick = async (buttonId: string, action: () => Promise<void>) => {
    if (buttonStates[buttonId]) return
    
    setButtonStates(prev => ({ ...prev, [buttonId]: true }))
    try {
      await action()
    } catch (error) {
      console.error(`Error in ${buttonId}:`, error)
    } finally {
      setButtonStates(prev => ({ ...prev, [buttonId]: false }))
    }
  }

  // Add this effect to handle initial auth check
  useEffect(() => {
    if (!loading && user?.user_type === 'admin') {
      const loadData = async () => {
        try {
          await loadAdminData()
          return setupRealtimeSubscriptions()
        } catch (error) {
          console.error('Error loading data:', error)
        }
      }
      
      void loadData() // Use void operator to explicitly ignore the Promise
    }
  }, [user, loading])

  // Separate effect for initialization
  useEffect(() => {
    if (!loading) {
      if (!user || user.user_type !== 'admin') {
        router.push('/')
        return
      }
      setIsInitialized(true)
    }
  }, [user, loading])

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Global error:', error)
      setHasError(true)
      toast.error('An unexpected error occurred', {
        description: 'Please refresh the page or contact support if the problem persists.'
      })
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  useEffect(() => {
    const checkGateway = async () => {
      try {
        const response = await fetch('/api/check-gateway')
        const { status } = await response.json()
        setGatewayStatus(status === 'running')
      } catch (error) {
        console.error('Gateway check failed:', error)
        setGatewayStatus(false)
      }
    }
    
    checkGateway()
    const interval = setInterval(checkGateway, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const setupRealtimeSubscriptions = (): () => void => {
    const subscriptions = [
      supabase
        .channel('admin-jobs')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'jobs' },
          async () => {
            await loadAdminData()
            toast.info("Jobs updated")
          }
        )
        .subscribe(),
      supabase
        .channel('admin-documents')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'documents'
          },
          async (payload) => {
            await loadAdminData()
            if (payload.eventType === 'INSERT') {
              toast.info("New document uploaded", {
                description: "A client has uploaded a new document"
              })
            }
          }
        )
        .subscribe(),
      supabase
        .channel('admin-job-requests')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'job_requests'
          },
          async (payload) => {
            await loadAdminData()
            if (payload.eventType === 'INSERT') {
              toast.info("New job request", {
                description: "A client has submitted a new job request"
              })
            }
          }
        )
        .subscribe()
    ]

    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe())
    }
  }

  const loadAdminData = async (): Promise<void> => {
    try {
      setIsLoading(true)
      
      // Load all data in parallel with additional calculations
      const [
        { data: clientsData, error: clientsError },
        { data: jobsData, error: jobsError },
        { data: paymentsData, error: paymentsError },
        { data: documentsData, error: documentsError },
        { data: jobRequestsData, error: jobRequestsError }
      ] = await Promise.all([
        // Load clients
        supabase
          .from('users')
          .select('*')
          .eq('user_type', 'client'),
        
        // Load jobs with client info
        supabase
          .from('jobs')
          .select(`
            *,
            client:users!jobs_client_id_fkey (
              full_name,
              email
            ),
            payments:payments (
              status,
              amount,
              created_at
            )
          `)
          .order('created_at', { ascending: false }),
        
        // Load payments
        supabase
          .from('payments')
          .select('*')
          .eq('status', 'Pending'),
        
        // Load documents
        supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false }),
        
        // Load job requests
        supabase
          .from('job_requests')
          .select('*')
          .order('created_at', { ascending: false })
      ])

      if (clientsError || jobsError || paymentsError || documentsError || jobRequestsError) 
        throw new Error('Error fetching data')

      // Process clients with total jobs, pending payments and status
      const processedClients = (clientsData || []).map(client => {
        const clientJobs = (jobsData || []).filter(job => job.client_id === client.id)
        const pendingPayments = (paymentsData || [])
          .filter(payment => payment.client_id === client.id)
          .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)

        // Determine status based on activity
        const hasActiveJobs = clientJobs.some(job => job.status === 'In Progress')
        const status = hasActiveJobs ? 'Active' : 'Pending'

        return {
          ...client,
          total_jobs: clientJobs.length,
          pending_payments: pendingPayments,
          status: status
        }
      })

      // Process jobs to include payment status
      const processedJobs = jobsData?.map(job => {
        const sortedPayments = job.payments?.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        return {
          ...job,
          payment_status: sortedPayments?.[0]?.status || 'Pending'
        }
      }) || []

      // Update states
      setClients(processedClients)
      setJobs(processedJobs)
      setDocuments(documentsData?.map(doc => ({
        id: doc.id,
        clientName: doc.client?.full_name || 'Unknown Client',
        name: doc.name,
        uploadedAt: doc.uploaded_at,
        status: doc.status,
        feedback: doc.feedback,
        file_name: doc.file_name,
        client: doc.client
      })) || [])
      setJobRequests(jobRequestsData?.map(request => ({
        id: request.id,
        title: request.title,
        type: request.type,
        description: request.description,
        deadline: request.deadline,
        budget: request.budget,
        status: request.status,
        clientName: request.client?.full_name || 'Unknown Client',
        createdAt: request.created_at
      })) || [])
      
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateJob = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    
    try {
      setButtonStates(prev => ({ ...prev, createJob: true }))

      const { error } = await supabase
        .from('jobs')
        .insert([{
          client_id: selectedClientId,
          title: formData.get('jobTitle'),
          type: formData.get('jobType'),
          status: 'In Progress',
          deadline: formData.get('deadline'),
          progress: 0,
          latest_update: 'Job created',
          amount: 0
        }])

      if (error) throw error

      toast.success('Job created successfully')
      loadAdminData() // Refresh the jobs list
      setSelectedClientId('') // Reset form
      
    } catch (error) {
      console.error('Error creating job:', error)
      toast.error('Failed to create job')
    } finally {
      setButtonStates(prev => ({ ...prev, createJob: false }))
    }
  }

  const handleRequestDocuments = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            client_id: selectedClientId,
            name: documentRequest.name,
            description: documentRequest.description,
            deadline: documentRequest.deadline,
            status: 'Pending'
          }
        ])
        .select()
        .single()

      if (error) throw error

      toast.success('Document request sent successfully')
      
      // Reset form
      setSelectedClientId('')
      setDocumentRequest({
        name: '',
        description: '',
        deadline: ''
      })
      
      // Refresh documents list
      loadAdminData()
      
    } catch (error) {
      console.error('Error requesting document:', error)
      toast.error('Failed to send document request')
    }
  }

  const handleSelectClient = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  const handleJobUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (jobUpdate.progress < 0 || jobUpdate.progress > 100) {
      toast.error('Progress must be between 0 and 100')
      return
    }

    try {
      // First update the job using supabase directly
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          status: jobUpdate.status,
          progress: jobUpdate.progress,
          latest_update: jobUpdate.latestUpdate
        })
        .eq('id', selectedJob!.id)

      if (updateError) throw updateError

      // Immediately update the local jobs state
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === selectedJob!.id 
            ? {
                ...job,
                status: jobUpdate.status,
                progress: jobUpdate.progress,
                latest_update: jobUpdate.latestUpdate
              }
            : job
        )
      )

      toast.success("Job updated successfully")
      setUpdateDialogOpen(false)
      setCurrentStep(1)
      setSelectedJob(null)
      
      // Refresh the full data in the background
      loadAdminData()

    } catch (error: any) {
      toast.error("Failed to update job", {
        description: error.message
      })
    }
  }

  const handleStepChange = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      if (currentStep === 1) {
        if (jobUpdate.progress < 0 || jobUpdate.progress > 100) {
          toast.error('Progress must be between 0 and 100')
          return
        }
        setCurrentStep(2 as MessageWizardStep)
      }
    } else {
      setCurrentStep(1 as MessageWizardStep)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedJob) return

    try {
      setButtonStates(prev => ({ ...prev, addPayment: true }))

      // Create the payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          job_id: selectedJob.id,
          client_id: selectedJob.client_id,
          amount: Number(paymentDetails.amount),
          description: paymentDetails.description,
          status: 'Pending',  // Changed from 'Paid' to 'Pending'
          payment_method: 'Direct',
          paid_at: new Date().toISOString()
        }])

      if (paymentError) throw paymentError

      // Update only the job amount, not the payment status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          amount: Number(paymentDetails.amount)
          // Removed payment_status update
        })
        .eq('id', selectedJob.id)

      if (jobError) throw jobError

      toast.success('Payment added successfully')
      setPaymentDialogOpen(false)
      setPaymentDetails({ amount: '', description: '' })
      
      await loadAdminData()

    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('Failed to add payment')
    } finally {
      setButtonStates(prev => ({ ...prev, addPayment: false }))
    }
  }

  const handleDocumentAction = async (document: Document, action: 'approve' | 'reject') => {
    if (action === 'reject' && !feedback.trim()) {
      setSelectedDocument(document)
      setFeedbackDialogOpen(true)
      return
    }

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: action === 'approve' ? 'Verified' : 'Rejected',
          feedback: action === 'reject' ? feedback : null
        })
        .eq('id', document.id)

      if (error) throw error

      toast.success(`Document ${action === 'approve' ? 'approved' : 'rejected'} successfully`)

      if (action === 'reject') {
        setFeedback("")
        setFeedbackDialogOpen(false)
        setSelectedDocument(null)
      }

      await loadAdminData()
    } catch (error: any) {
      toast.error(`Failed to ${action} document`, {
        description: error.message
      })
    }
  }

  const handleJobRequestAction = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      const updatedRequest = await jobRequestsApi.updateJobRequest(requestId, {
        status: action === 'approve' ? 'Approved' : 'Rejected'
      })

      if (action === 'approve') {
        // Create a new job when approved
        await jobsApi.createJob({
          client_id: updatedRequest.client_id,
          title: updatedRequest.title,
          type: updatedRequest.type,
          status: "In Progress",
          deadline: updatedRequest.deadline,
          progress: 0,
          latest_update: "Job created from request",
          amount: parseInt(updatedRequest.budget || "0")
        })
      }

      toast.success(`Job request ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
    } catch (error: any) {
      toast.error(`Failed to ${action} job request`, {
        description: error.message
      })
    }
  }

  // Update the filteredJobs function
  const filteredJobs = jobs.filter(job => {
    const matchesTitle = (job.title || '').toLowerCase().includes(jobTitleSearch.toLowerCase())
    const matchesFilter = filterStatus === 'all' || job.status === filterStatus
    return matchesTitle && matchesFilter
  }).sort((a, b) => {
    const dateA = new Date(a.deadline).getTime()
    const dateB = new Date(b.deadline).getTime()
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
  })

  // Add this function to load clients data
  const loadClientsData = async () => {
    try {
      const { data: clientsData, error } = await supabase
        .from('users')
        .select(`
          *,
          jobs:jobs (
            id,
            amount
          )
        `)
        .eq('user_type', 'client')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to include total jobs and amount with proper null checks
      const transformedClients = clientsData.map(client => ({
        id: client.id,
        email: client.email,
        full_name: client.full_name || 'Unnamed Client',
        mobile: client.mobile || 'No mobile',
        created_at: client.created_at,
        status: 'Active' as const,
        total_jobs: client.jobs?.length || 0,
        pending_payments: client.jobs?.reduce((sum: number, job: any) => 
          sum + (Number(job.amount) || 0), 0) || 0
      }))

      setClients(transformedClients)
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    }
  }

  // Update the document handling functions
  const handlePreviewDocument = async (document: Document) => {
    const documentId = document.id.toString()
    
    try {
      setDocumentLoadingStates(prev => ({ 
        ...prev, 
        [documentId]: { action: 'preview' }
      }))
      
      if (!document.file_name) {
        toast.error('No file available for preview')
        return
      }

      // Use the correct path format: {document.id}/{document.file_name}
      const path = `${document.id}/${document.file_name}`

      const { data, error } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(path, 3600) // 1 hour expiry

      if (error) {
        throw error
      }

      if (!data?.signedUrl) {
        throw new Error('Failed to generate preview URL')
      }

      setPreviewUrl(data.signedUrl)
      setPreviewOpen(true)

    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to load preview. Retrying...')
      // Auto retry once with correct path
      setTimeout(async () => {
        try {
          const path = `${document.id}/${document.file_name}`
          const { data } = await supabase
            .storage
            .from('documents')
            .createSignedUrl(path, 3600)
          
          if (data?.signedUrl) {
            setPreviewUrl(data.signedUrl)
            setPreviewOpen(true)
          }
        } catch (retryError) {
          toast.error('Preview failed. Please refresh and try again.')
        }
      }, 1000)
    } finally {
      setDocumentLoadingStates(prev => ({ 
        ...prev, 
        [documentId]: { action: null }
      }))
    }
  }

  const handleDownloadDocument = async (doc: Document) => {
    const documentId = doc.id.toString()
    
    try {
      setDocumentLoadingStates(prev => ({ 
        ...prev, 
        [documentId]: { action: 'download' }
      }))
      
      if (!doc.file_name) {
        toast.error('No file available for download')
        return
      }

      // Get a signed URL with download disposition
      const { data: signedData, error: signedError } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(`${doc.id}/${doc.file_name}`, 60, {
          download: true  // Only use this option
        })

      if (signedError) throw signedError

      if (!signedData?.signedUrl) {
        throw new Error('Failed to generate download URL')
      }

      // Create an invisible anchor and trigger download
      const link = window.document.createElement('a')
      link.style.display = 'none'
      link.href = signedData.signedUrl
      link.setAttribute('download', doc.file_name) // Force download attribute
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)

    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download. Retrying...')
      // Auto retry once
      setTimeout(async () => {
        try {
          const { data: signedData } = await supabase
            .storage
            .from('documents')
            .createSignedUrl(`${doc.id}/${doc.file_name}`, 60)
          
          if (signedData?.signedUrl) {
            const link = window.document.createElement('a')
            link.style.display = 'none'
            link.href = signedData.signedUrl
            link.setAttribute('download', doc.file_name!)
            window.document.body.appendChild(link)
            link.click()
            window.document.body.removeChild(link)
          }
        } catch (retryError) {
          toast.error('Download failed. Please refresh and try again.')
        }
      }, 1000)
    } finally {
      setDocumentLoadingStates(prev => ({ 
        ...prev, 
        [documentId]: { action: null }
      }))
    }
  }

  // Update the sendMessage function to handle SMS

  const sendMessage = async (channel: 'email' | 'message', clientId: string, content: string) => {
    try {
      // First get client details
      const { data: clientData, error: clientError } = await supabase
        .from('users')
        .select('email, mobile, full_name')
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError
      if (!clientData) throw new Error('Client not found')

      if (channel === 'email') {
        if (!clientData.email) {
          throw new Error(`Email not found for client ${clientData.full_name}`)
        }
        // Send email using configured email service
        const emailResult = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: clientData.email,
            subject: 'Message from Shan Association',
            content: content
          })
        })

        const emailData = await emailResult.json()
        if (!emailResult.ok) {
          throw new Error(emailData.error || 'Failed to send email')
        }
        return true
      } 
      else if (channel === 'message') {
        if (!clientData.mobile) {
          throw new Error(`Mobile number not found for client ${clientData.full_name}`)
        }
        // Send SMS using configured SMS service
        const smsResult = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: clientData.mobile,
            message: content
          })
        })

        const smsData = await smsResult.json()
        if (!smsResult.ok) {
          throw new Error(smsData.error || 'Failed to send SMS')
        }
        return true
      }
      else {
        throw new Error(`${channel} service is not configured yet`)
      }

    } catch (error: any) {
      console.error(`Error sending ${channel} message:`, error)
      throw new Error(`Failed to send ${channel} message: ${error.message}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDocumentRequest(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDocumentRequest(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Don't render anything until we're initialized
  if (!isInitialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar userType="admin" userName={user?.full_name} orgName="Shan Association" />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
            <p className="text-gray-600">Please try refreshing the page</p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user || user.user_type !== 'admin') {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar userType="guest" orgName="Shan Association" />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-600">Unauthorized Access</h2>
            <p className="text-gray-600">Please sign in with an admin account</p>
            <Button onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const DashboardHeader = () => (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Welcome,</span>
            <span className="font-semibold">{user?.full_name || 'Admin'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            Sort {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        userType="admin"
        userName={user?.full_name}
        orgName="Shan & Associates"
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        <DashboardHeader />
        <Tabs defaultValue="clients">
          <TabsList className="flex justify-between items-center w-full border-b">
            <div className="flex gap-4">
              <TabsTrigger value="clients">Manage Clients</TabsTrigger>
              <TabsTrigger value="jobs">Manage Jobs</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="jobRequests">Job Requests</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </div>
          </TabsList>
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Manage Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Input
                      placeholder="Search clients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                  </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Total Jobs</TableHead>
                      <TableHead>Pending Payments</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {clients
                        .filter(client => 
                          ((client.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (client.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        .map((client: Client) => (
                      <TableRow key={client.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{client.full_name || 'Unknown Client'}</span>
                                {isNewClient(client.created_at) && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                                    New
                                  </span>
                                )}
                              </div>
                            </TableCell>
                        <TableCell>{client.email || 'No email'}</TableCell>
                            <TableCell>{client.mobile || 'No mobile'}</TableCell>
                        <TableCell>
                              <div className="flex flex-col">
                                <span>{new Date(client.created_at).toLocaleDateString()}</span>
                                {isNewClient(client.created_at) && (
                                  <span className="text-xs text-green-600 font-medium">New Client</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{client.total_jobs || 0}</TableCell>
                            <TableCell>
                              <span className={`font-medium ${client.pending_payments > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                                ₹{(client.pending_payments || 0).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                client.status === 'Active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {client.status}
                              </span>
                            </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="jobs" className="py-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Job List</CardTitle>
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Search job title..."
                      value={jobTitleSearch}
                      onChange={(e) => setJobTitleSearch(e.target.value)}
                      className="w-[280px]"
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" /> New Job
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Job</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateJob}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="client" className="text-right">
                                Client
                              </Label>
                              <div className="col-span-3">
                                <Select
                                  onValueChange={(value) => setSelectedClientId(value)}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select client..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {clients.map((client) => (
                                      <SelectItem key={client.id} value={client.id}>
                                        <div className="flex flex-col">
                                          <span>{client.full_name}</span>
                                          <span className="text-xs text-gray-500">{client.email}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="jobTitle" className="text-right">
                                Job Title
                              </Label>
                              <Input
                                id="jobTitle"
                                name="jobTitle"
                                placeholder="Enter job title"
                                className="col-span-3"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="jobType" className="text-right">
                                Job Type
                              </Label>
                              <div className="col-span-3">
                                <Select
                                  name="jobType"
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select job type..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {JOB_TYPES.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="deadline" className="text-right">
                                Deadline
                              </Label>
                              <Input 
                                id="deadline" 
                                name="deadline"
                                type="date" 
                                className="col-span-3"
                                min={new Date().toISOString().split('T')[0]}
                                required 
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-4">
                            <Button type="submit" disabled={buttonStates['createJob']}>
                              {buttonStates['createJob'] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Create Job'
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Job Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Latest Update</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>{job.client?.full_name || 'Unknown Client'}</TableCell>
                        <TableCell>{job.title}</TableCell>
                        <TableCell>{job.type}</TableCell>
                        <TableCell>{job.status}</TableCell>
                        <TableCell>
                          <span className={
                            new Date(job.deadline) < new Date() 
                              ? "text-red-600 font-medium" 
                              : "text-gray-600"
                          }>
                            {new Date(job.deadline).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${job.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{job.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{job.latest_update}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-end">
                            <span className="font-medium">₹{job.amount.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            job.payment_status === 'Paid' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {job.payment_status || 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedJob(job)
                                setJobUpdate({
                                  status: job.status,
                                  progress: job.progress,
                                  latestUpdate: job.latest_update
                                })
                                setUpdateDialogOpen(true)
                              }}
                            >
                              {buttonStates['updateJob'] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Update'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedJob(job)
                                setPaymentDialogOpen(true)
                              }}
                            >
                              <IndianRupee className="h-4 w-4 mr-2" />
                              {buttonStates['addPayment'] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Add Payment'
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Documents</CardTitle>
                  <div className="flex gap-4">
                    <Input
                      placeholder="Search by client name or document..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-[280px]"
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Request Documents
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Documents</DialogTitle>
                        </DialogHeader>
                          <form onSubmit={handleRequestDocuments} className="space-y-4">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Select Client</Label>
                                <Select
                                  value={selectedClientId}
                                  onValueChange={setSelectedClientId}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {clients.map((client) => (
                                      <SelectItem key={client.id} value={client.id}>
                                        {client.full_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                          </div>

                                <div className="space-y-2">
                                  <Label htmlFor="name">Document Name</Label>
                                  <Input 
                                    id="name"
                                    name="name"
                                    placeholder="e.g., Bank Statement"
                                    value={documentRequest.name}
                                    onChange={handleInputChange}
                                    required
                                  />
                            </div>

                                <div className="space-y-2">
                                  <Label htmlFor="description">Description</Label>
                                  <Textarea 
                                    id="description"
                                    name="description"
                                    placeholder="Provide details about the required document..."
                                    value={documentRequest.description}
                                    onChange={handleTextAreaChange}
                                    required
                                  />
                            </div>

                                <div className="space-y-2">
                                  <Label htmlFor="deadline">Deadline</Label>
                                  <Input 
                                    id="deadline"
                                    name="deadline"
                                    type="date"
                                    value={documentRequest.deadline}
                                    onChange={handleInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                  />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                              <Button type="submit">
                                Request Document
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents
                      .filter(doc => 
                        (doc.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((document) => (
                        <TableRow key={document.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{document.client?.full_name || 'Unknown Client'}</span>
                              <span className="text-sm text-gray-500">{document.client?.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span>{document.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {document.uploadedAt ? (
                              formatSimpleDate(document.uploadedAt)
                            ) : (
                              <span className="text-gray-500">Not uploaded</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              document.status === 'Verified' 
                                ? 'bg-green-100 text-green-800'
                                : document.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : document.status === 'Uploaded'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {document.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {document.status === 'Uploaded' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleButtonClick('approve', () => handleDocumentAction(document, 'approve'))}
                                  >
                                    {buttonStates['approve'] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Approve'
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleButtonClick('reject', () => handleDocumentAction(document, 'reject'))}
                                  >
                                    {buttonStates['reject'] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Reject'
                                    )}
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePreviewDocument(document)}
                                disabled={documentLoadingStates[document.id.toString()]?.action === 'preview'}
                              >
                                {documentLoadingStates[document.id.toString()]?.action === 'preview' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Preview
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadDocument(document)}
                                disabled={documentLoadingStates[document.id.toString()]?.action === 'download'}
                              >
                                {documentLoadingStates[document.id.toString()]?.action === 'download' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Provide Feedback</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Document</Label>
                    <p className="text-sm text-gray-500">{selectedDocument?.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Please provide feedback for rejection..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="min-h-[100px]"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFeedbackDialogOpen(false)
                      setFeedback("")
                      setSelectedDocument(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (selectedDocument && feedback.trim()) {
                        handleButtonClick('reject', () => handleDocumentAction(selectedDocument, 'reject'))
                      }
                    }}
                    disabled={!feedback.trim() || buttonStates['reject']}
                  >
                    {buttonStates['reject'] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Reject Document'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
          <TabsContent value="jobRequests">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Job Requests</CardTitle>
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Search job requests..."
                      value={jobRequestSearch}
                      onChange={(e) => setJobRequestSearch(e.target.value)}
                      className="w-[280px]"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobRequests
                      .filter(request => 
                        request.title.toLowerCase().includes(jobRequestSearch.toLowerCase()) ||
                        request.clientName.toLowerCase().includes(jobRequestSearch.toLowerCase())
                      )
                      .map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.clientName}</TableCell>
                          <TableCell>{request.title}</TableCell>
                          <TableCell>{request.type}</TableCell>
                          <TableCell>{formatSimpleDate(request.deadline)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              request.status === 'Approved' 
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {request.status === 'Pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleButtonClick('approve', () => handleJobRequestAction(request.id, 'approve'))}
                                  >
                                    {buttonStates['approve'] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Approve'
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleButtonClick('reject', () => handleJobRequestAction(request.id, 'reject'))}
                                  >
                                    {buttonStates['reject'] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Reject'
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Send Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Recipients Selection */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <Label>Select Recipients</Label>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedClients(clients.map(client => client.id))}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedClients([])}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-4">
                      {clients.map((client) => (
                        <div key={client.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedClients.includes(client.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClients(prev => [...prev, client.id])
                              } else {
                                setSelectedClients(prev => prev.filter(id => id !== client.id))
                              }
                            }}
                          />
                          <Label>{client.full_name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Channel Selection */}
                  <div className="space-y-2">
                    <Label>Select Channels</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedChannels.includes('email')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedChannels(prev => [...prev, 'email'])
                            } else {
                              setSelectedChannels(prev => prev.filter(c => c !== 'email'))
                            }
                          }}
                        />
                        <Label>Email</Label>
                        <span className="text-xs text-green-600 ml-2">(Available)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedChannels.includes('message')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedChannels(prev => [...prev, 'message'])
                            } else {
                              setSelectedChannels(prev => prev.filter(c => c !== 'message'))
                            }
                          }}
                        />
                        <Label>SMS</Label>
                        <span className={`text-xs ml-2 ${gatewayStatus ? 'text-green-600' : 'text-red-600'}`}>
                          ({gatewayStatus ? 'Available' : 'Gateway Offline'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="space-y-2">
                    <Label>Message Content</Label>
                    <Textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Type your message here..."
                      className="min-h-[150px]"
                      disabled={isSending}
                    />
                  </div>

                  {/* Send Button */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {selectedClients.length > 0 && (
                        <span>{selectedClients.length} recipient{selectedClients.length !== 1 ? 's' : ''} selected</span>
                      )}
                    </div>
                    <Button
                      onClick={async () => {
                        if (isSending) return // Prevent double clicks
                        
                        setIsSending(true)
                        try {
                          if (selectedClients.length === 0) {
                            toast.error('Please select at least one client')
                            return
                          }
                          if (selectedChannels.length === 0) {
                            toast.error('Please select at least one channel')
                            return
                          }
                          if (!messageContent.trim()) {
                            toast.error('Please enter a message')
                            return
                          }

                          for (const clientId of selectedClients) {
                            const client = clients.find(c => c.id === clientId)
                            if (!client) continue

                            for (const channel of selectedChannels) {
                              try {
                                if (channel === 'email' && client.email) {
                                  await sendMessage('email', clientId, messageContent.trim())
                                }
                                if (channel === 'message' && client.mobile) {
                                  await sendMessage('message', clientId, messageContent.trim())
                                }
                              } catch (error) {
                                console.error(`Error sending ${channel} to ${client.full_name}:`, error)
                                toast.error(`Failed to send ${channel} to ${client.full_name}`)
                              }
                            }
                          }
                          toast.success('Messages sent successfully')
                          setMessageContent('')
                          setSelectedClients([])
                          setSelectedChannels([])
                        } catch (error) {
                          console.error('Error sending messages:', error)
                          toast.error('Failed to send messages')
                        } finally {
                          setIsSending(false)
                        }
                      }}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Messages
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      <Dialog 
        open={updateDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setUpdateDialogOpen(false)
            setCurrentStep(1)
            setSelectedJob(null)
            setJobUpdate({
              status: 'In Progress',
              progress: 0,
              latestUpdate: ''
            })
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Update Job - {selectedJob?.client?.full_name}
            </DialogTitle>
            <div className="flex justify-center space-x-2 pt-2">
              <div className={`h-2 w-24 rounded ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`h-2 w-24 rounded ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Job Status</Label>
                  <RadioGroup
                    defaultValue={jobUpdate.status}
                    onValueChange={(value) => 
                      setJobUpdate(prev => ({
                        ...prev,
                        status: value as 'In Progress' | 'Completed'
                      }))
                    }
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="In Progress" id="inProgress" />
                      <Label htmlFor="inProgress">In Progress</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Completed" id="completed" />
                      <Label htmlFor="completed">Completed</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Progress (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number"
                      min="0"
                      max="100"
                      value={jobUpdate.progress}
                      onChange={(e) => 
                        setJobUpdate(prev => ({
                          ...prev,
                          progress: parseInt(e.target.value)
                        }))
                      }
                      required
                    />
                    <span>%</span>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <form onSubmit={(e) => {
                e.preventDefault()
                handleButtonClick('updateJob', () => handleJobUpdate(e))
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Latest Update</Label>
                  <Textarea 
                    value={jobUpdate.latestUpdate}
                    onChange={(e) => 
                      setJobUpdate(prev => ({
                        ...prev,
                        latestUpdate: e.target.value
                      }))
                    }
                    placeholder="Describe the latest progress on this job..."
                    className="min-h-[150px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Review Details</Label>
                  <div className="bg-gray-50 p-4 rounded-md space-y-2">
                    <p><span className="font-semibold">Status:</span> {jobUpdate.status}</p>
                    <p><span className="font-semibold">Progress:</span> {jobUpdate.progress}%</p>
                    <p><span className="font-semibold">Latest Update:</span> {jobUpdate.latestUpdate}</p>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleButtonClick('prev', async () => handleStepChange('prev'))}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  
                  <Button 
                    type="submit"
                    disabled={!jobUpdate.latestUpdate.trim() || buttonStates['updateJob']}
                  >
                    {buttonStates['updateJob'] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Update Job'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {currentStep === 1 && (
              <div className="flex justify-between pt-4 border-t">
                <div />
                <Button
                  type="button"
                  onClick={() => handleButtonClick('next', async () => handleStepChange('next'))}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={paymentDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setPaymentDialogOpen(false)
            setPaymentDetails({ amount: '', description: '' })
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Payment - {selectedJob?.client?.full_name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    className="pl-7"
                    value={paymentDetails.amount}
                    onChange={(e) => setPaymentDetails(prev => ({
                      ...prev,
                      amount: e.target.value
                    }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Payment Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter payment details..."
                  value={paymentDetails.description}
                  onChange={(e) => setPaymentDetails(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!paymentDetails.amount || Number(paymentDetails.amount) <= 0 || buttonStates['addPayment']}
                >
                  {buttonStates['addPayment'] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Add Payment'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
            </DialogHeader>
            {previewUrl && (
              <div className="flex-1 w-full h-full min-h-[60vh]">
                {previewUrl.toLowerCase().includes('.pdf') ? (
                  <object
                    data={previewUrl}
                    type="application/pdf"
                    className="w-full h-full"
                  >
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                      className="w-full h-full border-none"
                      title="Document Preview"
                    />
                  </object>
                ) : previewUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img
                    src={previewUrl}
                    alt="Document Preview"
                    className="max-w-full max-h-full object-contain mx-auto"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>Preview not available for this file type</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => previewUrl && window.open(previewUrl, '_blank')}
              >
                Open in New Tab
              </Button>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

