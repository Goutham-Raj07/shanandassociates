import { supabase } from './supabase'
import type { Job, Payment, Document, JobRequest, Invoice } from '@/types/database'

// Jobs API
export const jobsApi = {
  async getClientJobs(clientId: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getAllJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        client:users!jobs_client_id_fkey (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async updateJob(jobId: number, updates: Partial<Job>) {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async createJob(jobData: Omit<Job, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Payments API
export const paymentsApi = {
  async getClientPayments(clientId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getAllPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createPayment(paymentData: Omit<Payment, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updatePayment(paymentId: number, updates: Partial<Payment>) {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Documents API
export const documentsApi = {
  async getClientDocuments(clientId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getAllDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async updateDocument(documentId: number, updates: Partial<Document>) {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async uploadDocument(documentData: Omit<Document, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Job Requests API
export const jobRequestsApi = {
  async getClientJobRequests(clientId: string) {
    const { data, error } = await supabase
      .from('job_requests')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getAllJobRequests() {
    const { data, error } = await supabase
      .from('job_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createJobRequest(requestData: Omit<JobRequest, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('job_requests')
      .insert([requestData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateJobRequest(requestId: number, updates: Partial<JobRequest>) {
    const { data, error } = await supabase
      .from('job_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Invoices API
export const invoicesApi = {
  async getClientInvoices(clientId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('generated_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createInvoice(invoiceData: Omit<Invoice, 'id'>) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// File Storage API
export const storageApi = {
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)

    if (error) throw error
    return data
  },

  async downloadFile(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) throw error
    return data
  },

  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  }
} 