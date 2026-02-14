import { Loader2 } from 'lucide-react';

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
