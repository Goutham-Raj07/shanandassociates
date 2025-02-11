"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { IndianRupee, CreditCard, Smartphone, Building } from "lucide-react"

type PaymentMethod = 'upi' | 'card' | 'netbanking'

interface PaymentDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  amount: number
  description: string
  onConfirmAction: (method: PaymentMethod) => void
}

export function PaymentDialog({
  open,
  onOpenChangeAction,
  amount,
  description,
  onConfirmAction
}: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi')
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    setIsProcessing(true)
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    onConfirmAction(selectedMethod)
    setIsProcessing(false)
    onOpenChangeAction(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Amount to Pay</div>
            <div className="text-2xl font-bold flex items-center">
              <IndianRupee className="h-5 w-5" />
              {amount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">{description}</div>
          </div>

          <div className="space-y-3">
            <Label>Select Payment Method</Label>
            <RadioGroup
              value={selectedMethod}
              onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
              className="space-y-2"
            >
              <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
                selectedMethod === 'upi' ? 'border-blue-600 bg-blue-50' : ''
              }`}>
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center space-x-3 cursor-pointer flex-1">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">UPI</div>
                    <div className="text-sm text-gray-500">Pay using any UPI app</div>
                  </div>
                </Label>
              </div>

              <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
                selectedMethod === 'card' ? 'border-blue-600 bg-blue-50' : ''
              }`}>
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center space-x-3 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Card</div>
                    <div className="text-sm text-gray-500">Credit or Debit card</div>
                  </div>
                </Label>
              </div>

              <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
                selectedMethod === 'netbanking' ? 'border-blue-600 bg-blue-50' : ''
              }`}>
                <RadioGroupItem value="netbanking" id="netbanking" />
                <Label htmlFor="netbanking" className="flex items-center space-x-3 cursor-pointer flex-1">
                  <Building className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Net Banking</div>
                    <div className="text-sm text-gray-500">All Indian banks</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChangeAction(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 