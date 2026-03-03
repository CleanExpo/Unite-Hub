export type QuestionType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'url' | 'tel'

export interface QuestionOption {
  value: string
  label: string
  nextQuestionId?: string
}

export interface Question {
  id: string
  title: string
  description?: string
  type: QuestionType
  required?: boolean
  placeholder?: string
  options?: QuestionOption[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  conditionalNext?: {
    condition: (value: any, allAnswers: Record<string, any>) => boolean
    nextQuestionId: string
  }[]
  defaultNext?: string
}

export interface QuestionnaireSection {
  id: string
  title: string
  description?: string
  questions: Question[]
}

export interface QuestionnaireData {
  id: string
  title: string
  description: string
  sections: QuestionnaireSection[]
  startQuestionId: string
}

export interface QuestionnaireResponse {
  questionId: string
  value: any
  timestamp: Date
}

export interface ClientProfile {
  companyName: string
  industry: string
  companySize: string
  budget: string
  services: string[]
  goals: string[]
  timeline: string
  currentChallenges: string
  website?: string
  contactName: string
  contactEmail: string
  contactPhone: string
  additionalInfo?: Record<string, any>
}