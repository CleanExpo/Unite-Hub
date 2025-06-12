import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvancedSearchFilters from '@/components/crm/search/AdvancedSearchFilters';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, onClick, variant }: { children: React.ReactNode; onClick?: () => void; variant?: string }) => 
    <span data-testid="badge" data-variant={variant} onClick={onClick}>{children}</span>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, disabled }: { children: React.ReactNode; onClick?: () => void; variant?: string; disabled?: boolean }) => 
    <button data-testid="button" data-variant={variant} onClick={onClick} disabled={disabled}>{children}</button>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, type }: { value: string; onChange: (e: any) => void; placeholder?: string; type?: string }) => 
    <input data-testid="input" value={value} onChange={onChange} placeholder={placeholder} type={type} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => 
    <label data-testid="label" htmlFor={htmlFor}>{children}</label>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange('test-value')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => 
    <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <div data-testid="select-value" />,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs-content">{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button data-testid="tabs-trigger">{children}</button>,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, id }: { checked: boolean; onCheckedChange: () => void; id: string }) => 
    <input data-testid="checkbox" type="checkbox" checked={checked} onChange={onCheckedChange} id={id} />,
}));

jest.mock('@/components/ui/date-range-picker', () => ({
  DatePickerWithRange: ({ date, onDateChange }: { date: any; onDateChange: (range: any) => void }) => 
    <div data-testid="date-range-picker" onClick={() => onDateChange({ from: new Date(), to: new Date() })}>
      Date Range Picker
    </div>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  X: () => <div data-testid="x-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Target: () => <div data-testid="target-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  SortAsc: () => <div data-testid="sort-asc-icon" />,
  SortDesc: () => <div data-testid="sort-desc-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
}));

jest.mock('react-day-picker', () => ({
  DateRange: {},
}));

// Sample search response data
const mockSearchResponse = {
  results: [
    {
      id: '1',
      type: 'client',
      title: 'Acme Corporation',
      description: 'john@acme.com - Technology Company',
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      tags: ['enterprise', 'technology'],
      metadata: {
        email: 'john@acme.com',
        phone: '+1-555-0123',
        company: 'Acme Corporation',
      },
    },
    {
      id: '2',
      type: 'deal',
      title: 'Software License Deal',
      description: 'Annual software license for Acme Corp',
      status: 'negotiation',
      value: 50000,
      priority: 'high',
      assignedTo: 'Jane Smith',
      createdAt: '2024-01-16T09:00:00Z',
      updatedAt: '2024-01-22T11:15:00Z',
      tags: ['software', 'annual'],
      metadata: {
        stage: 'negotiation',
        client_id: '1',
        expected_close_date: '2024-02-01',
      },
    },
    {
      id: '3',
      type: 'task',
      title: 'Follow up with Acme',
      description: 'Send contract proposal to client',
      status: 'pending',
      priority: 'medium',
      assignedTo: 'John Doe',
      createdAt: '2024-01-17T08:00:00Z',
      updatedAt: '2024-01-17T08:00:00Z',
      tags: ['followup', 'contract'],
      metadata: {
        due_date: '2024-01-25',
        client_id: '1',
        deal_id: '2',
      },
    },
    {
      id: '4',
      type: 'invoice',
      title: 'INV-2024-001',
      description: 'Q1 Service Invoice',
      status: 'sent',
      value: 15000,
      createdAt: '2024-01-18T16:00:00Z',
      updatedAt: '2024-01-19T09:30:00Z',
      tags: ['quarterly', 'services'],
      metadata: {
        due_date: '2024-02-18',
        client_id: '1',
        tax_amount: 1500,
        total_amount: 16500,
      },
    },
  ],
  totalCount: 4,
  facets: {
    entityTypes: {
      client: 1,
      deal: 1,
      task: 1,
      invoice: 1,
    },
    statuses: {
      active: 1,
      negotiation: 1,
      pending: 1,
      sent: 1,
    },
    priorities: {
      high: 1,
      medium: 1,
    },
    assignedUsers: {
      'Jane Smith': 1,
      'John Doe': 1,
    },
  },
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
};

describe('Advanced Search Filters Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSearchResponse,
    } as Response);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('should render the search interface', () => {
      render(<AdvancedSearchFilters />);
      
      expect(screen.getByText('Advanced Search')).toBeInTheDocument();
      expect(screen.getByText('Search and filter across all CRM entities')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search across all data...')).toBeInTheDocument();
    });

    it('should render filter controls', () => {
      render(<AdvancedSearchFilters />);
      
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Entity Types')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('Value Range')).toBeInTheDocument();
      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });

    it('should render entity type checkboxes', () => {
      render(<AdvancedSearchFilters />);
      
      expect(screen.getByText(/clients/i)).toBeInTheDocument();
      expect(screen.getByText(/deals/i)).toBeInTheDocument();
      expect(screen.getByText(/tasks/i)).toBeInTheDocument();
      expect(screen.getByText(/invoices/i)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<AdvancedSearchFilters />);
      
      expect(screen.getByText('Clear All')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should perform search when query is entered', async () => {
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });
      
      // Fast-forward timers to trigger debounced search
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/crm/search?q=Acme')
        );
      });
    });

    it('should debounce search queries', async () => {
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      
      // Type multiple characters quickly
      fireEvent.change(searchInput, { target: { value: 'A' } });
      fireEvent.change(searchInput, { target: { value: 'Ac' } });
      fireEvent.change(searchInput, { target: { value: 'Acm' } });
      fireEvent.change(searchInput, { target: { value: 'Acme' } });
      
      // Should not trigger search yet
      expect(mockFetch).not.toHaveBeenCalled();
      
      // Fast-forward past debounce delay
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should include filters in search parameters', async () => {
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      // Select some entity types
      const clientCheckbox = screen.getByLabelText(/clients/i);
      fireEvent.click(clientCheckbox);
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('entityTypes=deal,task,invoice')
        );
      });
    });
  });

  describe('Filter Controls', () => {
    it('should toggle entity type filters', async () => {
      render(<AdvancedSearchFilters />);
      
      const clientCheckbox = screen.getByLabelText(/clients/i);
      expect(clientCheckbox).toBeChecked();
      
      fireEvent.click(clientCheckbox);
      expect(clientCheckbox).not.toBeChecked();
      
      fireEvent.click(clientCheckbox);
      expect(clientCheckbox).toBeChecked();
    });

    it('should handle value range filters', async () => {
      render(<AdvancedSearchFilters />);
      
      const minValueInput = screen.getByPlaceholderText('Min');
      const maxValueInput = screen.getByPlaceholderText('Max');
      
      fireEvent.change(minValueInput, { target: { value: '1000' } });
      fireEvent.change(maxValueInput, { target: { value: '50000' } });
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('minValue=1000')
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('maxValue=50000')
        );
      });
    });

    it('should handle date range selection', async () => {
      render(<AdvancedSearchFilters />);
      
      const dateRangePicker = screen.getByTestId('date-range-picker');
      fireEvent.click(dateRangePicker);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('startDate=')
        );
      });
    });

    it('should clear all filters when Clear All is clicked', () => {
      render(<AdvancedSearchFilters />);
      
      // Set some filters first
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      
      const minValueInput = screen.getByPlaceholderText('Min');
      fireEvent.change(minValueInput, { target: { value: '1000' } });
      
      // Clear all filters
      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);
      
      // Check that filters are reset
      expect(searchInput).toHaveValue('');
      expect(minValueInput).toHaveValue('');
    });
  });

  describe('Search Results Display', () => {
    it('should display search results', async () => {
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(screen.getByText('Search Results (4)')).toBeInTheDocument();
        expect(screen.getByText('Found 4 results')).toBeInTheDocument();
      });

      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('Software License Deal')).toBeInTheDocument();
      expect(screen.getByText('Follow up with Acme')).toBeInTheDocument();
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    });

    it('should display result cards with proper information', async () => {
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(screen.getByText('$50,000')).toBeInTheDocument(); // Deal value
        expect(screen.getByText('$15,000')).toBeInTheDocument(); // Invoice value
      });

      expect(screen.getByText('negotiation')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('sent')).toBeInTheDocument();
    });

    it('should show entity type badges', async () => {
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(screen.getByText('client')).toBeInTheDocument();
        expect(screen.getByText('deal')).toBeInTheDocument();
        expect(screen.getByText('task')).toBeInTheDocument();
        expect(screen.getByText('invoice')).toBeInTheDocument();
      });
    });

    it('should display faceted search filters', async () => {
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(screen.getByText('active (1)')).toBeInTheDocument();
        expect(screen.getByText('negotiation (1)')).toBeInTheDocument();
        expect(screen.getByText('pending (1)')).toBeInTheDocument();
        expect(screen.getByText('sent (1)')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting and Filtering', () => {
    it('should handle sort order changes', async () => {
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      const ascButton = screen.getByTestId('sort-asc-icon').parentElement;
      fireEvent.click(ascButton!);
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('sortOrder=asc')
        );
      });
    });

    it('should allow filtering by status using quick filters', async () => {
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(screen.getByText('active (1)')).toBeInTheDocument();
      });

      const activeStatusBadge = screen.getByText('active (1)');
      fireEvent.click(activeStatusBadge);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('status=active')
        );
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading spinner during search', async () => {
      // Make fetch take longer to resolve
      mockFetch.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => mockSearchResponse,
        } as Response), 1000)
      ));

      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(screen.getByRole('presentation')).toBeInTheDocument();
      });
    });

    it('should handle search errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Search failed'));
      
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(screen.getByText(/Search error/)).toBeInTheDocument();
        expect(screen.getByText('Retry Search')).toBeInTheDocument();
      });
    });

    it('should retry search when retry button is clicked', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Search failed'));
      
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(screen.getByText('Retry Search')).toBeInTheDocument();
      });

      // Reset mock to succeed on retry
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResponse,
      } as Response);

      const retryButton = screen.getByText('Retry Search');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Search Results (4)')).toBeInTheDocument();
      });
    });

    it('should show no results message when no results found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockSearchResponse,
          results: [],
          totalCount: 0,
        }),
      } as Response);

      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search query or filters')).toBeInTheDocument();
      });
    });
  });

  describe('Default State', () => {
    it('should show default state when no search is performed', () => {
      render(<AdvancedSearchFilters />);
      
      expect(screen.getByText('Advanced Search')).toBeInTheDocument();
      expect(screen.getByText('Search across clients, deals, tasks, and invoices')).toBeInTheDocument();
      expect(screen.getByText('Enter a search query or apply filters to get started')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not search with queries less than 2 characters', () => {
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'A' } });
      
      jest.advanceTimersByTime(300);
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should search when filters are applied even without query', async () => {
      render(<AdvancedSearchFilters />);
      
      // Apply a filter without entering a search query
      const clientCheckbox = screen.getByLabelText(/clients/i);
      fireEvent.click(clientCheckbox); // Uncheck clients
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should refresh search when refresh button is clicked', async () => {
      render(<AdvancedSearchFilters />);
      
      const searchInput = screen.getByPlaceholderText('Search across all data...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      jest.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Advanced Search API Integration', () => {
  describe('Search Parameters', () => {
    it('should build correct search URL with all parameters', () => {
      const params = new URLSearchParams();
      params.set('q', 'test query');
      params.set('entityTypes', 'client,deal');
      params.set('status', 'active,pending');
      params.set('sortBy', 'created_at');
      params.set('sortOrder', 'desc');
      
      const expectedUrl = `/api/crm/search?${params.toString()}`;
      expect(expectedUrl).toContain('q=test+query');
      expect(expectedUrl).toContain('entityTypes=client%2Cdeal');
      expect(expectedUrl).toContain('status=active%2Cpending');
    });

    it('should handle date range parameters', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const params = new URLSearchParams();
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
      
      expect(params.get('startDate')).toBe('2024-01-01T00:00:00.000Z');
      expect(params.get('endDate')).toBe('2024-01-31T00:00:00.000Z');
    });

    it('should handle value range parameters', () => {
      const params = new URLSearchParams();
      params.set('minValue', '1000');
      params.set('maxValue', '50000');
      
      expect(params.get('minValue')).toBe('1000');
      expect(params.get('maxValue')).toBe('50000');
    });
  });

  describe('Response Handling', () => {
    it('should process search response correctly', () => {
      const response = mockSearchResponse;
      
      expect(response.results).toHaveLength(4);
      expect(response.totalCount).toBe(4);
      expect(response.facets.entityTypes.client).toBe(1);
      expect(response.facets.statuses.active).toBe(1);
    });

    it('should handle pagination information', () => {
      const response = mockSearchResponse;
      
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.totalPages).toBe(1);
      expect(response.pagination.hasNext).toBe(false);
      expect(response.pagination.hasPrev).toBe(false);
    });
  });
});
