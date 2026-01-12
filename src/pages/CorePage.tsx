import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Filter, Archive, RefreshCw, Eye, EyeOff, ChevronLeft, ChevronRight, BarChart3, ChartBar, Hammer, MessageCircle, Wrench, PanelLeft, PanelLeftClose } from "lucide-react";

import CoreSidebar from '../components/core/CoreSidebar';
import CoreViewer from '../components/core/CoreViewer';
import CoreInsights from '../components/core/CoreInsights';
import AddMemoryModal from '../components/AddMemoryModal';
import MemoriesVisualizations from '../components/memories/MemoriesVisualizations';
import TagFilter from '../components/memories/TagFilter';
import ChatInterface from '../components/chat/ChatInterface';
import OpalSettings from '../components/OpalSettings';
import memoryService from '../lib/memoryService';
import TokenManager from '../auth/TokenManager';
import opal from '../lib/simple-opal-client';

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

const CorePage: React.FC = () => {
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
      console.log('[CorePage] Fetching core entries from API...');
      console.log('[CorePage] Token debug info:', TokenManager.getDebugInfo());
      
      // Force reload token from storage in case it was lost
      TokenManager.reload();
      
      // Fetch core entries from REST API with archived flag
      const result = await memoryService.getMemories({
        includeArchived: showArchived
      });
      console.log('[CorePage] Core API result:', result);
      // Parse the API response - should be direct array of memories
      let memories: OpalMemory[] = [];
      if (result && Array.isArray(result)) {
        // Cast Memory[] to OpalMemory[] since they have compatible structure
        memories = result as unknown as OpalMemory[];
      } else if (result && typeof result === 'object' && 'memories' in result) {
        const wrappedResult = result as {memories: OpalMemory[]};
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
          summary: summary || 'No summary available',
          tags: tags as string[],
          createdAt: m.created_at || m.createdAt || m.timestamp || new Date().toISOString(),
          updatedAt: m.created_at || m.createdAt || m.timestamp || new Date().toISOString(),
          source: m.source || 'unknown',
          type: memoryType,
          starred: m.is_starred || m.isStarred || false,
          archived: m.is_archived || m.isArchived || false
        };
        return memory;
      });

      setMemories(mappedMemories);
      
      // Extract all unique tags
      const allTagsSet = new Set<string>();
      mappedMemories.forEach(memory => {
        memory.tags.forEach(tag => allTagsSet.add(tag));
      });
      setAllTags(Array.from(allTagsSet));
      
      console.log(`[CorePage] Loaded ${mappedMemories.length} memories`);
    } catch (error) {
      console.error('[CorePage] Error loading memories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [showArchived]);

  // Load memories on component mount and when showArchived changes
  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Check OPAL connection status
  useEffect(() => {
    const checkOpalStatus = () => {
      if (opal.ready()) {
        setOpalStatus('connected');
      } else {
        setOpalStatus('disconnected');
      }
    };

    checkOpalStatus();
    const interval = setInterval(checkOpalStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMemorySelect = (memoryId: string) => {
    setSelectedMemoryId(memoryId);
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      await memoryService.deleteMemory(memoryId);
      await loadMemories(); // Reload memories after deletion
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  const handleStarMemory = async (memoryId: string) => {
    try {
      const memory = memories.find(m => m.id === memoryId);
      if (memory) {
        await memoryService.updateMemory(memoryId, {
          ...memory,
          starred: !memory.starred
        });
        await loadMemories(); // Reload memories after update
      }
    } catch (error) {
      console.error('Error starring memory:', error);
    }
  };

  const handleEditMemory = async (memoryId: string, updates: Partial<Memory>) => {
    try {
      await memoryService.updateMemory(memoryId, updates);
      await loadMemories(); // Reload memories after update
    } catch (error) {
      console.error('Error editing memory:', error);
    }
  };

  const handleArchiveMemory = async (memoryId: string) => {
    try {
      const memory = memories.find(m => m.id === memoryId);
      if (memory) {
        await memoryService.updateMemory(memoryId, {
          ...memory,
          archived: !memory.archived
        });
        await loadMemories(); // Reload memories after update
      }
    } catch (error) {
      console.error('Error archiving memory:', error);
    }
  };

  const handleAddMemory = async (memoryData: { title: string; content: string; tags: string[] }) => {
    try {
      await memoryService.createMemory({
        ...memoryData,
        type: 'summary' as const,
        source: 'manual'
      });
      await loadMemories(); // Reload memories after creation
    } catch (error) {
      console.error('Error adding memory:', error);
    }
  };

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <div className="bg-background border-r border-border min-w-[220px] max-w-[320px] w-[25%] flex-shrink-0 transition-all duration-200 h-full overflow-hidden">
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

        {/* Main Content with Tabs */}
        <div className="flex-1 flex flex-col min-h-0 bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-background">
              <TabsList className="bg-zinc-800 border border-zinc-700">
                <TabsTrigger value="viewer" className="flex items-center gap-2 text-zinc-400 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                  <Eye className="w-4 h-4" />
                  Viewer
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-2 text-zinc-400 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                  <BarChart3 className="w-4 h-4" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="visualizations" className="flex items-center gap-2 text-zinc-400 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                  <ChartBar className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2 text-zinc-400 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowAddMemory(true)}
                  size="sm"
                  className="bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Core Entry
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {sidebarCollapsed ? <PanelLeft /> : <PanelLeftClose />}
                </Button>
              </div>
            </div>
            
            <TabsContent value="viewer" className="m-0 flex-1 min-h-0 overflow-hidden">
              <CoreViewer 
                memories={memories} 
                selectedMemoryId={selectedMemoryId}
                onDeleteMemory={handleDeleteMemory}
                onStarMemory={handleStarMemory}
                onEditMemory={handleEditMemory}
                onArchiveMemory={handleArchiveMemory}
              />
            </TabsContent>
            
            <TabsContent value="insights" className="m-0 flex-1 min-h-0 overflow-hidden">
              <CoreInsights coreEntries={memories} />
            </TabsContent>
            
            <TabsContent value="visualizations" className="m-0 flex-1 min-h-0 overflow-hidden">
              <MemoriesVisualizations
                memories={memories}
                isLoading={isLoading}
              />
            </TabsContent>
            
            
            <TabsContent value="chat" className="m-0 flex-1 min-h-0 overflow-hidden">
              <ChatInterface className="h-full" memories={memories} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      {showOpalSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-app-bg-elevated rounded-lg border border-app-border-primary p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-app-text-primary">OPAL Settings</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOpalSettings(false)}
                className="text-app-text-secondary hover:text-app-text-primary"
              >
                ×
              </Button>
            </div>
            <OpalSettings />
          </div>
        </div>
      )}

      <AddMemoryModal
        isOpen={showAddMemory}
        onSave={handleAddMemory}
        onClose={() => setShowAddMemory(false)}
      />
    </div>
  );
};

export default CorePage;
