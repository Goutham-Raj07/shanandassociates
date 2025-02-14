"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { X, Search } from "lucide-react"

interface RequestDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  clients: Array<{
    id: string
    full_name: string
    email?: string
  }>
}

interface DocumentRequest {
  name: string
  description: string
  deadline: string
}

export function RequestDocumentDialog({
  open,
  onOpenChange,
  onSuccess,
  clients
}: RequestDocumentDialogProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [clientSearch, setClientSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documentRequest, setDocumentRequest] = useState<DocumentRequest>({
    name: '',
    description: '',
    deadline: ''
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
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

      if (error) throw error

      toast.success('Document request sent successfully')
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error requesting document:', error)
      toast.error('Failed to send document request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedClientId('')
    setClientSearch('')
    setDocumentRequest({
      name: '',
      description: '',
      deadline: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Documents</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Client</Label>
              
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

            <div className="space-y-2">
              <Label htmlFor="name">Document Name</Label>
              <Input 
                id="name"
                name="name"
                placeholder="e.g., Bank Statement"
                value={documentRequest.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                name="description"
                placeholder="Provide details about the required document..."
                value={documentRequest.description}
                onChange={handleTextAreaChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input 
                id="deadline"
                name="deadline"
                type="date"
                value={documentRequest.deadline}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="submit"
              disabled={!selectedClientId || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Request...
                </>
              ) : (
                'Request Document'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 