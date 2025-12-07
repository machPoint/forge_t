import React, { useState, useEffect, useRef } from "react";
import JournalSidebar from "./JournalSidebar";
import GuidedStepsSidebar from "./journal/GuidedStepsSidebar";
import JournalEditor from "./JournalEditor";
import { useJournal } from "@/hooks/useJournal";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeft } from "lucide-react";

import AppHeader from "./AppHeader";
import { toast } from "sonner";
import TokenManager from "@/auth/TokenManager";

const JournalLayout: React.FC = () => {
  const { currentMode, selectedEntry, fetchEntries, addEntry, updateEntry } = useJournal();
  const [leftPaneCollapsed, setLeftPaneCollapsed] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const saveToMemoryRef = useRef<() => Promise<void>>();
  const generateFeedbackRef = useRef<() => Promise<void>>();

  useEffect(() => {
    // Fetch journal entries when the component mounts with retry logic
    const fetchWithRetry = async () => {
      let retries = 0;
      const maxRetries = 5;
      const retryDelay = 500; // 500ms between retries
      
      const attemptFetch = async () => {
        const token = TokenManager.getToken();
        if (token) {
          console.log('[JournalLayout] Token available, fetching entries');
          await fetchEntries();
          return true;
        }
        
        retries++;
        if (retries < maxRetries) {
          console.log(`[JournalLayout] No token yet, retry ${retries}/${maxRetries} in ${retryDelay}ms`);
          setTimeout(attemptFetch, retryDelay);
          return false;
        } else {
          console.warn('[JournalLayout] Max retries reached, token still not available');
          return false;
        }
      };
      
      await attemptFetch();
    };
    
    fetchWithRetry();
  }, [fetchEntries]);

  // No additional useEffect hooks needed as they're now in AppHeader

  // Custom divider style for subtle, dark lines
  const dividerClass = "w-px bg-gray-700/30";

  const handleNewJournal = () => {
    // Create a new entry using the useJournal hook
    addEntry({
      title: "New Entry",
      content: "",
      personaId: useJournal.getState().activePersonaId
    });
    console.log('New journal entry created from ribbon');
  };

  const handleSave = () => {
    // Save the current entry if one is selected
    if (selectedEntry) {
      updateEntry(selectedEntry.id, {
        title: selectedEntry.title,
        content: selectedEntry.content
      });
      toast.success('Journal entry saved');
      console.log('Entry saved from ribbon');
    } else {
      toast.error('No entry selected to save');
    }
  };
  

  
  const handleSaveToCore = () => {
    console.log('Save to Core requested from ribbon');
    if (!selectedEntry) {
      toast.error('No entry selected to save to Core');
      return;
    }
    
    // Call the saveToMemory function if it's available
    if (saveToMemoryRef.current) {
      saveToMemoryRef.current();
    } else {
      toast.error('Save to Core function not available');
    }
  };

  return (
    <div className="h-full flex flex-col bg-app-bg-primary">
      <div className="flex-1 min-h-0 flex bg-app-bg-primary">
        {/* Sidebar */}
        {!leftPaneCollapsed && (
          <div className="bg-app-bg-primary border-r border-app-border-divider min-w-[220px] max-w-[320px] w-[20%] flex-shrink-0 transition-all duration-200 relative">
            {currentMode === "guided" ? <GuidedStepsSidebar /> : <JournalSidebar />}
            {/* Panel toggle button - inside sidebar at bottom-right */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute bottom-3 right-3 z-10 h-7 w-7 bg-transparent opacity-40 hover:opacity-70 hover:bg-transparent"
              onClick={() => setLeftPaneCollapsed(!leftPaneCollapsed)}
            >
              <PanelLeftClose size={14} className="text-gray-400" />
            </Button>
          </div>
        )}
        {/* Divider */}
        {!leftPaneCollapsed && <div className={dividerClass} />}
        {/* Main Editor */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="h-full bg-app-bg-primary">
            <JournalEditor 
              onFeedbackRequest={() => setShowFeedback(true)}
              onSaveToCore={handleSaveToCore}
              saveToMemoryRef={saveToMemoryRef}
              generateFeedbackRef={generateFeedbackRef}
            />
          </div>
        </div>
      </div>
      
      {/* Panel toggle button - only shown when sidebar is collapsed */}
      {leftPaneCollapsed && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute bottom-3 left-2 z-10 h-7 w-7 bg-transparent opacity-40 hover:opacity-70 hover:bg-transparent"
          onClick={() => setLeftPaneCollapsed(!leftPaneCollapsed)}
        >
          <PanelLeft size={14} className="text-gray-400" />
        </Button>
      )}

      {/* OPAL Settings Modal is now handled by AppHeader */}
    </div>
  );
};

export default JournalLayout;
