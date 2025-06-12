import { useState, useEffect, useMemo } from 'react';

// Use a logger that doesn't log in production
export const useLogger = () => {
  const log = (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  };

  return log;
};

const useAgentState = () => {
  const [state, setState] = useState<{ [key: string]: any }>({});
  
  // Move useLogger to the top level of the hook
  const logger = useLogger();

  // Initial state setup (example)
  const initialState = useMemo(() => ({}), []);
  
  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  // Track state changes (example)
  useEffect(() => {
    logger('State updated:', state);
    // ... other code ...
  }, [state, logger]);

  return { state, setState };
};

export default useAgentState;