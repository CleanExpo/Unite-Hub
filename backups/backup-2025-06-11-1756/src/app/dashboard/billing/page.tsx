'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Download, 
  FileText, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Check,
  AlertCircle,
  Plus,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Invoice {
  id: string
  number: string
  date: string
  dueDate: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  items: {
    description: string
    quantity: number
    amount: number
  }[]
}

interface Subscription {
  id: string
  name: string
  price: number
  interval: 'monthly' | 'yearly'
  status: 'active' | 'cancelled' | 'past_due'
  nextBillingDate: string
  features: string[]
}

const currentSubscription: Subscription = {
  id: '1',
  name: 'Growth Plan',
  price: 299,
  interval: 'monthly',
  status: 'active',
  nextBillingDate: '2024-04-01',
  features: [
    'Unlimited projects',
    '50 team members',
    'Advanced analytics',
    'Priority support',
    'API access',
    'Custom integrations'
  ]
}

const invoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-2024-003',
    date: '2024-03-01',
    dueDate: '2024-03-15',
    amount: 299,
    status: 'paid',
    items: [
      { description: 'Growth Plan - March 2024', quantity: 1, amount: 299 }
    ]
  },
  {
    id: '2',
    number: 'INV-2024-002',
    date: '2024-02-01',
    dueDate: '2024-02-15',
    amount: 299,
    status: 'paid',
    items: [
      { description: 'Growth Plan - February 2024', quantity: 1, amount: 299 }
    ]
  },
  {
    id: '3',
    number: 'INV-2024-001',
    date: '2024-01-01',
    dueDate: '2024-01-15',
    amount: 299,
    status: 'paid',
    items: [
      { description: 'Growth Plan - January 2024', quantity: 1, amount: 299 }
    ]
  }
]

const plans = [
  {
    name: 'Starter',
    price: 99,
    features: [
      '5 projects',
      '10 team members',
      'Basic analytics',
      'Email support',
      'API access (limited)'
    ]
  },
  {
    name: 'Growth',
    price: 299,
    current: true,
    features: [
      'Unlimited projects',
      '50 team members',
      'Advanced analytics',
      'Priority support',
      'API access',
      'Custom integrations'
    ]
  },
  {
    name: 'Enterprise',
    price: 999,
    features: [
      'Everything in Growth',
      'Unlimited team members',
      'White-label options',
      'Dedicated account manager',
      'SLA guarantee',
      'On-premise deployment'
    ]
  }
]

export default function BillingPage() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const usagePercentage = 75 // Mock usage percentage

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-600/20 text-green-400 border-green-800">Paid</Badge>
      case 'pending':
        return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-800">Pending</Badge>
      case 'overdue':
        return <Badge className="bg-red-600/20 text-red-400 border-red-800">Overdue</Badge>
      case 'active':
        return <Badge className="bg-green-600/20 text-green-400 border-green-800">Active</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-slate-400">Manage your subscription, billing, and invoices</p>
        </motion.div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Current Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Current Plan</CardTitle>
                      <CardDescription className="text-slate-400">
                        Your subscription details and usage
                      </CardDescription>
                    </div>
                    {getStatusBadge(currentSubscription.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{currentSubscription.name}</h3>
                      <p className="text-slate-400">
                        ${currentSubscription.price}/{currentSubscription.interval}
                      </p>
                    </div>
                    <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
                      Upgrade Plan
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Usage this month</span>
                      <span className="text-white">{usagePercentage}%</span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                    {usagePercentage > 80 && (
                      <div className="flex items-center gap-2 text-yellow-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>You&apos;re approaching your usage limit</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400">Next billing date</p>
                      <p className="text-lg font-medium text-white">
                        {new Date(currentSubscription.nextBillingDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400">Amount</p>
                      <p className="text-lg font-medium text-white">
                        ${currentSubscription.price}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Billing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Total Spent</p>
                        <p className="text-2xl font-bold text-white">$897</p>
                        <p className="text-xs text-slate-400 mt-1">Last 3 months</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-green-600/20 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Active Since</p>
                        <p className="text-2xl font-bold text-white">Jan 2024</p>
                        <p className="text-xs text-slate-400 mt-1">3 months</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Invoices</p>
                        <p className="text-2xl font-bold text-white">3</p>
                        <p className="text-xs text-slate-400 mt-1">All paid</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Invoices</CardTitle>
                    <CardDescription className="text-slate-400">
                      Download and manage your invoices
                    </CardDescription>
                  </div>
                  <Button variant="outline" className="border-slate-600">
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Invoice</TableHead>
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300">Amount</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-right text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-slate-700">
                        <TableCell className="font-medium text-white">
                          {invoice.number}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(invoice.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          ${invoice.amount}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className={`bg-slate-800 border-slate-700 ${plan.current ? 'ring-2 ring-teal-500' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">{plan.name}</CardTitle>
                        {plan.current && <Badge className="bg-teal-600">Current Plan</Badge>}
                      </div>
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-white">${plan.price}</span>
                        <span className="text-slate-400">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full mt-6"
                        variant={plan.current ? 'outline' : 'default'}
                        disabled={plan.current}
                      >
                        {plan.current ? 'Current Plan' : 'Switch to ' + plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payment-methods" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Payment Methods</CardTitle>
                    <CardDescription className="text-slate-400">
                      Manage your payment methods
                    </CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Method
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-slate-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-slate-700 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ 4242</p>
                        <p className="text-sm text-slate-400">Expires 12/24</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600/20 text-green-400 border-green-800">Default</Badge>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
