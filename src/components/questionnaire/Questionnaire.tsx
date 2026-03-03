'use client'

import React, { useState, useEffect } from 'react'
import { useQuestionnaireStore } from '@/lib/questionnaire-store'
import { agencyQuestionnaireData } from '@/lib/questionnaire-data'
import { QuestionRenderer } from './QuestionRenderer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { Question } from '@/types/questionnaire'

export function Questionnaire() {
  const {
    currentQuestionId,
    responses,
    progress,
    isComplete,
    setCurrentQuestionId,
    addResponse,
    goToPreviousQuestion,
    getNextQuestionId,
    resetQuestionnaire,
    history
  } = useQuestionnaireStore()

  const [currentValue, setCurrentValue] = useState<any>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)

  useEffect(() => {
    const findQuestion = (id: string): Question | null => {
      for (const section of agencyQuestionnaireData.sections) {
        const question = section.questions.find(q => q.id === id)
        if (question) return question
      }
      return null
    }

    const question = findQuestion(currentQuestionId)
    setCurrentQuestion(question)
    setCurrentValue(responses[currentQuestionId] || '')
  }, [currentQuestionId, responses])

  const handleNext = async () => {
    if (!currentQuestion) return

    if (currentQuestion.required && !currentValue) {
      return
    }

    setIsSubmitting(true)
    addResponse(currentQuestionId, currentValue)
    
    const nextId = getNextQuestionId(currentQuestion, currentValue)
    
    if (nextId === 'complete' || !nextId) {
      handleComplete()
    } else {
      setCurrentQuestionId(nextId)
      setCurrentValue('')
    }
    
    setIsSubmitting(false)
  }

  const handleBack = () => {
    goToPreviousQuestion()
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    
    setTimeout(() => {
      setIsSubmitting(false)
    }, 1500)
  }

  const isNextDisabled = () => {
    if (!currentQuestion) return true
    if (currentQuestion.required && !currentValue) return true
    if (currentQuestion.type === 'checkbox' && currentQuestion.required && (!currentValue || currentValue.length === 0)) return true
    return false
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
            <p className="text-lg text-gray-600 mb-8">
              We've received your information and will create a personalized service plan for your business.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold mb-4">What happens next?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Our team will review your responses within 24 hours</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>You'll receive a customized service proposal via email</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>A specialist will contact you to schedule a consultation</span>
                </li>
              </ul>
            </div>
            <div className="space-x-4">
              <Button onClick={() => window.location.href = '/'}>
                Back to Home
              </Button>
              <Button variant="outline" onClick={resetQuestionnaire}>
                Start New Questionnaire
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {agencyQuestionnaireData.title}
            </h1>
            <span className="text-sm text-gray-500">
              {history.length + 1} / ~25 questions
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">{currentQuestion.title}</CardTitle>
            {currentQuestion.description && (
              <CardDescription>{currentQuestion.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="min-h-[200px]">
              <QuestionRenderer
                question={currentQuestion}
                value={currentValue}
                onChange={setCurrentValue}
                onSubmit={handleNext}
              />
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={history.length === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={isNextDisabled() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {currentQuestion.defaultNext === 'complete' ? 'Complete' : 'Next'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Your information is secure and will only be used to create your personalized service plan
          </p>
        </div>
      </div>
    </div>
  )
}