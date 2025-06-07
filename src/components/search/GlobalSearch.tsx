'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, FileText, Users, Briefcase, MessageSquare, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  type: 'project' | 'client' | 'message' | 'document'
  title: string
  description?: string
  path: string
  metadata?: {
    status?: string
    date?: string
    author?: string
  }
}

// Mock search results - in production this would call an API
const mockSearch = async (query: string): Promise<SearchResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay
  
  const allResults: SearchResult[] = [
    {
      id: '1',
      type: 'project',
      title: 'AI Implementation for Healthcare',
      description: 'Machine learning solution for patient diagnosis',
      path: '/dashboard/crm/projects/1',
      metadata: { status: 'In Progress', date: '2024-03-15' }
    },
    {
      id: '2',
      type: 'client',
      title: 'Sarah Chen',
      description: 'CTO at TechCorp',
      path: '/dashboard/crm/clients/2',
      metadata: { status: 'Active' }
    },
    {
      id: '3',
      type: 'message',
      title: 'Discussion about cloud migration',
      description: 'Thread in #general channel',
      path: '/dashboard/crm/messaging?thread=3',
      metadata: { author: 'Michael Torres', date: '2024-03-20' }
    },
    {
      id: '4',
      type: 'document',
      title: 'Project Requirements Document',
      description: 'SaaS platform specifications',
      path: '/dashboard/documents/4',
      metadata: { date: '2024-03-10' }
    }
  ]
  
  return allResults.filter(result => 
    result.title.toLowerCase().includes(query.toLowerCase()) ||
    result.description?.toLowerCase().includes(query.toLowerCase())
  )
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Search when query changes
  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true)
      try {
        const searchResults = await mockSearch(query)
        setResults(searchResults)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    router.push(result.path)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    }
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'project':
        return <Briefcase className="h-4 w-4" />
      case 'client':
        return <Users className="h-4 w-4" />
      case 'message':
        return <MessageSquare className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'project':
        return 'text-blue-500 bg-blue-50'
      case 'client':
        return 'text-green-500 bg-green-50'
      case 'message':
        return 'text-purple-500 bg-purple-50'
      case 'document':
        return 'text-orange-500 bg-orange-50'
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center border-b px-4">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Search projects, clients, messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex h-14 w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-[400px]">
            {results.length === 0 && query && !loading && (
              <div className="py-14 text-center text-sm text-muted-foreground">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}
            
            {results.length > 0 && (
              <div className="p-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      selectedIndex === index
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <div className={cn("mt-0.5 rounded-md p-1.5", getTypeColor(result.type))}>
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-medium">{result.title}</div>
                      {result.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {result.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {result.type}
                        </Badge>
                        {result.metadata?.status && (
                          <Badge variant="outline" className="text-xs">
                            {result.metadata.status}
                          </Badge>
                        )}
                        {result.metadata?.date && (
                          <span className="text-xs text-muted-foreground">
                            {result.metadata.date}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                  ↑↓
                </kbd>
                <span>Navigate</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium ml-2">
                  ↵
                </kbd>
                <span>Select</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium ml-2">
                  ESC
                </kbd>
                <span>Close</span>
              </div>
              {results.length > 0 && (
                <span>{results.length} results</span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
