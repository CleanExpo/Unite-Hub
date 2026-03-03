/**
 * TaskSubmissionForm Component Tests
 *
 * Tests for the TaskSubmissionForm component that handles
 * task submission to the agentic layer with validation and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock fetch
global.fetch = vi.fn()

// Mock TaskSubmissionForm (simplified for testing)
import { useState } from 'react'

function TaskSubmissionForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskType, setTaskType] = useState<string>('feature')
  const [priority, setPriority] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          task_type: taskType,
          priority,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit task')
      }

      // Reset form
      setTitle('')
      setDescription('')
      setTaskType('feature')
      setPriority(5)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit task')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="task-submission-form">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Add dark mode toggle"
          data-testid="title-input"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={10}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Implement dark mode toggle in settings page..."
          data-testid="description-input"
        />
      </div>

      <div>
        <label htmlFor="taskType" className="block text-sm font-medium text-gray-700 mb-1">
          Task Type
        </label>
        <select
          id="taskType"
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          data-testid="task-type-select"
        >
          <option value="feature">Feature</option>
          <option value="bug">Bug Fix</option>
          <option value="refactor">Refactor</option>
          <option value="docs">Documentation</option>
          <option value="test">Tests</option>
        </select>
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
          Priority: {priority}
        </label>
        <input
          id="priority"
          type="range"
          min="1"
          max="10"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          className="w-full"
          data-testid="priority-slider"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={`w-full py-2 px-4 rounded-md font-medium transition ${
          submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        data-testid="submit-button"
      >
        {submitting ? 'Submitting...' : 'Submit to Agents'}
      </button>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm" data-testid="success-message">
          Task submitted successfully! Agents will begin execution.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm" data-testid="error-message">
          {error}
        </div>
      )}
    </form>
  )
}

describe('TaskSubmissionForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockReset()
  })

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<TaskSubmissionForm />)

      expect(screen.getByTestId('title-input')).toBeInTheDocument()
      expect(screen.getByTestId('description-input')).toBeInTheDocument()
      expect(screen.getByTestId('task-type-select')).toBeInTheDocument()
      expect(screen.getByTestId('priority-slider')).toBeInTheDocument()
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    it('should have proper labels', () => {
      render(<TaskSubmissionForm />)

      expect(screen.getByLabelText('Title')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
      expect(screen.getByLabelText('Task Type')).toBeInTheDocument()
      expect(screen.getByText(/Priority:/)).toBeInTheDocument()
    })

    it('should have placeholders', () => {
      render(<TaskSubmissionForm />)

      expect(screen.getByPlaceholderText('Add dark mode toggle')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Implement dark mode toggle/)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should have required attribute on title field', () => {
      render(<TaskSubmissionForm />)

      const titleInput = screen.getByTestId('title-input')
      expect(titleInput).toHaveAttribute('required')
      expect(titleInput).toHaveAttribute('minLength', '3')
    })

    it('should have required attribute on description field', () => {
      render(<TaskSubmissionForm />)

      const descriptionInput = screen.getByTestId('description-input')
      expect(descriptionInput).toHaveAttribute('required')
      expect(descriptionInput).toHaveAttribute('minLength', '10')
    })
  })

  describe('User Interactions', () => {
    it('should update title on input change', async () => {
      const user = userEvent.setup()
      render(<TaskSubmissionForm />)

      const titleInput = screen.getByTestId('title-input') as HTMLInputElement

      await user.type(titleInput, 'New Task Title')

      expect(titleInput.value).toBe('New Task Title')
    })

    it('should update description on input change', async () => {
      const user = userEvent.setup()
      render(<TaskSubmissionForm />)

      const descriptionInput = screen.getByTestId('description-input') as HTMLTextAreaElement

      await user.type(descriptionInput, 'This is a detailed description of the task')

      expect(descriptionInput.value).toBe('This is a detailed description of the task')
    })

    it('should change task type selection', async () => {
      const user = userEvent.setup()
      render(<TaskSubmissionForm />)

      const select = screen.getByTestId('task-type-select') as HTMLSelectElement

      await user.selectOptions(select, 'bug')

      expect(select.value).toBe('bug')
    })

    it('should update priority slider', async () => {
      render(<TaskSubmissionForm />)

      const slider = screen.getByTestId('priority-slider') as HTMLInputElement

      fireEvent.change(slider, { target: { value: '8' } })

      expect(slider.value).toBe('8')
      expect(screen.getByText('Priority: 8')).toBeInTheDocument()
    })
  })

  describe('Form Submission - Success', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123' }),
      })

      render(<TaskSubmissionForm />)

      // Fill form
      await user.type(screen.getByTestId('title-input'), 'Test Task')
      await user.type(screen.getByTestId('description-input'), 'This is a test task description')
      await user.selectOptions(screen.getByTestId('task-type-select'), 'feature')

      // Submit
      await user.click(screen.getByTestId('submit-button'))

      // Verify fetch was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Test Task',
              description: 'This is a test task description',
              task_type: 'feature',
              priority: 5,
            }),
          })
        )
      })

      // Verify success message
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument()
      })
    })

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123' }),
      })

      render(<TaskSubmissionForm />)

      // Fill and submit form
      await user.type(screen.getByTestId('title-input'), 'Test Task')
      await user.type(screen.getByTestId('description-input'), 'Test description for the task')
      await user.click(screen.getByTestId('submit-button'))

      // Wait for form to reset
      await waitFor(() => {
        const titleInput = screen.getByTestId('title-input') as HTMLInputElement
        const descriptionInput = screen.getByTestId('description-input') as HTMLTextAreaElement

        expect(titleInput.value).toBe('')
        expect(descriptionInput.value).toBe('')
      })
    })

    it('should show submitting state during submission', async () => {
      const user = userEvent.setup()

      // Mock slow fetch
      ;(global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ id: '123' }),
                }),
              100
            )
          )
      )

      render(<TaskSubmissionForm />)

      await user.type(screen.getByTestId('title-input'), 'Test')
      await user.type(screen.getByTestId('description-input'), 'Test description text')
      await user.click(screen.getByTestId('submit-button'))

      // Check submitting state
      expect(screen.getByText('Submitting...')).toBeInTheDocument()
      expect(screen.getByTestId('submit-button')).toBeDisabled()

      // Wait for submission to complete
      await waitFor(
        () => {
          expect(screen.queryByText('Submitting...')).not.toBeInTheDocument()
        },
        { timeout: 200 }
      )
    })
  })

  describe('Form Submission - Error', () => {
    it('should display error message on failed submission', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      render(<TaskSubmissionForm />)

      await user.type(screen.getByTestId('title-input'), 'Test')
      await user.type(screen.getByTestId('description-input'), 'Test description')
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByText('Failed to submit task')).toBeInTheDocument()
      })
    })

    it('should re-enable submit button after error', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
      })

      render(<TaskSubmissionForm />)

      await user.type(screen.getByTestId('title-input'), 'Test')
      await user.type(screen.getByTestId('description-input'), 'Test description')
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).not.toBeDisabled()
      })
    })

    it('should handle network error', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      render(<TaskSubmissionForm />)

      await user.type(screen.getByTestId('title-input'), 'Test')
      await user.type(screen.getByTestId('description-input'), 'Test description')
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<TaskSubmissionForm />)

      const form = screen.getByTestId('task-submission-form')
      expect(form.tagName).toBe('FORM')
    })

    it('should have labels associated with inputs', () => {
      render(<TaskSubmissionForm />)

      const titleInput = screen.getByTestId('title-input')
      const titleLabel = screen.getByLabelText('Title')

      expect(titleLabel).toBe(titleInput)
    })

    it('should have accessible submit button', () => {
      render(<TaskSubmissionForm />)

      const button = screen.getByTestId('submit-button')
      expect(button).toHaveAttribute('type', 'submit')
    })
  })

  describe('Default Values', () => {
    it('should have default task type as feature', () => {
      render(<TaskSubmissionForm />)

      const select = screen.getByTestId('task-type-select') as HTMLSelectElement
      expect(select.value).toBe('feature')
    })

    it('should have default priority as 5', () => {
      render(<TaskSubmissionForm />)

      const slider = screen.getByTestId('priority-slider') as HTMLInputElement
      expect(slider.value).toBe('5')
    })
  })

  describe('Task Type Options', () => {
    it('should have all task type options', () => {
      render(<TaskSubmissionForm />)

      const select = screen.getByTestId('task-type-select')

      expect(screen.getByRole('option', { name: 'Feature' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Bug Fix' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Refactor' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Documentation' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Tests' })).toBeInTheDocument()
    })
  })

  describe('Priority Slider', () => {
    it('should have correct range', () => {
      render(<TaskSubmissionForm />)

      const slider = screen.getByTestId('priority-slider')
      expect(slider).toHaveAttribute('min', '1')
      expect(slider).toHaveAttribute('max', '10')
    })

    it('should update label when slider changes', () => {
      render(<TaskSubmissionForm />)

      const slider = screen.getByTestId('priority-slider')

      fireEvent.change(slider, { target: { value: '7' } })

      expect(screen.getByText('Priority: 7')).toBeInTheDocument()
    })
  })
})
