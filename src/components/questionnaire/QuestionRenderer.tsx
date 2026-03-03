'use client'

import React, { useState } from 'react'
import { Question } from '@/types/questionnaire'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface QuestionRendererProps {
  question: Question
  value: any
  onChange: (value: any) => void
  onSubmit: () => void
}

export function QuestionRenderer({ question, value, onChange, onSubmit }: QuestionRendererProps) {
  const [checkboxValues, setCheckboxValues] = useState<string[]>(value || [])

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    const newValues = checked
      ? [...checkboxValues, optionValue]
      : checkboxValues.filter(v => v !== optionValue)
    setCheckboxValues(newValues)
    onChange(newValues)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && question.type !== 'textarea') {
      e.preventDefault()
      onSubmit()
    }
  }

  switch (question.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'tel':
    case 'number':
      return (
        <Input
          type={question.type}
          placeholder={question.placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          required={question.required}
          className="w-full"
        />
      )

    case 'textarea':
      return (
        <Textarea
          placeholder={question.placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
          className="w-full min-h-[120px]"
        />
      )

    case 'select':
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'radio':
      return (
        <RadioGroup value={value} onValueChange={onChange}>
          <div className="space-y-3">
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label
                  htmlFor={option.value}
                  className="font-normal cursor-pointer flex-1"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      )

    case 'checkbox':
      return (
        <div className="space-y-3">
          {question.options?.map((option) => (
            <div key={option.value} className="flex items-center space-x-3">
              <Checkbox
                id={option.value}
                checked={checkboxValues.includes(option.value)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(option.value, checked as boolean)
                }
              />
              <Label
                htmlFor={option.value}
                className="font-normal cursor-pointer flex-1"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      )

    default:
      return null
  }
}