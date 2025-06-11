'use client'

import { useState } from 'react'
import { X, Calendar, Clock, Mail, Phone, Building, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ConsultationBookingModalProps {
  isOpen: boolean
  onClose: () => void
  serviceType: string
  serviceName: string
}

export default function ConsultationBookingModal({ 
  isOpen, 
  onClose, 
  serviceType,
  serviceName 
}: ConsultationBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    company: '',
    phone: '',
    preferred_date: '',
    preferred_time: '',
    alternate_date: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          service_type: serviceType
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book consultation')
      }

      toast.success('Consultation booked successfully!', {
        description: 'We\'ll contact you soon to confirm your appointment.'
      })
      
      // Reset form and close modal
      setFormData({
        client_name: '',
        client_email: '',
        company: '',
        phone: '',
        preferred_date: '',
        preferred_time: '',
        alternate_date: '',
        message: ''
      })
      onClose()
      
    } catch (error: any) {
      console.error('Booking error:', error)
      toast.error('Failed to book consultation', {
        description: error.message || 'Please try again later.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // Get tomorrow's date as minimum for booking
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book a Consultation</DialogTitle>
          <DialogDescription>
            Schedule a consultation for {serviceName}. We&apos;ll discuss your needs and create a custom solution.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Personal Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">
                <User className="w-4 h-4 inline mr-1" />
                Full Name *
              </Label>
              <Input
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                required
                Unite Group="Unite Group Team"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_email">
                <Mail className="w-4 h-4 inline mr-1" />
                Email *
              </Label>
              <Input
                id="client_email"
                name="client_email"
                type="email"
                value={formData.client_email}
                onChange={handleChange}
                required
                Unite Group="john@unite-group.in"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">
                <Building className="w-4 h-4 inline mr-1" />
                Company
              </Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                Unite Group="ACME Corp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                Unite Group="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred_date">
                <Calendar className="w-4 h-4 inline mr-1" />
                Preferred Date *
              </Label>
              <Input
                id="preferred_date"
                name="preferred_date"
                type="date"
                min={minDate}
                value={formData.preferred_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_time">
                <Clock className="w-4 h-4 inline mr-1" />
                Preferred Time *
              </Label>
              <select
                id="preferred_time"
                name="preferred_time"
                aria-label="Preferred consultation time"
                value={formData.preferred_time}
                onChange={(e) => handleChange(e as any)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a time</option>
                <option value="09:00">9:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="14:00">2:00 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="16:00">4:00 PM</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alternate_date">
              <Calendar className="w-4 h-4 inline mr-1" />
              Alternate Date (Optional)
            </Label>
            <Input
              id="alternate_date"
              name="alternate_date"
              type="date"
              min={minDate}
              value={formData.alternate_date}
              onChange={handleChange}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Additional Information
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              Unite Group="Tell us about your project requirements..."
              rows={4}
            />
          </div>

          {/* Service Type Display */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Service:</strong> {serviceName}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Consultation Fee:</strong> $550 (Credited toward project if you proceed)
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Booking...' : 'Book Consultation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
