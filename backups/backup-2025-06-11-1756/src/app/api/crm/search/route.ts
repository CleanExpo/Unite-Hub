import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q') || '';
    const entityTypes = searchParams.get('entityTypes')?.split(',') || ['client', 'deal', 'task', 'invoice'];
    const status = searchParams.get('status')?.split(',') || [];
    const priority = searchParams.get('priority')?.split(',') || [];
    const minValue = searchParams.get('minValue') ? Number(searchParams.get('minValue')) : null;
    const maxValue = searchParams.get('maxValue') ? Number(searchParams.get('maxValue')) : null;
    const assignedTo = searchParams.get('assignedTo')?.split(',') || [];
    const tags = searchParams.get('tags')?.split(',') || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build search results from different entity types
    const searchResults: any[] = [];
    const facets = {
      entityTypes: {} as { [key: string]: number },
      statuses: {} as { [key: string]: number },
      priorities: {} as { [key: string]: number },
      assignedUsers: {} as { [key: string]: number },
    };

    // Search Clients
    if (entityTypes.includes('client')) {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .or(query ? `name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%` : 'id.neq.null')
        .gte(startDate ? 'created_at' : 'id', startDate || '0')
        .lte(endDate ? 'created_at' : 'id', endDate || '9999-12-31')
        .order('created_at', { ascending: sortOrder === 'asc' });

      if (!clientsError && clients) {
        clients.forEach(client => {
          const searchResult = {
            id: client.id,
            type: 'client' as const,
            title: client.name || 'Unnamed Client',
            description: `${client.email || ''} - ${client.company || ''}`.trim(),
            status: client.status || 'active',
            createdAt: client.created_at,
            updatedAt: client.updated_at || client.created_at,
            tags: client.tags || [],
            metadata: {
              email: client.email,
              phone: client.phone,
              company: client.company,
              address: client.address,
            },
          };

          // Apply filters
          if (status.length > 0 && !status.includes(searchResult.status)) return;
          
          searchResults.push(searchResult);
          
          // Update facets
          facets.entityTypes.client = (facets.entityTypes.client || 0) + 1;
          facets.statuses[searchResult.status] = (facets.statuses[searchResult.status] || 0) + 1;
        });
      }
    }

    // Search Deals
    if (entityTypes.includes('deal')) {
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .or(query ? `title.ilike.%${query}%,description.ilike.%${query}%` : 'id.neq.null')
        .gte(startDate ? 'created_at' : 'id', startDate || '0')
        .lte(endDate ? 'created_at' : 'id', endDate || '9999-12-31')
        .gte(minValue ? 'value' : 'id', minValue || 0)
        .lte(maxValue ? 'value' : 'id', maxValue || 999999999)
        .order('created_at', { ascending: sortOrder === 'asc' });

      if (!dealsError && deals) {
        deals.forEach(deal => {
          const searchResult = {
            id: deal.id,
            type: 'deal' as const,
            title: deal.title || 'Untitled Deal',
            description: deal.description || '',
            status: deal.status || 'open',
            value: deal.value,
            priority: deal.priority,
            assignedTo: deal.assigned_to,
            createdAt: deal.created_at,
            updatedAt: deal.updated_at || deal.created_at,
            tags: deal.tags || [],
            metadata: {
              stage: deal.stage,
              client_id: deal.client_id,
              expected_close_date: deal.expected_close_date,
            },
          };

          // Apply filters
          if (status.length > 0 && !status.includes(searchResult.status)) return;
          if (priority.length > 0 && searchResult.priority && !priority.includes(searchResult.priority)) return;
          if (assignedTo.length > 0 && searchResult.assignedTo && !assignedTo.includes(searchResult.assignedTo)) return;
          
          searchResults.push(searchResult);
          
          // Update facets
          facets.entityTypes.deal = (facets.entityTypes.deal || 0) + 1;
          facets.statuses[searchResult.status] = (facets.statuses[searchResult.status] || 0) + 1;
          if (searchResult.priority) {
            facets.priorities[searchResult.priority] = (facets.priorities[searchResult.priority] || 0) + 1;
          }
          if (searchResult.assignedTo) {
            facets.assignedUsers[searchResult.assignedTo] = (facets.assignedUsers[searchResult.assignedTo] || 0) + 1;
          }
        });
      }
    }

    // Search Tasks
    if (entityTypes.includes('task')) {
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .or(query ? `title.ilike.%${query}%,description.ilike.%${query}%` : 'id.neq.null')
        .gte(startDate ? 'created_at' : 'id', startDate || '0')
        .lte(endDate ? 'created_at' : 'id', endDate || '9999-12-31')
        .order('created_at', { ascending: sortOrder === 'asc' });

      if (!tasksError && tasks) {
        tasks.forEach(task => {
          const searchResult = {
            id: task.id,
            type: 'task' as const,
            title: task.title || 'Untitled Task',
            description: task.description || '',
            status: task.status || 'pending',
            priority: task.priority,
            assignedTo: task.assigned_to,
            createdAt: task.created_at,
            updatedAt: task.updated_at || task.created_at,
            tags: task.tags || [],
            metadata: {
              due_date: task.due_date,
              client_id: task.client_id,
              deal_id: task.deal_id,
            },
          };

          // Apply filters
          if (status.length > 0 && !status.includes(searchResult.status)) return;
          if (priority.length > 0 && searchResult.priority && !priority.includes(searchResult.priority)) return;
          if (assignedTo.length > 0 && searchResult.assignedTo && !assignedTo.includes(searchResult.assignedTo)) return;
          
          searchResults.push(searchResult);
          
          // Update facets
          facets.entityTypes.task = (facets.entityTypes.task || 0) + 1;
          facets.statuses[searchResult.status] = (facets.statuses[searchResult.status] || 0) + 1;
          if (searchResult.priority) {
            facets.priorities[searchResult.priority] = (facets.priorities[searchResult.priority] || 0) + 1;
          }
          if (searchResult.assignedTo) {
            facets.assignedUsers[searchResult.assignedTo] = (facets.assignedUsers[searchResult.assignedTo] || 0) + 1;
          }
        });
      }
    }

    // Search Invoices
    if (entityTypes.includes('invoice')) {
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .or(query ? `invoice_number.ilike.%${query}%,description.ilike.%${query}%` : 'id.neq.null')
        .gte(startDate ? 'created_at' : 'id', startDate || '0')
        .lte(endDate ? 'created_at' : 'id', endDate || '9999-12-31')
        .gte(minValue ? 'amount' : 'id', minValue || 0)
        .lte(maxValue ? 'amount' : 'id', maxValue || 999999999)
        .order('created_at', { ascending: sortOrder === 'asc' });

      if (!invoicesError && invoices) {
        invoices.forEach(invoice => {
          const searchResult = {
            id: invoice.id,
            type: 'invoice' as const,
            title: invoice.invoice_number || 'Invoice',
            description: invoice.description || '',
            status: invoice.status || 'draft',
            value: invoice.amount,
            createdAt: invoice.created_at,
            updatedAt: invoice.updated_at || invoice.created_at,
            tags: invoice.tags || [],
            metadata: {
              due_date: invoice.due_date,
              client_id: invoice.client_id,
              tax_amount: invoice.tax_amount,
              total_amount: invoice.total_amount,
            },
          };

          // Apply filters
          if (status.length > 0 && !status.includes(searchResult.status)) return;
          
          searchResults.push(searchResult);
          
          // Update facets
          facets.entityTypes.invoice = (facets.entityTypes.invoice || 0) + 1;
          facets.statuses[searchResult.status] = (facets.statuses[searchResult.status] || 0) + 1;
        });
      }
    }

    // Apply tag filters if specified
    const filteredResults = tags.length > 0 
      ? searchResults.filter(result => 
          tags.some(tag => result.tags.includes(tag))
        )
      : searchResults;

    // Sort results
    let sortedResults = [...filteredResults];
    
    switch (sortBy) {
      case 'created_at':
        sortedResults.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
        break;
      case 'updated_at':
        sortedResults.sort((a, b) => {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
        break;
      case 'value':
        sortedResults.sort((a, b) => {
          const valueA = a.value || 0;
          const valueB = b.value || 0;
          return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
        });
        break;
      case 'title':
        sortedResults.sort((a, b) => {
          const comparison = a.title.localeCompare(b.title);
          return sortOrder === 'asc' ? comparison : -comparison;
        });
        break;
      case 'relevance':
      default:
        // For relevance, prioritize exact matches and recent items
        if (query) {
          sortedResults.sort((a, b) => {
            const aExactMatch = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
            const bExactMatch = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
            
            if (aExactMatch !== bExactMatch) {
              return bExactMatch - aExactMatch;
            }
            
            // Then by recency
            const dateA = new Date(a.updatedAt).getTime();
            const dateB = new Date(b.updatedAt).getTime();
            return dateB - dateA;
          });
        }
        break;
    }

    // Implement pagination
    const offset = (page - 1) * limit;
    const paginatedResults = sortedResults.slice(offset, offset + limit);
    
    // Calculate total count
    const totalCount = sortedResults.length;

    const response = {
      results: paginatedResults,
      totalCount,
      facets,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: offset + limit < totalCount,
        hasPrev: page > 1,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate search relevance score
function calculateRelevanceScore(item: any, query: string): number {
  if (!query) return 0;
  
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Title match (highest weight)
  if (item.title?.toLowerCase().includes(queryLower)) {
    score += 10;
    // Exact title match gets bonus
    if (item.title?.toLowerCase() === queryLower) {
      score += 20;
    }
  }
  
  // Description match (medium weight)
  if (item.description?.toLowerCase().includes(queryLower)) {
    score += 5;
  }
  
  // Tag match (medium weight)
  if (item.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
    score += 5;
  }
  
  // Metadata match (low weight)
  Object.values(item.metadata || {}).forEach(value => {
    if (typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
      score += 2;
    }
  });
  
  // Recency bonus (newer items get slight boost)
  const daysSinceUpdate = (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 7) score += 2;
  else if (daysSinceUpdate < 30) score += 1;
  
  return score;
}

// Helper function to extract searchable text from an item
function extractSearchableText(item: any): string {
  const text = [
    item.title,
    item.description,
    ...(item.tags || []),
    ...Object.values(item.metadata || {}).filter(v => typeof v === 'string')
  ].filter(Boolean).join(' ');
  
  return text.toLowerCase();
}

// Advanced text search with fuzzy matching (optional enhancement)
function fuzzySearch(text: string, query: string): boolean {
  if (!query) return true;
  
  const queryWords = query.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();
  
  // All query words must be found in the text (partial matches allowed)
  return queryWords.every(word => 
    textLower.includes(word) || 
    // Simple fuzzy match - check for substring with max 1 character difference
    textLower.split('').some((_, i) => 
      textLower.substring(i, i + word.length).replace(/./g, (c, j) => 
        Math.abs(j - 0) <= 1 ? word[j] || c : c
      ) === word
    )
  );
}
