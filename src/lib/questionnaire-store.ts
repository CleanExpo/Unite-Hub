import { create } from 'zustand'
import { Question, QuestionnaireResponse } from '@/types/questionnaire'
import { agencyQuestionnaireData } from './questionnaire-data'

interface QuestionnaireStore {
  currentQuestionId: string
  responses: Record<string, any>
  history: QuestionnaireResponse[]
  progress: number
  isComplete: boolean
  
  setCurrentQuestionId: (id: string) => void
  addResponse: (questionId: string, value: any) => void
  goToPreviousQuestion: () => void
  getNextQuestionId: (currentQuestion: Question, value: any) => string | null
  resetQuestionnaire: () => void
  calculateProgress: () => number
}

export const useQuestionnaireStore = create<QuestionnaireStore>((set, get) => ({
  currentQuestionId: agencyQuestionnaireData.startQuestionId,
  responses: {},
  history: [],
  progress: 0,
  isComplete: false,

  setCurrentQuestionId: (id) => {
    set({ currentQuestionId: id })
    get().calculateProgress()
  },

  addResponse: (questionId, value) => {
    const timestamp = new Date()
    set((state) => ({
      responses: { ...state.responses, [questionId]: value },
      history: [...state.history, { questionId, value, timestamp }]
    }))
  },

  goToPreviousQuestion: () => {
    const { history } = get()
    if (history.length > 0) {
      const newHistory = [...history]
      newHistory.pop()
      const previousQuestion = newHistory[newHistory.length - 1]
      
      if (previousQuestion) {
        set((state) => {
          const newResponses = { ...state.responses }
          delete newResponses[history[history.length - 1].questionId]
          return {
            currentQuestionId: previousQuestion.questionId,
            history: newHistory,
            responses: newResponses
          }
        })
      } else {
        set({
          currentQuestionId: agencyQuestionnaireData.startQuestionId,
          history: [],
          responses: {}
        })
      }
    }
    get().calculateProgress()
  },

  getNextQuestionId: (currentQuestion, value) => {
    const { responses } = get()
    
    if (currentQuestion.id === 'complete' || currentQuestion.defaultNext === 'complete') {
      set({ isComplete: true })
      return null
    }

    if (currentQuestion.options) {
      const selectedOption = currentQuestion.options.find(opt => opt.value === value)
      if (selectedOption?.nextQuestionId) {
        return selectedOption.nextQuestionId
      }
    }

    if (currentQuestion.conditionalNext) {
      for (const condition of currentQuestion.conditionalNext) {
        if (condition.condition(value, responses)) {
          return condition.nextQuestionId
        }
      }
    }

    return currentQuestion.defaultNext || null
  },

  resetQuestionnaire: () => {
    set({
      currentQuestionId: agencyQuestionnaireData.startQuestionId,
      responses: {},
      history: [],
      progress: 0,
      isComplete: false
    })
  },

  calculateProgress: () => {
    const { history } = get()
    const totalQuestions = 25
    const progress = Math.min(100, Math.round((history.length / totalQuestions) * 100))
    set({ progress })
    return progress
  }
}))