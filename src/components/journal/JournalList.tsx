/**
 * JournalList Component
 * 
 * Displays a list of journal entries with search, filtering, and sorting capabilities.
 * Supports different view modes and entry management actions.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Clock,
  SortAsc,
  SortDesc,
  Grid,
  List
} from 'lucide-react';
import { JournalEntry } from './JournalEditor';
import { getContentConfig } from '../../config/content.config';
import { getThemeConfig } from '../../config/theme.config';
import Spinner from '../ui/spinner';

interface JournalListProps {
  entries: JournalEntry[];
  selectedEntry?: JournalEntry;
  onSelectEntry: (entry: JournalEntry) => void;
  onEditEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entry: JournalEntry) => void;
  onCreateNew: () => void;
  loading?: boolean;
  className?: string;
}

type SortOption = 'newest' | 'oldest' | 'title' | 'wordCount';
type ViewMode = 'list' | 'grid';

export const JournalList: React.FC<JournalListProps> = ({
  entries,
  selectedEntry,
  onSelectEntry,
  onEditEntry,
  onDeleteEntry,
  onCreateNew,
  loading = false,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const contentConfig = getContentConfig();
  const themeConfig = getThemeConfig();

  // Get all unique tags from entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(entry => {
      entry.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  // Filter and sort entries
  const filteredAndSortedEntries = useMemo(() => {
    let filtered = entries;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(query) ||
        (entry.content || '').toLowerCase().includes(query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(entry =>
        selectedTags.every(tag => entry.tags.includes(tag))
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.updatedAt || b.createdAt || 0).getTime() - 
                 new Date(a.updatedAt || a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - 
                 new Date(b.createdAt || 0).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'wordCount': {
          const aWords = (a.content || '').split(/\s+/).filter(w => w.length > 0).length;
          const bWords = (b.content || '').split(/\s+/).filter(w => w.length > 0).length;
          return bWords - aWords;
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [entries, searchQuery, selectedTags, sortBy]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getWordCount = (content: string) => {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  const getContentPreview = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const EntryCard: React.FC<{ entry: JournalEntry }> = ({ entry }) => {
    const isSelected = selectedEntry?.id === entry.id;
    const wordCount = getWordCount(entry.content);

    return (
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => onSelectEntry(entry)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate" title={entry.title}>
                {entry.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(entry.updatedAt || entry.createdAt)}</span>
                <Separator orientation="vertical" className="h-3" />
                <FileText className="h-3 w-3" />
                <span>{wordCount} words</span>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEditEntry(entry);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEntry(entry);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Content Preview */}
          <p className="text-sm text-muted-foreground mb-3">
            {getContentPreview(entry.content, 300)}
          </p>
          
          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries by title, content, or tags..."
            className="pl-10"
          />
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Tag Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {allTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className="flex items-center gap-2"
                  >
                    <div className={`h-3 w-3 rounded border ${
                      selectedTags.includes(tag) ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`} />
                    {tag}
                  </DropdownMenuItem>
                ))}
                {selectedTags.length > 0 && (
                  <>
                    <Separator />
                    <DropdownMenuItem onClick={() => setSelectedTags([])}>
                      Clear filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="wordCount">Word count</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            {/* New Entry Button */}
            <Button onClick={onCreateNew} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {selectedTags.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Entries List/Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Spinner size="lg" className="mx-auto mb-2" />
            Loading entries...
          </div>
        ) : filteredAndSortedEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            {entries.length === 0 ? (
              <div>
                <p className="mb-2">No journal entries yet</p>
                <Button onClick={onCreateNew} variant="outline">
                  Create your first entry
                </Button>
              </div>
            ) : (
              <p>No entries match your search criteria</p>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }>
            {filteredAndSortedEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredAndSortedEntries.length > 0 && (
        <div className="text-sm text-muted-foreground text-center pt-4 border-t">
          Showing {filteredAndSortedEntries.length} of {entries.length} entries
        </div>
      )}
    </div>
  );
};

export default JournalList;
