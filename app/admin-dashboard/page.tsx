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
import { Plus, Send, Download, MessageCircle, MessageSquare, ChevronRight, ChevronLeft, FileText, IndianRupee, MapPin, Search, X, Users2, Briefcase, ClipboardList } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { apiRequest } from '@/lib/api-helpers'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { RequestDocumentDialog } from "../components/RequestDocumentDialog"
import { Building2 } from 'lucide-react' // Add this import

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
    payment_method?: string  // Add this line
  }[]
}

type JobRequest = {
  client: any
  service_type: string
  id: number
  title: string
  type: string
  description: string
  deadline: string
  budget?: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Declined'
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
  status: 'Active' | 'Inactive' // Changed from 'Pending' to 'Inactive'
  total_jobs: number
  pending_payments: number
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  pincode?: string
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

// Add this helper function at the top of the file
const isNewClient = (createdAt: string) => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  return new Date(createdAt) > threeDaysAgo;
};

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

// Add this type at the top with other types
type MessageTemplate = {
  id: string
  title: string
  content: string
}

// Update the MessageHistory type
type MessageHistory = {
  id: number
  content: string
  recipients: number
  recipient_details: Array<{
    id: string
    name: string
    email?: string
    mobile?: string
    channels: string[]
    status: 'success' | 'failed'
  }>
  channels: string[]
  sent_at: string
  status: 'success' | 'partial' | 'failed'
  sender_id: string
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

  const [clientSearch, setClientSearch] = useState("")

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
  const [jobSearch, setJobSearch] = useState('')

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
  const [showMessageSection, setShowMessageSection] = useState(true)  // Changed to true

  // Add gateway status check
  const [gatewayStatus, setGatewayStatus] = useState(false)

  // Add this state for button loading
  const [buttonStates, setButtonStates] = useState<ButtonStates>({})

  // Add this state for tracking loading states per document
  const [documentLoadingStates, setDocumentLoadingStates] = useState<DocumentLoadingState>({})

  // Add this state near the top with other states
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)

  // Add this state
  const [showRequestDialog, setShowRequestDialog] = useState(false)

  // Add this state
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([])

  // Add this state for expanded message
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null)

  // Add these states at the top
  const [showAllMessages, setShowAllMessages] = useState(false)
  const [messageSearchQuery, setMessageSearchQuery] = useState('')

  // Add these states for pagination
  const [jobRequestsPage, setJobRequestsPage] = useState(0)
  const [documentsPage, setDocumentsPage] = useState(0)
  const [messagesPage, setMessagesPage] = useState(0)

  // Add this state for expanded message in history
  const [expandedHistoryMessage, setExpandedHistoryMessage] = useState<number | null>(null)

  // Add this state near other state declarations
  const [showCompletedJobs, setShowCompletedJobs] = useState(false)

  // Add this function to filter messages
  const filteredMessages = useMemo(() => {
    const query = messageSearchQuery.toLowerCase()
    return messageHistory.filter(message => 
      // Search in message content
      message.content.toLowerCase().includes(query) ||
      // Search in recipient details
      message.recipient_details.some(recipient => 
        recipient.name.toLowerCase().includes(query) ||
        (recipient.email?.toLowerCase() || '').includes(query) ||
        (recipient.mobile?.toLowerCase() || '').includes(query)
      )
    )
  }, [messageHistory, messageSearchQuery])

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
          await fetchMessageHistory()  // Add this line
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

  // Update the loadAdminData function to properly handle payment status
  const loadAdminData = async () => {
    try {
      setIsLoading(true)
      
      const [
        { data: clientsData, error: clientsError },
        { data: jobsData, error: jobsError },
        { data: documentsData, error: documentsError },
        { data: jobRequestsData, error: jobRequestsError }, // Add this line
      ] = await Promise.all([
        // Load clients
        supabase
          .from('users')
          .select('*')
          .eq('user_type', 'client'),
        
        // Load jobs with client info and ALL payments
        supabase
          .from('jobs')
          .select(`
            *,
            client:users!jobs_client_id_fkey (
              full_name,
              email
            ),
            payments!payments_job_id_fkey (
              id,
              status,
              amount,
              created_at,
              payment_method,
              job_id
            )
          `)
          .order('created_at', { ascending: false }),
        
        // Load documents
        supabase
          .from('documents')
          .select(`
            *,
            client:client_id (
              id,
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false }),

        // Add this block to load job requests
        supabase
          .from('job_requests')
          .select(`
            *,
            client:client_id (
              id,
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false }),
      ])

      if (clientsError || jobsError || documentsError || jobRequestsError) 
        throw new Error('Error fetching data')

      // Process jobs to include payment status based on latest payment
      const processedJobs = (jobsData || []).map(job => {
        // Sort payments by creation date (newest first)
        const sortedPayments = job.payments?.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ) || []

        // Get the latest payment
        const latestPayment = sortedPayments[0]

        return {
          ...job,
          payment_status: latestPayment?.status || 'Pending',
          payments: sortedPayments
        }
      })

      // Process clients with total jobs and pending payments
      const processedClients = (clientsData || []).map(client => {
        const clientJobs = (jobsData || []).filter(job => job.client_id === client.id)
        
        // Calculate pending payments by checking latest payment for each job
        const pendingPayments = clientJobs.reduce((total, job) => {
          // Get all payments for this job, sorted by creation date (newest first)
          const jobPayments = job.payments?.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ) || []

          // Get the latest payment
          const latestPayment = jobPayments[0]

          // Add to total if the latest payment is pending or waiting for confirmation
          if (latestPayment && 
              (latestPayment.status === 'Pending' || 
               latestPayment.status === 'Waiting for Confirmation')) {
            return total + (Number(latestPayment.amount) || 0)
          }
          return total
        }, 0)

        // Determine status based on activity
        const hasActiveJobs = clientJobs.some(job => job.status === 'In Progress')
        const status = hasActiveJobs ? 'Active' : 'Inactive'

        return {
          ...client,
          total_jobs: clientJobs.length,
          pending_payments: pendingPayments,
          status: status
        }
      })

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
      
      // Add this block to process and set job requests
      if (jobRequestsData) {
        const processedRequests = jobRequestsData.map(request => ({
          id: request.id,
          client: request.client,
          service_type: request.service_type,
          title: request.title,
          type: request.type,
          description: request.description,
          deadline: request.deadline,
          budget: request.budget,
          status: request.status,
          clientName: request.client?.full_name || 'Unknown Client',
          createdAt: request.created_at
        }))
        setJobRequests(processedRequests)
      }
      
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
      // First update the job request status
      const { error: updateError } = await supabase
        .from('job_requests')
        .update({
          status: action === 'approve' ? 'Approved' : 'Rejected'
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      if (action === 'approve') {
        // Get the job request details to create a new job
        const { data: requestData, error: requestError } = await supabase
          .from('job_requests')
          .select('*')
          .eq('id', requestId)
          .single()

        if (requestError) throw requestError

        // Create a new job when approved
        const { error: jobError } = await supabase
          .from('jobs')
          .insert({
            client_id: requestData.client_id,
            title: requestData.title || requestData.service_type,
            type: requestData.type,
            status: "In Progress",
            deadline: requestData.deadline,
            progress: 0,
            latest_update: "Job created from request",
            amount: parseInt(requestData.budget || "0")
          })

        if (jobError) throw jobError
      }

      // Refresh the data
      await loadAdminData()

      toast.success(`Job request ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
    } catch (error: any) {
      console.error(`Failed to ${action} job request:`, error)
      toast.error(`Failed to ${action} job request`, {
        description: error.message
      })
    }
  }

  // Update the filteredJobs function
  const filteredJobs = jobs
    .filter(job => {
      // First filter by completion status
      if (!showCompletedJobs && job.status === 'Completed') {
        return false
      }

      // Then filter by search term
    const searchTerm = jobSearch.toLowerCase().trim()
      if (!searchTerm) return true
    
    const jobId = job.id.toString()
    const jobTitle = (job.title || '').toLowerCase()
    const clientName = (job.client?.full_name || '').toLowerCase()
    const clientEmail = (job.client?.email || '').toLowerCase()
    
    return jobId.includes(searchTerm) ||
           jobTitle.includes(searchTerm) ||
           clientName.includes(searchTerm) ||
           clientEmail.includes(searchTerm)
    })
    .sort((a, b) => {
      // Always keep completed jobs at the bottom
      if (a.status !== b.status) {
        return a.status === 'Completed' ? 1 : -1
      }

      // For jobs with the same status, sort by deadline proximity
      const today = new Date()
      const deadlineA = new Date(a.deadline)
      const deadlineB = new Date(b.deadline)
      const daysUntilA = Math.ceil((deadlineA.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const daysUntilB = Math.ceil((deadlineB.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      return daysUntilA - daysUntilB
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

  // Add this search filter function near other state declarations
  const filteredDocuments = documents.filter(document => {
    const searchTerm = searchQuery.toLowerCase().trim()
    if (!searchTerm) return true // Show all documents when search is empty
    
    const documentName = (document.name || '').toLowerCase()
    const clientName = (document.client?.full_name || '').toLowerCase()
    const clientEmail = (document.client?.email || '').toLowerCase()
    
    return documentName.includes(searchTerm) ||
           clientName.includes(searchTerm) ||
           clientEmail.includes(searchTerm)
  })

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Redirect if not authenticated or wrong user type
  if (!user || user.user_type !== 'admin') {
    router.replace('/')
    return null
  }

  const DashboardHeader = () => (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Welcome,</span>
            <span className="font-semibold">{user?.full_name || 'Admin'}</span>
          </div>
        </div>
      </div>
    </div>
  )

  // Update the search filter function to be more robust
  const filteredClients = clients.filter(client => {
    const searchTerm = clientSearch.toLowerCase().trim()
    if (!searchTerm) return true // Show all clients when search is empty
    
    const fullName = (client.full_name || '').toLowerCase()
    const email = (client.email || '').toLowerCase()
    
    return fullName.includes(searchTerm) || email.includes(searchTerm)
  })

  // Add these templates in the component before the return statement
  const messageTemplates: MessageTemplate[] = [
    {
      id: 'payment-reminder',
      title: 'Payment Reminder',
      content: 'Dear client, this is a reminder that your payment of ₹{amount} for {service} is pending. Please complete the payment at your earliest convenience.\n\nRegards,\nSaravanan\nShan & Associates\nRedhills, Chennai\nContact: +91-9962698999'
    },
    {
      id: 'document-request',
      title: 'Document Request',
      content: 'Dear client, please submit the required document ({document_name}) by {deadline}. This is important for proceeding with your service.\n\nBest regards,\nSaravanan\nShan & Associates\nRedhills, Chennai\nContact: +91-9962698999'
    },
    {
      id: 'service-update',
      title: 'Service Update',
      content: 'Dear client, we have updated your {service_name}. Current progress is at {progress}%. Please review and let us know if you have any questions.\n\nBest regards,\nSaravanan\nShan & Associates\nRedhills, Chennai\nContact: +91-9962698999'
    },
    {
      id: 'welcome',
      title: 'Welcome Message',
      content: 'Dear client, welcome to Shan & Associates! We are delighted to have you as our client. For any queries, please feel free to contact us.\n\nBest regards,\nSaravanan\nShan & Associates\nRedhills, Chennai\nContact: +91-9962698999'
    },
    {
      id: 'completion',
      title: 'Service Completion',
      content: 'Dear client, we are pleased to inform you that your {service_name} has been completed. Please review and provide your feedback.\n\nThank you for choosing Shan & Associates.\n\nBest regards,\nSaravanan\nShan & Associates\nRedhills, Chennai\nContact: +91-9962698999'
    }
  ]

  // Add this function near other data loading functions
  const fetchMessageHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('message_history')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50)  // Limit to last 50 messages

      if (error) throw error

      if (data) {
        setMessageHistory(data)
      }
    } catch (error) {
      console.error('Error fetching message history:', error)
      toast.error('Failed to load message history')
    }
  }

  // Update the handleSendMessage function's success block
  const handleSendMessage = async () => {
    if (isSending) return
    
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

      const recipientDetails = selectedClients.map(clientId => {
        const client = clients.find(c => c.id === clientId)
        return {
          id: clientId,
          name: client?.full_name || 'Unknown',
          email: client?.email,
          mobile: client?.mobile,
          channels: selectedChannels,
          status: 'success'
        }
      })

      // Insert into message_history table
      const { data: messageData, error: messageError } = await supabase
        .from('message_history')
        .insert({
          content: messageContent,
          recipients: selectedClients.length,
          recipient_details: recipientDetails,
          channels: selectedChannels,
          status: 'success',
          sender_id: user!.id
        })
        .select()
        .single()

      if (messageError) throw messageError

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

      // Update UI with new message
      setMessageHistory(prev => [messageData, ...prev])

      // After successful send, refresh the message history
      await fetchMessageHistory()
      
      // Clear form
      setMessageContent('')
      setSelectedClients([])
      setSelectedChannels([])

    } catch (error) {
      console.error('Error sending messages:', error)
      toast.error('Failed to send messages')
    } finally {
      setIsSending(false)
    }
  }

  // Add this function to handle payment approval
  const handlePaymentApproval = async (jobId: number, paymentId: number) => {
    try {
      // Update the payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'Paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      if (paymentError) throw paymentError

      // Refresh the data
      await loadAdminData()
      
      toast.success('Payment approved successfully')
    } catch (error) {
      console.error('Error approving payment:', error)
      toast.error('Failed to approve payment')
    }
  }

  // Add this near other filter functions
  const filteredJobRequests = useMemo(() => {
    return jobRequests.filter(request => {
      const searchTerm = jobRequestSearch.toLowerCase().trim()
      if (!searchTerm) return true

      const title = (request.title || '').toLowerCase()
      const type = (request.type || '').toLowerCase()
      const clientName = (request.client?.full_name || '').toLowerCase()
      const description = (request.description || '').toLowerCase()
      
      return title.includes(searchTerm) ||
             type.includes(searchTerm) ||
             clientName.includes(searchTerm) ||
             description.includes(searchTerm)
    })
  }, [jobRequests, jobRequestSearch])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        userType="admin"
        userName={user?.full_name}
        orgName="Shan & Associates"
      />
      <main className="flex-grow container mx-auto px-4 py-4 sm:py-8">
        <DashboardHeader />
        
        {/* Recent Updates Section */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Job Requests</CardTitle>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (jobRequestsPage > 0) {
                      setJobRequestsPage(prev => prev - 1)
                    } else {
                      setJobRequestsPage(Math.floor((jobRequests.length - 1) / 5))
                    }
                  }}
                  disabled={jobRequests.length <= 5}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-500 w-12 text-center">
                  {Math.min(jobRequestsPage * 5 + 5, jobRequests.length)}/{jobRequests.length}
                </span>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (jobRequests.length > (jobRequestsPage + 1) * 5) {
                      setJobRequestsPage(prev => prev + 1)
                    } else {
                      setJobRequestsPage(0)
                    }
                  }}
                  disabled={jobRequests.length <= 5}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {jobRequests.slice(jobRequestsPage * 5, (jobRequestsPage + 1) * 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{request.title || request.service_type}</p>
                      <p className="text-xs text-gray-500">
                        {request.client?.full_name} • {formatTimeAgo(request.createdAt)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      request.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      request.status === 'Declined' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {request.status || 'Pending'}
                    </span>
                  </div>
                ))}
                {jobRequests.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">No recent requests</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Documents</CardTitle>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (documentsPage > 0) {
                      setDocumentsPage(prev => prev - 1)
                    } else {
                      setDocumentsPage(Math.floor((documents.length - 1) / 5))
                    }
                  }}
                  disabled={documents.length <= 5}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-500 w-12 text-center">
                  {Math.min(documentsPage * 5 + 5, documents.length)}/{documents.length}
                </span>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (documents.length > (documentsPage + 1) * 5) {
                      setDocumentsPage(prev => prev + 1)
                    } else {
                      setDocumentsPage(0)
                    }
                  }}
                  disabled={documents.length <= 5}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documents.slice(documentsPage * 5, (documentsPage + 1) * 5).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.clientName}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      doc.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      doc.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">No recent documents</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Payments Waiting Confirmation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {jobs
                  .filter(job => job.payments?.some(payment => payment.status === 'Waiting for Confirmation'))
                  .slice(0, 5)
                  .map((job) => {
                    const waitingPayment = job.payments?.find(payment => payment.status === 'Waiting for Confirmation')
                    return (
                      <div key={job.id} className="flex items-center justify-between py-2">
                    <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">₹{waitingPayment?.amount.toLocaleString()}</p>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {waitingPayment?.payment_method || 'Bank Transfer'}
                    </span>
                  </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {job.title} • {job.client?.full_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatTimeAgo(waitingPayment?.created_at || '')}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push('/admin-dashboard/payments')}
                        >
                          View & Approve
                        </Button>
                      </div>
                    )
                })}
                {jobs.filter(job => job.payments?.some(payment => payment.status === 'Waiting for Confirmation')).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">No payments waiting confirmation</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clients" value={selectedTab} onValueChange={setSelectedTab}>
          {/* Mobile/Tablet View */}
          <div className="sm:hidden">
            <Select
              value={selectedTab}
              onValueChange={setSelectedTab}
            >
              <SelectTrigger className="w-full mb-4">
                <SelectValue>
                  {selectedTab === 'clients' && 'Manage Clients'}
                  {selectedTab === 'jobs' && 'Manage Jobs'}
                  {selectedTab === 'documents' && 'Documents'}
                  {selectedTab === 'jobRequests' && 'Job Requests'}
                  {selectedTab === 'messages' && 'Messages'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clients">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4" />
                    Manage Clients
                  </div>
                </SelectItem>
                <SelectItem value="jobs">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Manage Jobs
                  </div>
                </SelectItem>
                <SelectItem value="documents">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents
                  </div>
                </SelectItem>
                <SelectItem value="jobRequests">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Job Requests
                  </div>
                </SelectItem>
                <SelectItem value="messages">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop View */}
          <TabsList className="hidden sm:block w-full border-b bg-white sticky top-0 z-10">
            <div className="container mx-auto px-2 sm:px-4 overflow-x-auto">
              <div className="flex min-w-max space-x-2 py-1">
              <TabsTrigger 
                value="clients"
                  className="px-3 py-2 text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                  <Users2 className="h-4 w-4 mr-2" />
                Manage Clients
              </TabsTrigger>
              <TabsTrigger 
                value="jobs"
                  className="px-3 py-2 text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                  <Briefcase className="h-4 w-4 mr-2" />
                Manage Jobs
              </TabsTrigger>
              <TabsTrigger 
                value="documents"
                  className="px-3 py-2 text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                  <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger 
                value="jobRequests"
                  className="px-3 py-2 text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                  <ClipboardList className="h-4 w-4 mr-2" />
                Job Requests
              </TabsTrigger>
              <TabsTrigger 
                value="messages"
                  className="px-3 py-2 text-sm rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                  <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </TabsTrigger>
              </div>
            </div>
          </TabsList>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <div className="space-y-4 sm:space-y-0">
                <div className="flex items-center justify-between">
                  <CardTitle>Manage Clients</CardTitle>
                    <Button
                      onClick={() => router.push('/admin-dashboard/add-user')}
                      className="hidden sm:flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add New Client
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search by name or email..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="pl-8 h-9 w-full"
                      />
                    </div>
                    <Button 
                      onClick={() => router.push('/admin-dashboard/add-user')}
                      className="sm:hidden flex items-center gap-2 justify-center"
                    >
                      <Plus className="h-4 w-4" />
                      Add New Client
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Mobile/Tablet View */}
                <div className="sm:hidden space-y-4">
                  {filteredClients.map((client) => (
                    <div key={client.id} className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{client.full_name || 'Unnamed Client'}</h3>
                            {isNewClient(client.created_at) && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{client.email || 'No email'}</p>
                          <p className="text-sm text-gray-500">{client.mobile || 'No mobile'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {client.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                        <div>
                          <p className="text-xs text-gray-500">Total Jobs</p>
                          <p className="font-medium">{client.total_jobs || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pending Payments</p>
                          <p className={`font-medium ${client.pending_payments > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                            ₹{(client.pending_payments || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="text-sm text-gray-500">
                          Joined: {new Date(client.created_at).toLocaleDateString()}
                        </div>
                        {client.address_line1 && (
                          <Dialog>
                            <DialogTrigger>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MapPin className="h-4 w-4 text-gray-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <div className="space-y-2 pt-2">
                                <p>{client.address_line1}</p>
                                {client.address_line2 && <p>{client.address_line2}</p>}
                                {(client.city || client.state || client.pincode) && (
                                  <p>
                                    {[client.city, client.state, client.pincode]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredClients.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No clients found
                    </div>
                  )}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                <div className="min-w-[640px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile</TableHead>
                        <TableHead>Address</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Total Jobs</TableHead>
                      <TableHead>Pending Payments</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                        {filteredClients.map((client: Client) => (
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
                                {client.address_line1 ? (
                                  <Dialog>
                                    <DialogTrigger>
                                      <MapPin className="h-4 w-4 text-gray-500 hover:text-blue-500 cursor-pointer" />
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                      <div className="space-y-2 pt-2">
                                        <p>{client.address_line1}</p>
                                        {client.address_line2 && <p>{client.address_line2}</p>}
                                        {(client.city || client.state || client.pincode) && (
                                          <p>
                                            {[client.city, client.state, client.pincode]
                                              .filter(Boolean)
                                              .join(', ')}
                                          </p>
                                        )}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                ) : (
                                  <MapPin className="h-4 w-4 text-gray-300" />
                                )}
                              </TableCell>
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
                                  : 'bg-red-100 text-red-800' // Changed from yellow to red for Inactive
                              }`}>
                                {client.status}
                              </span>
                            </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                </div>

                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No clients found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="jobs" className="py-4">
            <Card>
              <CardHeader className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                  <CardTitle>Job List</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="hidden sm:flex">
                          <Plus className="mr-2 h-4 w-4" /> New Job
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Job</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateJob}>
                          <div className="grid gap-4 py-4">
                            {/* Add this in the job creation dialog, before the client selection dropdown */}
                            <div className="space-y-4">
                              <Label>Select Client</Label>
                              
                              <div className="space-y-2">
                                {selectedClientId ? (
                                  <div className="flex items-center justify-between border rounded-lg p-3">
                                    {clients
                                      .filter(client => client.id === selectedClientId)
                                      .map((client) => (
                                        <div key={client.id} className="flex items-center justify-between w-full">
                                          <div className="flex flex-col">
                                            <span className="font-medium">{client.full_name || 'Unnamed Client'}</span>
                                            <span className="text-xs text-gray-500">{client.email || 'No email'}</span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedClientId('')
                                              setClientSearch('')
                                            }}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <>
                                    <div className="relative">
                                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                                        placeholder="Search clients by name or email..."
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                        className="pl-8"
                                      />
                                    </div>

                                    {clientSearch && (
                                      <div className="border rounded-lg divide-y">
                                        {clients
                                          .filter(client => {
                                            const searchTerm = clientSearch.toLowerCase();
                                            const fullName = (client.full_name || '').toLowerCase();
                                            const email = (client.email || '').toLowerCase();
                                            
                                            return fullName.includes(searchTerm) || email.includes(searchTerm);
                                          })
                                          .slice(0, 3)
                                          .map((client) => (
                                            <div
                                              key={client.id}
                                              className="p-2 cursor-pointer hover:bg-gray-50"
                                              onClick={() => {
                                                setSelectedClientId(client.id)
                                                setClientSearch('')
                                              }}
                                            >
                                              <div className="flex flex-col">
                                                <span className="font-medium">{client.full_name || 'Unnamed Client'}</span>
                                                <span className="text-xs text-gray-500">{client.email || 'No email'}</span>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </>
                                )}
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
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search jobs..."
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                        className="pl-8 w-full"
                    />
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="sm:hidden w-full">
                          <Plus className="mr-2 h-4 w-4" /> New Job
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Job</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateJob}>
                          <div className="grid gap-4 py-4">
                            {/* Add this in the job creation dialog, before the client selection dropdown */}
                            <div className="space-y-4">
                              <Label>Select Client</Label>
                              
                              <div className="space-y-2">
                                {selectedClientId ? (
                                  <div className="flex items-center justify-between border rounded-lg p-3">
                                    {clients
                                      .filter(client => client.id === selectedClientId)
                                      .map((client) => (
                                        <div key={client.id} className="flex items-center justify-between w-full">
                                          <div className="flex flex-col">
                                            <span className="font-medium">{client.full_name || 'Unnamed Client'}</span>
                                            <span className="text-xs text-gray-500">{client.email || 'No email'}</span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedClientId('')
                                              setClientSearch('')
                                            }}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <>
                                    <div className="relative">
                                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                      <Input
                                        placeholder="Search clients by name or email..."
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                        className="pl-8"
                                      />
                                    </div>

                                    {clientSearch && (
                                      <div className="border rounded-lg divide-y">
                                        {clients
                                          .filter(client => {
                                            const searchTerm = clientSearch.toLowerCase();
                                            const fullName = (client.full_name || '').toLowerCase();
                                            const email = (client.email || '').toLowerCase();
                                            
                                            return fullName.includes(searchTerm) || email.includes(searchTerm);
                                          })
                                          .slice(0, 3)
                                          .map((client) => (
                                            <div
                                              key={client.id}
                                              className="p-2 cursor-pointer hover:bg-gray-50"
                                              onClick={() => {
                                                setSelectedClientId(client.id)
                                                setClientSearch('')
                                              }}
                                            >
                                              <div className="flex flex-col">
                                                <span className="font-medium">{client.full_name || 'Unnamed Client'}</span>
                                                <span className="text-xs text-gray-500">{client.email || 'No email'}</span>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </>
                                )}
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
              <CardContent className="p-4">
                {/* Mobile/Tablet View */}
                <div className="sm:hidden space-y-4">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{job.title}</p>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              job.status === 'Completed' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">#{job.id} • {job.type}</p>
                          <div className="text-sm text-gray-500">
                            <p>{job.client?.full_name}</p>
                            <p className="text-xs">{job.client?.email}</p>
                          </div>
                        </div>
                        <p className={`text-sm font-medium ${
                          new Date(job.deadline) < new Date() 
                            ? "text-red-600" 
                            : "text-gray-600"
                        }`}>
                          {formatSimpleDate(job.deadline)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${job.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 min-w-[40px] text-right">
                            {job.progress}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{job.latest_update}</p>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1"
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
                          Update
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedJob(job)
                            setPaymentDialogOpen(true)
                          }}
                        >
                          <IndianRupee className="h-4 w-4 mr-2" />
                          Payment
                        </Button>
                      </div>

                      <div className="flex items-center justify-between pt-2 text-sm">
                        <p className="font-medium">Amount: ₹{job.amount.toLocaleString()}</p>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          job.payment_status === 'Paid' 
                            ? 'bg-green-100 text-green-800'
                            : job.payment_status === 'Waiting for Confirmation'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {job.payment_status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                <div className="min-w-[640px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                        <TableHead>Job ID</TableHead>
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
                          <TableCell className="font-medium">#{job.id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{job.client?.full_name}</div>
                              <div className="text-sm text-gray-500">{job.client?.email}</div>
                            </div>
                          </TableCell>
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
                              : job.payment_status === 'Waiting for Confirmation'
                              ? 'bg-blue-100 text-blue-800'
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
                  </div>
                </div>

                {filteredJobs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No jobs found
                  </div>
                )}

                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowCompletedJobs(!showCompletedJobs)}
                    className="w-full sm:w-auto max-w-[200px]"
                  >
                    {showCompletedJobs ? 'Hide Completed Jobs' : 'Show Completed Jobs'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="documents">
            <Card>
              <CardHeader className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                  <CardTitle>Documents</CardTitle>
                    <Button 
                      onClick={() => setShowRequestDialog(true)}
                      className="hidden sm:flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Request Document
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-full"
                    />
                    </div>
                    <Button 
                      onClick={() => setShowRequestDialog(true)}
                      className="sm:hidden w-full flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Request Document
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Mobile/Tablet View */}
                <div className="sm:hidden space-y-4">
                  {filteredDocuments.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <p className="font-medium">{doc.name}</p>
                          </div>
                          <p className="text-sm text-gray-500">{doc.client?.full_name}</p>
                          <p className="text-xs text-gray-400">{formatTimeAgo(doc.uploadedAt)}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          doc.status === 'Verified' ? 'bg-green-100 text-green-800' :
                          doc.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          doc.status === 'Uploaded' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        {doc.status === 'Uploaded' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-green-600 hover:text-green-700"
                              onClick={() => handleButtonClick('approve', () => handleDocumentAction(doc, 'approve'))}
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
                              className="flex-1 text-red-600 hover:text-red-700"
                              onClick={() => handleButtonClick('reject', () => handleDocumentAction(doc, 'reject'))}
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
                          className="flex-1"
                          onClick={() => handlePreviewDocument(doc)}
                          disabled={documentLoadingStates[doc.id.toString()]?.action === 'preview'}
                        >
                          {documentLoadingStates[doc.id.toString()]?.action === 'preview' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Preview'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDownloadDocument(doc)}
                          disabled={documentLoadingStates[doc.id.toString()]?.action === 'download'}
                        >
                          {documentLoadingStates[doc.id.toString()]?.action === 'download' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Download'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                <div className="min-w-[640px]">
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
                    {filteredDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {document.client?.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {document.client?.email || 'No email'}
                            </div>
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
                </div>
                </div>

                {filteredDocuments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No documents found
                  </div>
                )}
              </CardContent>
            </Card>

            <RequestDocumentDialog
              open={showRequestDialog}
              onOpenChange={setShowRequestDialog}
              onSuccess={loadAdminData}
              clients={clients}
            />
          </TabsContent>
          <TabsContent value="jobRequests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Job Requests</CardTitle>
                  <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search requests..."
                      value={jobRequestSearch}
                      onChange={(e) => setJobRequestSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredJobRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{request.title || request.service_type}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              request.status === 'Approved' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-500">
                            <p>
                              <span className="font-medium">Client:</span> {request.client?.full_name}
                            </p>
                            <p>
                              <span className="font-medium">Type:</span> {request.type}
                            </p>
                            {request.budget && (
                              <p>
                                <span className="font-medium">Budget:</span> ₹{request.budget}
                              </p>
                            )}
                            <p>
                              <span className="font-medium">Deadline:</span> {formatSimpleDate(request.deadline)}
                            </p>
                            <p className="text-sm mt-2">{request.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(request.createdAt)}
                          </span>
                          {request.status === 'Pending' && (
                            <div className="flex flex-col gap-2 mt-4">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleButtonClick(`approve-${request.id}`, () => handleJobRequestAction(request.id, 'approve'))}
                                disabled={buttonStates[`approve-${request.id}`]}
                              >
                                {buttonStates[`approve-${request.id}`] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Approve'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleButtonClick(`reject-${request.id}`, () => handleJobRequestAction(request.id, 'reject'))}
                                disabled={buttonStates[`reject-${request.id}`]}
                              >
                                {buttonStates[`reject-${request.id}`] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Decline'
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredJobRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {jobRequestSearch ? 'No matching job requests found' : 'No job requests found'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Messages & Communications</CardTitle>
                  <Button 
                    onClick={() => setShowMessageSection(!showMessageSection)} // Changed to toggle
                    className="flex items-center gap-2"
                    variant={!showMessageSection ? "outline" : "default"}  // Inverted condition
                  >
                    {!showMessageSection ? (  // Inverted condition
                      <>
                        <MessageCircle className="h-4 w-4" />
                        New Message
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        View History
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showMessageSection ? (  // Removed the ! to show sending page when true
                  <div className="space-y-6">
                    {/* Client Selection */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Select Recipients</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedClients(clients.map(c => c.id))}
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

                      {/* Add client search bar */}
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search clients by name or email..."
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[200px] overflow-y-auto border rounded-lg p-4">
                        {clients
                          .filter(client => {
                            const searchTerm = clientSearch.toLowerCase();
                            const fullName = (client.full_name || '').toLowerCase();
                            const email = (client.email || '').toLowerCase();
                            
                            return fullName.includes(searchTerm) || email.includes(searchTerm);
                          })
                          .map((client) => (
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
                              <div>
                                <p className="text-sm font-medium">{client.full_name || 'Unnamed Client'}</p>
                                <p className="text-xs text-gray-500">{client.email || 'No email'}</p>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>

                    {/* Channel Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Select Channels</h3>
                      <div className="flex gap-6">
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
                          <div>
                            <Label>Email</Label>
                            <p className="text-xs text-green-600">Available</p>
                          </div>
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
                          <div>
                            <Label>SMS</Label>
                            <p className={`text-xs ${gatewayStatus ? 'text-green-600' : 'text-red-600'}`}>
                              {gatewayStatus ? 'Available' : 'Gateway Offline'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Compose Message</h3>
                      <div className="space-y-4">
                        <Select
                          onValueChange={(value) => {
                            const template = messageTemplates.find(t => t.id === value)
                            if (template) {
                              setMessageContent(template.content)
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a template or write custom message" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom Message</SelectItem>
                            {messageTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Textarea
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          placeholder="Type your message here..."
                          className="min-h-[200px]"
                          disabled={isSending}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowMessageSection(false)}
                      >
                        Cancel
                      </Button>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-500">
                          {selectedClients.length} recipient{selectedClients.length !== 1 ? 's' : ''} selected
                        </p>
                        <Button
                          onClick={handleSendMessage}
                          disabled={isSending || selectedClients.length === 0}
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Message History Section
                  <div className="space-y-6">
                    {/* Message History Search */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Message History</h3>
                      <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search messages..."
                          value={messageSearchQuery}
                          onChange={(e) => setMessageSearchQuery(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>

                    {/* Message History List */}
                    <div className="space-y-4">
                      {filteredMessages.map((message) => (
                        <div 
                          key={message.id} 
                          className="border rounded-lg p-4 space-y-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => setExpandedHistoryMessage(expandedHistoryMessage === message.id ? null : message.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <p className="font-medium">{message.content}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{message.recipients} recipient(s)</span>
                                <span>•</span>
                                <span>{message.channels.join(', ')}</span>
                                <span>•</span>
                                <span>{formatTimeAgo(message.sent_at)}</span>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              message.status === 'success' ? 'bg-green-100 text-green-700' :
                              message.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {message.status}
                            </span>
                          </div>

                          {/* Recipient Details Section */}
                          {expandedHistoryMessage === message.id && (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="text-sm font-medium mb-3">Recipients</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {message.recipient_details.map((recipient) => (
                                  <div 
                                    key={recipient.id} 
                                    className="bg-gray-50 p-3 rounded-lg"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="space-y-1">
                                        <p className="text-sm font-medium">{recipient.name}</p>
                                        {recipient.email && (
                                          <p className="text-xs text-gray-500">
                                            Email: {recipient.email}
                                          </p>
                                        )}
                                        {recipient.mobile && (
                                          <p className="text-xs text-gray-500">
                                            Mobile: {recipient.mobile}
                                          </p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                          Sent via: {recipient.channels?.join(', ') || 'No channels'}
                                        </p>
                                      </div>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        recipient.status === 'success' 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {recipient.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

