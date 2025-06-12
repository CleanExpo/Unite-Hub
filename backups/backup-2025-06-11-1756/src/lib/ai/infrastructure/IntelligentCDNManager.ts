```typescript
try {
  // code that may throw an error
} catch (error) {
  console.error('An error occurred:', error);
}
```

In the catch block, the error should be properly logged or handled instead of just logging it to the console. This way, the error can be appropriately dealt with and not just ignored.