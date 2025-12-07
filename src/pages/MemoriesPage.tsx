import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CoreSidebar from "@/components/core/CoreSidebar";
import CoreViewer from "@/components/core/CoreViewer";
import CoreInsights from "@/components/core/CoreInsights";
import MemoriesVisualizations from "@/components/memories/MemoriesVisualizations";
import ChatInterface from "@/components/chat/ChatInterface";
import TagFilter from "@/components/memories/TagFilter";
import { ThemeToggle } from "@/components/ThemeToggle";
import OpalSettings from "@/components/OpalSettings";
import memoryService from "@/lib/memoryService";
import { getAIFeedback } from "@/lib/openai";
import { Eye, BarChart3, ChartBar, Plus, Wifi, WifiOff, Settings, PanelLeft, PanelLeftClose, Hammer, MessageCircle, Wrench } from "lucide-react";
import AddMemoryModal from "@/components/AddMemoryModal";
import MainNavigation from "@/components/MainNavigation";
import UserProfile from "@/components/UserProfile";
import opal from "@/lib/simple-opal-client";

interface OpalMemory {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags?: string[] | string;
  created_at?: string;
  createdAt?: string;
  timestamp?: string;
  source?: string;
  type?: string;
  is_starred?: boolean;
  isStarred?: boolean;
  is_archived?: boolean;
  isArchived?: boolean;
  metadata?: {
    summary?: string;
  };
}

interface MemoryApiResponse {
  memories: OpalMemory[];
}

interface Memory {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source: string;
  type: 'journal' | 'note' | 'summary';
  starred?: boolean;
  archived?: boolean;
}

const MemoriesPage: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("viewer");
  const [opalStatus, setOpalStatus] = useState('disconnected');
  const [showOpalSettings, setShowOpalSettings] = useState(false);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Define loadMemories with useCallback to prevent unnecessary re-renders
  const loadMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('[MemoriesPage] Fetching memories from OPAL...');
      // Fetch memories from OPAL with archived flag
      const result = await memoryService.getMemories({
        includeArchived: showArchived
      });
      console.log('[MemoriesPage] Memory API result:', result);
      // Parse the API response - should be direct array of memories
      let memories: OpalMemory[] = [];
      if (result && Array.isArray(result)) {
        memories = result;
      } else if (result && typeof result === 'object' && 'memories' in result) {
        const wrappedResult = result as MemoryApiResponse;
        if (Array.isArray(wrappedResult.memories)) {
          memories = wrappedResult.memories;
        }
      }
      // Map OPAL memory fields to UI Memory interface
      const mappedMemories = memories.map((m: OpalMemory) => {
        let tags = m.tags;
        if (typeof tags === 'string') {
          try { tags = JSON.parse(tags); } catch (e) { tags = []; }
        }
        if (!Array.isArray(tags)) tags = [];
        // Try to extract summary from content if it's a JSON string
        let summary = m.summary || (m.metadata && m.metadata.summary) || '';
        if (!summary && typeof m.content === 'string') {
          try {
            // Try to parse as array
            const arr = JSON.parse(m.content);
            if (Array.isArray(arr) && arr.length > 0 && arr[0].type === 'text') {
              const textObj = arr[0];
              const inner = JSON.parse(textObj.text);
              if (inner.summary) summary = inner.summary;
            }
          } catch (e) { /* not JSON, ignore */ }
        }
        // Ensure type is one of the allowed values in Memory interface
        let memoryType: 'journal' | 'note' | 'summary' = 'summary';
        if (m.type === 'journal' || m.type === 'note') {
          memoryType = m.type;
        }
        
        const memory: Memory = {
          id: m.id,
          title: m.title,
          content: m.content,
          summary: summary,
          tags: tags as string[],
          createdAt: m.created_at || m.createdAt || m.timestamp || '',
          updatedAt: m.created_at || m.createdAt || m.timestamp || '',
          source: m.source || '',
          type: memoryType,
          starred: m.is_starred || m.isStarred || false,
          archived: m.is_archived || m.isArchived || false,
        };
        console.log('[MemoriesPage] Mapped memory:', memory);
        return memory;
      });
      setMemories(mappedMemories);
      // Extract all unique tags
      const uniqueTags = Array.from(new Set(
        mappedMemories.flatMap(memory => memory.tags)
      )).filter(Boolean);
      setAllTags(uniqueTags);
      
      // If this is the first load and there's at least one memory, select the first one
      if (mappedMemories.length > 0 && !selectedMemoryId) {
        setSelectedMemoryId(mappedMemories[0].id);
      }
      
      // Log whether we're showing archived memories
      console.log(`[MemoriesPage] Showing ${showArchived ? 'all including archived' : 'only non-archived'} memories`);
    } catch (error) {
      console.error('[MemoriesPage] Failed to load memories from OPAL:', error);
      setMemories([]); // Remove mock data fallback
    } finally {
      setIsLoading(false);
    }
  }, [showArchived, selectedMemoryId]);
  

  
  // Mock data for now - in real implementation, this would come from OPAL/database
  const mockMemories: Memory[] = [
    {
      id: "1",
      title: "Daily Reflection",
      content: "Today was a productive day. I worked on the OPAL integration and made significant progress. The WebSocket connection is now stable, and I've successfully implemented the token-based authentication system.\n\nKey accomplishments:\n- Fixed the token permissions issue in the admin panel\n- Integrated the OPAL client into the Forge UI\n- Added the AI Summary functionality to the journal editor\n- Created comprehensive documentation for the integration\n\nChallenges faced:\n- Initial TypeScript compilation errors required switching to JavaScript approach\n- OPAL server token creation was defaulting to read-only permissions\n- Required careful coordination between server and client components\n\nNext steps:\n- Test the full integration with real OPAL server\n- Implement more AI tools beyond just summarization\n- Consider adding memory storage capabilities to OPAL",
      summary: "Productive day working on OPAL integration with progress on WebSocket connections, token authentication, and AI functionality integration",
      tags: ["work", "progress", "integration", "opal", "ai", "development"],
      createdAt: "2025-01-10T14:40:00Z",
      updatedAt: "2025-01-10T14:40:00Z",
      source: "Journal Entry",
      type: "journal"
    },
    {
      id: "2", 
      title: "Project Ideas",
      content: "Some interesting ideas came up during the meeting about memory management systems:\n\n1. AI-powered memory categorization\n2. Automatic tag generation based on content analysis\n3. Cross-referencing memories to find patterns\n4. Timeline visualization of thought evolution\n5. Integration with external knowledge bases\n\nThe team particularly liked the idea of using AI to suggest connections between different memories and highlight recurring themes in our thinking patterns.",
      summary: "Meeting discussion about memory management systems and future project directions with focus on AI-powered features",
      tags: ["ideas", "meeting", "memory-systems", "ai", "planning"],
      createdAt: "2025-01-10T10:15:00Z",
      updatedAt: "2025-01-10T10:15:00Z",
      source: "Meeting Notes",
      type: "note"
    },
    {
      id: "3",
      title: "AI Summary: Development Progress",
      content: "Based on recent development activities, here's a comprehensive summary:\n\nTechnical Achievements:\n- Successfully integrated OPAL MCP server with Forge application\n- Resolved authentication and permissions issues\n- Implemented working JavaScript client for WebSocket communication\n- Added AI summarization capabilities to journal editor\n\nArchitectural Decisions:\n- Chose JavaScript over TypeScript for initial implementation due to compilation complexity\n- Implemented token-based authentication with proper read/write permissions\n- Used modular component structure for maintainability\n\nCurrent Status:\n- Core integration is functional\n- Documentation is comprehensive\n- Ready for testing with live OPAL server\n\nRecommendations:\n- Continue with JavaScript approach for stability\n- Expand AI tool integration beyond summarization\n- Consider implementing memory persistence in OPAL server",
      summary: "AI-generated summary of development progress covering server fixes, integration work, and architectural decisions",
      tags: ["development", "ai-summary", "progress", "opal", "architecture"],
      createdAt: "2025-01-10T09:30:00Z",
      updatedAt: "2025-01-10T09:30:00Z",
      source: "AI Generated",
      type: "summary"
    },
    {
      id: "4",
      title: "Learning: WebSocket Best Practices",
      content: "Research notes on WebSocket implementation best practices:\n\n1. Connection Management:\n- Always implement reconnection logic\n- Use exponential backoff for failed connections\n- Handle connection state changes gracefully\n\n2. Message Handling:\n- Implement proper message queuing\n- Use unique message IDs for request/response correlation\n- Handle malformed messages gracefully\n\n3. Security:\n- Always use WSS in production\n- Implement proper authentication tokens\n- Validate all incoming messages\n\n4. Performance:\n- Batch messages when possible\n- Implement message compression for large payloads\n- Monitor connection health with ping/pong\n\nThese practices were particularly relevant when implementing the OPAL WebSocket client.",
      summary: "Technical research notes on WebSocket implementation best practices and security considerations",
      tags: ["learning", "websocket", "best-practices", "security", "performance"],
      createdAt: "2025-01-09T16:20:00Z",
      updatedAt: "2025-01-09T16:20:00Z",
      source: "Research Notes",
      type: "note"
    }
  ];

  useEffect(() => {
    // Load memories immediately since we're using direct API calls
    loadMemories();
  }, [loadMemories]);

  useEffect(() => {
    // Set status to ready since we're using direct API calls
    setOpalStatus('ready');
  }, []);





  const handleMemorySelect = (memoryId: string) => {
    setSelectedMemoryId(memoryId);
    setActiveTab("viewer"); // Switch to viewer when selecting a memory
  };

  const getOpalStatusIcon = () => {
    if (opalStatus === 'ready') return <Wifi className="w-4 h-4 text-green-500" />;
    if (opalStatus === 'connected') return <Wifi className="w-4 h-4 text-yellow-500" />;
    return <WifiOff className="w-4 h-4 text-red-500" />;
  };

  const getOpalStatusText = () => {
    if (opalStatus === 'ready') return 'OPAL Ready';
    if (opalStatus === 'connected') return 'OPAL Connecting';
    return 'OPAL Offline';
  };

  const getOpalStatusVariant = () => {
    if (opalStatus === 'ready') return 'default';
    if (opalStatus === 'connected') return 'secondary';
    return 'destructive';
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      await memoryService.deleteMemory(memoryId);
      // Remove from local state and reload from backend
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      if (selectedMemoryId === memoryId) setSelectedMemoryId(null);
      await loadMemories();
    } catch (e) {
      console.error('Failed to delete memory:', e);
      // Optionally show a toast or error message to the user
    }
  };

  const handleStarMemory = async (memoryId: string) => {
    try {
      // Find the memory to toggle its starred status
      const memory = memories.find(m => m.id === memoryId);
      if (!memory) return;
      
      const newStarredStatus = !memory.starred;
      
      // Call the memory_update tool to update the starred status
      const updatedMemory = await memoryService.updateMemory(memoryId, {
        starred: newStarredStatus
      });
      
      console.log('Memory starred status updated:', updatedMemory);
      
      // Update the local state
      setMemories(memories.map(m => 
        m.id === memoryId ? { ...m, starred: newStarredStatus } : m
      ));
    } catch (error) {
      console.error('Error starring memory:', error);
    }
  };

  const handleEditMemory = async (memoryId: string, updates: Partial<Memory>) => {
    try {
      // If no updates provided, this is just the edit button click
      // We would typically open an edit modal here
      if (Object.keys(updates).length === 0) {
        // For now, we'll just log this action
        console.log('Edit memory button clicked:', memoryId);
        return;
      }
      
      // Call the memory_update tool to update the memory
      const updatedMemory = await memoryService.updateMemory(memoryId, updates);
      
      console.log('Memory updated:', updatedMemory);
      
      // Update the local state
      setMemories(memories.map(m => 
        m.id === memoryId ? { ...m, ...updates } : m
      ));
    } catch (error) {
      console.error('Error updating memory:', error);
    }
  };

  const handleArchiveMemory = async (memoryId: string) => {
    try {
      // Call the memory_update tool to archive the memory
      const updatedMemory = await memoryService.updateMemory(memoryId, {
        archived: true
      });
      
      console.log('Memory archived:', updatedMemory);
      
      // Update the local state - remove from the current view
      setMemories(memories.filter(m => m.id !== memoryId));
      
      // If this was the selected memory, clear the selection
      if (selectedMemoryId === memoryId) {
        setSelectedMemoryId(null);
      }
    } catch (error) {
      console.error('Error archiving memory:', error);
    }
  };

  // Generate tags from content using AI
  const generateTags = async (title: string, content: string): Promise<string[]> => {
    try {
      // Prepare prompt for AI tag generation
      const prompt = `Please analyze this text and generate 3-5 relevant tags that categorize the content. 
      Return only the tags as a JSON array of strings. The tags should be single words or short phrases.

Title: ${title}

Content: ${content}`;
      
      const response = await getAIFeedback(prompt, 'system');
      console.log('AI tag generation response:', response);
      
      // Parse the response to extract tags
      let tags: string[] = [];
      try {
        // Try to parse the entire response as JSON
        // Ensure response is a string before parsing
        const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
        tags = JSON.parse(responseStr);
      } catch (e) {
        // If that fails, try to extract JSON from the response text
        // Ensure response is a string before using match
        const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
        const jsonMatch = responseStr.match(/\[.*?\]/s);
        if (jsonMatch) {
          try {
            tags = JSON.parse(jsonMatch[0]);
          } catch (innerError) {
            console.error('Failed to parse extracted JSON:', innerError);
          }
        }
      }
      
      // Validate tags format and filter out any non-string values
      return Array.isArray(tags) ? tags.filter(tag => typeof tag === 'string') : [];
    } catch (error) {
      console.error('Error generating tags:', error);
      return [];
    }
  };

  // Helper function to calculate content similarity
  const calculateContentSimilarity = (str1: string, str2: string): number => {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;
    
    const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    if (words1.length === 0 && words2.length === 0) return 1;
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = (commonWords.length * 2) / (words1.length + words2.length);
    
    return similarity;
  };

  // Find and clean up duplicate memories
  const findDuplicates = () => {
    const duplicateGroups: Memory[][] = [];
    const processed = new Set<string>();

    memories.forEach((memory, index) => {
      if (processed.has(memory.id)) return;

      const duplicates = [memory];
      const currentTitle = memory.title.trim().toLowerCase();
      const currentContent = memory.content.trim().toLowerCase();

      memories.slice(index + 1).forEach(otherMemory => {
        if (processed.has(otherMemory.id)) return;

        const otherTitle = otherMemory.title.trim().toLowerCase();
        const otherContent = otherMemory.content.trim().toLowerCase();

        const titleMatch = currentTitle === otherTitle;
        const contentSimilarity = calculateContentSimilarity(currentContent, otherContent);

        if (titleMatch && contentSimilarity > 0.9) {
          duplicates.push(otherMemory);
          processed.add(otherMemory.id);
        }
      });

      if (duplicates.length > 1) {
        duplicateGroups.push(duplicates);
      }
      processed.add(memory.id);
    });

    return duplicateGroups;
  };

  // Clean up duplicates by keeping the oldest entry and removing newer ones
  const cleanupDuplicates = async () => {
    const duplicateGroups = findDuplicates();
    
    if (duplicateGroups.length === 0) {
      console.log('No duplicates found');
      return;
    }

    console.log(`Found ${duplicateGroups.length} duplicate groups:`, duplicateGroups);
    
    for (const group of duplicateGroups) {
      // Sort by creation date, keep the oldest (first created)
      const sortedGroup = group.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      const keepEntry = sortedGroup[0];
      const duplicatesToDelete = sortedGroup.slice(1);
      
      console.log(`Keeping "${keepEntry.title}" (${keepEntry.createdAt}), deleting ${duplicatesToDelete.length} duplicates`);
      
      // Delete the duplicate entries
      for (const duplicate of duplicatesToDelete) {
        try {
          await memoryService.deleteMemory(duplicate.id);
          console.log(`Deleted duplicate: ${duplicate.title} (${duplicate.id})`);
        } catch (error) {
          console.error(`Failed to delete duplicate ${duplicate.id}:`, error);
        }
      }
    }
    
    // Reload memories after cleanup
    await loadMemories();
    console.log('Duplicate cleanup completed');
  };

  // Handle adding a new memory
  const handleAddMemory = async (data: { title: string; content: string; tags: string[] }) => {
    setShowAddMemory(false);
    setIsLoading(true);
    try {
      // Generate AI tags if there are no user-provided tags
      let finalTags = data.tags;
      if (finalTags.length === 0) {
        const aiTags = await generateTags(data.title, data.content);
        finalTags = aiTags;
        console.log('AI generated tags:', aiTags);
      }
      
      const result = await memoryService.createMemory({
        title: data.title,
        content: data.content,
        tags: finalTags,
        source: 'user'
      });
      await loadMemories();
    } catch (error) {
      console.error('Error adding memory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom divider style for subtle, dark lines
  const dividerClass = "h-6 w-px bg-gray-200 dark:bg-gray-700";

  return (
    <div className="page-container bg-app-bg-primary text-app-text-primary">
      {/* Core Header */}
      <div className="flex flex-col gap-3 py-4 px-6 bg-app-bg-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-app-text-secondary">
              <path d="M7 8H17L19 12H5L7 8Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 3H16L17 8H7L8 3Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 12H19L18 17H6L5 12Z" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="17" width="6" height="4" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <h2 className="text-xl font-bold text-app-text-primary">Core</h2>
            <span className="text-sm text-app-text-secondary">
              ({memories.length} Core Entries)
            </span>
          </div>
          
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddMemory(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Core Entry
          </Button>
        </div>
      </div>


      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <div className="bg-app-bg-primary border-r border-app-border-divider min-w-[220px] max-w-[320px] w-[25%] flex-shrink-0 transition-all duration-200">
            <CoreSidebar 
              memories={memories}
              selectedMemoryId={selectedMemoryId}
              onMemorySelect={handleMemorySelect}
              showArchived={showArchived}
              onToggleArchived={() => setShowArchived(!showArchived)}
              isLoading={isLoading}
              onRefresh={loadMemories}
              selectedTags={selectedTags}
            />
          </div>
        )}
        
        {/* Main content: Memories viewer, insights, or visualizations */}
        <div className="flex-1 overflow-y-auto bg-app-bg-primary">
          <Tabs defaultValue="viewer" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center p-4 border-b border-app-border-divider bg-app-bg-primary">
              <TabsList className="grid grid-cols-5 w-[600px]">
                <TabsTrigger value="viewer" className="flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-app-text-secondary" /> Core View
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-app-text-secondary" /> AI Insights
                </TabsTrigger>
                <TabsTrigger value="visualizations" className="flex items-center">
                  <ChartBar className="w-4 h-4 mr-2 text-app-text-secondary" /> Analysis
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="flex items-center">
                  <Wrench className="w-4 h-4 mr-2 text-app-text-secondary" /> Maintenance
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2 text-app-text-secondary" /> Chat
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-3">
                {/* Tag filter integrated into tabs row */}
                <div className="min-w-[220px]">
                  <TagFilter
                    allTags={allTags} 
                    selectedTags={selectedTags} 
                    onTagSelect={setSelectedTags}
                  />
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-app-text-secondary hover:text-app-text-primary"
                >
                  {sidebarCollapsed ? <PanelLeft /> : <PanelLeftClose />}
                </Button>
              </div>
            </div>
            
            <TabsContent value="viewer" className="m-0">
              <CoreViewer 
                memories={memories} 
                selectedMemoryId={selectedMemoryId}
                onDeleteMemory={handleDeleteMemory}
                onStarMemory={handleStarMemory}
                onEditMemory={handleEditMemory}
                onArchiveMemory={handleArchiveMemory}
              />
            </TabsContent>
            
            <TabsContent value="insights" className="m-0">
              <CoreInsights coreEntries={memories} />
            </TabsContent>
            
            <TabsContent value="visualizations" className="m-0">
              <MemoriesVisualizations
                memories={memories}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="maintenance" className="m-0">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Wrench className="w-6 h-6 text-blue-400" />
                  <h2 className="text-2xl font-bold text-app-text-primary">Entry Maintenance</h2>
                </div>
                
                {/* Duplicate Management Section */}
                <div className="bg-app-bg-elevated rounded-lg p-6 border border-app-border-primary">
                  <h3 className="text-lg font-semibold text-app-text-primary mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    Duplicate Entry Management
                  </h3>
                  <p className="text-app-text-primary mb-4">
                    Find entries with similar titles and content. You can choose to merge them, keep one version, or leave them separate.
                  </p>
                  <div className="space-y-4">
                    {(() => {
                      const duplicateGroups = findDuplicates();
                      if (duplicateGroups.length === 0) {
                        return (
                          <div className="text-center py-8 text-app-text-secondary">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-900/20 flex items-center justify-center">
                              <span className="text-2xl">✓</span>
                            </div>
                            <p>No duplicate entries found!</p>
                          </div>
                        );
                      }
                      
                      return duplicateGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="border border-yellow-600/30 rounded-lg p-4 bg-app-bg-hover">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-yellow-400">
                              Duplicate Group {groupIndex + 1} ({group.length} entries)
                            </h4>
                            <span className="text-sm text-app-text-secondary">
                              Title: "{group[0].title}"
                            </span>
                          </div>
                          
                          <div className="grid gap-3">
                            {group.map((entry, entryIndex) => (
                              <div key={entry.id} className="bg-app-bg-elevated rounded p-3 border border-app-border-secondary">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-app-text-primary">
                                    Entry {entryIndex + 1}
                                  </span>
                                  <span className="text-xs text-app-text-secondary">
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-app-text-secondary line-clamp-2">
                                  {(entry.content || '').substring(0, 150)}...
                                </p>
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-400 border-green-400 hover:bg-green-400 hover:text-white"
                                    onClick={() => {
                                      // Keep this entry, delete others in group
                                      const toDelete = group.filter(g => g.id !== entry.id);
                                      if (confirm(`Keep this entry and delete ${toDelete.length} duplicates?`)) {
                                        toDelete.forEach(async (duplicate) => {
                                          try {
                                            await memoryService.deleteMemory(duplicate.id);
                                          } catch (error) {
                                            console.error(`Failed to delete ${duplicate.id}:`, error);
                                          }
                                        });
                                        loadMemories();
                                      }
                                    }}
                                  >
                                    Keep This
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
                                    onClick={() => {
                                      // TODO: Implement merge functionality
                                      alert('Merge functionality coming soon! For now, you can manually edit entries to combine content.');
                                    }}
                                  >
                                    Merge All
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
                
                {/* Entry Statistics */}
                <div className="bg-app-bg-elevated rounded-lg p-6 border border-app-border-primary">
                  <h3 className="text-lg font-semibold text-app-text-primary mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Entry Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{memories.length}</div>
                      <div className="text-sm text-gray-400">Total Entries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {memories.filter(m => m.type === 'journal').length}
                      </div>
                      <div className="text-sm text-app-text-secondary">Journal Entries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {memories.filter(m => m.type === 'note').length}
                      </div>
                      <div className="text-sm text-app-text-secondary">Notes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {findDuplicates().length}
                      </div>
                      <div className="text-sm text-app-text-secondary">Duplicate Groups</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="chat" className="m-0 bg-app-bg-secondary">
              <div className="h-[calc(100vh-12rem)] bg-app-bg-secondary">
                <ChatInterface className="h-full" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sidebar collapse button */}
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute bottom-6 right-6 z-10 h-8 w-8 bg-app-bg-tertiary opacity-80 hover:opacity-100 shadow-md"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
      </Button>

      {/* OPAL Settings Modal */}
      <OpalSettings 
        isOpen={showOpalSettings} 
        onClose={() => setShowOpalSettings(false)} 
      />

      <AddMemoryModal
        isOpen={showAddMemory}
        onSave={handleAddMemory}
        onClose={() => setShowAddMemory(false)}
      />
    </div>
  );
};

export default MemoriesPage; 