# Supabase Documentation

> Official documentation sourced from [supabase.com/docs](https://supabase.com/docs/reference/javascript/initializing)

## Installation

```bash
npm install @supabase/supabase-js
```

## Client Setup

### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabase = createClient('https://xyzcompany.supabase.co', 'publishable-or-anon-key');
```

### With Additional Parameters

```typescript
import { createClient } from '@supabase/supabase-js';

const options = {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
};
const supabase = createClient('https://xyzcompany.supabase.co', 'publishable-or-anon-key', options);
```

### With Custom Schema

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://xyzcompany.supabase.co', 'publishable-or-anon-key', {
  db: { schema: 'other_schema' },
});
```

### Custom Fetch Implementation

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://xyzcompany.supabase.co', 'publishable-or-anon-key', {
  global: { fetch: fetch.bind(globalThis) },
});
```

### React Native with AsyncStorage

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = createClient('https://xyzcompany.supabase.co', 'publishable-or-anon-key', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Python

```python
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
```

## Authentication

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
});
```

### Sign In with Password

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});
```

### Sign In with OAuth

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

### Auth Provider (React)

```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

const AuthContext = createContext<{
  user: User | null
  loading: boolean
}>({
  user: null,
  loading: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

## Database Queries

### Select

```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false });

// Select with relations
const { data, error } = await supabase.from('posts').select(`
    id,
    title,
    author:users(name, email)
  `);
```

### Insert

```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({ title: 'New Post', content: 'Content here' })
  .select();

// Insert multiple rows
const { data, error } = await supabase
  .from('posts')
  .insert([{ title: 'Post 1' }, { title: 'Post 2' }])
  .select();
```

### Update

```typescript
const { data, error } = await supabase
  .from('posts')
  .update({ title: 'Updated Title' })
  .eq('id', postId)
  .select();
```

### Delete

```typescript
const { error } = await supabase.from('posts').delete().eq('id', postId);
```

### Filters

```typescript
// Equal
.eq('column', 'value')

// Not equal
.neq('column', 'value')

// Greater than
.gt('column', 'value')

// Less than
.lt('column', 'value')

// Like (pattern matching)
.like('column', '%pattern%')

// In array
.in('column', ['value1', 'value2'])

// Is null
.is('column', null)
```

## Real-time Subscriptions

### Subscribe to Changes

```typescript
const channel = supabase
  .channel('schema-db-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE, or *
      schema: 'public',
      table: 'posts',
    },
    (payload) => console.log(payload)
  )
  .subscribe();
```

### With Filter

```typescript
const channel = supabase
  .channel('filtered-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'products',
      filter: 'name=in.(red, blue, yellow)',
    },
    (payload) => console.log(payload)
  )
  .subscribe();
```

### Presence

```typescript
const channel = supabase.channel('room:123', {
  config: {
    presence: {
      key: user.id,
    },
  },
});

channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  console.log('Current state:', state);
});

channel.track({ user_id: user.id, status: 'online' });
```

### Broadcast

```typescript
const channel = supabase.channel('broadcast-test', {
  broadcast: { ack: false, self: false },
});

channel.on('broadcast', { event: 'some-event' }, (payload) => console.log(payload));

channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.send({
      type: 'broadcast',
      event: 'some-event',
      payload: { hello: 'world' },
    });
  }
});
```

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own posts
CREATE POLICY "Users can view own posts"
ON posts FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own posts
CREATE POLICY "Users can insert own posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id);
```

## Server-Side (Next.js)

```typescript
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// Usage in Server Component
export default async function Page() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('posts').select('*')
  return <div>{/* render data */}</div>
}
```

## Storage

```typescript
// Upload file
const { data, error } = await supabase.storage.from('avatars').upload('public/avatar1.png', file);

// Get public URL
const { data } = supabase.storage.from('public-bucket').getPublicUrl('folder/avatar1.png');

// Download file
const { data, error } = await supabase.storage.from('avatars').download('public/avatar1.png');

// List files
const { data, error } = await supabase.storage.from('bucket').list('folder', {
  limit: 100,
  offset: 0,
});

// Delete file
const { data, error } = await supabase.storage.from('avatars').remove(['public/avatar1.png']);
```

## Edge Functions

```typescript
// Invoke edge function
const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'Functions' },
});
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Migrations

```bash
# Create migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database
supabase db reset

# Start local Supabase
supabase start

# Stop local Supabase
supabase stop
```

## Official Resources

- **Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **JavaScript Reference**: [supabase.com/docs/reference/javascript](https://supabase.com/docs/reference/javascript/introduction)
- **Python Reference**: [supabase.com/docs/reference/python](https://supabase.com/docs/reference/python/introduction)
- **GitHub**: [github.com/supabase/supabase](https://github.com/supabase/supabase)
