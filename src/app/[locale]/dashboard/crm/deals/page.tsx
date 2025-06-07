'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Filter, DollarSign, Clock, User } from 'lucide-react'
import { motion } from 'framer-motion'

interface Deal {
  id: string
  title: string
  company: string
  value: number
  stage: string
  probability: number
  owner: string
  lastActivity: string
  priority: 'high' | 'medium' | 'low'
}

const mockDeals: Deal[] = [
  {
    id: '1',
    title: 'Enterprise Software License',
    company: 'TechCorp Inc.',
    value: 150000,
    stage: 'Proposal',
    probability: 75,
    owner: 'John Smith',
    lastActivity: '2 hours ago',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Cloud Migration Project',
    company: 'DataFlow Solutions',
    value: 85000,
    stage: 'Negotiation',
    probability: 60,
    owner: 'Sarah Johnson',
    lastActivity: '1 day ago',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Custom Development',
    company: 'StartupXYZ',
    value: 45000,
    stage: 'Discovery',
    probability: 30,
    owner: 'Mike Chen',
    lastActivity: '3 days ago',
    priority: 'low'
  }
]

const stages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>(mockDeals)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStage, setSelectedStage] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStage = selectedStage === 'all' || deal.stage === selectedStage
    const matchesPriority = selectedPriority === 'all' || deal.priority === selectedPriority
    
    return matchesSearch && matchesStage && matchesPriority
  })

  const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0)
  const avgProbability = filteredDeals.length > 0 
    ? filteredDeals.reduce((sum, deal) => sum + deal.probability, 0) / filteredDeals.length 
    : 0

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Lead': return 'bg-blue-500'
      case 'Qualified': return 'bg-purple-500'
      case 'Proposal': return 'bg-orange-500'
      case 'Negotiation': return 'bg-yellow-500'
      case 'Closed Won': return 'bg-green-500'
      case 'Closed Lost': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deals</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pipeline</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">{filteredDeals.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Probability</p>
                <p className="text-2xl font-bold">{avgProbability.toFixed(0)}%</p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">$325K</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Deals</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="stage">Stage</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {stages.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals List */}
      <div className="grid gap-4">
        {filteredDeals.map((deal, index) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{deal.title}</h3>
                      <Badge className={`${getPriorityColor(deal.priority)} text-white`}>
                        {deal.priority.toUpperCase()}
                      </Badge>
                      <Badge className={`${getStageColor(deal.stage)} text-white`}>
                        {deal.stage}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{deal.company}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Owner: {deal.owner}</span>
                      <span>Last activity: {deal.lastActivity}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ${deal.value.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {deal.probability}% probability
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredDeals.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No deals found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
