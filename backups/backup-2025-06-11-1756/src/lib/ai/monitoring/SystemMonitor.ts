One way to fix this issue is to surround the console.log statement with an if condition that checks if the application is running in a development environment. This can be achieved by setting a global variable like `isDev` to `true` in development mode and `false` in production mode.

Here is an example of how you can do that:

```typescript
if (isDev) {
  console.log("System Monitor: monitoring system performance...");
}
```

Make sure to replace `isDev` with the variable you are using to determine the environment (e.g., `process.env.NODE_ENV === 'development'`). This way, the console.log statement will only be executed in the development environment and not in production.