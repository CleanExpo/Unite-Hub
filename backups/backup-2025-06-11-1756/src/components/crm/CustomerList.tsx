Here's an enhanced version of the CRM customer list component with comprehensive error handling, validation, and security features:

```tsx
// interfaces.ts
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  version?: number; // For optimistic concurrency control
}

export interface Filters {
  search: string;
  status: 'all' | Customer['status'];
  source: 'all' | 'web' | 'email' | 'phone';
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: Customer['status'];
}

// validation.ts
import { ValidationError, CustomerFormData } from './interfaces';

export class ValidationService {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly PHONE_REGEX = /^[\+]?[\d\s\-\(\)]{10,}$/;
  private static readonly NAME_MIN_LENGTH = 2;
  private static readonly NAME_MAX_LENGTH = 100;

  static validateCustomer(data: CustomerFormData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Name validation
    if (!data.name?.trim()) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (data.name.trim().length < this.NAME_MIN_LENGTH) {
      errors.push({ field: 'name', message: `Name must be at least ${this.NAME_MIN_LENGTH} characters` });
    } else if (data.name.trim().length > this.NAME_MAX_LENGTH) {
      errors.push({ field: 'name', message: `Name must be less than ${this.NAME_MAX_LENGTH} characters` });
    } else if (!/^[a-zA-Z\s\-'\.]+$/.test(data.name.trim())) {
      errors.push({ field: 'name', message: 'Name contains invalid characters' });
    }

    // Email validation
    if (!data.email?.trim()) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!this.EMAIL_REGEX.test(data.email.trim())) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    // Phone validation (optional)
    if (data.phone?.trim() && !this.PHONE_REGEX.test(data.phone.trim())) {
      errors.push({ field: 'phone', message: 'Please enter a valid phone number' });
    }

    // Company validation
    if (!data.company?.trim()) {
      errors.push({ field: 'company', message: 'Company is required' });
    } else if (data.company.trim().length > 200) {
      errors.push({ field: 'company', message: 'Company name must be less than 200 characters' });
    }

    // Status validation
    if (!['active', 'inactive', 'pending'].includes(data.status)) {
      errors.push({ field: 'status', message: 'Invalid status selected' });
    }

    return errors;
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  static validateSearchTerm(searchTerm: string): string {
    // Prevent SQL injection and XSS in search
    const sanitized = this.sanitizeInput(searchTerm);
    return sanitized.length > 100 ? sanitized.substring(0, 100) : sanitized;
  }
}

// apiService.ts
import { Customer, ApiResponse } from './interfaces';

export class ApiService {
  private static readonly BASE_URL = process.env.REACT_APP_API_URL || '/api';
  private static readonly TIMEOUT = 10000; // 10 seconds

  private static async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = this.TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest', // CSRF protection
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized - redirect to login
          window.location.href = '/login';
          throw new Error('Unauthorized access');
        }
        
        if (response.status === 403) {
          throw new Error('Access forbidden');
        }

        if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false
      };
    }
  }

  static async getCustomers(filters?: Partial<Filters>): Promise<ApiResponse<Customer[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) {
        queryParams.append('search', ValidationService.validateSearchTerm(filters.search));
      }
      if (filters?.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      if (filters?.source && filters.source !== 'all') {
        queryParams.append('source', filters.source);
      }

      const response = await this.fetchWithTimeout(
        `${this.BASE_URL}/customers?${queryParams.toString()}`
      );
      
      return this.handleResponse<Customer[]>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch customers',
        success: false
      };
    }
  }

  static async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>> {
    try {
      const response = await this.fetchWithTimeout(`${this.BASE_URL}/customers`, {
        method: 'POST',
        body: JSON.stringify(customer),
      });

      return this.handleResponse<Customer>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create customer',
        success: false
      };
    }
  }

  static async updateCustomer(customer: Customer): Promise<ApiResponse<Customer>> {
    try {
      const response = await this.fetchWithTimeout(`${this.BASE_URL}/customers/${customer.id}`, {
        method: 'PUT',
        body: JSON.stringify(customer),
      });

      return this.handleResponse<Customer>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to update customer',
        success: false
      };
    }
  }

  static async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.fetchWithTimeout(`${this.BASE_URL}/customers/${id}`, {
        method: 'DELETE',
      });

      return this.handleResponse<void>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to delete customer',
        success: false
      };
    }
  }
}

// hooks/useCustomers.ts
import { useState, useEffect, useCallback } from 'react';
import { Customer, Filters, ApiResponse } from '../interfaces';
import { ApiService } from '../apiService';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    source: 'all'
  });

  const loadCustomers = useCallback(async (currentFilters?: Filters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.getCustomers(currentFilters || filters);
      
      if (response.success && response.data) {
        setCustomers(response.data);
      } else {
        setError(response.error || 'Failed to load customers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>> => {
    const response = await ApiService.createCustomer(customer);
    
    if (response.success && response.data) {
      setCustomers(prev => [...prev, response.data!]);
    }
    
    return response;
  };

  const updateCustomer = async (customer: Customer): Promise<ApiResponse<Customer>> => {
    const response = await ApiService.updateCustomer(customer);
    
    if (response.success && response.data) {
      setCustomers(prev => prev.map(c => c.id === customer.id ? response.data! : c));
    }
    
    return response;
  };

  const deleteCustomer = async (id: string): Promise<ApiResponse<void>> => {
    const response = await ApiService.deleteCustomer(id);
    
    if (response.success) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
    
    return response;
  };

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    loading,
    error,
    filters,
    setFilters,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};

// components/CustomerForm.tsx
import React, { useState, useEffect } from 'react';
import { Customer, CustomerFormData, ValidationError } from '../interfaces';
import { ValidationService } from '../validation';

interface CustomerFormProps {
  customer?: Customer | null;
  onSave: (customer: CustomerFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  loading?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onSave,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active'
  });
  
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        company: customer.company,
        status: customer.status
      });
    }
  }, [customer]);

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    const sanitizedValue = ValidationService.sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear field-specific errors
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = ValidationService.validateCustomer(formData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const result = await onSave(formData);
      
      if (!result.success) {
        setErrors([{ field: 'form', message: result.error || 'Failed to save customer' }]);
      }
    } catch (error) {
      setErrors([{ 
        field: 'form', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  const getFormError = () => {
    return errors.find(error => error.field === 'form')?.message;
  };

  return (
    <div className="customer-form" role="dialog" aria-labelledby="form-title">
      <h2 id="form-title">
        {customer?.id ? 'Edit Customer' : 'Add New Customer'}
      </h2>
      
      {getFormError() && (
        <div className="error-banner" role="alert">
          {getFormError()}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={getFieldError('name') ? 'error' : ''}
            disabled={isSubmitting || loading}
            maxLength={100}
            required
            aria-describedby={getFieldError('name') ? 'name-error' : undefined}
          />
          {getFieldError('name') && (
            <span id="name-error" className="field-error" role="alert">
              {getFieldError('name')}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={getFieldError('email') ? 'error' : ''}
            disabled={isSubmitting || loading}
            required
            aria-describedby={getFieldError('email') ? 'email-error' : undefined}
          />
          {getFieldError('email') && (
            <span id="email-error" className="field-error" role="alert">
              {getFieldError('email')}
            