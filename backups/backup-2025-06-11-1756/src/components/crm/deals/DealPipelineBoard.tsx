'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp,
  Plus,
  MoreHorizontal,
  Target,
  Clock
} from 'lucide-react'
import { AddDealModal } from './AddDealModal'

interface Deal {
  id: string
  title: string
  value: number
  currency: string
  probability: number
  expected_close_date?: string
  client: {
    id: string
    name: string
    company?: string
  }
  pipeline_stage: {
    id: string
    name: string
    color: string
    probability: number
  }
  assigned_to_profile?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  created_at: string
}

interface PipelineStage {
  id: string
  name: string
  color: string
  probability: number
  stage_order: number
  deals: Deal[]
}

interface DealPipelineBoardProps {
  onDealSelect?: (deal: Deal) => void
}

export function DealPipelineBoard({ onDealSelect }: DealPipelineBoardProps) {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)
  const { toast } = useToast()

  const fetchPipelineData = async () => {
    setLoading(true)
    try {
      // Fetch deals and organize by pipeline stages
      const response = await fetch('/api/crm/deals?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        const allDeals = result.data || []
        setDeals(allDeals)

        // Calculate total pipeline value
        const total = allDeals.reduce((sum: number, deal: Deal) => sum + deal.value, 0)
        setTotalValue(total)

        // Group deals by stage
        const stageMap = new Map<string, PipelineStage>()
        
        // Default stages if no pipeline_stage data
        const defaultStages = [
          { id: '1', name: 'Prospecting', color: '#3B82F6', probability: 10, stage_order: 1 },
          { id: '2', name: 'Qualification', color: '#8B5CF6', probability: 25, stage_order: 2 },
          { id: '3', name: 'Proposal', color: '#F59E0B', probability: 50, stage_order: 3 },
          { id: '4', name: 'Negotiation', color: '#EF4444', probability: 75, stage_order: 4 },
          { id: '5', name: 'Closed Won', color: '#10B981', probability: 100, stage_order: 5 },
        ]

        // Initialize stages
        defaultStages.forEach(stage => {
          stageMap.set(stage.id, {
            ...stage,
            deals: []
          })
        })

        // Distribute deals into stages
        allDeals.forEach((deal: Deal) => {
          const stageId = deal.pipeline_stage?.id || '1' // Default to first stage
          const stage = stageMap.get(stageId)
          if (stage) {
            stage.deals.push(deal)
          }
        })

        setStages(Array.from(stageMap.values()).sort((a, b) => a.stage_order - b.stage_order))
      } else {
        throw new Error('Failed to fetch deals')
      }
    } catch (error) {
      console.error('Error fetching pipeline data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load pipeline data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPipelineData()
  }, [])

  const handleDealAdded = () => {
    fetchPipelineData()
  }

  const formatCurrency = (amount: number, currency: string = 'AUD') => {
    return `${currency} $${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStageValue = (stage: PipelineStage) => {
    return stage.deals.reduce((sum, deal) => sum + deal.value, 0)
  }

  const getWeightedValue = (stage: PipelineStage) => {
    return stage.deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Deal Pipeline</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track your sales opportunities through the pipeline
          </p>
        </div>
        <AddDealModal onDealAdded={handleDealAdded} />
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pipeline</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Deals</p>
                <p className="text-2xl font-bold text-purple-600">{deals.length}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Deal Size</p>
                <p className="text-2xl font-bold text-green-600">
                  {deals.length > 0 ? formatCurrency(totalValue / deals.length) : '$0'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Weighted Pipeline</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stages.reduce((sum, stage) => sum + getWeightedValue(stage), 0))}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[600px]">
        {stages.map((stage) => (
          <Card key={stage.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle 
                  className="text-sm font-medium"
                  style={{ color: stage.color }}
                >
                  {stage.name}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {stage.deals.length}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {formatCurrency(getStageValue(stage))}
                </p>
                <p className="text-xs text-gray-500">
                  Weighted: {formatCurrency(getWeightedValue(stage))}
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 space-y-3 pt-0">
              {stage.deals.map((deal) => (
                <Card 
                  key={deal.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                  style={{ borderLeftColor: stage.color }}
                  onClick={() => onDealSelect?.(deal)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm leading-tight">{deal.title}</h4>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(deal.value, deal.currency)}
                        </p>
                        
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <Users className="h-3 w-3" />
                          <span>{deal.client.name}</span>
                        </div>
                        
                        {deal.client.company && (
                          <p className="text-xs text-gray-500">{deal.client.company}</p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>{deal.probability}%</span>
                          </div>
                          
                          {deal.expected_close_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(deal.expected_close_date)}</span>
                            </div>
                          )}
                        </div>
                        
                        {deal.assigned_to_profile && (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs">
                                {deal.assigned_to_profile.full_name.charAt(0)}
                              </span>
                            </div>
                            <span className="truncate">{deal.assigned_to_profile.full_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {stage.deals.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No deals in this stage</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default DealPipelineBoard
