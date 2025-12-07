import { create } from 'zustand';
import { toast } from 'sonner';
import authService from '@/lib/auth-service';
import { getNotesApiUrl, isTauri } from '@/lib/tauri-bridge';

export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

type NotesState = {
  notes: Note[];
  selectedNote: Note | null;
  isLoading: boolean;
  error: string | null;
};

type NotesActions = {
  fetchNotes: () => Promise<void>;
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;
  toggleArchiveNote: (id: string) => Promise<void>;
  setSelectedNote: (note: Note | null) => void;
  clearError: () => void;
};

type NotesStore = NotesState & NotesActions;

// API URL will be resolved at runtime
let cachedApiUrl: string | null = null;

async function getApiUrl(): Promise<string> {
  if (cachedApiUrl) {
    return cachedApiUrl;
  }
  
  if (isTauri()) {
    try {
      cachedApiUrl = await getNotesApiUrl();
      return cachedApiUrl;
    } catch (error) {
      console.error('[useNotes] Failed to get API URL from Tauri:', error);
    }
  }
  
  // Fallback for web version
  cachedApiUrl = 'http://localhost:3000/notes';
  return cachedApiUrl;
}

export const useNotes = create<NotesStore>((set, get) => ({
  notes: [],
  selectedNote: null,
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = authService.getAccessToken();
      const apiUrl = await getApiUrl();
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch notes.');
      const notes = await response.json();
      set({ notes, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch notes', 
        isLoading: false 
      });
    }
  },

  createNote: async (note) => {
    try {
      set({ isLoading: true, error: null });
      const token = authService.getAccessToken();
      const apiUrl = await getApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(note),
      });
      if (!response.ok) throw new Error('Failed to create note.');
      const newNote = await response.json();
      set(state => ({
        notes: [newNote, ...state.notes],
        selectedNote: newNote,
        isLoading: false
      }));
      toast.success('Note created successfully');
      return newNote;
    } catch (error) {
      console.error('Failed to create note:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create note', 
        isLoading: false 
      });
      toast.error('Failed to create note');
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const token = authService.getAccessToken();
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update note.');
      const updatedNote = await response.json();
      set(state => ({
        notes: state.notes.map(note => note.id === id ? updatedNote : note),
        selectedNote: state.selectedNote?.id === id ? updatedNote : state.selectedNote,
        isLoading: false
      }));
      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Failed to update note:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update note', 
        isLoading: false 
      });
      toast.error('Failed to update note');
    }
  },

  deleteNote: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const token = authService.getAccessToken();
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete note.');
      set(state => ({
        notes: state.notes.filter(note => note.id !== id),
        selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
        isLoading: false
      }));
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Failed to delete note:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete note', 
        isLoading: false 
      });
      toast.error('Failed to delete note');
    }
  },

  togglePinNote: async (id) => {
    try {
      const note = get().notes.find(n => n.id === id);
      if (!note) return;
      
      const isPinned = !note.isPinned;
      
      // First update local state for immediate UI feedback
      set(state => ({
        notes: state.notes.map(n => 
          n.id === id ? { ...n, isPinned } : n
        ),
        selectedNote: state.selectedNote?.id === id 
          ? { ...state.selectedNote, isPinned } 
          : state.selectedNote
      }));
      
      // Then persist to backend
      const token = authService.getAccessToken();
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isPinned }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note on backend');
      }
      
      const updatedNote = await response.json();
      console.log('🔥 Note pinned status updated in database:', updatedNote);
      
      toast.success(isPinned ? "Note pinned" : "Note unpinned");
    } catch (error) {
      console.error('Failed to toggle pin status:', error);
      
      // Revert local state if backend update failed
      const note = get().notes.find(n => n.id === id);
      if (note) {
        set(state => ({
          notes: state.notes.map(n => 
            n.id === id ? { ...n, isPinned: !note.isPinned } : n
          ),
          selectedNote: state.selectedNote?.id === id 
            ? { ...state.selectedNote, isPinned: !note.isPinned } 
            : state.selectedNote
        }));
      }
      
      toast.error("Failed to update note");
    }
  },

  toggleArchiveNote: async (id) => {
    try {
      const note = get().notes.find(n => n.id === id);
      if (!note) return;
      
      const isArchived = !note.isArchived;
      
      // First update local state for immediate UI feedback
      set(state => ({
        notes: state.notes.map(n => 
          n.id === id ? { ...n, isArchived } : n
        ),
        selectedNote: state.selectedNote?.id === id 
          ? { ...state.selectedNote, isArchived } 
          : state.selectedNote
      }));
      
      // Then persist to backend
      const token = authService.getAccessToken();
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isArchived }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note on backend');
      }
      
      const updatedNote = await response.json();
      console.log('🔥 Note archived status updated in database:', updatedNote);
      
      toast.success(isArchived ? "Note archived" : "Note unarchived");
    } catch (error) {
      console.error('Failed to toggle archive status:', error);
      
      // Revert local state if backend update failed
      const note = get().notes.find(n => n.id === id);
      if (note) {
        set(state => ({
          notes: state.notes.map(n => 
            n.id === id ? { ...n, isArchived: !note.isArchived } : n
          ),
          selectedNote: state.selectedNote?.id === id 
            ? { ...state.selectedNote, isArchived: !note.isArchived } 
            : state.selectedNote
        }));
      }
      
      toast.error("Failed to update note");
    }
  },

  setSelectedNote: (note) => set({ selectedNote: note }),
  clearError: () => set({ error: null }),
}));

