import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Remove .single() to get all matching clients
    const { data: clientData, error: clientError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        mobile,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        created_at,
        gst_number,
        pan_number
      `)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,mobile.ilike.%${query}%`)
      .eq('user_type', 'client')
      .limit(1)    // Add this to get just the first match

    if (clientError) {
      console.error('Client fetch error:', clientError)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (!clientData || clientData.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Use the first client from the results
    const client = clientData[0]

    // Then fetch jobs for this specific client
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .eq('client_id', client.id)

    // And fetch payments for this specific client
    const { data: paymentsData } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        description,
        status,
        payment_method,
        paid_at,
        created_at,
        job_id
      `)
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })

    // Update the payment processing logic
    const processedPayments = (paymentsData || []).reduce((acc: any[], payment) => {
      // Check if this payment has been updated (has a newer version)
      const hasNewerVersion = (paymentsData || []).some(p => 
        p.job_id === payment.job_id && 
        p.amount === payment.amount &&
        new Date(p.created_at) > new Date(payment.created_at) &&
        p.status === 'Paid'
      )

      // Skip if this payment has a newer version
      if (hasNewerVersion) {
        return acc
      }

      // For payments with the same job_id, only keep the latest one
      const existingPaymentIndex = acc.findIndex(p => p.job_id === payment.job_id)
      if (existingPaymentIndex >= 0) {
        // Replace if this is a newer version
        if (new Date(payment.created_at) > new Date(acc[existingPaymentIndex].created_at)) {
          acc[existingPaymentIndex] = payment
        }
      } else {
        // Add if no existing payment for this job
        acc.push(payment)
      }

      return acc
    }, [])

    // Format the response using the first client
    const clientDetails = {
      name: client.full_name || 'N/A',
      email: client.email || 'N/A',
      phone: client.mobile || 'N/A',
      address: [
        client.address_line1,
        client.address_line2,
        client.city,
        client.state,
        client.pincode
      ].filter(Boolean).join(', ') || 'N/A',
      businessName: client.full_name || 'N/A',
      registrationDate: new Date(client.created_at).toLocaleDateString(),
      gstNumber: client.gst_number || 'Not Available',
      panNumber: client.pan_number || 'Not Available',
      subscriptionStatus: jobsData?.some(job => job.status === 'In Progress') ? 'Active' : 'Inactive',
      paymentHistory: processedPayments
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map(payment => ({
          amount: payment.amount || 0,
          date: payment.paid_at 
            ? new Date(payment.paid_at).toLocaleDateString()
            : new Date(payment.created_at).toLocaleDateString(),
          status: payment.status === 'Waiting for Confirmation' && payment.payment_method === 'CASH'
            ? 'Paid'
            : payment.status || 'Pending',
          method: payment.payment_method 
            ? payment.payment_method === 'CASH' 
              ? 'Cash Payment'
              : payment.payment_method
            : 'Not specified'
        })),
      activeJobs: jobsData?.filter(job => job.status === 'In Progress').map(job => ({
        id: job.id,
        title: job.title,
        type: job.type,
        progress: job.progress,
        deadline: new Date(job.deadline).toLocaleDateString(),
        latestUpdate: job.latest_update
      })) || [],
      completedJobs: jobsData?.filter(job => job.status === 'Completed').map(job => ({
        id: job.id,
        title: job.title,
        type: job.type,
        completedDate: new Date(job.updated_at || job.created_at).toLocaleDateString()
      })) || []
    }

    return NextResponse.json(clientDetails)
  } catch (error) {
    console.error('Error in client-details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 