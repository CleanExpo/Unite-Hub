'use client'

import React from 'react'

interface WorkflowBuilderProps {
  className?: string
}

export default function WorkflowBuilder({ className }: WorkflowBuilderProps) {
  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Workflow Builder
        </h3>
        <p className="text-gray-600 mb-4">
          Advanced workflow builder coming soon
        </p>
        <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm">
              Drag and drop workflow builder interface will be available here
            </p>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Features: Visual workflow design, conditional logic, integrations
        </div>
      </div>
    </div>
  )
}
