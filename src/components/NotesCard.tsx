import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  StickyNote, 
  Plus, 
  Edit, 
  Trash2, 
  Pin, 
  Archive, 
  X,
  Save
} from "lucide-react";
import { useNotes, Note } from "@/hooks/useNotes";
import { toast } from "sonner";

const NotesCard: React.FC = () => {
  const { notes, createNote, updateNote, deleteNote, togglePinNote, toggleArchiveNote, fetchNotes } = useNotes();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: [] as string[] });
  const [editNote, setEditNote] = useState({ title: '', content: '', tags: [] as string[] });

  // Fetch notes when component mounts
  React.useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Get pinned and recent notes
  const pinnedNotes = notes.filter(note => note.isPinned && !note.isArchived).slice(0, 3);
  const recentNotes = notes.filter(note => !note.isPinned && !note.isArchived).slice(0, 3);

  const handleCreateNote = async () => {
    if (!newNote.title.trim() && !newNote.content.trim()) {
      toast.error("Please enter a title or content for your note");
      return;
    }

    try {
      await createNote({
        title: newNote.title.trim() || 'Untitled Note',
        content: newNote.content.trim(),
        tags: newNote.tags,
        isPinned: false,
        isArchived: false,
      });
      
      setNewNote({ title: '', content: '', tags: [] });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleEditNote = async () => {
    if (!editingNote) return;
    if (!editNote.title.trim() && !editNote.content.trim()) {
      toast.error("Please enter a title or content for your note");
      return;
    }

    try {
      await updateNote(editingNote.id, {
        title: editNote.title.trim() || 'Untitled Note',
        content: editNote.content.trim(),
        tags: editNote.tags,
      });
      
      setEditNote({ title: '', content: '', tags: [] });
      setEditingNote(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(noteId);
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setEditNote({
      title: note.title,
      content: note.content,
      tags: note.tags,
    });
    setIsEditDialogOpen(true);
  };

  const NoteItem: React.FC<{ note: Note }> = ({ note }) => (
    <div className="p-3 bg-[#3e3e42] hover:bg-[#4e4e52] rounded transition-colors border border-gray-600">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-white font-medium text-sm truncate flex-1 mr-2">
          {note.title}
        </h4>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePinNote(note.id)}
            className={`text-white ${note.isPinned ? 'text-blue-400 hover:text-blue-500' : 'hover:text-blue-400'} h-6 w-6 p-0`}
          >
            <Pin className="w-3 h-3" fill={note.isPinned ? 'currentColor' : 'none'} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleArchiveNote(note.id)}
            className="text-white hover:text-gray-200 h-6 w-6 p-0"
          >
            <Archive className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(note)}
            className="text-white hover:text-yellow-400 h-6 w-6 p-0"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteNote(note.id)}
            className="text-white hover:text-red-400 h-6 w-6 p-0"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
        {note.content}
      </p>
      <p className="text-gray-500 text-xs mt-2">
        {new Date(note.updatedAt).toLocaleDateString()}
      </p>
    </div>
  );

  return (
    <>
      <Card className="bg-[#2d2d2d] border-gray-600">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center text-lg">
              <StickyNote className="w-5 h-5 mr-2 text-green-400" />
              Notes
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-green-400 h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#2d2d2d] border-gray-600">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Note title (optional)"
                    value={newNote.title}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-[#3e3e42] border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Textarea
                    placeholder="Write your note here..."
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    className="bg-[#3e3e42] border-gray-600 text-white placeholder:text-gray-400 min-h-[120px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="border-gray-600 text-gray-300 hover:bg-[#3e3e42]"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateNote}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Create Note
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {pinnedNotes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center">
                <Pin className="w-3 h-3 mr-1" />
                Pinned Notes
              </h4>
              <div className="space-y-2">
                {pinnedNotes.map(note => (
                  <NoteItem key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}
          
          {recentNotes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Notes</h4>
              <div className="space-y-2">
                {recentNotes.map(note => (
                  <NoteItem key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}
          
          {notes.length === 0 && (
            <div className="text-center py-6">
              <StickyNote className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-500 text-sm mb-4">No notes yet</p>
              <p className="text-gray-600 text-xs">Create your first note to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Note Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#2d2d2d] border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Note title"
              value={editNote.title}
              onChange={(e) => setEditNote(prev => ({ ...prev, title: e.target.value }))}
              className="bg-[#3e3e42] border-gray-600 text-white placeholder:text-gray-400"
            />
            <Textarea
              placeholder="Note content"
              value={editNote.content}
              onChange={(e) => setEditNote(prev => ({ ...prev, content: e.target.value }))}
              className="bg-[#3e3e42] border-gray-600 text-white placeholder:text-gray-400 min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-[#3e3e42]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditNote}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotesCard;

