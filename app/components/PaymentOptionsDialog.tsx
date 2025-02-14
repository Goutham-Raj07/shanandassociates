"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrCode, Landmark, Smartphone, Copy, ExternalLink, Check } from "lucide-react"
import { toast } from "sonner"
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PaymentOptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  paymentId: number
  onSelectOption: (option: 'qr' | 'bank' | 'upi') => void
  onPaymentComplete?: () => void
}

type BankDetails = {
  label: string
  value: string
}

interface PaymentDetailsForm {
  upi: {
    upiId: string
    name: string
  }
  bank: {
    accountNumber: string
    name: string
  }
}

export function PaymentOptionsDialog({
  open,
  onOpenChange,
  amount,
  paymentId,
  onSelectOption,
  onPaymentComplete
}: PaymentOptionsDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'qr' | 'bank' | 'upi' | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsForm>({
    upi: { upiId: '', name: '' },
    bank: { accountNumber: '', name: '' }
  })
  const UPI_ID = "ssaravanan303-1@okicici"
  const upiURL = `upi://pay?pa=${UPI_ID}&pn=Shan%20and%20Associates&tn=Payment%20to%20Shan%20and%20Associates`

  const bankDetails: BankDetails[] = [
    { label: "Account Number", value: "1664170000003945" },
    { label: "Account Name", value: "Goutham Raj K" },
    { label: "Bank Name", value: "KVB Bank" },
    { label: "IFSC Code", value: "KVBL0001664" }
  ]

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const handlePaymentConfirmation = async () => {
    // Validate payment details
    if (selectedOption === 'upi' || selectedOption === 'qr') {
      if (!paymentDetails.upi.upiId || !paymentDetails.upi.name) {
        toast.error('Please enter UPI payment details')
        return
      }
    } else if (selectedOption === 'bank') {
      if (!paymentDetails.bank.accountNumber || !paymentDetails.bank.name) {
        toast.error('Please enter bank payment details')
        return
      }
    }

    setIsConfirming(true)
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'Waiting for Confirmation',
          payment_method: selectedOption?.toUpperCase(),
          paid_at: new Date().toISOString(),
          payment_details: selectedOption === 'bank' 
            ? paymentDetails.bank 
            : paymentDetails.upi
        })
        .eq('id', paymentId)

      if (error) throw error

      onSelectOption(selectedOption!)
      toast.success('Payment completed, waiting for admin confirmation')
      onOpenChange(false)
      onPaymentComplete?.()
    } catch (error) {
      console.error('Payment update error:', error)
      toast.error('Failed to update payment status')
    } finally {
      setIsConfirming(false)
    }
  }

  const renderPaymentForm = () => {
    if (selectedOption === 'upi' || selectedOption === 'qr') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID used for payment</Label>
            <Input
              id="upiId"
              value={paymentDetails.upi.upiId}
              onChange={(e) => setPaymentDetails(prev => ({
                ...prev,
                upi: { ...prev.upi, upiId: e.target.value }
              }))}
              placeholder="Enter UPI ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="upiName">Name as per UPI</Label>
            <Input
              id="upiName"
              value={paymentDetails.upi.name}
              onChange={(e) => setPaymentDetails(prev => ({
                ...prev,
                upi: { ...prev.upi, name: e.target.value }
              }))}
              placeholder="Enter name"
            />
          </div>
        </div>
      )
    }

    if (selectedOption === 'bank') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number used for payment</Label>
            <Input
              id="accountNumber"
              value={paymentDetails.bank.accountNumber}
              onChange={(e) => setPaymentDetails(prev => ({
                ...prev,
                bank: { ...prev.bank, accountNumber: e.target.value }
              }))}
              placeholder="Enter account number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankName">Account Holder Name</Label>
            <Input
              id="bankName"
              value={paymentDetails.bank.name}
              onChange={(e) => setPaymentDetails(prev => ({
                ...prev,
                bank: { ...prev.bank, name: e.target.value }
              }))}
              placeholder="Enter name"
            />
          </div>
        </div>
      )
    }

    return null
  }

  const renderPaymentConfirmation = () => (
    <div className="space-y-4">
      {showPaymentForm ? (
        <>
          {renderPaymentForm()}
          <Button 
            className="w-full"
            onClick={handlePaymentConfirmation}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <>Confirming payment...</>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm Payment Details
              </>
            )}
          </Button>
        </>
      ) : (
        <Button 
          className="w-full"
          onClick={() => setShowPaymentForm(true)}
        >
          <Check className="h-4 w-4 mr-2" />
          I have completed the payment
        </Button>
      )}
      <Button 
        variant="outline"
        className="w-full"
        onClick={() => {
          setSelectedOption(null)
          setShowPaymentForm(false)
        }}
        disabled={isConfirming}
      >
        Back to Options
      </Button>
    </div>
  )

  const handleUPIPayment = () => {
    window.location.href = upiURL
    onSelectOption('upi')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          {(selectedOption === 'upi' || selectedOption === 'qr' || selectedOption === 'bank') && (
            <div className="text-sm text-gray-500 mt-2">
              Amount to pay: ₹{amount.toLocaleString()}
            </div>
          )}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!selectedOption ? (
            // Show payment options
            <>
              <Button
                variant="outline"
                className="flex items-center justify-start gap-4 h-16"
                onClick={() => setSelectedOption('qr')}
              >
                <QrCode className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Scan QR Code</div>
                  <div className="text-sm text-gray-500">Pay using any UPI app</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="flex items-center justify-start gap-4 h-16"
                onClick={() => setSelectedOption('bank')}
              >
                <Landmark className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Bank Transfer</div>
                  <div className="text-sm text-gray-500">Direct bank account transfer</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="flex items-center justify-start gap-4 h-16"
                onClick={() => setSelectedOption('upi')}
              >
                <Smartphone className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">UPI ID</div>
                  <div className="text-sm text-gray-500">Pay using UPI ID</div>
                </div>
              </Button>
            </>
          ) : selectedOption === 'bank' ? (
            // Show bank details
            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                {bankDetails.map((detail) => (
                  <div key={detail.label} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{detail.label}</div>
                      <div className="font-mono font-medium">{detail.value}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(detail.value, detail.label)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {renderPaymentConfirmation()}
            </div>
          ) : selectedOption === 'qr' ? (
            // Show QR Code with confirmation
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                <QRCodeSVG 
                  value={upiURL}
                  size={200}
                  level="H"
                  includeMargin
                />
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-500">Scan with any UPI app</div>
                  <div className="font-mono font-medium mt-1">{UPI_ID}</div>
                </div>
              </div>
              {renderPaymentConfirmation()}
            </div>
          ) : selectedOption === 'upi' ? (
            // Show UPI ID with confirmation
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">UPI ID</div>
                    <div className="font-mono font-medium">{UPI_ID}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(UPI_ID, "UPI ID")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button 
                className="w-full"
                onClick={handleUPIPayment}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Pay with UPI
              </Button>
              {renderPaymentConfirmation()}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
} 