"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getClients, createOpportunity } from "@/lib/crm"
import { useAuth } from "@/contexts/auth-context"
import type { Client, Opportunity } from "@/types/crm"

interface AddOpportunityModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (opportunity: Opportunity) => void
  initialStageId?: number
}

export function AddOpportunityModal({ isOpen, onClose, onSuccess, initialStageId }: AddOpportunityModalProps) {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    value: "",
    client_id: "",
    stage_id: initialStageId?.toString() || "",
  })

  useEffect(() => {
    async function loadClients() {
      try {
        const clientsData = await getClients()
        setClients(clientsData)
      } catch (error) {
        console.error("Error loading clients:", error)
      }
    }

    if (isOpen) {
      loadClients()
      // Reset form when opening
      setFormData({
        title: "",
        description: "",
        value: "",
        client_id: "",
        stage_id: initialStageId?.toString() || "",
      })
    }
  }, [isOpen, initialStageId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.client_id) {
      alert("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const opportunity = {
        title: formData.title,
        description: formData.description || null,
        client_id: Number.parseInt(formData.client_id, 10),
        stage_id: formData.stage_id ? Number.parseInt(formData.stage_id, 10) : null,
        value: formData.value ? Number.parseFloat(formData.value) : null,
        created_by: user?.id || null,
      } as Omit<Opportunity, "id" | "created_at" | "updated_at">

      const createdOpportunity = await createOpportunity(opportunity)
      onSuccess(createdOpportunity)
      onClose()
    } catch (error) {
      console.error("Error creating opportunity:", error)
      alert("Failed to create opportunity. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#001428] text-white border-[#4ecdc4]/20 max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Opportunity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">
              Opportunity Name *
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="bg-[#00203a] border-[#4ecdc4]/20 text-white"
              placeholder="Enter opportunity name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id" className="text-gray-300">
              Client *
            </Label>
            <Select
              name="client_id"
              value={formData.client_id}
              onValueChange={(value) => handleSelectChange("client_id", value)}
            >
              <SelectTrigger className="bg-[#00203a] border-[#4ecdc4]/20 text-white">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent className="bg-[#00203a] border-[#4ecdc4]/20 text-white">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()} className="text-white hover:bg-[#4ecdc4]/10">
                    {client.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value" className="text-gray-300">
              Value
            </Label>
            <Input
              id="value"
              name="value"
              type="number"
              min="0"
              step="0.01"
              value={formData.value}
              onChange={handleChange}
              className="bg-[#00203a] border-[#4ecdc4]/20 text-white"
              placeholder="Enter value"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="bg-[#00203a] border-[#4ecdc4]/20 text-white min-h-[100px]"
              placeholder="Enter description"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#4ecdc4]/20 text-white hover:bg-[#4ecdc4]/5"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Opportunity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
