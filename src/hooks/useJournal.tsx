import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import AppConfig from '../config/AppConfig';
import TokenManager from '../auth/TokenManager';
import authService from "@/lib/auth-service";
import opal from "@/lib/simple-opal-client";

// Extended memory interface for module-specific properties
interface ModuleMemory {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  module_id?: string;
  journal_id?: string;
}

export type JournalMode = "freeform" | "guided";

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  personaId?: string;
  feedback?: string;
  moduleId?: string;
  moduleStep?: string;
  isComplete?: boolean;
  tags?: string[];
  starred?: boolean;
  archived?: boolean;
  pinned?: boolean;
};

export type StepEntry = {
  content: string;
  lastSaved?: string;
  completed?: boolean;
};

export type ModuleProgress = {
  moduleId: string;
  currentStep: number;
  isComplete: boolean;
  entries: { [stepId: string]: string | StepEntry };
};

type JournalState = {
  entries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  currentMode: JournalMode;
  activePersonaId: string;
  moduleProgress: { [moduleId: string]: ModuleProgress };
  activeModuleId: string | null;
  isGeneratingFeedback: boolean;
  loadAllModuleProgress: () => Promise<void>;
  fetchEntries: () => Promise<void>;
  addEntry: (entry: Partial<JournalEntry>) => Promise<void>;
  createEntry: (entry: Partial<JournalEntry>) => Promise<JournalEntry>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleStarEntry: (id: string) => Promise<void>;
  toggleArchiveEntry: (id: string) => Promise<void>;
  togglePinEntry: (id: string) => Promise<void>;
  setSelectedEntry: (entry: JournalEntry | null) => void;
  setCurrentMode: (mode: JournalMode) => void;
  setActivePersonaId: (id: string) => void;
  setActiveModuleId: (id: string | null) => void;
  clearActiveModule: () => void;
  updateModuleProgress: (moduleId: string, updates: Partial<ModuleProgress>) => void;
  startNewModuleSession: (moduleId: string) => void;
  setIsGeneratingFeedback: (isGenerating: boolean) => void;
  addFeedback: (entryId: string, feedback: string) => Promise<void>;
  saveCompletedModuleToCore: (moduleId: string) => Promise<void>;
  resetModuleProgress: (moduleId: string) => Promise<void>;
};

// Use centralized configuration for API URL - lazy loaded
const getApiUrl = () => {
  try {
    return AppConfig.apiUrl;
  } catch (error) {
    console.warn('[useJournal] AppConfig not ready, using fallback URL');
    return 'http://localhost:3000/journal';
  }
};

export const useJournal = create<JournalState>((set, get) => ({
  entries: [],
  selectedEntry: null,
  currentMode: "freeform",
  activePersonaId: "supportive",
  moduleProgress: {},
  activeModuleId: null,
  isGeneratingFeedback: false,

  // Load all module progress on initialization
  loadAllModuleProgress: async () => {
    try {
      if (opal.ready()) {
        console.log('[useJournal] Loading all module progress from OPAL');
        const allProgress = await opal.callTool('getAllModuleProgress', {});
        
        if (allProgress && Array.isArray(allProgress)) {
          const progressMap: { [moduleId: string]: ModuleProgress } = {};
          allProgress.forEach((progress: ModuleProgress) => {
            progressMap[progress.moduleId] = progress;
          });
          
          console.log('[useJournal] Loaded module progress:', progressMap);
          set({ moduleProgress: progressMap });
        }
      }
    } catch (error) {
      console.error('[useJournal] Error loading module progress:', error);
    }
  },

  fetchEntries: async () => {
    try {
      const token = TokenManager.getToken();
      if (!token) {
        console.warn("No authentication token available");
        return;
      }
      
      const response = await fetch(`${getApiUrl()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const entries = await response.json();
      
      // Auto-select the first entry if no entry is currently selected and entries exist
      set((state) => ({
        entries,
        selectedEntry: !state.selectedEntry && entries.length > 0 ? entries[0] : state.selectedEntry,
      }));
      
      console.log(`Fetched ${entries.length} entries via API`);
    } catch (error) {
      console.error("Failed to fetch entries via API:", error);
    }
  },

  addEntry: async (entry) => {
    try {
      const token = TokenManager.getToken();
      if (!token) {
        console.warn("No authentication token available");
        toast.error("Authentication required");
        return;
      }
      
      const response = await fetch(`${getApiUrl()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: entry.title || "Untitled Entry",
          content: entry.content || "",
          moduleId: entry.moduleId,
          moduleStep: entry.moduleStep,
          tags: entry.tags
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const newEntry = await response.json();
      
      set((state) => ({
        entries: [newEntry, ...state.entries],
        selectedEntry: newEntry,
      }));
      
      console.log("Entry created via API:", newEntry.id);
    } catch (error) {
      console.error("Failed to add entry via API:", error);
      toast.error("Failed to create entry");
    }
  },

  createEntry: async (entry) => {
    try {
      const token = TokenManager.getToken();
      if (!token) {
        console.warn("No authentication token available");
        throw new Error("Authentication required");
      }
      
      const response = await fetch(`${getApiUrl()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: entry.title || "Untitled Entry",
          content: entry.content || "",
          moduleId: entry.moduleId,
          moduleStep: entry.moduleStep,
          tags: entry.tags,
          createdAt: entry.createdAt, // Include original date for imports
          updatedAt: entry.updatedAt  // Include original updated date if provided
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const newEntry = await response.json();
      
      set((state) => ({
        entries: [newEntry, ...state.entries],
        selectedEntry: newEntry,
      }));
      
      console.log("Entry created via API:", newEntry.id);
      return newEntry;
    } catch (error) {
      console.error("Failed to create entry via API:", error);
      throw error;
    }
  },

  updateEntry: async (id, updates) => {
    try {
      const token = TokenManager.getToken();
      if (!token) {
        console.warn("No authentication token available");
        toast.error("Authentication required");
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const updatedEntry = await response.json();
      
      set((state) => ({
        entries: state.entries.map((e) => e.id === id ? updatedEntry : e),
        selectedEntry: state.selectedEntry?.id === id ? updatedEntry : state.selectedEntry,
      }));
      
      console.log("Entry updated via API:", id);
    } catch (error) {
      console.error("Failed to update entry via API:", error);
      toast.error("Failed to update entry");
    }
  },

  deleteEntry: async (id) => {
    try {
      const token = TokenManager.getToken();
      if (!token) {
        console.warn("No authentication token available");
        toast.error("Authentication required");
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        selectedEntry: state.selectedEntry?.id === id ? null : state.selectedEntry,
      }));
      
      console.log("Entry deleted via API:", id);
      toast.success("Entry deleted");
    } catch (error) {
      console.error("Failed to delete entry via API:", error);
      toast.error("Failed to delete entry");
    }
  },

  addFeedback: async (entryId, feedback) => {
    try {
      console.log('[useJournal] Adding feedback to entry:', { entryId, feedbackLength: feedback.length });
      
      // Update the entry in the local state
      set(state => ({
        entries: state.entries.map(e => 
          e.id === entryId ? { ...e, feedback } : e
        ),
        // Also update selectedEntry if it's the one being modified
        selectedEntry: state.selectedEntry?.id === entryId 
          ? { ...state.selectedEntry, feedback } 
          : state.selectedEntry
      }));
      
      // Optional: Save to backend or persistent storage
      // This could be added if needed
      
      toast.success("AI feedback added");
    } catch (error) {
      console.error('[useJournal] Error adding feedback:', error);
      toast.error("Failed to add feedback");
    }
  },

  toggleStarEntry: async (id) => {
    try {
      const entry = get().entries.find(e => e.id === id);
      if (!entry) return;
      
      const isStarred = !entry.starred;
      
      const token = TokenManager.getToken();
      if (!token) {
        console.warn("No authentication token available, updating local state only");
        set(state => ({
          entries: state.entries.map(e => 
            e.id === id ? { ...e, starred: isStarred } : e
          ),
          selectedEntry: state.selectedEntry?.id === id 
            ? { ...state.selectedEntry, starred: isStarred } 
            : state.selectedEntry
        }));
        toast.success(isStarred ? "Entry starred" : "Entry unstarred");
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ starred: isStarred })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const updatedEntry = await response.json();
      
      set(state => ({
        entries: state.entries.map(e => 
          e.id === id ? updatedEntry : e
        ),
        selectedEntry: state.selectedEntry?.id === id 
          ? updatedEntry
          : state.selectedEntry
      }));
      
      toast.success(isStarred ? "Entry starred" : "Entry unstarred");
    } catch (error) {
      console.error('Failed to toggle star status:', error);
      toast.error("Failed to update entry");
    }
  },

  toggleArchiveEntry: async (id) => {
    try {
      const entry = get().entries.find(e => e.id === id);
      if (!entry) return;
      
      const isArchived = !entry.archived;
      
      const token = TokenManager.getToken();
      if (!token) {
        console.warn("No authentication token available, updating local state only");
        set(state => ({
          entries: state.entries.map(e => 
            e.id === id ? { ...e, archived: isArchived } : e
          ),
          selectedEntry: state.selectedEntry?.id === id 
            ? { ...state.selectedEntry, archived: isArchived } 
            : state.selectedEntry
        }));
        toast.success(isArchived ? "Entry archived" : "Entry unarchived");
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ archived: isArchived })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const updatedEntry = await response.json();
      
      set(state => ({
        entries: state.entries.map(e => 
          e.id === id ? updatedEntry : e
        ),
        selectedEntry: state.selectedEntry?.id === id 
          ? updatedEntry
          : state.selectedEntry
      }));
      
      toast.success(isArchived ? "Entry archived" : "Entry unarchived");
    } catch (error) {
      console.error('Failed to toggle archive status:', error);
      toast.error("Failed to update entry");
    }
  },

  togglePinEntry: async (id) => {
    try {
      const entry = get().entries.find(e => e.id === id);
      if (!entry) return;
      
      const isPinned = !entry.pinned;
      
      const token = TokenManager.getToken();
      if (!token) {
        console.warn("No authentication token available, updating local state only");
        set(state => ({
          entries: state.entries.map(e => 
            e.id === id ? { ...e, pinned: isPinned } : e
          ),
          selectedEntry: state.selectedEntry?.id === id 
            ? { ...state.selectedEntry, pinned: isPinned } 
            : state.selectedEntry
        }));
        toast.success(isPinned ? "Entry pinned" : "Entry unpinned");
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pinned: isPinned })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const updatedEntry = await response.json();
      
      set(state => ({
        entries: state.entries.map(e => 
          e.id === id ? updatedEntry : e
        ),
        selectedEntry: state.selectedEntry?.id === id 
          ? updatedEntry
          : state.selectedEntry
      }));
      
      toast.success(isPinned ? "Entry pinned" : "Entry unpinned");
    } catch (error) {
      console.error('Failed to toggle pin status:', error);
      toast.error("Failed to update entry");
    }
  },

  setSelectedEntry: (entry) => set({ selectedEntry: entry }),
  setCurrentMode: (mode) => set({ currentMode: mode }),
  setActivePersonaId: (id) => set({ activePersonaId: id }),
  setActiveModuleId: (id) => set({ activeModuleId: id }),
  
  clearActiveModule: () => set({ 
    activeModuleId: null, 
    currentMode: "freeform" 
  }),
  updateModuleProgress: async (moduleId, updates) => {
    // First update local state for immediate UI feedback
    set((state) => ({
      moduleProgress: {
        ...state.moduleProgress,
        [moduleId]: {
          moduleId,
          currentStep: 0,
          isComplete: false,
          entries: {},
          ...state.moduleProgress[moduleId],
          ...updates,
        },
      },
    }));
    
    const currentProgress = get().moduleProgress[moduleId];
    if (!currentProgress) {
      console.error('[updateModuleProgress] No current progress found for module:', moduleId);
      return;
    }
    
    // Combine current progress with updates
    const updatedProgress = {
      ...currentProgress,
      ...updates,
    };
    
    // Save to both storage systems for unified experience
    try {
      // 1. Save to OPAL (module progress tracking)
      if (opal.ready()) {
        await opal.callTool('saveModuleProgress', {
          moduleId,
          currentStep: updatedProgress.currentStep,
          isComplete: updatedProgress.isComplete,
          entries: updatedProgress.entries || {}
        });
        console.log("Module progress saved via OPAL");
      } else {
        console.warn("OPAL not ready, module progress will not be persisted");
      }
      
      // Module entries should be kept separate from journal entries
      // They are already saved via saveModuleProgress above
      console.log("Module progress saved successfully. Module entries are kept separate from journal entries.");
      
    } catch (error) {
      console.error("Failed to save module progress:", error);
      toast.error("Failed to save progress");
    }
  },
  startNewModuleSession: async (moduleId) => {
    console.log(`[startNewModuleSession] Starting session for module: ${moduleId}`);
    
    // First check if we already have progress in local state
    const currentProgress = get().moduleProgress[moduleId];
    console.log(`[startNewModuleSession] Current progress check:`, {
      moduleId,
      hasProgress: !!currentProgress,
      progressData: currentProgress,
      entriesCount: currentProgress ? Object.keys(currentProgress.entries || {}).length : 0
    });
    
    if (currentProgress) {
      console.log(`[startNewModuleSession] Using existing local progress for ${moduleId}:`, currentProgress);
      set({
        activeModuleId: moduleId,
        currentMode: "guided",
      });
      return;
    }
    
    // Try to fetch from OPAL server with timeout handling
    try {
      if (opal.ready()) {
        console.log(`[startNewModuleSession] Fetching progress from OPAL for ${moduleId}`);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OPAL timeout')), 5000)
        );
        
        const progress = await Promise.race([
          opal.callTool('getModuleProgressById', { moduleId }),
          timeoutPromise
        ]);
        
        // If we found existing progress, use it (even if entries is empty but progress exists)
        if (progress) {
          console.log(`[startNewModuleSession] Found existing progress from OPAL:`, progress);
          set({
            activeModuleId: moduleId,
            currentMode: "guided",
            moduleProgress: {
              ...get().moduleProgress,
              [moduleId]: progress,
            },
          });
          return;
        } else {
          console.log(`[startNewModuleSession] No progress found from OPAL for ${moduleId}`);
        }
      } else {
        console.log(`[startNewModuleSession] OPAL not ready, creating local progress`);
      }
    } catch (error) {
      console.error(`[startNewModuleSession] Error fetching module progress for ${moduleId}:`, error);
      console.log(`[startNewModuleSession] Falling back to local progress creation`);
    }
    
    // Only create new progress if we truly have none
    console.log(`[startNewModuleSession] Creating new progress for ${moduleId}`);
    const newProgress = {
      moduleId,
      currentStep: 0,
      isComplete: false,
      entries: {},
    };
    
    // Update local state
    set({
      activeModuleId: moduleId,
      currentMode: "guided",
      moduleProgress: {
        ...get().moduleProgress,
        [moduleId]: newProgress,
      },
    });
    
    // Try to persist to backend using Opal
    try {
      if (opal.ready()) {
        await opal.callTool('saveModuleProgress', {
          moduleId,
          currentStep: newProgress.currentStep,
          isComplete: newProgress.isComplete,
          entries: newProgress.entries || {}
        });
        console.log("New module progress saved via OPAL");
      }
    } catch (error) {
      console.error("Failed to save new module progress:", error);
      // Continue with local state only if backend save fails
    }
  },
  setIsGeneratingFeedback: (isGenerating) => set({ isGeneratingFeedback: isGenerating }),
  
  saveCompletedModuleToCore: async (moduleId: string) => {
    try {
      const state = get();
      const progress = state.moduleProgress[moduleId];
      
      if (!progress || !progress.isComplete) {
        toast.error("Module must be completed before saving to Core");
        return;
      }
      
      // Get module definition to access step titles and descriptions
      const { useModules } = await import("@/hooks/useModules");
      const { getModuleById } = useModules.getState();
      const module = getModuleById(moduleId);
      
      if (!module) {
        toast.error("Module not found");
        return;
      }
      
      // Import memoryService at the top level so it's available throughout the function
      const memoryService = (await import("@/lib/memoryService")).default;
      
      // Format the content by combining all step entries
      let formattedContent = `# ${module.title}\n\n`;
      formattedContent += `${module.description}\n\n`;
      formattedContent += `**Category:** ${module.category}\n\n`;
      formattedContent += `**Completed on:** ${new Date().toLocaleDateString()}\n\n`;
      formattedContent += `---\n\n`;
      
      // Add each step's content
      module.steps.forEach((step, index) => {
        const stepEntry = progress.entries[step.id];
        let stepContent = '';
        
        // Handle both string and StepEntry formats
        if (typeof stepEntry === 'string') {
          stepContent = stepEntry;
        } else if (stepEntry && typeof stepEntry === 'object' && 'content' in stepEntry) {
          stepContent = stepEntry.content;
        }
        
        if (stepContent) {
          formattedContent += `## Step ${index + 1}: ${step.title}\n\n`;
          formattedContent += `*${step.description}*\n\n`;
          formattedContent += `**Prompt:** ${step.prompt}\n\n`;
          formattedContent += `**Response:**\n${stepContent}\n\n`;
          formattedContent += `---\n\n`;
        }
      });
      
      // Check if this module session was previously saved to core
      let existingMemoryId = null;
      
      try {
        const allMemories = await memoryService.getMemories({});
        
        if (Array.isArray(allMemories)) {
          const matchingMemory = allMemories.find((memory): memory is ModuleMemory => 
            memory.source === 'guided-module' && 
            (memory as ModuleMemory).module_id === moduleId
          );
          
          if (matchingMemory) {
            existingMemoryId = matchingMemory.id;
            console.log(`Found existing memory with ID ${existingMemoryId} for module ${moduleId}`);
          }
        }
      } catch (err) {
        console.error('Error checking for existing memory:', err);
        // Continue with creation even if lookup fails
      }

      // Prepare the memory data using the same format as journal entries
      const memoryData = {
        title: `${module.title} - Completed Session`,
        content: formattedContent,
        source: "guided-module",
        module_id: moduleId,
        tags: [module.category.toLowerCase().replace(/\s+/g, '-'), 'guided-module', moduleId],
        summary: "", // Auto-summarization happens on the server side
      };

      // Create or update the memory using API calls
      let result;
      if (existingMemoryId) {
        console.log('Updating memory with params:', memoryData);
        result = await memoryService.updateMemory(existingMemoryId, memoryData);
      } else {
        console.log('Creating memory with params:', memoryData);
        result = await memoryService.createMemory(memoryData);
      }
      console.log('Memory operation result:', result);

      toast.success(
        existingMemoryId ? 
          "Core entry updated successfully" : 
          `"${module.title}" session saved to Core successfully!`
      );
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Failed to save module to Core:", error);
      toast.error(`Failed to save to Core: ${errorMsg}`);
    }
  },
  
  resetModuleProgress: async (moduleId: string) => {
    try {
      console.log(`[resetModuleProgress] Resetting progress for module: ${moduleId}`);
      
      // Remove from local state
      set((state) => {
        const newModuleProgress = { ...state.moduleProgress };
        delete newModuleProgress[moduleId];
        return {
          moduleProgress: newModuleProgress,
          // If this is the active module, clear it
          activeModuleId: state.activeModuleId === moduleId ? null : state.activeModuleId,
          currentMode: state.activeModuleId === moduleId ? "freeform" : state.currentMode
        };
      });
      
      // Delete from backend
      try {
        if (opal.ready()) {
          await opal.callTool('deleteModuleProgress', { moduleId });
          console.log(`Module progress deleted from backend for ${moduleId}`);
        }
      } catch (error) {
        console.warn(`Failed to delete module progress from backend: ${error instanceof Error ? error.message : String(error)}`);
        // Continue anyway since local state was cleared
      }
      
      toast.success("Module progress reset successfully");
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Failed to reset module progress:", error);
      toast.error(`Failed to reset module: ${errorMsg}`);
    }
  },
}));
