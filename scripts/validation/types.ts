export interface ValidationError {
  type: 'missing_file' | 'database_table' | 'api_connection' | 'mock_data' | 'security' | 'seo' | 'missing_component' | 'missing_directory' | 'database_connection'
  file?: string
  table?: string
  service?: string
  component?: string
  path?: string
  message: string
}

export interface ValidationWarning {
  type: 'todo_found' | 'console_log' | 'silent_error' | 'seo'
  file: string
  message: string
}

export interface ValidationReport {
  timestamp: string
  summary: {
    errors: number
    warnings: number
    missingFiles: number
    mockData: number
    brokenConnections: number
  }
  errors: ValidationError[]
  warnings: ValidationWarning[]
  missingFiles: string[]
  mockDataFound: string[]
  brokenConnections: string[]
  healthScore: number
}
