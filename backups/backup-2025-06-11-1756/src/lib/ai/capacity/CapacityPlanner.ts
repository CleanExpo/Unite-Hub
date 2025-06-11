One way to fix this code quality issue is to remove the console.log statement from the production code. 

Before:
```
console.log("Capacity Planner initialized");
```

After:
```
// Capacity Planner initialized
``` 

Alternatively, you can consider commenting out the console.log statement or replacing it with a more appropriate logging mechanism, such as a logging library like Winston or Bunyan. 

Remember to always avoid leaving console.log statements in production code as they can expose sensitive information and impact performance.