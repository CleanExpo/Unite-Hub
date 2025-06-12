To resolve the "Catch block without proper error handling" issue in `src\components\blog\NewsletterSubscribe.tsx`, follow these steps:

1. **Add an Error State**: Use React's `useState` to track and display errors.
2. **Clear Previous Errors**: Reset the error state before attempting the newsletter submission.
3. **Handle Errors Gracefully**: Catch and display user-friendly error messages while logging detailed errors to the console.

Here's the fixed code:

```tsx
import React, { useState } from 'react';

const NewsletterSubscribe = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setIsSubscribed(false);

    try {
      // ... Your subscription logic here ...
      // Example: const response = await newsletterService.subscribe(email);

      // Success handling
      setIsSubscribed(true);
      setEmail('');
    } catch (err) {
      console.error('Subscription failed:', err); // Log for debugging
      setError(
        err instanceof Error
          ? `Failed to subscribe: ${err.message}`
          : 'An unknown error occurred. Please try again later.'
      );
    }
  };

  return (
    // ... JSX with error display ...
    {error && <div className="error-message">{error}</div>}
    {isSubscribed && <div className="success-message">Thank you for subscribing!</div>}
  );
};

export default NewsletterSubscribe;
```

**Key Changes**:
- Added `error` state to track and display errors.
- Reset `error` before each request.
- Formatted error messages for user-friendly display while retaining technical details in logs.
- Used `instanceof Error` to handle both standard and custom errors.

This approach ensures user feedback during failures, proper logging, and prevents unhandled exceptions.