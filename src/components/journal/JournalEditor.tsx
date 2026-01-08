/**
 * JournalEditor Component
 * 
 * A rich text editor for creating and editing journal entries with support for
 * templates, tags, and real-time saving.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Tag, 
  Calendar, 
  FileText, 
  Sparkles, 
  X,
  Plus,
  Clock
} from 'lucide-react';
import { getBrandConfig } from '../../config/brand.config';
import { getThemeConfig } from '../../config/theme.config';
import { isFeatureEnabled } from '../../config/features.config';
import { getContentConfig, JournalTemplate } from '../../config/content.config';

export interface JournalEntry {
  id?: string;
  title: string;
  content: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
  templateId?: string;
}

interface JournalEditorProps {
  entry?: JournalEntry;
  template?: JournalTemplate;
  onSave: (entry: JournalEntry) => Promise<void>;
  onCancel?: () => void;
  autoSave?: boolean;
  className?: string;
  onSaveToCore?: () => void;
  onFeedbackRequest?: () => void;
  saveToMemoryRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
  generateFeedbackRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  template,
  onSave,
  onCancel,
  autoSave = true,
  className = '',
  onSaveToCore,
  onFeedbackRequest,
  saveToMemoryRef,
  generateFeedbackRef
}) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const brandConfig = getBrandConfig();
  const themeConfig = getThemeConfig();
  const contentConfig = getContentConfig();
  const aiEnabled = isFeatureEnabled('ai', 'feedback');

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const entryToSave: JournalEntry = {
        ...entry,
        title: title || 'Untitled Entry',
        content,
        tags,
        templateId: template?.id,
        updatedAt: new Date()
      };

      if (!entry?.id) {
        entryToSave.createdAt = new Date();
      }

      await onSave(entryToSave);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save entry:', error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, entry, title, content, tags, template?.id, onSave]);

  // Expose save function to parent via ref if provided
  useEffect(() => {
    if (saveToMemoryRef) {
      // @ts-ignore
      saveToMemoryRef.current = async () => {
        if (onSaveToCore) onSaveToCore();
      };
    }
    if (generateFeedbackRef) {
      // @ts-ignore
      generateFeedbackRef.current = async () => {
        if (onFeedbackRequest) onFeedbackRequest();
      };
    }
  }, [saveToMemoryRef, generateFeedbackRef, onSaveToCore, onFeedbackRequest]);

  // Listen for custom events from TopNavigation
  useEffect(() => {
    const handleTriggerSave = () => handleSave();
    const handleTriggerSaveToCore = () => {
        if (onSaveToCore) onSaveToCore();
    };
    const handleTriggerAiFeedback = () => {
        if (onFeedbackRequest) onFeedbackRequest();
    };

    window.addEventListener('trigger-save-entry', handleTriggerSave);
    window.addEventListener('trigger-save-to-core', handleTriggerSaveToCore);
    window.addEventListener('trigger-ai-feedback', handleTriggerAiFeedback);

    return () => {
      window.removeEventListener('trigger-save-entry', handleTriggerSave);
      window.removeEventListener('trigger-save-to-core', handleTriggerSaveToCore);
      window.removeEventListener('trigger-ai-feedback', handleTriggerAiFeedback);
    };
  }, [handleSave, onSaveToCore, onFeedbackRequest]);


  // Auto-save functionality
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && (title || content)) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSave(true);
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, tags, hasUnsavedChanges, autoSave, handleSave]);

  // Mark changes as unsaved when content changes
  useEffect(() => {
    if (entry) {
      const hasChanges = 
        title !== entry.title ||
        content !== entry.content ||
        JSON.stringify(tags) !== JSON.stringify(entry.tags);
      setHasUnsavedChanges(hasChanges);
    } else {
      setHasUnsavedChanges(title.length > 0 || content.length > 0);
    }
  }, [title, content, tags, entry]);

  // Apply template if provided
  useEffect(() => {
    if (template && !entry) {
      // Generate content from template prompts
      const templateContent = template.prompts
        .map(prompt => `**${prompt.question}**\n${prompt.placeholder || ''}\n\n`)
        .join('');
      
      setContent(templateContent);
      setTitle(template.name);
      if (template.tags) {
        setTags([...template.tags]);
      }
    }
  }, [template, entry]);



  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  const getSaveButtonText = () => {
    if (isSaving) return 'Saving...';
    if (hasUnsavedChanges) return 'Save';
    return 'Saved';
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className="space-y-4">
        {/* Title Input */}
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your journal title..."
            className="text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
            style={{ fontFamily: themeConfig.fonts.journal }}
          />
        </div>

        {/* Tags Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="h-4 w-4" />
            <span>Tags</span>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
            
            <div className="flex items-center gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag..."
                className="w-24 h-6 text-xs"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddTag}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <Separator />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content Editor */}
        <div className="space-y-2">
          <Textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={template ? 
              "Follow the template prompts above or write freely..." : 
              "Start writing your thoughts..."
            }
            className="min-h-[400px] resize-none border-none shadow-none px-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
            style={{ fontFamily: themeConfig.fonts.journal }}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {/* Last Saved Indicator */}
            {lastSaved && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
            
            {/* Word Count */}
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
            </div>

            {/* Template Info */}
            {template && (
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                <span>{template.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* AI Feedback Button */}
            {aiEnabled && content.trim() && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  // TODO: Implement AI feedback
                  console.log('AI feedback requested');
                }}
              >
                <Sparkles className="h-4 w-4" />
                Get AI Feedback
              </Button>
            )}

            {/* Cancel Button */}
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}

            {/* Save Button */}
            <Button
              onClick={() => handleSave()}
              disabled={isSaving || (!hasUnsavedChanges && !!entry)}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {getSaveButtonText()}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JournalEditor;
