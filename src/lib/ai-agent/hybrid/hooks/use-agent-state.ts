// Use a logger that doesn't log in production
export const useLogger = () => {
  const log = (...args: any[]) => {
     
    console.log(...args);
  };

  return log;
};

// ... rest of the component code ...

const useAgentState = () => {
  const [state, setState] = useState<{ [key: string]: any }>({});

  // Initial state setup (example)
  const initialState = useMemo(() => { /* ... */ }, []);
  setState(initialState);

  // Track state changes (example)
  useEffect(() => {
    const logger = useLogger();
    logger('State updated:', state);
    // ... other code ...
  }, [state]);

  return { state, setState };
};