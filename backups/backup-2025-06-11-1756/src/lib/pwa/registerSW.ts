To fix the code quality issue of having console.log statements in production code, you can remove or comment out the console.log statement in the "registerSW.ts" file. Here's an example of how you can do this:

Before:
```typescript
console.log('Service worker registered successfully.');
```

After:
```typescript
// console.log('Service worker registered successfully.');
```

By commenting out the console.log statement, you ensure that it won't be executed in the production code but can still be useful for debugging purposes during development.