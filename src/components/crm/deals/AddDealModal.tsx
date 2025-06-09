'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Loader2, DollarSign, Users, Calendar, Target } from 'lucide-react'

// 💼 Deal form validation schema
const dealSchema = z.object({
  title: z.string().min(2, 'Deal title must be at least 2 characters'),
  description: z.string().optional().or(z.literal('')),
  client_id: z.string().min(1, 'Please select a client'),
  value: z.number().min(0, 'Deal value must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  probability: z.number().min(0).max(100, 'Probability must be between 0-100'),
  expected_close_date: z.string().optional().or(z.literal('')),
  source: z.string().optional().or(z.literal('')),
  competitors: z.array(z.string()),
  tags: z.array(z.string()),
})

type DealFormData = z.infer<typeof dealSchema>

interface Client {
  id: string
  name: string
  email: string
  company?: string
  status: string
}

interface AddDealModalProps {
  onDealAdded?: (deal: any) => void
  trigger?: React.ReactNode
  preselectedClientId?: string
}

export function AddDealModal({ onDealAdded, trigger, preselectedClientId }: AddDealModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const { toast } = useToast()

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: '',
      description: '',
      client_id: preselectedClientId || '',
      value: 0,
      currency: 'AUD',
      probability: 50,
      expected_close_date: '',
      source: '',
      competitors: [],
      tags: [],
    },
  })

  // Load clients when modal opens
  useEffect(() => {
    if (open && clients.length === 0) {
      loadClients()
    }
  }, [open])

  const loadClients = async () => {
    setLoadingClients(true)
    try {
      const response = await fetch('/api/crm/clients?limit=100&status=active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setClients(result.data || [])
      } else {
        console.error('Failed to load clients')
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  const handleSubmit = async (data: DealFormData) => {
    setIsSubmitting(true)
    
    try {
      console.log('🔄 Creating deal with data:', data)
      
      const response = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create deal')
      }

      const result = await response.json()
      console.log('✅ Deal created successfully:', result.data)

      // Success notification
      toast({
        title: '✅ Deal Created Successfully',
        description: `"${data.title}" has been added to your pipeline.`,
        variant: 'default',
      })

      // Reset form and close modal
      form.reset()
      setOpen(false)

      // Notify parent component
      if (onDealAdded) {
        onDealAdded(result.data)
      }

    } catch (error) {
      console.error('❌ Error creating deal:', error)
      toast({
        title: '❌ Error Creating Deal',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.]/g, ''))
    return isNaN(numValue) ? 0 : numValue
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-teal-600" />
            Create New Deal
          </DialogTitle>
          <DialogDescription>
            Add a new deal to your sales pipeline and track its progress.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Basic Deal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Deal Information
              </h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enterprise Software License" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of the deal, requirements, and scope..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client and Financial Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Client & Assignment
                </h3>

                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client">
                              {loadingClients ? "Loading clients..." : "Select a client"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{client.name}</span>
                                {client.company && (
                                  <span className="text-sm text-gray-500">{client.company}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Source</FormLabel>
                      <FormControl>
                        <Input placeholder="Website, Referral, Cold Call..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Details
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Value *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10000"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AUD">AUD</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="probability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Win Probability (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Estimated likelihood of closing this deal (0-100%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Timeline and Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline & Additional Info
              </h3>

              <FormField
                control={form.control}
                name="expected_close_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Close Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormDescription>
                      When do you expect to close this deal?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Deal...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Deal
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddDealModal
