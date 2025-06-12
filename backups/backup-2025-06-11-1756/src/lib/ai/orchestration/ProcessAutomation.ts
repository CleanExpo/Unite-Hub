One way to fix this issue is to remove or comment out the console.log statement in the production code. Console.log statements are typically used for debugging purposes and should not be left in production code as they can expose sensitive information and impact performance.

Before:
```typescript
console.log('Starting process automation...');
```

After:
```typescript
// console.log('Starting process automation...');
``` 

Alternatively, you can consider using a proper logging library like Winston or Bunyan to handle logging in a more structured and organized manner. This will allow you to log messages at different levels (e.g. debug, info, error) and have more control over where and how logs are outputted.