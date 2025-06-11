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
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Billing & Subscription</h1>
            <p className="text-slate-400">Manage your subscription, view invoices, and track usage</p>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
                <TrendingUp className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="subscription" className="data-[state=active]:bg-slate-700">
                <CreditCard className="h-4 w-4 mr-2" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="invoices" className="data-[state=active]:bg-slate-700">
                <FileText className="h-4 w-4 mr-2" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="plans" className="data-[state=active]:bg-slate-700">
                <Plus className="h-4 w-4 mr-2" />
                Plans
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-200">Current Plan</CardTitle>
                    <CreditCard className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{currentSubscription.name}</div>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(currentSubscription.price)}/{currentSubscription.interval}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-200">Next Billing</CardTitle>
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatDate(currentSubscription.nextBillingDate)}
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(currentSubscription.nextBillingDate), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-200">Usage</CardTitle>
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{usagePercentage}%</div>
                    <Progress value={usagePercentage} className="mt-2" />
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-200">Total Spent</CardTitle>
                    <DollarSign className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(invoices.reduce((sum, invoice) => sum + invoice.amount, 0))}
                    </div>
                    <p className="text-xs text-slate-400">This year</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200">Recent Invoices</CardTitle>
                    <CardDescription className="text-slate-400">
                      Your latest billing history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {invoices.slice(0, 3).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-200">{invoice.number}</p>
                            <p className="text-xs text-slate-400">{formatDate(invoice.date)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-200">{formatCurrency(invoice.amount)}</span>
                            {getStatusBadge(invoice.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200">Plan Features</CardTitle>
                    <CardDescription className="text-slate-400">
                      What's included in your current plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentSubscription.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">Current Subscription</CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage your subscription settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{currentSubscription.name}</h3>
                      <p className="text-slate-400">
                        {formatCurrency(currentSubscription.price)} per {currentSubscription.interval}
                      </p>
                      <Badge className="mt-2 bg-green-600/20 text-green-400 border-green-800">
                        {currentSubscription.status}
                      </Badge>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" className="border-slate-600">
                        Change Plan
                      </Button>
                      <Button variant="outline" className="border-red-600 text-red-400">
                        Cancel
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Payment Method</h4>
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-8 w-8 text-slate-400" />
                        <div>
                          <p className="text-slate-200">•••• •••• •••• 4242</p>
                          <p className="text-xs text-slate-400">Expires 12/25</p>
                        </div>
                      </div>
                      <Button variant="outline" className="border-slate-600">
                        Update
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Billing Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-300">Next billing date</label>
                        <p className="text-slate-200">{formatDate(currentSubscription.nextBillingDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-300">Billing cycle</label>
                        <p className="text-slate-200 capitalize">{currentSubscription.interval}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">Invoice History</CardTitle>
                  <CardDescription className="text-slate-400">
                    Download and view your past invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Invoice</TableHead>
                        <TableHead className="text-slate-300">Date</TableHead>
                        <TableHead className="text-slate-300">Amount</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id} className="border-slate-700">
                          <TableCell className="text-slate-200">{invoice.number}</TableCell>
                          <TableCell className="text-slate-400">{formatDate(invoice.date)}</TableCell>
                          <TableCell className="text-slate-200">{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="border-slate-600">
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button size="sm" variant="outline" className="border-slate-600">
                                <ExternalLink className="h-3 w-3" />
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
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Choose Your Plan</h2>
                <p className="text-slate-400">Upgrade or downgrade your subscription at any time</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                  <Card key={plan.name} className={`bg-slate-800/50 border-slate-700 ${plan.current ? 'ring-2 ring-teal-500' : ''}`}>
                    {plan.current && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-teal-600 text-white">Current Plan</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                      <div className="text-3xl font-bold text-white">
                        {formatCurrency(plan.price)}
                        <span className="text-sm text-slate-400">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-slate-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full" 
                        variant={plan.current ? "secondary" : "default"}
                        disabled={plan.current}
                      >
                        {plan.current ? 'Current Plan' : 'Upgrade'}
                        {!plan.current && <ChevronRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
