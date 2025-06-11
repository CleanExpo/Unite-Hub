One way to fix this issue is to remove the console.log statement from the production code. 

Here is the updated code without the console.log statement:

```typescript
// src\lib\ai\recommendation-engine.ts

// Your recommendation-engine code here

// Removed console.log statement
``` 

Make sure to review the rest of the code and ensure there are no other console.log statements in the production code. It is best practice to remove all console.log statements from production code to avoid any unwanted logs being displayed to end-users.