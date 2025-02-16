"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface AddOfflinePaymentDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  onSuccessAction: () => void
  jobs: Array<{
    id: number
    title: string
    client: {
      id: string
      full_name: string
    }
  }>
}

type JobDetails = {
  id: number
  title: string
  client: {
    id: string
    full_name: string
    email: string
  } | null
  amount: number
  description: string
  payment_status?: string
}

export function AddOfflinePaymentDialog({
  open,
  onOpenChangeAction,
  onSuccessAction,
  jobs
}: AddOfflinePaymentDialogProps) {
  const [jobId, setJobId] = useState("")
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null)
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleJobSearch = async () => {
    if (!jobId) return

    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          amount,
          payment_status,
          client:users!client_id (
            id,
            full_name,
            email
          )
        `)
        .eq('id', jobId)
        .single()

      if (error) throw error

      if (!data) {
        toast.error('Job not found')
        return
      }

      if (!data.client) {
        toast.error('Client details not found')
        return
      }

      if (data.payment_status === 'Paid') {
        toast.error('This job is already paid')
        return
      }

      const jobDetails: JobDetails = {
        id: data.id,
        title: data.title,
        amount: data.amount || 0,
        description: data.title,
        payment_status: data.payment_status,
        client: Array.isArray(data.client) ? data.client[0] : data.client
      }

      setJobDetails(jobDetails)
    } catch (error) {
      console.error('Error fetching job:', error)
      toast.error('Failed to fetch job details')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async () => {
    if (!jobDetails) return

    setIsSubmitting(true)
    try {
      // First, find any pending payment requests for this job
      const { data: pendingPayments, error: searchError } = await supabase
        .from('payments')
        .select('id, amount')
        .eq('job_id', jobDetails.id)
        .eq('status', 'Pending')

      if (searchError) throw searchError

      // If there's a pending payment, update it with new amount and status
      if (pendingPayments && pendingPayments.length > 0) {
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'Paid',
            payment_method: paymentMode,
            paid_at: new Date().toISOString(),
            amount: jobDetails.amount  // Update with the new amount
          })
          .eq('id', pendingPayments[0].id)

        if (updateError) throw updateError
      } else {
        // If no pending payment exists, create new payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            job_id: jobDetails.id,
            client_id: jobDetails.client?.id,
            amount: jobDetails.amount,
            description: `Payment for ${jobDetails.title}`,
            status: 'Paid',
            payment_method: paymentMode,
            paid_at: new Date().toISOString()
          })

        if (paymentError) throw paymentError
      }

      // Update job payment status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          payment_status: 'Paid'
        })
        .eq('id', jobDetails.id)

      if (jobError) throw jobError

      toast.success('Payment added successfully')
      onSuccessAction()
      onOpenChangeAction(false)
      resetForm()
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('Failed to add payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setJobId("")
    setJobDetails(null)
    setPaymentMode('CASH')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Offline Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!jobDetails ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Job ID</Label>
                <div className="flex gap-2">
                  <Input
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    placeholder="Enter job ID"
                  />
                  <Button 
                    onClick={handleJobSearch}
                    disabled={!jobId || isSearching}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="font-medium">Job Details</div>
                <div className="text-sm space-y-1">
                  <div><span className="text-gray-500">ID:</span> #{jobDetails.id}</div>
                  <div><span className="text-gray-500">Title:</span> {jobDetails.title}</div>
                  <div><span className="text-gray-500">Client:</span> {jobDetails.client?.full_name}</div>
                  <div><span className="text-gray-500">Email:</span> {jobDetails.client?.email}</div>
                  <div><span className="text-gray-500">Amount:</span> ₹{jobDetails.amount.toLocaleString()}</div>
                  <div><span className="text-gray-500">Description:</span> {jobDetails.description}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <RadioGroup value={paymentMode} onValueChange={(value: 'CASH' | 'UPI') => setPaymentMode(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CASH" id="cash" />
                    <Label htmlFor="cash">Cash</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="UPI" id="upi" />
                    <Label htmlFor="upi">UPI</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setJobDetails(null)
                    setJobId("")
                  }}
                >
                  Back
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Marking as Paid...
                    </>
                  ) : (
                    'Mark as Paid'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 