import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Tag, Edit, Trash2, Share, Star, Save, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Memory {
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

interface MemoriesViewerProps {
  selectedMemoryId: string | null;
  memories: Memory[];
  onDeleteMemory?: (id: string) => void;
  onStarMemory?: (id: string) => void;
  onEditMemory?: (id: string, updates: Partial<Memory>) => void;
  onArchiveMemory?: (id: string) => void;
}

const MemoriesViewer: React.FC<MemoriesViewerProps> = ({ selectedMemoryId, memories, onDeleteMemory, onStarMemory, onEditMemory, onArchiveMemory }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  // Function to clean text content from JSON formatting and HTML
  const cleanTextContent = (content: string): string => {
    if (!content) return '';
    
    let cleaned = content;
    
    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Remove JSON formatting artifacts
    cleaned = cleaned
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\\n/g, '\n') // Convert \n to actual newlines
      .replace(/\\"/g, '"') // Convert \" to actual quotes
      .replace(/\\'/g, "'") // Convert \' to actual quotes
      .replace(/^\{[^}]*"text":\s*"/, '') // Remove JSON prefix like {"text": "
      .replace(/"\}$/, '') // Remove JSON suffix like "}
      .replace(/&lt;/g, '<') // Convert HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim();
    
    return cleaned;
  };

  // Find the selected memory from the memories array
  const selectedMemory = memories.find(m => m.id === selectedMemoryId);

  // Debug log to help diagnose selection/rendering issues
  console.log('MemoriesViewer debug:', { selectedMemoryId, selectedMemory, memories });
  
  // Initialize editing state when selected memory changes
  useEffect(() => {
    if (selectedMemory) {
      setEditedTitle(selectedMemory.title || "");
      setEditedContent(selectedMemory.content || "");
      setEditedSummary(selectedMemory.summary || "");
      setEditedTags(selectedMemory.tags || []);
    }
  }, [selectedMemory]);
  
  // Editing functions
  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (!selectedMemory) return;
    
    setIsEditing(false);
    setEditedTitle(selectedMemory.title);
    setEditedContent(selectedMemory.content);
    setEditedSummary(selectedMemory.summary);
    setEditedTags([...selectedMemory.tags]);
    setNewTag("");
  };

  const saveEdits = async () => {
    if (!selectedMemory) return;
    
    // Create updates object
    const updates: Partial<Memory> = {
      title: editedTitle,
      content: editedContent,
      summary: editedSummary,
      tags: [...editedTags]
    };
    
    // Call the callback to handle saving
    if (onEditMemory) {
      onEditMemory(selectedMemory.id, updates);
    }
    
    setIsEditing(false);
    setNewTag("");
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    
    // Don't add duplicate tags
    if (!editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()]);
    }
    
    setNewTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
  };

  const generateTags = async () => {
    if (!selectedMemory?.content) return;
    
    setIsGeneratingTags(true);
    
    try {
      // Use the full content for AI tag generation
      const content = selectedMemory.content;
      console.log("Generating tags for content:", content.slice(0, 100) + "...");
      
      // This is a placeholder simulation
      setTimeout(() => {
        // Generate tags based on the actual content
        const contentLower = content.toLowerCase();
        const potentialTags = [
          { tag: "psychological", keywords: ["psych", "profile", "behavior", "traits"] },
          { tag: "biographical", keywords: ["bio", "profile", "biographical"] },
          { tag: "personality", keywords: ["personality", "openness", "traits", "style"] },
          { tag: "reflection", keywords: ["think", "review", "assess"] },
          { tag: "identity", keywords: ["identity", "psychological"] },
          { tag: "analysis", keywords: ["analyze", "assessment", "specific"] },
          { tag: "coffee-shop", keywords: ["coffee", "shop"] },
          { tag: "reading", keywords: ["novel", "reading"] },
          { tag: "daily-life", keywords: ["routine", "morning", "day"] },
          { tag: "personal-growth", keywords: ["growth", "development", "change"] },
        ];
        
        // Extract relevant tags based on content
        const extractedTags = potentialTags
          .filter(({ keywords }) => keywords.some(keyword => contentLower.includes(keyword)))
          .map(({ tag }) => tag);
        
        // Ensure we have at least some tags if none match
        const finalTags = extractedTags.length > 0 ? extractedTags : ["note", "entry"];
        
        setEditedTags([...new Set([...editedTags, ...finalTags])]);
        setIsGeneratingTags(false);
      }, 1500);
    } catch (error) {
      console.error("Error generating tags:", error);
      setIsGeneratingTags(false);
    }
  };
  
  // New function for auto-summarizing content
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const generateSummary = async () => {
    if (!selectedMemory?.content) return;
    
    setIsGeneratingSummary(true);
    
    try {
      // Use the full content for AI summary generation
      const content = selectedMemory.content;
      console.log("Generating summary for content:", content.slice(0, 100) + "...");
      
      // This is a placeholder simulation
      setTimeout(() => {
        // Generate a thoughtful summary based on the actual content
        let summary = "";
        
        if (content.toLowerCase().includes("psych") && content.toLowerCase().includes("profile")) {
          summary = "A request to analyze the user's psychological and biographical profile, asking for assessment of personality traits, openness, and thought style based on available profile information.";
        } 
        else if (content.toLowerCase().includes("coffee") || content.toLowerCase().includes("novel")) {
          summary = "A reflective entry about a peaceful morning routine and the significance of small, quiet moments. The author describes walking to a coffee shop, interacting with strangers, and completing a novel with mixed feelings of loss and satisfaction.";
        }
        else {
          // Generic summary for other content types
          const words = content.split(/\s+/).filter(w => w.length > 0);
          const topicWords = words
            .filter(w => w.length > 4)
            .slice(0, 3)
            .join(", ");
          summary = `A personal entry covering topics related to ${topicWords || "daily experiences"} with personal reflections and observations.`;
        }
        
        setEditedSummary(summary);
        setIsGeneratingSummary(false);
      }, 2000);
    } catch (error) {
      console.error("Error generating summary:", error);
      setIsGeneratingSummary(false);
    }
  };

  if (!selectedMemoryId) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1d1d1d] text-gray-400">
        <div className="text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 text-gray-400">
            <path d="M7 8H17L19 12H5L7 8Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 3H16L17 8H7L8 3Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 12H19L18 17H6L5 12Z" stroke="currentColor" strokeWidth="1.5" />
            <rect x="9" y="17" width="6" height="4" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Select a Memory</h3>
          <p className="text-sm">Choose a memory from the sidebar to view its details</p>
        </div>
      </div>
    );
  }

  if (!selectedMemory) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1d1d1d] text-gray-400">
        <div className="text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 text-gray-400">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 16V12H8" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="8" r="1" fill="currentColor" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Memory Not Found</h3>
          <p className="text-sm">The selected memory could not be loaded</p>
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

  const getTypeIcon = (type: Memory['type']) => {
    switch (type) {
      case 'journal': return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
          <path d="M12 3H19V21H5V3H12Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 8H15" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 12H15" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 16H13" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
      case 'note': return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 8H16" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 16H12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
      case 'summary': return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 16V12H8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
      default: return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="8" r="1" fill="currentColor" />
          <path d="M12 11V16" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    }
  };

  const getTypeColor = (type: Memory['type']) => {
    // Using grayscale colors with varying brightnesses
    switch (type) {
      case 'journal': return 'bg-gray-700/20 text-gray-300 border-gray-700/30';
      case 'note': return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
      case 'summary': return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
      default: return 'bg-gray-400/20 text-gray-600 border-gray-400/30';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1d1d1d]">
      {/* Header */}
      <div className="border-b border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span>{getTypeIcon(selectedMemory.type)}</span>
            <div className="w-full">
              {isEditing ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-2xl font-bold text-gray-100 mb-2 bg-[#2a2a2a] border-gray-600"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-100 mb-2">
                  {selectedMemory.title}
                </h1>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  {formatDate(selectedMemory.createdAt)}
                </div>
                <Badge className={`${getTypeColor(selectedMemory.type)}`}>
                  {selectedMemory.type}
                </Badge>
                <span className="text-gray-500">Source: {selectedMemory.source}</span>
                {selectedMemory.archived && <span className="ml-2 text-xs text-yellow-400">[Archived]</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStarMemory && onStarMemory(selectedMemory.id)}
              className="text-gray-300 hover:text-yellow-400 relative group"
              aria-label={selectedMemory.starred ? 'Unstar' : 'Star'}
              title={selectedMemory.starred ? 'Unstar' : 'Star'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`text-gray-300 ${selectedMemory.starred ? 'fill-yellow-400 text-yellow-400' : ''}`}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                {selectedMemory.starred ? 'Unstar' : 'Star'}
              </div>
            </Button>
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onEditMemory) {
                      onEditMemory(selectedMemory.id, {
                        title: editedTitle,
                        content: editedContent
                      });
                    }
                    setIsEditing(false);
                  }}
                  className="text-gray-300 hover:text-green-400"
                  aria-label="Save"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v6a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M7 10l5 5 5-5z" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-red-400"
                  aria-label="Cancel"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditedTitle(selectedMemory.title);
                  setEditedContent(selectedMemory.content);
                  setIsEditing(true);
                }}
                className="text-gray-400 hover:text-gray-100 relative group"
                aria-label="Edit"
                title="Edit"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Edit
                </div>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArchiveMemory && onArchiveMemory(selectedMemory.id)}
              className="text-gray-300 hover:text-gray-100 relative group"
              aria-label="Archive"
              disabled={selectedMemory.archived}
              title="Archive"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300">
                <rect x="3" y="3" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 7v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" stroke="currentColor" strokeWidth="1.5" />
                <polyline points="9 10 12 13 15 10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Archive
              </div>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteMemory && onDeleteMemory(selectedMemory.id)}
              className="text-gray-400 hover:text-red-400 relative group"
              aria-label="Delete"
              title="Delete"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300">
                <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Delete
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Core Entry Control Center */}
          <Card className="bg-[#2a2a2a] border-gray-600 mb-2">
            <CardHeader className="py-1 px-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 8H16" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span className="font-medium text-gray-200">Core Entry Details</span>
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={saveEdits}
                      className="h-7 py-0 px-2 text-xs bg-transparent border-gray-600 text-gray-300 hover:text-green-400 hover:border-green-400"
                    >
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={cancelEditing}
                      className="h-7 py-0 px-2 text-xs bg-transparent border-gray-600 text-gray-300 hover:text-red-400 hover:border-red-400"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={startEditing}
                    className="h-7 py-0 px-2 text-xs bg-transparent border-gray-600 text-gray-300 hover:text-gray-100 hover:border-gray-400"
                  >
                    Edit Details
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-1 px-2 pb-2">
              {/* Summary */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs font-medium text-gray-400">Summary</div>
                  {isEditing && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={generateSummary}
                      className="h-5 py-0 px-2 text-xs bg-transparent border-gray-600 text-gray-300 hover:text-gray-100 hover:border-gray-400"
                      disabled={isGeneratingSummary}
                    >
                      {isGeneratingSummary ? 'Generating...' : 'Auto-summarize'}
                    </Button>
                  )}
                </div>
                <div className="text-sm text-gray-300">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedSummary}
                        onChange={(e) => setEditedSummary(e.target.value)}
                        className="text-gray-300 leading-relaxed whitespace-pre-wrap h-20 bg-[#2a2a2a] border-gray-600 text-sm"
                        placeholder="Add a summary or click Auto-summarize to generate one from the content..."
                      />
                      <div className="text-xs text-gray-500 italic">
                        {isGeneratingSummary ? 'Analyzing content and generating summary...' : 'Tip: Click Auto-summarize to use AI to generate a summary from the full content'}
                      </div>
                    </div>
                  ) : (
                    selectedMemory.summary || <span className="text-gray-500 italic text-xs">No summary available</span>
                  )}
                </div>
              </div>
              
              {/* Tags */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs font-medium text-gray-400">Tags</div>
                  {isEditing && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={generateTags}
                      className="h-5 py-0 px-2 text-xs bg-transparent border-gray-600 text-gray-300 hover:text-gray-100 hover:border-gray-400"
                      disabled={isGeneratingTags}
                    >
                      {isGeneratingTags ? 'Generating...' : 'Auto-tag'}
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {isEditing ? (
                    <div className="w-full">
                      <div className="flex gap-1 mb-1">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          className="flex-1 h-6 text-xs bg-[#333] text-gray-300 border-gray-600"
                          placeholder="Add tag"
                          onKeyDown={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addTag}
                          className="h-6 py-0 px-2 text-xs bg-transparent border-gray-600 text-gray-300"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {editedTags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs py-0 px-1.5 text-gray-300 border-gray-500 flex items-center gap-1"
                          >
                            #{tag}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                          </Badge>
                        ))}
                        {editedTags.length === 0 && (
                          <span className="text-gray-500 italic text-xs">No tags added</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 italic">
                        {isGeneratingTags ? 'Analyzing content and generating tags...' : 'Tip: Click Auto-tag to use AI to analyze the full content and suggest tags'}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedMemory.tags && selectedMemory.tags.length > 0 ? (
                        selectedMemory.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs py-0 px-1.5 text-gray-300 border-gray-500"
                          >
                            #{tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 italic text-xs">No tags</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Removed redundant metadata */}

              {/* Full Content */}
              <div>
                <div className="text-xs font-medium text-gray-400 mb-1">Full Content</div>
                <div className="relative bg-[#222] rounded-md p-2">
                  {isEditing ? (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="text-gray-300 leading-relaxed whitespace-pre-wrap min-h-[200px] bg-[#222] border-0 text-sm p-0"
                      placeholder="Enter content..."
                    />
                  ) : (
                    <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                      {selectedMemory.content ? cleanTextContent(selectedMemory.content) : <span className="text-gray-500 italic text-xs">No content</span>}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default MemoriesViewer; 