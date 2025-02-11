"use client"

import { useEffect } from 'react'
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Local helper function
function formatSimpleDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

interface InvoiceProps {
  invoiceNumber: string
  paymentDate: string
  amount: number
  description: string
  paymentMethod: string
  clientName: string
  clientEmail: string
}

export async function generateInvoicePDF(data: InvoiceProps) {
  // Dynamically import jsPDF only on client side
  const { default: jsPDF } = await import('jspdf')
  await import('jspdf-autotable')

  const doc = new jsPDF()

  // Add company logo/header
  doc.setFontSize(20)
  doc.text('SHAN & ASSOCIATES', 105, 20, { align: 'center' })
  doc.setFontSize(12)
  doc.text('Tax & Accounting Services', 105, 30, { align: 'center' })

  // Add invoice details
  doc.setFontSize(14)
  doc.text('INVOICE', 105, 45, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Invoice No: ${data.invoiceNumber}`, 15, 60)
  doc.text(`Date: ${formatSimpleDate(data.paymentDate)}`, 15, 67)

  // Add client details
  doc.text('Bill To:', 15, 80)
  doc.text(data.clientName, 15, 87)
  doc.text(data.clientEmail, 15, 94)

  // Add payment details
  doc.autoTable({
    startY: 105,
    head: [['Description', 'Amount']],
    body: [
      [data.description, `₹${data.amount.toLocaleString()}`],
      ['Payment Method', data.paymentMethod],
      ['Total', `₹${data.amount.toLocaleString()}`]
    ],
  })

  // Add footer
  doc.setFontSize(10)
  doc.text('Thank you for your business!', 105, doc.internal.pageSize.height - 20, { align: 'center' })

  // Save the PDF
  doc.save(`invoice-${data.invoiceNumber}.pdf`)
} 