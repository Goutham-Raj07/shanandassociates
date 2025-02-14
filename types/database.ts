export type User = {
  id: string
  email: string
  full_name: string
  mobile: string
  user_type: 'admin' | 'client'
  created_at: string
  // Updated field name
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  pincode?: string
  company_name?: string
  gst_number?: string
  pan_number?: string
}

export interface Job {
  id: number
  title: string
  client_id: string
  type: string
  status: 'In Progress' | 'Completed'
  deadline: string
  progress: number
  latest_update: string
  amount: number
  created_at: string
}

export interface Payment {
  id: number
  job_id: number
  client_id: string
  amount: number
  description: string
  status: 'Pending' | 'Waiting for Confirmation' | 'Paid' | 'Rejected'
  payment_method?: string
  paid_at?: string
  created_at: string
}

export interface Document {
  id: number
  client_id: string
  name: string
  description: string
  deadline: string
  status: 'Pending' | 'Uploaded' | 'Verified' | 'Rejected'
  feedback?: string
  uploaded_at?: string
  created_at: string
  file_name?: string
  client?: {
    full_name: string
    email: string
  }
}

export type JobRequest = {
  id: number
  client_id: string
  title: string
  type: string
  description: string
  deadline: string
  budget?: string
  status: 'Pending' | 'Approved' | 'Rejected'
  created_at: string
}

export interface Invoice {
  id: number
  payment_id: number
  invoice_number: string
  client_id: string
  generated_at: string
} 