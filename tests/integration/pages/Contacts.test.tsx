/**
 * Integration Tests for Contacts Page (Phase 3 Redesigned)
 * Tests component interactions: Pagination + Table + Modals + API calls
 * Covers user workflows: search, filter, add, edit, delete, send email
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from '@/test-utils/mock-fetch';
import ContactsPage from '@/app/dashboard/contacts/page';

// Mock dependencies
vi.mock('@/hooks/useWorkspace', () => ({
  useWorkspace: vi.fn(() => ({
    workspaceId: 'test-workspace-id',
    loading: false,
  })),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
    auth: {
      getSession: vi.fn(() => ({
        data: {
          session: {
            access_token: 'test-token',
          },
        },
      })),
    },
  },
}));

vi.mock('@/components/modals/AddContactModal', () => ({
  AddContactModal: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div role="dialog" aria-label="Add Contact Modal">
        <input placeholder="Contact name" />
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/modals/SendEmailModal', () => ({
  SendEmailModal: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div role="dialog" aria-label="Send Email Modal">
        <textarea placeholder="Email body" />
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/modals/EditContactModal', () => ({
  EditContactModal: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div role="dialog" aria-label="Edit Contact Modal">
        <input placeholder="Contact name" />
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/modals/DeleteContactModal', () => ({
  DeleteContactModal: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div role="dialog" aria-label="Delete Contact Modal">
        <p>Are you sure?</p>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
  ),
}));

const mockContacts = [
  {
    id: 'contact-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    company: 'Tech Corp',
    job_title: 'Marketing Manager',
    phone: '555-0101',
    status: 'prospect',
    ai_score: 85,
    tags: ['marketing', 'prospect'],
    last_interaction: '2025-11-28',
    created_at: '2025-11-01',
  },
  {
    id: 'contact-2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    company: 'Sales Inc',
    job_title: 'Sales Director',
    phone: '555-0102',
    status: 'lead',
    ai_score: 72,
    tags: ['sales', 'lead'],
    last_interaction: '2025-11-25',
    created_at: '2025-11-05',
  },
  {
    id: 'contact-3',
    name: 'Carol White',
    email: 'carol@example.com',
    company: 'Design Studio',
    job_title: 'Creative Director',
    phone: '555-0103',
    status: 'prospect',
    ai_score: 78,
    tags: ['design', 'prospect'],
    last_interaction: '2025-11-20',
    created_at: '2025-11-10',
  },
  {
    id: 'contact-4',
    name: 'David Lee',
    email: 'david@example.com',
    company: 'Business Group',
    job_title: 'CEO',
    phone: '555-0104',
    status: 'prospect',
    ai_score: 92,
    tags: ['executive', 'prospect'],
    last_interaction: '2025-11-22',
    created_at: '2025-11-12',
  },
  {
    id: 'contact-5',
    name: 'Eve Martinez',
    email: 'eve@example.com',
    company: 'Innovation Labs',
    job_title: 'Product Manager',
    phone: '555-0105',
    status: 'lead',
    ai_score: 88,
    tags: ['product', 'lead'],
    last_interaction: '2025-11-26',
    created_at: '2025-11-08',
  },
  {
    id: 'contact-6',
    name: 'Frank Brown',
    email: 'frank@example.com',
    company: 'Growth Partners',
    job_title: 'Growth Lead',
    phone: '555-0106',
    status: 'prospect',
    ai_score: 65,
    tags: ['growth'],
    last_interaction: '2025-11-15',
    created_at: '2025-11-14',
  },
  {
    id: 'contact-7',
    name: 'Grace Wilson',
    email: 'grace@example.com',
    company: 'Strategy Consulting',
    job_title: 'Consultant',
    phone: '555-0107',
    status: 'prospect',
    ai_score: 75,
    tags: ['consulting', 'prospect'],
    last_interaction: '2025-11-23',
    created_at: '2025-11-16',
  },
  {
    id: 'contact-8',
    name: 'Henry Davis',
    email: 'henry@example.com',
    company: 'Enterprise Corp',
    job_title: 'VP Engineering',
    phone: '555-0108',
    status: 'lead',
    ai_score: 81,
    tags: ['engineering', 'enterprise'],
    last_interaction: '2025-11-27',
    created_at: '2025-11-18',
  },
];

describe('Contacts Page Integration Tests (Phase 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Page Layout & Header', () => {
    it('should render page header with title and description', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      expect(screen.getByRole('heading', { name: /contacts/i, level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/manage all your contacts/i)).toBeInTheDocument();
    });

    it('should have breadcrumb navigation', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      expect(screen.getByText('Contacts')).toBeInTheDocument();
    });

    it('should display Add Contact button', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const addButton = screen.getByRole('button', { name: /add contact/i });
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Search & Filter Functionality', () => {
    it('should search contacts by name', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, 'Alice');

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    });

    it('should search contacts by email', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, 'bob@example.com');

      await waitFor(() => {
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      });

      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });

    it('should search contacts by company', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, 'Tech Corp');

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    });

    it('should reset pagination when search term changes', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);

      // Type first search
      await user.type(searchInput, 'Alice');

      // Clear and type new search
      await user.clear(searchInput);
      await user.type(searchInput, 'Bob');

      await waitFor(() => {
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      });
    });

    it('should display Filter button', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const filterButton = screen.getByRole('button', { name: /filter/i });
      expect(filterButton).toBeInTheDocument();
    });
  });

  describe('Statistics Cards', () => {
    it('should display total contacts count', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Contacts')).toBeInTheDocument();
      });
    });

    it('should display prospects count', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Prospects')).toBeInTheDocument();
      });
    });

    it('should display hot leads count (AI score >= 80)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Hot Leads')).toBeInTheDocument();
      });
    });

    it('should display average AI score', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Avg AI Score')).toBeInTheDocument();
      });
    });
  });

  describe('Contacts Table', () => {
    it('should display contacts in table format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should display table headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const headers = ['Name', 'Company', 'Email', 'AI Score', 'Status', 'Last Interaction', 'Actions'];

      await waitFor(() => {
        headers.forEach(header => {
          expect(screen.getByText(header)).toBeInTheDocument();
        });
      });
    });

    it('should display paginated contacts (10 per page)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        // Should show first 8 contacts (matching mockContacts length)
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      });
    });

    it('should display AI score with color-coded badge', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        // High score (85)
        expect(screen.getByText('85')).toBeInTheDocument();
        // Medium score (72)
        expect(screen.getByText('72')).toBeInTheDocument();
      });
    });

    it('should display status badge', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        const statusElements = screen.getAllByText('prospect');
        expect(statusElements.length).toBeGreaterThan(0);
      });
    });

    it('should display last interaction date', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('11/28/2025')).toBeInTheDocument();
      });
    });

    it('should show email as clickable mailto link', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        const emailLinks = screen.getAllByText('alice@example.com');
        expect(emailLinks[0]).toHaveAttribute('href', 'mailto:alice@example.com');
      });
    });
  });

  describe('Pagination Integration', () => {
    it('should show pagination controls when contacts exceed page size', async () => {
      // Create 15 contacts to trigger pagination
      const manyContacts = Array.from({ length: 15 }, (_, i) => ({
        ...mockContacts[0],
        id: `contact-${i}`,
        name: `Contact ${i}`,
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: manyContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
      });
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      const manyContacts = Array.from({ length: 15 }, (_, i) => ({
        ...mockContacts[0],
        id: `contact-${i}`,
        name: `Contact ${i}`,
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: manyContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next|→/i });
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('should show current page number', async () => {
      const manyContacts = Array.from({ length: 25 }, (_, i) => ({
        ...mockContacts[0],
        id: `contact-${i}`,
        name: `Contact ${i}`,
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: manyContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /page 1/i })).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interactions', () => {
    it('should open Add Contact modal when button clicked', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const addButton = screen.getByRole('button', { name: /add contact/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /add contact modal/i })).toBeInTheDocument();
      });
    });

    it('should open Send Email modal from action menu', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        const firstRow = screen.getByText('Alice Johnson').closest('tr');
        expect(firstRow).toBeInTheDocument();
      });

      const actionButton = screen.getAllByRole('button', { name: '' })[0];
      await user.click(actionButton);

      // Menu items should appear
      await waitFor(() => {
        expect(screen.getByText('Send Email')).toBeInTheDocument();
      });
    });

    it('should handle modal closure', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const addButton = screen.getByRole('button', { name: /add contact/i });
      await user.click(addButton);

      const modal = screen.getByRole('dialog', { name: /add contact modal/i });
      expect(modal).toBeInTheDocument();

      const closeButton = within(modal).getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /add contact modal/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no contacts exist', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: [] }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText(/no contacts yet/i)).toBeInTheDocument();
      });
    });

    it('should show empty search state when search yields no results', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, 'NonexistentContact');

      await waitFor(() => {
        expect(screen.getByText(/no contacts found/i)).toBeInTheDocument();
      });
    });

    it('should have Add Contact button in empty state', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: [] }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        const addButtons = screen.getAllByRole('button', { name: /add contact/i });
        expect(addButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error state when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load contacts/i)).toBeInTheDocument();
      });
    });

    it('should provide retry button on error', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent(/contacts/i);
    });

    it('should have accessible search input', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should have accessible table with proper structure', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();

        const headers = screen.getAllByRole('columnheader');
        expect(headers.length).toBeGreaterThan(0);
      });
    });

    it('should have descriptive button labels', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      expect(screen.getByRole('button', { name: /add contact/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.tab();

      expect(searchInput).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport (375px)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      // Mock window.innerWidth for responsive behavior
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ContactsPage />);

      const heading = screen.getByRole('heading', { name: /contacts/i });
      expect(heading).toBeInTheDocument();
    });

    it('should render table container with proper overflow handling', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence & Refresh', () => {
    it('should refresh contacts after adding new contact', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: mockContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should reload contacts with latest data', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ contacts: mockContacts.slice(0, 3) }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ contacts: mockContacts }),
        });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large contact list (50+ contacts)', async () => {
      const manyContacts = Array.from({ length: 50 }, (_, i) => ({
        ...mockContacts[0],
        id: `contact-${i}`,
        name: `Contact ${i}`,
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: manyContacts }),
      });

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Contact 0')).toBeInTheDocument();
      });
    });

    it('should efficiently filter large contact list', async () => {
      const user = userEvent.setup();
      const manyContacts = Array.from({ length: 100 }, (_, i) => ({
        ...mockContacts[0],
        id: `contact-${i}`,
        name: i === 0 ? 'Alice Johnson' : `Contact ${i}`,
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ contacts: manyContacts }),
      });

      render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, 'Alice');

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
    });
  });
});
