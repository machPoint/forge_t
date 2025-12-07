import React, { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PanelLeftClose, PanelLeft, Wifi, WifiOff } from "lucide-react";
import UserProfile from "./UserProfile";
import opal from "@/lib/simple-opal-client";

interface AppHeaderProps {
  showFeedbackButton?: boolean;
  showFeedback?: boolean;
  onFeedbackToggle?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  showFeedbackButton = false,
  showFeedback = false,
  onFeedbackToggle
}) => {
  const [opalStatus, setOpalStatus] = useState('disconnected');

  useEffect(() => {
    // Listen for OPAL status changes
    opal.on('statusChange', setOpalStatus);
    
    // Set initial status
    setOpalStatus(opal.getStatus());
    
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

  return (
    <>
      <div className="flex items-center justify-between w-full">
        {/* Left side - empty for now, can be used for navigation/branding later */}
        <div></div>
        
        {/* Right side - status elements */}
        <div className="flex items-center gap-3">
          <Badge variant={getOpalStatusVariant()} className="flex items-center gap-1">
            {getOpalStatusIcon()}
            {getOpalStatusText()}
          </Badge>
          
          {showFeedbackButton && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onFeedbackToggle}
              className="text-xs flex items-center gap-1"
            >
              <span className="hidden sm:inline">AI Feedback</span>
              {showFeedback ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
            </Button>
          )}
          
          <ThemeToggle />
          
          <UserProfile variant="dropdown" />
        </div>
      </div>
    </>
  );
};

export default AppHeader;
