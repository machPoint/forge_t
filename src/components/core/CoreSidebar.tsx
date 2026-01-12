import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Calendar, Tag, Trash2, RefreshCw, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Spinner from '../ui/spinner';

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

interface CoreSidebarProps {
  memories?: CoreEntry[];
  selectedMemoryId?: string | null;
  onMemorySelect?: (memoryId: string) => void;
  showArchived?: boolean;
  onToggleArchived?: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  selectedTags?: string[];
}

const CoreSidebar: React.FC<CoreSidebarProps> = ({ 
  memories = [], 
  selectedMemoryId, 
  onMemorySelect,
  showArchived = false,
  onToggleArchived,
  isLoading = false,
  onRefresh,
  selectedTags = []
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCore, setSelectedCore] = useState<string | null>(selectedMemoryId || null);

  useEffect(() => {
    setSelectedCore(selectedMemoryId || null);
  }, [selectedMemoryId]);

  // Filter core entries based on search term and selected tags
  const filteredCoreEntries = memories.filter(entry => {
    // First filter by search term
    const matchesSearch = 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Then filter by selected tags (if any)
    const matchesTags = 
      selectedTags.length === 0 || 
      selectedTags.every(tag => entry.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeIcon = (type: CoreEntry['type']) => {
    switch (type) {
      case 'journal': return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
          <path d="M12 3H19V21H5V3H12Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 8H15" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 12H15" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 16H13" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
      case 'note': return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 8H16" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 16H12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
      case 'summary': return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 16V12H8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
      default: return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="8" r="1" fill="currentColor" />
          <path d="M12 11V16" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    }
  };

  const getTypeColor = (type: CoreEntry['type']) => {
    // Using grayscale colors with varying brightnesses
    switch (type) {
      case 'journal': return 'bg-gray-700/20 text-gray-300';
      case 'note': return 'bg-gray-600/20 text-gray-400';
      case 'summary': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-gray-400/20 text-gray-600';
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center ml-auto gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleArchived}
              className={showArchived ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-muted-foreground hover:text-sidebar-foreground'}
            >
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search core entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus-visible:ring-zinc-600"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              <Spinner size="lg" className="mx-auto mb-2" />
              Loading core entries...
            </div>
          ) : filteredCoreEntries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground/50 mx-auto mb-2">
                <path d="M7 8H17L19 12H5L7 8Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 3H16L17 8H7L8 3Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 12H19L18 17H6L5 12Z" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="17" width="6" height="4" stroke="currentColor" strokeWidth="1.5" />
                <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {searchTerm ? 'No core entries found' : 'No core entries stored yet'}
            </div>
          ) : (
            filteredCoreEntries.map((entry) => (
              <Card
                key={entry.id}
                className={`cursor-pointer transition-all hover:bg-sidebar-accent border-sidebar-border ${
                  selectedCore === entry.id ? 'bg-sidebar-accent border-primary/50' : 'bg-sidebar-card/50'
                }`}
                onClick={() => {
                  setSelectedCore(entry.id);
                  onMemorySelect?.(entry.id);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{getTypeIcon(entry.type)}</span>
                      <CardTitle className="text-sm text-sidebar-foreground line-clamp-1">
                        {entry.title}
                      </CardTitle>
                      {entry.starred && (
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      )}
                    </div>
                    <Badge className={`text-xs ${getTypeColor(entry.type)}`}>
                      {entry.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {entry.summary}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mb-2">
                    <Calendar className="w-3 h-3" />
                    {formatDate(entry.createdAt)}
                  </div>
                  
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs px-1 py-0 text-muted-foreground border-sidebar-border"
                        >
                          <Tag className="w-2 h-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {entry.tags.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 text-muted-foreground border-sidebar-border"
                        >
                          +{entry.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CoreSidebar;
