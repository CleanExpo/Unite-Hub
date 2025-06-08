"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, WifiOff, Wifi } from "lucide-react";

interface OfflineFormProps {
  endpoint: string;
  formData: Record<string, any>;
  formId: string;
  onSuccess?: () => void;
  successMessage?: string;
  errorMessage?: string;
  children: React.ReactNode;
  submitButtonText?: string;
}

/**
 * OfflineForm component that provides offline capabilities for forms
 * Stores form data in IndexedDB when offline and syncs when back online
 */
export default function OfflineForm({
  endpoint,
  formData,
  formId,
  onSuccess,
  successMessage = "Form submitted successfully!",
  errorMessage = "Error submitting form. Your data has been saved and will be submitted when you're back online.",
  children,
  submitButtonText = "Submit",
}: OfflineFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  
  // Check online status on mount and set up event listeners
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      // Try to submit any pending forms when we come back online
      syncOfflineForms();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for pending submissions on load
    checkPendingSubmissions();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Check for pending form submissions
  const checkPendingSubmissions = async () => {
    try {
      const db = await openDatabase();
      const forms = await getAllForms(db, formId);
      setPendingSubmissions(forms.length);
    } catch (error) {
      console.error('Error checking pending submissions:', error);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (isOnline) {
      // Submit directly if online
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        toast({
          title: "Success",
          description: successMessage,
          variant: "default",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        
        // If submission fails, store in IndexedDB
        await storeFormData(formData);
        
        toast({
          title: "Warning",
          description: "Unable to submit form. Your data has been saved and will be submitted when possible.",
          variant: "destructive",
        });
      }
    } else {
      // Store in IndexedDB if offline
      await storeFormData(formData);
      
      toast({
        title: "Offline Mode",
        description: "You're currently offline. Your form data has been saved and will be submitted when you're back online.",
        variant: "default",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    }
    
    setIsSubmitting(false);
    // Update pending submissions count
    checkPendingSubmissions();
  };
  
  // Store form data in IndexedDB
  const storeFormData = async (data: Record<string, any>) => {
    try {
      const db = await openDatabase();
      await addForm(db, {
        formId,
        data,
        createdAt: new Date().toISOString(),
        endpoint,
      });
      
      // Trigger a sync if the browser supports Background Sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        // Using any type assertion as Sync API is not fully recognized in TypeScript
        await (registration as any).sync.register('form-sync');
      }
    } catch (error) {
      console.error('Error storing form data:', error);
    }
  };
  
  // Manually sync offline forms
  const syncOfflineForms = async () => {
    if (!isOnline) {
      toast({
        title: "Still Offline",
        description: "You're still offline. Forms will be submitted when you're back online.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const db = await openDatabase();
      const forms = await getAllForms(db, formId);
      
      // Submit each form
      for (const form of forms) {
        try {
          const response = await fetch(form.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(form.data),
          });
          
          if (response.ok && form.id !== undefined) {
            // Remove from IndexedDB if successful
            await deleteForm(db, form.id);
          }
        } catch (error) {
          console.error('Error syncing form:', error);
          // Keep in IndexedDB to try again later
        }
      }
      
      // Update pending submissions count
      checkPendingSubmissions();
      
      toast({
        title: "Sync Complete",
        description: "Your offline submissions have been processed.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error syncing forms:', error);
      
      toast({
        title: "Sync Failed",
        description: "Failed to sync your offline submissions. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        {children}
        
        <div className="mt-6 flex flex-col gap-4">
          <Button 
            type="submit" 
            className={`${isOnline ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600' : 'bg-slate-600'} text-white`} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {isOnline ? (
                  <Wifi className="mr-2 h-4 w-4" />
                ) : (
                  <WifiOff className="mr-2 h-4 w-4" />
                )}
                {submitButtonText}
              </>
            )}
          </Button>
          
          {pendingSubmissions > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-md p-3 mt-2">
              <p className="text-yellow-400 flex items-center">
                <WifiOff className="h-4 w-4 mr-2" />
                You have {pendingSubmissions} pending {pendingSubmissions === 1 ? 'submission' : 'submissions'}.
                {isOnline && (
                  <Button 
                    variant="link" 
                    className="text-yellow-400 underline ml-2 p-0 h-auto" 
                    onClick={syncOfflineForms}
                    disabled={isSubmitting}
                  >
                    Sync now
                  </Button>
                )}
              </p>
            </div>
          )}
          
          {!isOnline && (
            <div className="bg-slate-700/50 border border-slate-600 rounded-md p-3 text-slate-300 text-sm">
              <p className="flex items-center">
                <WifiOff className="h-4 w-4 mr-2" />
                You're currently offline. Your form data will be saved and submitted when you're back online.
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

// IndexedDB utility functions
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('unite-group-forms', 1);
    
    request.onerror = () => {
      reject('Error opening database');
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('forms')) {
        const store = db.createObjectStore('forms', { keyPath: 'id', autoIncrement: true });
        store.createIndex('formId', 'formId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

interface FormEntry {
  id?: number;
  formId: string;
  data: Record<string, any>;
  createdAt: string;
  endpoint: string;
}

function addForm(db: IDBDatabase, form: FormEntry): Promise<number> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['forms'], 'readwrite');
    const store = transaction.objectStore('forms');
    const request = store.add(form);
    
    request.onsuccess = () => {
      resolve(request.result as number);
    };
    
    request.onerror = () => {
      reject('Error adding form');
    };
  });
}

function getAllForms(db: IDBDatabase, formId: string): Promise<FormEntry[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['forms'], 'readonly');
    const store = transaction.objectStore('forms');
    const index = store.index('formId');
    const request = index.getAll(formId);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject('Error getting forms');
    };
  });
}

function deleteForm(db: IDBDatabase, id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['forms'], 'readwrite');
    const store = transaction.objectStore('forms');
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject('Error deleting form');
    };
  });
}
