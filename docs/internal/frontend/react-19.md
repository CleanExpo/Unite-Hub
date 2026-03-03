# React 19 Documentation

> Official documentation sourced from [react.dev](https://react.dev/reference/react)

## React 19.2 - Available Hooks

### Core Hooks

- `useState` - State management
- `useEffect` - Side effects
- `useContext` - Context consumption
- `useReducer` - Complex state logic
- `useCallback` - Memoized callbacks
- `useMemo` - Memoized values
- `useRef` - Mutable refs

### React 19 New Hooks

- `useActionState` - Form action state
- `useOptimistic` - Optimistic updates
- `use` - Read resources in render
- `useFormStatus` - Form submission status
- `useTransition` - Non-blocking updates

## useActionState

```typescript
import { useActionState } from 'react';

function ChangeName({ name, setName }) {
  const [error, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const error = await updateName(formData.get("name"));
      if (error) {
        return error;
      }
      redirect("/path");
      return null;
    },
    null,
  );

  return (
    <form action={submitAction}>
      <input type="text" name="name" />
      <button type="submit" disabled={isPending}>Update</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

## useFormStatus

```typescript
import { useFormStatus } from 'react-dom';

function DesignButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} />
}

function Submit() {
  const { pending, data, method, action } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}
```

## useOptimistic

`useOptimistic` lets you show a different state while an async action is underway, providing immediate feedback to users.

```typescript
import { useOptimistic, useState, useRef, startTransition } from "react";

function Thread({ messages, sendMessageAction }) {
  const formRef = useRef();

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage) => [
      { text: newMessage, sending: true },
      ...state,
    ]
  );

  function formAction(formData) {
    addOptimisticMessage(formData.get("message"));
    formRef.current.reset();
    startTransition(async () => {
      await sendMessageAction(formData);
    });
  }

  return (
    <>
      <form action={formAction} ref={formRef}>
        <input type="text" name="message" placeholder="Hello!" />
        <button type="submit">Send</button>
      </form>
      {optimisticMessages.map((message, index) => (
        <div key={index}>
          {message.text}
          {!!message.sending && <small> (Sending...)</small>}
        </div>
      ))}
    </>
  );
}
```

### Parameters

- `state`: The value to return initially and whenever no action is pending
- `updateFn(currentState, optimisticValue)`: Pure function that returns the merged optimistic state

### Returns

- `optimisticState`: The resulting optimistic state
- `addOptimistic`: Dispatcher function to trigger optimistic updates

## use Hook

```typescript
import { use } from 'react';

async function fetchUser() {
  const response = await fetch('/api/user');
  return response.json();
}

function UserProfile() {
  const user = use(fetchUser());

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Using with Context
function Button() {
  const theme = use(ThemeContext);
  return <button className={theme}>Click me</button>;
}
```

## Form Actions

```typescript
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

async function createUserAction(prevState, formData) {
  try {
    await fetch('/user', {
      method: 'POST',
      body: JSON.stringify({ name: formData.get('name') }),
    });
  } catch (err) {
    return {
      success: false,
      message: err.message,
    };
  }
  return {
    success: true,
    message: 'User created successfully!',
  };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button>{pending ? 'Saving...' : 'Save'}</button>;
}

export default function UserForm() {
  const [formState, formAction] = useActionState(createUserAction, null);

  return (
    <form action={formAction}>
      <input name="name" type="text" />
      <SubmitButton />
      {formState?.success === true && (
        <p className="success">{formState?.message}</p>
      )}
      {formState?.success === false && (
        <p className="error">{formState?.message}</p>
      )}
    </form>
  );
}
```

## Resource Preloading

```typescript
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom';

function MyComponent() {
  preinit('https://.../path/to/some/script.js', { as: 'script' });
  preload('https://.../path/to/font.woff', { as: 'font' });
  preload('https://.../path/to/stylesheet.css', { as: 'style' });
  prefetchDNS('https://...');
  preconnect('https://...');
}
```

## Server Components

```typescript
// MyServerComponent.server.jsx
async function MyServerComponent() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

## New Components in React 19

### Activity (Experimental)

```typescript
import { Activity } from 'react';

function MyComponent() {
  return (
    <Activity mode="hidden">
      <ExpensiveComponent />
    </Activity>
  );
}
```

### ViewTransition (Experimental)

```typescript
import { ViewTransition } from 'react';

function MyComponent() {
  return (
    <ViewTransition>
      <PageContent />
    </ViewTransition>
  );
}
```

## New APIs

### startTransition

```typescript
import { startTransition } from 'react';

function handleClick() {
  startTransition(() => {
    setTab('comments');
  });
}
```

### cache

```typescript
import { cache } from 'react';

const getUser = cache(async (id) => {
  const response = await fetch(`/api/user/${id}`);
  return response.json();
});
```

## Improved Hydration Error Messages

React 19 provides better hydration error messages:

```
Uncaught Error: Hydration failed because the server rendered HTML didn't match the client.

This can happen if:
- A server/client branch: if (typeof window !== 'undefined')
- Variable input such as Date.now() or Math.random()
- Date formatting in a user's locale
- External changing data without a snapshot
- Invalid HTML tag nesting
```

## AddToCart Example

```typescript
import { useActionState, useState } from "react";
import { addToCart } from "./actions.js";

function AddToCartForm({ itemID, itemTitle }) {
  const [message, formAction, isPending] = useActionState(addToCart, null);

  return (
    <form action={formAction}>
      <h2>{itemTitle}</h2>
      <input type="hidden" name="itemID" value={itemID} />
      <button type="submit">Add to Cart</button>
      {isPending ? "Loading..." : message}
    </form>
  );
}

export default function App() {
  return (
    <>
      <AddToCartForm itemID="1" itemTitle="JavaScript: The Definitive Guide" />
      <AddToCartForm itemID="2" itemTitle="JavaScript: The Good Parts" />
    </>
  );
}
```

## Official Resources

- **Documentation**: [react.dev](https://react.dev)
- **Reference**: [react.dev/reference/react](https://react.dev/reference/react)
- **Hooks**: [react.dev/reference/react/hooks](https://react.dev/reference/react/hooks)
- **GitHub**: [github.com/facebook/react](https://github.com/facebook/react)
