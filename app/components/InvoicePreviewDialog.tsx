"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"

function formatSimpleDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

interface InvoicePreviewDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  invoiceData: InvoiceData | null
  onDownloadAction: () => Promise<void>
}

interface InvoiceData {
  invoiceNumber: string
  paymentDate: string
  amount: number
  description: string
  paymentMethod: string
  clientName: string
  clientEmail: string
}

export function InvoicePreviewDialog({ 
  open, 
  onOpenChangeAction,
  invoiceData, 
  onDownloadAction 
}: InvoicePreviewDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    console.log('InvoicePreviewDialog - invoiceData:', invoiceData)
  }, [invoiceData])

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await onDownloadAction()
    } catch (error) {
      console.error('Error downloading invoice:', error)
    }
    setIsDownloading(false)
  }

  if (!invoiceData) {
    console.log('No invoice data provided')
    return null
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(open) => {
        console.log('Dialog onOpenChange:', open)
        onOpenChangeAction(open)
      }}
    >
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
        </DialogHeader>
        <div className="mt-4 bg-white p-8 rounded-lg border">
          {/* Invoice Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">SHAN & ASSOCIATES</h2>
            <p className="text-gray-600">Tax & Accounting Services</p>
          </div>

          {/* Invoice Details */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-center mb-4">INVOICE</h3>
            <div className="flex justify-between">
              <div>
                <p><span className="font-semibold">Invoice No:</span> {invoiceData.invoiceNumber}</p>
                <p><span className="font-semibold">Date:</span> {formatSimpleDate(invoiceData.paymentDate)}</p>
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="mb-8">
            <h4 className="font-semibold mb-2">Bill To:</h4>
            <p>{invoiceData.clientName}</p>
            <p>{invoiceData.clientEmail}</p>
          </div>

          {/* Payment Details */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left">Description</th>
                  <th className="border p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">{invoiceData.description}</td>
                  <td className="border p-2 text-right">₹{invoiceData.amount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="border p-2">Payment Method</td>
                  <td className="border p-2 text-right">{invoiceData.paymentMethod}</td>
                </tr>
                <tr className="font-bold">
                  <td className="border p-2">Total</td>
                  <td className="border p-2 text-right">₹{invoiceData.amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-600">
            <p>Thank you for your business!</p>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-end mt-4">
          <Button 
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 