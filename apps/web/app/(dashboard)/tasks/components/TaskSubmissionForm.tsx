/**
 * TaskSubmissionForm Component
 *
 * Form for submitting new tasks to the agentic layer.
 * Uses client-side form handling and validation.
 */

'use client'

import { useState } from 'react'

export function TaskSubmissionForm() {
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

      // Reload page to show new task
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit task')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add dark mode toggle"
        />
      </div>

      {/* Description */}
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Implement dark mode toggle in settings page with persistence..."
        />
      </div>

      {/* Task Type */}
      <div>
        <label htmlFor="taskType" className="block text-sm font-medium text-gray-700 mb-1">
          Task Type
        </label>
        <select
          id="taskType"
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="feature">Feature</option>
          <option value="bug">Bug Fix</option>
          <option value="refactor">Refactor</option>
          <option value="docs">Documentation</option>
          <option value="test">Tests</option>
        </select>
      </div>

      {/* Priority */}
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
          aria-label={`Priority level: ${priority} out of 10`}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={priority}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Highest (1)</span>
          <span>Lowest (10)</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className={`w-full py-2 px-4 rounded-md font-medium transition ${
          submitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {submitting ? 'Submitting...' : 'Submit to Agents'}
      </button>

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm" role="alert" aria-live="polite">
          Task submitted successfully! Agents will begin execution.
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
    </form>
  )
}
