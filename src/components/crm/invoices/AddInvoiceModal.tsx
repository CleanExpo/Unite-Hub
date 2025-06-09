'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Loader2, DollarSign, FileText, Trash2, Calculator } from 'lucide-react'

// 💰 Invoice form validation schema
const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  amount: z.number().min(0, 'Amount must be positive'),
})

const invoiceSchema = z.object({
  client_id: z.string().min(1, 'Please select a client'),
  amount: z.number().min(0, 'Total amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  payment_terms: z.number().min(1, 'Payment terms must be at least 1 day'),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface Client {
  id: string
  name: string
  email: string
  company?: string
}

interface AddInvoiceModalProps {
  onInvoiceAdded?: (invoice: any) => void
  trigger?: React.ReactNode
  preselectedClientId?: string
}

export function AddInvoiceModal({ onInvoiceAdded, trigger, preselectedClientId }: AddInvoiceModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const { toast } = useToast()

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: preselectedClientId || '',
      amount: 0,
      currency: 'AUD',
      payment_terms: 30,
      notes: '',
      items: [
        {
          description: '',
          quantity: 1,
          unit_price: 0,
          amount: 0,
        }
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  // Load clients when modal opens
  useEffect(() => {
    if (open && clients.length === 0) {
      loadClients()
    }
  }, [open])

  // Calculate totals when items change
  const calculateTotal = () => {
    const items = form.getValues('items')
    const total = items.reduce((sum, item) => sum + (item.amount || 0), 0)
    form.setValue('amount', total)
  }

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

  const handleSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true)
    
    try {
      console.log('🔄 Creating invoice with data:', data)
      
      const response = await fetch('/api/crm/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invoice')
      }

      const result = await response.json()
      console.log('✅ Invoice created successfully:', result.data)

      // Success notification
      toast({
        title: '✅ Invoice Created Successfully',
        description: `Invoice ${result.data.invoice_number} has been created.`,
        variant: 'default',
      })

      // Reset form and close modal
      form.reset()
      setOpen(false)

      // Notify parent component
      if (onInvoiceAdded) {
        onInvoiceAdded(result.data)
      }

    } catch (error) {
      console.error('❌ Error creating invoice:', error)
      toast({
        title: '❌ Error Creating Invoice',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateItemAmount = (index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`)
    const unitPrice = form.getValues(`items.${index}.unit_price`)
    const amount = quantity * unitPrice
    form.setValue(`items.${index}.amount`, amount)
    calculateTotal()
  }

  const addNewItem = () => {
    append({
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Create New Invoice
          </DialogTitle>
          <DialogDescription>
            Generate a professional invoice for your client with itemized billing.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Invoice Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-2">
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

                <FormField
                  control={form.control}
                  name="payment_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Invoice Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Invoice Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Service or product description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Qty</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value) || 1)
                                  updateItemAmount(index)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Unit Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseFloat(e.target.value) || 0)
                                  updateItemAmount(index)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                readOnly
                                className="bg-gray-50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-1">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            remove(index)
                            calculateTotal()
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    <span className="font-semibold">Total: </span>
                    <Badge variant="outline" className="text-lg font-bold">
                      {form.watch('currency')} ${form.watch('amount').toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Payment instructions, terms, or additional information..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Any additional information for the client
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Invoice
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

export default AddInvoiceModal
