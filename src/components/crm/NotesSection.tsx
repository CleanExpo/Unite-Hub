'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, User, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { useEffect as useEffectHook } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Note {
  id: string;
  content: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  user_id: string;
  user_email?: string;
}

interface NotesSectionProps {
  entityType: 'client' | 'project' | 'task';
  entityId: string;
}

export default function NotesSection({ entityType, entityId }: NotesSectionProps) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any> 'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, User, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { useEffect as useEffectHook } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Note {
  id: string;
  content: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  user_id: string;
  user_email?: string;
}

interface NotesSectionProps {
  entityType: 'client' | 'project' | 'task';
  entityId: string;
}

export default function NotesSection({ entityType, entityId }: NotesSectionProps) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, [entityType, entityId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_notes')
        .select(`
          id,
          content,
          entity_type,
          entity_id,
          created_at,
          user_id,
          profiles:user_id (email)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the data to include user email
      const formattedNotes = data?.map((note: any) => ({
        ...note,
        user_email: Array.isArray(note.profiles) ? note.profiles[0]?.email : note.profiles?.email
      })) || [];

      setNotes(formattedNotes);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!note.trim() || !user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('crm_notes')
        .insert({
          content: note,
          entity_type: entityType,
          entity_id: entityId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new note to the list with user email
      setNotes([{ ...data, user_email: user.email } as Note, ...notes]);
      setNote('');
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('crm_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      // Remove the note from the list
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Note input section */}
      <div className="space-y-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          Unite Group="Add a note..."
          rows={4}
          disabled={loading || !user}
        />
        <Button 
          onClick={handleSaveNote} 
          disabled={loading || !note.trim() || !user}
        >
          {loading ? 'Saving...' : 'Save Note'}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notes list */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Notes History</h3>
        
        {loading && notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No notes yet. Add your first note above.
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{note.user_email || 'Unknown user'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    {user?.id === note.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={loading}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
.Value -replace "'", "'" <div className="space-y-4 mt-4">
      {/* Note input section */}
      <div className="space-y-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          Unite Group="Add a note..."
          rows={4}
          disabled={loading || !user}
        />
        <Button 
          onClick={handleSaveNote} 
          disabled={loading || !note.trim() || !user}
        > 'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, User, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { useEffect as useEffectHook } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Note {
  id: string;
  content: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  user_id: string;
  user_email?: string;
}

interface NotesSectionProps {
  entityType: 'client' | 'project' | 'task';
  entityId: string;
}

export default function NotesSection({ entityType, entityId }: NotesSectionProps) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, [entityType, entityId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_notes')
        .select(`
          id,
          content,
          entity_type,
          entity_id,
          created_at,
          user_id,
          profiles:user_id (email)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the data to include user email
      const formattedNotes = data?.map((note: any) => ({
        ...note,
        user_email: Array.isArray(note.profiles) ? note.profiles[0]?.email : note.profiles?.email
      })) || [];

      setNotes(formattedNotes);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!note.trim() || !user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('crm_notes')
        .insert({
          content: note,
          entity_type: entityType,
          entity_id: entityId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new note to the list with user email
      setNotes([{ ...data, user_email: user.email } as Note, ...notes]);
      setNote('');
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('crm_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      // Remove the note from the list
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Note input section */}
      <div className="space-y-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          Unite Group="Add a note..."
          rows={4}
          disabled={loading || !user}
        />
        <Button 
          onClick={handleSaveNote} 
          disabled={loading || !note.trim() || !user}
        >
          {loading ? 'Saving...' : 'Save Note'}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notes list */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Notes History</h3>
        
        {loading && notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No notes yet. Add your first note above.
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{note.user_email || 'Unknown user'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    {user?.id === note.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={loading}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
.Value -replace "'", "'" </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notes list */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Notes History</h3>
        
        {loading && notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No notes yet. Add your first note above.
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span> 'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, User, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { useEffect as useEffectHook } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Note {
  id: string;
  content: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  user_id: string;
  user_email?: string;
}

interface NotesSectionProps {
  entityType: 'client' | 'project' | 'task';
  entityId: string;
}

export default function NotesSection({ entityType, entityId }: NotesSectionProps) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, [entityType, entityId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_notes')
        .select(`
          id,
          content,
          entity_type,
          entity_id,
          created_at,
          user_id,
          profiles:user_id (email)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the data to include user email
      const formattedNotes = data?.map((note: any) => ({
        ...note,
        user_email: Array.isArray(note.profiles) ? note.profiles[0]?.email : note.profiles?.email
      })) || [];

      setNotes(formattedNotes);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!note.trim() || !user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('crm_notes')
        .insert({
          content: note,
          entity_type: entityType,
          entity_id: entityId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new note to the list with user email
      setNotes([{ ...data, user_email: user.email } as Note, ...notes]);
      setNote('');
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('crm_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      // Remove the note from the list
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Note input section */}
      <div className="space-y-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          Unite Group="Add a note..."
          rows={4}
          disabled={loading || !user}
        />
        <Button 
          onClick={handleSaveNote} 
          disabled={loading || !note.trim() || !user}
        >
          {loading ? 'Saving...' : 'Save Note'}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notes list */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Notes History</h3>
        
        {loading && notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No notes yet. Add your first note above.
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{note.user_email || 'Unknown user'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    {user?.id === note.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={loading}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
.Value -replace "'", "'" </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span> 'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, User, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { useEffect as useEffectHook } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Note {
  id: string;
  content: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  user_id: string;
  user_email?: string;
}

interface NotesSectionProps {
  entityType: 'client' | 'project' | 'task';
  entityId: string;
}

export default function NotesSection({ entityType, entityId }: NotesSectionProps) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, [entityType, entityId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_notes')
        .select(`
          id,
          content,
          entity_type,
          entity_id,
          created_at,
          user_id,
          profiles:user_id (email)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the data to include user email
      const formattedNotes = data?.map((note: any) => ({
        ...note,
        user_email: Array.isArray(note.profiles) ? note.profiles[0]?.email : note.profiles?.email
      })) || [];

      setNotes(formattedNotes);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!note.trim() || !user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('crm_notes')
        .insert({
          content: note,
          entity_type: entityType,
          entity_id: entityId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new note to the list with user email
      setNotes([{ ...data, user_email: user.email } as Note, ...notes]);
      setNote('');
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('crm_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      // Remove the note from the list
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Note input section */}
      <div className="space-y-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          Unite Group="Add a note..."
          rows={4}
          disabled={loading || !user}
        />
        <Button 
          onClick={handleSaveNote} 
          disabled={loading || !note.trim() || !user}
        >
          {loading ? 'Saving...' : 'Save Note'}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notes list */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Notes History</h3>
        
        {loading && notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No notes yet. Add your first note above.
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{note.user_email || 'Unknown user'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    {user?.id === note.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={loading}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
.Value -replace "'", "'" </span>
                        </div>
                      </div>
                    </div>
                    {user?.id === note.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={loading}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
