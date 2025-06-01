import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface NotesSectionProps {
  entityType: 'client' | 'project' | 'task';
  entityId: string;
}

export default function NotesSection({ entityType, entityId }: NotesSectionProps) {
  const [note, setNote] = useState('');

  const handleSaveNote = () => {
    // TODO: Implement note saving logic
    console.log(`Saving note for ${entityType} ${entityId}:`, note);
    setNote('');
  };

  return (
    <div className="space-y-4 mt-4">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note..."
        rows={4}
      />
      <Button onClick={handleSaveNote}>Save Note</Button>
      {/* TODO: Add notes list component */}
    </div>
  );
}
