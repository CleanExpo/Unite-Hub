"use client";

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

// Form field types
export type LeadFormField = 
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'company'
  | 'jobTitle'
  | 'message'
  | 'interests'
  | 'referralSource'
  | 'marketingConsent';

// Field configuration
export interface LeadFormFieldConfig {
  type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox' | 'select';
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

// Form configuration
export interface LeadFormConfig {
  fields: Record<LeadFormField, LeadFormFieldConfig>;
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  analyticsEventName?: string;
  redirectUrl?: string;
  emailListId?: string;
  additionalData?: Record<string, any>;
  displayStyle?: 'horizontal' | 'vertical' | 'grid';
}

// Form schema based on configuration
const createFormSchema = (config: LeadFormConfig) => {
  const schemaFields: Record<string, any> = {};
  
  Object.entries(config.fields).forEach(([fieldName, fieldConfig]) => {
    if (!fieldConfig) return;

    let fieldSchema;
    switch (fieldConfig.type) {
      case 'email':
        fieldSchema = z.string().email('Please enter a valid email address');
        break;
      case 'tel':
        fieldSchema = z.string().regex(/^[0-9+\-\s()]*$/, 'Please enter a valid phone number');
        break;
      case 'checkbox':
        fieldSchema = z.boolean();
        break;
      case 'select':
        fieldSchema = z.string().min(1, 'Please select an option');
        break;
      default:
        fieldSchema = z.string();
    }
    
    if (fieldConfig.required) {
      if (fieldConfig.type === 'checkbox') {
        // For checkboxes, we need a different validation approach
        fieldSchema = z.boolean().refine((val: boolean) => val === true, {
          message: `${fieldConfig.label} is required`,
        });
      } else if (fieldConfig.type === 'select' || fieldConfig.type === 'text' || 
                fieldConfig.type === 'email' || fieldConfig.type === 'tel') {
        // For string-based fields, we can use min
        fieldSchema = z.string().min(1, `${fieldConfig.label} is required`);
      } else if (fieldConfig.type === 'textarea') {
        // For textareas, also string-based
        fieldSchema = z.string().min(1, `${fieldConfig.label} is required`);
      }
    } else {
      // For optional fields
      if (fieldConfig.type === 'checkbox') {
        fieldSchema = z.boolean().optional();
      } else {
        fieldSchema = z.string().optional();
      }
    }
    
    schemaFields[fieldName] = fieldSchema;
  });
  
  return z.object(schemaFields);
};

// Default form configuration
const defaultFormConfig: LeadFormConfig = {
  fields: {
    firstName: {
      type: 'text',
      label: 'First Name',
      placeholder: 'Enter your first name',
      required: true,
    },
    lastName: {
      type: 'text',
      label: 'Last Name',
      placeholder: 'Enter your last name',
      required: false,
    },
    email: {
      type: 'email',
      label: 'Email',
      placeholder: 'Enter your email address',
      required: true,
    },
    phone: {
      type: 'tel',
      label: 'Phone',
      placeholder: 'Enter your phone number',
      required: false,
    },
    company: {
      type: 'text',
      label: 'Company',
      placeholder: 'Enter your company name',
      required: false,
    },
    jobTitle: {
      type: 'text',
      label: 'Job Title',
      placeholder: 'Enter your job title',
      required: false,
    },
    message: {
      type: 'textarea',
      label: 'Message',
      placeholder: 'How can we help you?',
      required: false,
    },
    interests: {
      type: 'select',
      label: 'Interests',
      placeholder: 'Select your interests',
      required: false,
      options: [
        { value: 'consulting', label: 'Consulting' },
        { value: 'development', label: 'Web Development' },
        { value: 'marketing', label: 'Digital Marketing' },
        { value: 'other', label: 'Other' },
      ],
    },
    referralSource: {
      type: 'select',
      label: 'How did you hear about us?',
      placeholder: 'Select an option',
      required: false,
      options: [
        { value: 'search', label: 'Search Engine' },
        { value: 'social', label: 'Social Media' },
        { value: 'recommendation', label: 'Recommendation' },
        { value: 'other', label: 'Other' },
      ],
    },
    marketingConsent: {
      type: 'checkbox',
      label: 'I agree to receive marketing communications from UNITE Group',
      description: 'You can unsubscribe at any time by clicking the link in the footer of our emails.',
      required: false,
      defaultValue: false,
    },
  },
  submitButtonText: 'Submit',
  successMessage: 'Thank you for your submission. We will be in touch soon.',
  errorMessage: 'An error occurred. Please try again later.',
  analyticsEventName: 'lead_form_submission',
  displayStyle: 'vertical',
};

/**
 * Lead Generation Form Component
 * A configurable form for lead generation with analytics tracking and email marketing integration
 */
interface LeadGenerationFormProps {
  config?: Partial<LeadFormConfig>;
  onSubmitSuccess?: (data: any) => void;
  className?: string;
}

export default function LeadGenerationForm({
  config = defaultFormConfig,
  onSubmitSuccess,
  className,
}: LeadGenerationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Merge default config with provided config
  const formConfig: LeadFormConfig = {
    ...defaultFormConfig,
    ...config,
    fields: {
      ...defaultFormConfig.fields,
      ...config.fields,
    },
  };
  
  // Create schema based on config
  const formSchema = createFormSchema(formConfig);
  type FormValues = z.infer<typeof formSchema>;
  
  // Create default values based on config
  const defaultValues: Partial<FormValues> = {};
  Object.entries(formConfig.fields).forEach(([fieldName, fieldConfig]) => {
    if (fieldConfig.defaultValue !== undefined) {
      defaultValues[fieldName as keyof FormValues] = fieldConfig.defaultValue;
    } else if (fieldConfig.type === 'checkbox') {
      defaultValues[fieldName as keyof FormValues] = false;
    } else {
      defaultValues[fieldName as keyof FormValues] = '';
    }
  });
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Track form submission event for analytics
      if (formConfig.analyticsEventName && typeof window !== 'undefined') {
        // Track with Google Analytics if available
        if (window.gtag) {
          window.gtag('event', formConfig.analyticsEventName, {
            event_category: 'Lead Generation',
            event_label: data.email || 'Unknown',
          });
        }
        
        // Track with Facebook Pixel if available
        if (window.fbq) {
          window.fbq('track', 'Lead');
        }
      }
      
      // Submit to API
      const response = await fetch('/api/marketing/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          additionalData: formConfig.additionalData,
          emailListId: formConfig.emailListId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit form');
      }
      
      setIsSuccess(true);
      toast({
        title: 'Success',
        description: formConfig.successMessage,
      });
      
      // Call success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess(data);
      }
      
      // Reset form
      form.reset();
      
      // Redirect if specified
      if (formConfig.redirectUrl) {
        window.location.href = formConfig.redirectUrl;
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: formConfig.errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render form fields based on config
  const renderFormFields = () => {
    return Object.entries(formConfig.fields).map(([fieldName, fieldConfig]) => {
      if (!fieldConfig) return null;

      return (
        <FormField
          key={fieldName}
          control={form.control}
          name={fieldName}
          render={({ field: formField }) => (
            <FormItem key={fieldName}>
              {fieldConfig.type === 'checkbox' ? (
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={formField.value}
                      onCheckedChange={formField.onChange}
                    />
                  </FormControl>
                  <div>
                    <FormLabel>{fieldConfig.label}</FormLabel>
                    {fieldConfig.description && (
                      <FormDescription>{fieldConfig.description}</FormDescription>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <FormLabel>{fieldConfig.label}</FormLabel>
                  <FormControl>
                    {fieldConfig.type === 'textarea' ? (
                      <Textarea
                        placeholder={fieldConfig.placeholder}
                        {...formField}
                      />
                    ) : fieldConfig.type === 'select' ? (
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...formField}
                      >
                        <option value="">{fieldConfig.placeholder || 'Select an option'}</option>
                        {fieldConfig.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type={fieldConfig.type}
                        placeholder={fieldConfig.placeholder}
                        {...formField}
                      />
                    )}
                  </FormControl>
                  {fieldConfig.description && (
                    <FormDescription>{fieldConfig.description}</FormDescription>
                  )}
                </>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      );
    });
  };
  
  // Generate form class based on display style
  const getFormClass = () => {
    switch (formConfig.displayStyle) {
      case 'horizontal':
        return 'flex flex-wrap gap-4 items-end';
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 gap-4';
      case 'vertical':
        return 'space-y-4';
    }
  };
  
  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={getFormClass()}>
          {renderFormFields()}
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              formConfig.submitButtonText
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
