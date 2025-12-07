import React, { useState, useEffect } from "react";
import MemoriesSidebar from "./memories/MemoriesSidebar";
import MemoriesViewer from "./memories/MemoriesViewer";
import MemoriesInsights from "./memories/MemoriesInsights";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PanelRightClose, PanelLeftClose, PanelRight, PanelLeft, Wifi, WifiOff, Settings } from "lucide-react";
import MainNavigation from "./MainNavigation";
import UserProfile from "./UserProfile";
import opal from "@/lib/simple-opal-client";
import OpalSettings from "./OpalSettings";

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

const MemoriesLayout: React.FC = () => {
  const [leftPaneCollapsed, setLeftPaneCollapsed] = useState(false);
  const [rightPaneCollapsed, setRightPaneCollapsed] = useState(false);
  const [opalStatus, setOpalStatus] = useState('disconnected');
  const [showOpalSettings, setShowOpalSettings] = useState(false);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    // Listen for OPAL status changes
    opal.on('statusChange', setOpalStatus);
    
    // Set initial status
    setOpalStatus(opal.getStatus());
    
    // Mock memories data for now
    setMemories([
      {
        id: "1",
        title: "Project Progress Update",
        content: "Made significant progress on the OPAL integration project...",
        summary: "Completed authentication system and started working on memory management features.",
        tags: ["work", "progress", "integration"],
        createdAt: new Date().toISOString(),
        source: "journal",
        type: "journal"
      }
    ]);
    
    return () => {
      opal.off('statusChange', setOpalStatus);
    };
  }, []);

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

  // Custom divider style for subtle, dark lines
  const dividerClass = "w-px bg-[#23232a] dark:bg-[#23232a] opacity-70 h-full";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#111111] to-[#222222] dark:from-[#111111] dark:to-[#222222]">
      <div className="h-14 border-b border-gray-700 px-4 flex items-center justify-between bg-[#1d1d1d]/80 dark:bg-[#1d1d1d]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Memory Manager</h1>
          <div className="h-6 w-px bg-gray-700"></div>
          <MainNavigation />
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={getOpalStatusVariant()} className="flex items-center gap-1">
            {getOpalStatusIcon()}
            {getOpalStatusText()}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowOpalSettings(!showOpalSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <ThemeToggle />
          <UserProfile variant="dropdown" />
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] dark:from-[#1a1a1a] dark:to-[#2a2a2a]">
        {/* Sidebar */}
        {!leftPaneCollapsed && (
          <div className="bg-[#1d1d1d] dark:bg-[#1d1d1d] border-r border-[#23232a] min-w-[220px] max-w-[320px] w-[20%] flex-shrink-0 transition-all duration-200">
            <MemoriesSidebar />
          </div>
        )}
        {/* Divider */}
        {!leftPaneCollapsed && <div className={dividerClass} />}
        {/* Main Viewer */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="h-full bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] dark:from-[#1a1a1a] dark:to-[#2a2a2a]">
            <MemoriesViewer 
              selectedMemoryId={selectedMemoryId}
              memories={memories}
            />
          </div>
        </div>
        {/* Divider */}
        {!rightPaneCollapsed && <div className={dividerClass} />}
        {/* Insights Pane */}
        {!rightPaneCollapsed && (
          <div className="bg-[#1d1d1d] dark:bg-[#1d1d1d] border-l border-[#23232a] min-w-[220px] max-w-[320px] w-[20%] flex-shrink-0 transition-all duration-200">
            <MemoriesInsights memories={memories} />
          </div>
        )}
      </div>
      
      {/* Panel toggle buttons */}
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute top-20 left-2 z-10 h-8 w-8 bg-[#1d1d1d] dark:bg-[#1d1d1d] opacity-80 hover:opacity-100"
        onClick={() => setLeftPaneCollapsed(!leftPaneCollapsed)}
      >
        {leftPaneCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute top-20 right-2 z-10 h-8 w-8 bg-[#1d1d1d] dark:bg-[#1d1d1d] opacity-80 hover:opacity-100"
        onClick={() => setRightPaneCollapsed(!rightPaneCollapsed)}
      >
        {rightPaneCollapsed ? <PanelRight size={16} /> : <PanelRightClose size={16} />}
      </Button>

      {/* OPAL Settings Modal */}
      <OpalSettings 
        isOpen={showOpalSettings} 
        onClose={() => setShowOpalSettings(false)} 
      />
    </div>
  );
};

export default MemoriesLayout; 