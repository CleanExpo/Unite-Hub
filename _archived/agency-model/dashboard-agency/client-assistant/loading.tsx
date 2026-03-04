import { Loader2 } from 'lucide-react';

export default function ClientAssistantLoading() {
  return (
    <div className="flex items-center justify-center p-8 min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading assistant...</p>
      </div>
    </div>
  );
}
