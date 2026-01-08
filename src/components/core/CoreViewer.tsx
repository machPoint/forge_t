import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Tag, Edit, Trash2, Share, Star, Save, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface CoreEntry {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
  source: string;
  type: 'journal' | 'note' | 'summary';
  starred?: boolean;
  archived?: boolean;
}

interface CoreViewerProps {
  selectedMemoryId: string | null;
  memories: CoreEntry[];
  onDeleteMemory?: (id: string) => void;
  onStarMemory?: (id: string) => void;
  onEditMemory?: (id: string, updates: Partial<CoreEntry>) => void;
  onArchiveMemory?: (id: string) => void;
}

const CoreViewer: React.FC<CoreViewerProps> = ({ selectedMemoryId, memories, onDeleteMemory, onStarMemory, onEditMemory, onArchiveMemory }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Find the selected core entry from the memories array
  const selectedCore = memories?.find(c => c.id === selectedMemoryId);

  // Initialize editing state when selected core changes
  useEffect(() => {
    if (selectedCore) {
      setEditedTitle(selectedCore.title || "");
      setEditedContent(selectedCore.content || "");
      setEditedSummary(selectedCore.summary || "");
      setEditedTags(selectedCore.tags || []);
    }
  }, [selectedCore]);

  if (!selectedMemoryId) {
    return (
      <div className="h-full flex items-center justify-center bg-card text-muted-foreground">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Select a Core Entry</h3>
          <p className="text-sm">Choose a core entry from the sidebar to view its details</p>
        </div>
      </div>
    );
  }

  if (!selectedCore) {
    return (
      <div className="h-full flex items-center justify-center bg-card text-muted-foreground">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Core Entry Not Found</h3>
          <p className="text-sm">The selected core entry could not be loaded</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden">
      <div className="border-b border-border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-full">
              {isEditing ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-2xl font-bold bg-secondary border-border text-foreground mb-2"
                />
              ) : (
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {selectedCore.title}
                </h1>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedCore.createdAt)}
                </div>
                <Badge className="bg-muted text-muted-foreground">
                  {selectedCore.type}
                </Badge>
                <span className="text-muted-foreground/70">Source: {selectedCore.source}</span>
                {selectedCore.starred && (
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <>
                <Button
                  onClick={() => {
                    if (onEditMemory) {
                      onEditMemory(selectedCore.id, {
                        title: editedTitle,
                        content: editedContent,
                        summary: editedSummary,
                        tags: editedTags
                      });
                    }
                    setIsEditing(false);
                  }}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset to original values
                    setEditedTitle(selectedCore.title || "");
                    setEditedContent(selectedCore.content || "");
                    setEditedSummary(selectedCore.summary || "");
                    setEditedTags(selectedCore.tags || []);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  variant="outline"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  onClick={() => onStarMemory?.(selectedCore.id)}
                  size="sm"
                  variant="outline"
                  className={selectedCore.starred ? "text-yellow-400" : ""}
                >
                  <Star className={`w-4 h-4 mr-1 ${selectedCore.starred ? 'fill-current' : ''}`} />
                  {selectedCore.starred ? 'Starred' : 'Star'}
                </Button>
                <Button
                  onClick={() => onArchiveMemory?.(selectedCore.id)}
                  size="sm"
                  variant="outline"
                >
                  <Share className="w-4 h-4 mr-1" />
                  {selectedCore.archived ? 'Unarchive' : 'Archive'}
                </Button>
                <Button
                  onClick={() => onDeleteMemory?.(selectedCore.id)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Tags</h3>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {editedTags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-muted-foreground border-border flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                        <button
                          onClick={() => setEditedTags(editedTags.filter((_, i) => i !== index))}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add new tag..."
                      className="bg-secondary border-border text-foreground"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newTag.trim()) {
                          if (!editedTags.includes(newTag.trim())) {
                            setEditedTags([...editedTags, newTag.trim()]);
                          }
                          setNewTag("");
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (newTag.trim() && !editedTags.includes(newTag.trim())) {
                          setEditedTags([...editedTags, newTag.trim()]);
                          setNewTag("");
                        }
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Add Tag
                    </Button>
                  </div>
                </div>
              ) : (
                selectedCore.tags && selectedCore.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCore.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-muted-foreground border-border"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground/70 italic">No tags assigned</p>
                )
              )}
            </div>

            {selectedCore.summary && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Summary</h3>
                {isEditing ? (
                  <Textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    className="bg-secondary border-border text-foreground min-h-[80px]"
                    placeholder="Enter summary..."
                  />
                ) : (
                  <p className="text-muted-foreground leading-relaxed">{selectedCore.summary}</p>
                )}
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Content</h3>
              <div className="bg-secondary rounded-lg p-4">
                {isEditing ? (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="bg-muted border-border text-foreground min-h-[200px] w-full"
                    placeholder="Enter content..."
                  />
                ) : (
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedCore.content}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default CoreViewer;
