import React, { useState, useEffect } from "react";
import JournalLayout from "@/components/JournalLayout";
import { useJournal } from "@/hooks/useJournal";
import { useAuth } from "@/hooks/useAuth";
import opal from '@/lib/simple-opal-client';
import authService from '@/lib/auth-service';
import { useLocation, useParams } from 'react-router-dom';

const JournalPage: React.FC = () => {
  const { setCurrentMode, activeModuleId, setSelectedEntry, entries, fetchEntries, startNewModuleSession, loadAllModuleProgress } = useJournal();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const { moduleId } = useParams();
  
  // Set appropriate mode based on URL params and location state
  useEffect(() => {
    // If we have a moduleId in the URL, this is a guided module route
    if (moduleId) {
      console.log(`[JournalPage] Module route detected: ${moduleId}`);
      startNewModuleSession(moduleId);
      setCurrentMode("guided");
      return;
    }
    
    // Check if we have location state with forceGuidedMode flag or resetMode flag
    const locationState = location.state as { 
      forceGuidedMode?: boolean, 
      resetMode?: boolean,
      selectedDate?: string 
    } | null;
    const forceGuidedMode = locationState?.forceGuidedMode;
    const resetMode = locationState?.resetMode;
    const selectedDate = locationState?.selectedDate;
    
    // If resetMode is true, always set to freeform mode regardless of activeModuleId
    if (resetMode) {
      setCurrentMode("freeform");
      
      // If we have a selected date from the home page calendar, find and select an entry for that date
      if (selectedDate && entries.length > 0) {
        const targetDate = new Date(selectedDate);
        const targetDateString = targetDate.toDateString();
        
        // Find entries for the selected date
        const dateEntries = entries.filter(entry => {
          const entryDate = new Date(entry.createdAt).toDateString();
          return entryDate === targetDateString;
        });
        
        if (dateEntries.length > 0) {
          // Select the first entry for that date
          setSelectedEntry(dateEntries[0]);
        }
      }
      return;
    }
    
    // If forceGuidedMode is explicitly true, set to guided mode
    // Otherwise, when navigating to /journal directly, always default to freeform mode
    if (forceGuidedMode) {
      setCurrentMode("guided");
    } else {
      // Default to freeform mode when navigating to /journal
      setCurrentMode("freeform");
    }
  }, [setCurrentMode, activeModuleId, location.key, location.state, setSelectedEntry, entries, moduleId, startNewModuleSession]);

  // Fetch entries when component mounts
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Initialize OPAL connection with JWT token when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const accessToken = authService.getAccessToken();
      if (accessToken) {
        // Set the JWT token for OPAL connection
        opal.setToken(accessToken);
        opal.autoConnect();
        
        // Load all module progress after OPAL connection is established
        setTimeout(() => {
          loadAllModuleProgress();
        }, 1000); // Give OPAL time to connect
      }
    } else {
      // Disconnect OPAL if user is not authenticated
      opal.disconnect();
    }
  }, [isAuthenticated, user, loadAllModuleProgress]);

  return <JournalLayout />;
};

export default JournalPage;
