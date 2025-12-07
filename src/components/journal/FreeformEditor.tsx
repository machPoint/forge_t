import React, { useState, useRef, useEffect, useCallback } from "react";
import { useJournal, JournalEntry } from "@/hooks/useJournal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import JournalRichEditor from "../JournalRichEditor";
import AIPersonaSelector from "../AIPersonaSelector";
import { Star, Trash2, Archive, Pin } from "lucide-react";
import { toast } from "sonner";
import memoryService from "@/lib/memoryService";
import { getPersonaById } from "@/lib/aiPersonas";
import { getAIFeedback } from "@/lib/openai";
import { getIdentityProfile } from "@/lib/identityProfileService";

// Extended memory interface for journal-specific properties
interface JournalMemory {
  id: string;
  title: string;
  content: string;
  source: string;
  journal_id?: string;
  module_id?: string;
}

// Helper function to calculate content similarity using Levenshtein distance
const calculateContentSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  // Simple similarity check - count common words
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 && words2.length === 0) return 1;
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  const similarity = (commonWords.length * 2) / (words1.length + words2.length);
  
  return similarity;
};

interface FreeformEditorProps {
  selectedEntry: JournalEntry;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  setIsGeneratingFeedback: (isGenerating: boolean) => void;
  addFeedback: (entryId: string, feedback: string) => void;
  activePersonaId: string;
  addEntry: (entry: Partial<JournalEntry>) => void;
  onFeedbackRequest?: () => void;
  onSaveToCore?: () => void;
  saveToMemoryRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
  generateFeedbackRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
  deleteEntry?: (id: string) => void;
  toggleStarEntry?: (id: string) => void;
  toggleArchiveEntry?: (id: string) => void;
  togglePinEntry?: (id: string) => void;
}

const FreeformEditor: React.FC<FreeformEditorProps> = ({
  selectedEntry,
  updateEntry,
  setIsGeneratingFeedback,
  addFeedback,
  activePersonaId,
  addEntry,
  onFeedbackRequest,
  onSaveToCore,
  saveToMemoryRef,
  generateFeedbackRef,
  deleteEntry,
  toggleStarEntry,
  toggleArchiveEntry,
  togglePinEntry,
}) => {
  // Initialize with empty strings if selectedEntry properties are undefined
  const [title, setTitle] = useState(selectedEntry?.title || "");
  const [content, setContent] = useState(selectedEntry?.content || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  
  // We'll connect the saveToMemory function to the ref after it's defined

  // Auto-focus logic - ensure selectedEntry is defined
  useEffect(() => {
    if (selectedEntry && titleRef.current) {
      setTitle(selectedEntry.title || "");
      setContent(selectedEntry.content || "");
      setIsEditing(false); // Reset editing state when a new entry is selected
    }
  }, [selectedEntry]);

  // Handle content changes - ensure safe updates
  const handleContentChange = (value: string) => {
    setContent(value);
    if (selectedEntry?.id) {
      updateEntry(selectedEntry.id, { content: value });
    }
  };

  // Handle title changes - ensure safe updates
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (selectedEntry?.id) {
      updateEntry(selectedEntry.id, { title: newTitle });
    }
  };

  // Save the current entry - ensure safe operations
  const handleSave = () => {
    if (selectedEntry?.id) {
      updateEntry(selectedEntry.id, { 
        title: title || "Untitled Entry", 
        content,
        updatedAt: new Date().toISOString()
      });
      toast.success("Entry saved successfully");
    } else {
      // Create a new entry if none is selected
      addEntry({
        title: title || "Untitled Entry",
        content,
        personaId: activePersonaId
      });
      toast.success("New entry created");
    }
  };

  // Save journal entry to core system, updating if it already exists
  const saveToMemory = useCallback(async () => {
    if (!content.trim()) {
      toast.error("No content to save");
      return;
    }

    // No need to check OPAL connection since we're using direct API calls

    setIsSummarizing(true); // Reusing the state variable for the loading indicator

    try {
      // First check if this journal entry was previously saved to core
      let existingMemoryId = null;
      let duplicateMemory = null;
      
      try {
        const allMemories = await memoryService.getMemories({});
        console.log('All memories:', allMemories);
        
        // Look for any memory with matching attributes (client-side filtering)
        if (Array.isArray(allMemories)) {
          // Check for exact journal_id match first
          const matchingMemory = allMemories.find((memory): memory is JournalMemory => 
            memory.source === 'journal' && 
            (memory as JournalMemory).journal_id === selectedEntry?.id
          );
          
          if (matchingMemory) {
            existingMemoryId = matchingMemory.id;
            console.log(`Found existing memory with ID ${existingMemoryId} for journal entry ${selectedEntry?.id}`);
          }
          
          // Check for duplicate content (same title and similar content)
          const currentTitle = (title || "Untitled Entry").trim().toLowerCase();
          const currentContent = content.trim().toLowerCase();
          
          duplicateMemory = allMemories.find(memory => {
            if (memory.source !== 'journal') return false;
            if (memory.id === existingMemoryId) return false; // Skip the exact same entry
            
            const memoryTitle = (memory.title || "").trim().toLowerCase();
            const memoryContent = (memory.content || "").trim().toLowerCase();
            
            // Check for exact title match and very similar content (90% similarity)
            const titleMatch = memoryTitle === currentTitle;
            const contentSimilarity = calculateContentSimilarity(currentContent, memoryContent);
            
            return titleMatch && contentSimilarity > 0.9;
          });
          
          if (duplicateMemory && !existingMemoryId) {
            console.log(`Found duplicate content in memory ID ${duplicateMemory.id}`);
            toast.warning(`This content appears to already exist in Core as "${duplicateMemory.title}"`);
            setIsSummarizing(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error checking for existing memory:', err);
        // Continue with creation even if lookup fails
      }

      // Prepare the memory data
      const memoryData = {
        title: title || "Untitled Entry",
        content: content,
        source: "journal",
        journal_id: selectedEntry?.id,
        tags: [], // Auto-tagging happens on the server side
        summary: "", // Auto-summarization happens on the server side
      };

      // Create or update the memory using API calls
      let result;
      if (existingMemoryId) {
        console.log('Updating memory with params:', memoryData);
        result = await memoryService.updateMemory(existingMemoryId, memoryData);
        console.log('Update result:', result);
      } else {
        console.log('Creating memory with params:', memoryData);
        result = await memoryService.createMemory(memoryData);
        console.log('Create result:', result);
      }

      toast.success(
        existingMemoryId ? 
          "Core entry updated successfully" : 
          "Added to Core successfully"
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error saving to Core:", error);
      toast.error(`Failed to save to Core: ${errorMsg}`);
    } finally {
      setIsSummarizing(false);
    }
  }, [content, title, selectedEntry, setIsSummarizing]);

  // Connect saveToMemory function to the ref so it can be called from parent components
  useEffect(() => {
    if (saveToMemoryRef) {
      // Directly assign the saveToMemory function to the ref
      // This will be called when the Save to Core button is clicked
      saveToMemoryRef.current = saveToMemory;
    }
  }, [saveToMemoryRef, saveToMemory]);

  // Generate AI feedback - now calls OpenAI API
  const generateFeedback = useCallback(async () => {
    console.log('[FreeformEditor] generateFeedback called');
    
    if (!selectedEntry?.id) {
      console.log('[FreeformEditor] No entry selected for feedback');
      toast.error("No entry selected for feedback");
      return;
    }
    
    // Check if content is empty
    if (!content.trim()) {
      console.log('[FreeformEditor] No content to generate feedback on');
      toast.error("No content to generate feedback on");
      return;
    }
    
    console.log('[FreeformEditor] Setting isGeneratingFeedback to true');
    setIsGeneratingFeedback(true);
    
    try {
      // Get the persona prompt
      const persona = getPersonaById(activePersonaId);
      const personaPrompt = persona?.prompt || "";
      console.log('[FreeformEditor] Using persona:', { 
        id: activePersonaId, 
        name: persona?.name,
        promptLength: personaPrompt.length 
      });
      
      // Get the identity profile - must await as it returns a Promise
      let identityProfile = null;
      try {
        identityProfile = await getIdentityProfile();
        console.log('[FreeformEditor] Identity profile:', identityProfile);
        
        // Log detailed personality profile data to verify real values are present
        const pp = identityProfile?.personality_profile;
        console.log('[FreeformEditor] Personality profile data check:', {
          hasPersonalityData: !!pp,
          bigFive: pp?.big_five || pp?.bigFive,
          attachmentStyle: pp?.attachment_style || pp?.attachmentStyle,
          locusOfControl: pp?.locus_of_control || pp?.locusOfControl,
        });
      } catch (identityError) {
        console.error('[FreeformEditor] Error getting identity profile:', identityError);
        // Continue without identity profile
      }
      
      console.log('[FreeformEditor] Generating AI feedback with:', { 
        contentLength: content.length,
        personaId: activePersonaId,
        hasIdentityProfile: !!identityProfile
      });
      
      // Call the OpenAI API to get feedback
      console.log('[FreeformEditor] Calling getAIFeedback...');
      const feedback = await getAIFeedback(content, personaPrompt, identityProfile);
      
      console.log('[FreeformEditor] Received AI feedback:', feedback);
      
      // Add feedback to the entry
      if (selectedEntry?.id) {
        // Ensure feedback is always a string
        const feedbackStr = Array.isArray(feedback) ? feedback.join('\n') : String(feedback);
        console.log('[FreeformEditor] Adding feedback to entry:', { 
          entryId: selectedEntry.id, 
          feedbackLength: feedbackStr.length 
        });
        addFeedback(selectedEntry.id, feedbackStr);
      }
      
      toast.success("AI feedback generated");
      
      // Dispatch event to open the flyout (without regenerating)
      console.log('[FreeformEditor] Dispatching showAIFeedbackFlyout event');
      const event = new CustomEvent('showAIFeedbackFlyout', { 
        detail: { entryId: selectedEntry.id, skipGeneration: true } 
      });
      window.dispatchEvent(event);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error generating AI feedback:", error);
      toast.error(`Failed to generate feedback: ${errorMsg}`);
    } finally {
      console.log('[FreeformEditor] Setting isGeneratingFeedback to false');
      setIsGeneratingFeedback(false);
    }
  }, [content, setIsGeneratingFeedback, activePersonaId, selectedEntry, addFeedback]);
  
  // Connect the generateFeedback function to the ref
  useEffect(() => {
    if (generateFeedbackRef) {
      // This will be called when the AI Feedback button is clicked
      generateFeedbackRef.current = generateFeedback;
    }
  }, [generateFeedbackRef, generateFeedback]);

  return (
    <Card className="h-full flex flex-col shadow-none border-app-border-primary bg-app-bg-primary overflow-hidden" style={{ borderRadius: 0 }}>
      <CardHeader className="p-0 bg-app-bg-secondary border-b border-app-border-primary" style={{ borderRadius: 0 }}>
        <div className="flex items-center justify-between p-4">
          {/* Left Section - Title */}
          <div className="flex-1 mr-4">
            <Input
              ref={titleRef}
              value={title}
              onChange={handleTitleChange}
              placeholder="Entry title..."
              className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 focus:border-app-border-primary focus:outline-none px-0 bg-transparent text-app-text-primary placeholder:text-app-text-tertiary"
              style={{ borderRadius: 0 }}
            />
          </div>
          
          {/* Center Section - Entry Action Buttons */}
          <div className="flex items-center gap-1 mx-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectedEntry?.id && togglePinEntry && togglePinEntry(selectedEntry.id)}
              className={`text-app-text-primary ${selectedEntry?.pinned ? 'text-blue-400 hover:text-blue-500' : 'hover:text-blue-400'} h-8 w-8 p-0`}
              style={{ borderRadius: 0 }}
              aria-label={selectedEntry?.pinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="w-4 h-4" fill={selectedEntry?.pinned ? 'currentColor' : 'none'} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectedEntry?.id && toggleStarEntry && toggleStarEntry(selectedEntry.id)}
              className={`text-app-text-primary ${selectedEntry?.starred ? 'text-yellow-400 hover:text-yellow-500' : 'hover:text-yellow-400'} h-8 w-8 p-0`}
              style={{ borderRadius: 0 }}
              aria-label={selectedEntry?.starred ? 'Unstar' : 'Star'}
            >
              <Star className="w-4 h-4" fill={selectedEntry?.starred ? 'currentColor' : 'none'} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectedEntry?.id && toggleArchiveEntry && toggleArchiveEntry(selectedEntry.id)}
              className="text-app-text-primary hover:text-app-text-secondary h-8 w-8 p-0"
              style={{ borderRadius: 0 }}
              aria-label={selectedEntry?.archived ? 'Unarchive' : 'Archive'}
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectedEntry?.id && deleteEntry && deleteEntry(selectedEntry.id)}
              className="text-app-text-primary hover:text-red-400 h-8 w-8 p-0"
              style={{ borderRadius: 0 }}
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Right Section - Persona Selector */}
          <div className="ml-4">
            <AIPersonaSelector />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto px-3 pt-3 pb-0 flex flex-col">
        <JournalRichEditor 
          content={content} 
          onChange={handleContentChange} 
          placeholder="Start journaling here..."
          className="flex-1"
        />
      </CardContent>
      
      <CardFooter className="flex justify-end border-t border-app-border-primary pt-4 space-x-2">
        <Button variant="outline" onClick={handleSave}>Save</Button>
        <Button variant="outline" onClick={saveToMemory}>Save to Core</Button>
        <Button onClick={generateFeedback}>AI Feedback</Button>
      </CardFooter>
    </Card>
  );
};

export default FreeformEditor;
