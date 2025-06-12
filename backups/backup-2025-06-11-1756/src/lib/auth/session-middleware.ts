
```typescript
import { getSession } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export const withSession = (handler: (req: NextRequest) => Promise<NextResponse>) => 
  async (req: NextRequest) => {
    const session = await getSession({ req });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req);
  };
```
