"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Navbar } from "../../components/Navbar"
import { Footer } from "../../components/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Loader2, Check, X, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { RejectPaymentDialog } from "../../components/RejectPaymentDialog"
import { AddOfflinePaymentDialog } from "../../components/AddOfflinePaymentDialog"

type Payment = {
  id: number
  job_id?: number
  client_id: string
  amount: number
  description: string
  status: string
  payment_method: string
  paid_at: string
  payment_details?: {
    upiId?: string
    name?: string
    accountNumber?: string
  }
  users?: {
    full_name: string
    email: string
  }
}

type Job = {
  id: number
  title: string
  client: {
    id: string
    full_name: string
  }
}

export default function PaymentConfirmation() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState<number | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null)
  const [showAddOfflinePayment, setShowAddOfflinePayment] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    if (user?.id) {
      fetchPendingPayments()
      fetchJobs()
    }
  }, [user])

  const fetchPendingPayments = async () => {
    try {
      // First get the payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'Waiting for Confirmation')
        .order('paid_at', { ascending: false })

      if (paymentsError) throw paymentsError

      // Then get the user details for each payment
      const paymentData = await Promise.all(
        payments.map(async (payment) => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', payment.client_id)
            .single()

          if (userError) {
            console.error('Error fetching user:', userError)
            return {
              ...payment,
              users: { full_name: 'Unknown', email: 'Unknown' }
            }
          }

          return {
            ...payment,
            users: userData
          }
        })
      )

      setPayments(paymentData)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          client:client_id!inner (
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      // Transform data to match Job type
      const transformedData = data.map((job: any) => ({
        id: job.id,
        title: job.title,
        client: job.client[0]  // Get first client from array
      }))
      setJobs(transformedData)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to load jobs')
    }
  }

  const handlePaymentAction = async (paymentId: number, action: 'confirm' | 'reject') => {
    setProcessingPayment(paymentId)
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: action === 'confirm' ? 'Paid' : 'Pending',
          payment_method: action === 'reject' ? null : undefined,
          paid_at: action === 'reject' ? null : undefined,
          payment_details: action === 'reject' ? null : undefined
        })
        .eq('id', paymentId)

      if (error) throw error

      toast.success(`Payment ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully`)
      fetchPendingPayments()
    } catch (error) {
      console.error('Error updating payment:', error)
      toast.error('Failed to update payment')
    } finally {
      setProcessingPayment(null)
    }
  }

  const handleReject = (paymentId: number) => {
    setSelectedPaymentId(paymentId)
    setShowRejectDialog(true)
  }

  const handlePaymentReject = async (reason: string) => {
    if (!selectedPaymentId) return

    setProcessingPayment(selectedPaymentId)
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'Pending',
          payment_method: null,
          paid_at: null,
          payment_details: null,
          rejection_reason: reason
        })
        .eq('id', selectedPaymentId)

      if (error) throw error

      toast.success('Payment rejected successfully')
      fetchPendingPayments()
    } catch (error) {
      console.error('Error updating payment:', error)
      toast.error('Failed to update payment')
    } finally {
      setProcessingPayment(null)
      setSelectedPaymentId(null)
    }
  }

  if (!user || user.user_type !== 'admin') {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar userType="admin" userName={user?.full_name} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payment Confirmations</CardTitle>
            <Button onClick={() => setShowAddOfflinePayment(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Offline Payment
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payments awaiting confirmation
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Payment Details</TableHead>
                    <TableHead>Initiated At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.job_id || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.users?.full_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{payment.users?.email || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {payment.payment_details && (
                            <>
                              {payment.payment_details.upiId && (
                                <div className="text-sm">
                                  <span className="font-medium">UPI ID:</span> {payment.payment_details.upiId}
                                </div>
                              )}
                              {payment.payment_details.accountNumber && (
                                <div className="text-sm">
                                  <span className="font-medium">Account:</span> {payment.payment_details.accountNumber}
                                </div>
                              )}
                              {payment.payment_details.name && (
                                <div className="text-sm">
                                  <span className="font-medium">Name:</span> {payment.payment_details.name}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(payment.paid_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handlePaymentAction(payment.id, 'confirm')}
                            disabled={processingPayment === payment.id}
                          >
                            {processingPayment === payment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(payment.id)}
                            disabled={processingPayment === payment.id}
                          >
                            {processingPayment === payment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
      <RejectPaymentDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={handlePaymentReject}
      />
      <AddOfflinePaymentDialog
        open={showAddOfflinePayment}
        onOpenChangeAction={setShowAddOfflinePayment}
        onSuccessAction={fetchPendingPayments}
        jobs={jobs}
      />
    </div>
  )
} 