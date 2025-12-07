import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Home, 
  BookOpen, 
  Compass, 
  Layers, 
  User, 
  PlusCircle, 
  Save, 
  FileText, 
  MessageCircle, 
  Settings 
} from "lucide-react";

/**
 * UnifiedHeader Component
 * 
 * Provides consistent navigation and action buttons across all pages
 * Matches the MemoriesPage template design
 */

interface UnifiedHeaderProps {
  // Optional action buttons for the right side
  actionButtons?: React.ReactNode;
}

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({ actionButtons }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navButtonClass = (path: string) => cn(
    "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-none border-b-2 transition-colors",
    isActive(path)
      ? "border-blue-500 bg-app-bg-elevated text-app-text-primary"
      : "border-transparent text-app-text-secondary hover:bg-app-bg-hover hover:text-app-text-primary"
  );

  const actionButtonClass = cn(
    "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-none transition-colors",
    "text-app-text-secondary hover:bg-app-bg-hover hover:text-app-text-primary"
  );

  return (
    <div className="flex-shrink-0 bg-app-bg-secondary border-b border-app-border-divider">
      <div className="flex items-center justify-between h-16">
        {/* Left: Navigation */}
        <div className="flex items-center h-full">
          <div className="px-4 border-r border-app-border-divider h-full flex items-center">
            <h1 className="text-sm font-semibold text-app-text-primary">Navigation</h1>
          </div>
          
          <div className="flex items-center h-full">
            <Button
              variant="ghost"
              className={navButtonClass("/")}
              onClick={() => navigate("/")}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>

            <Button
              variant="ghost"
              className={navButtonClass("/journal")}
              onClick={() => navigate("/journal")}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">Journal</span>
            </Button>

            <Button
              variant="ghost"
              className={navButtonClass("/modules")}
              onClick={() => navigate("/modules")}
            >
              <Compass className="w-5 h-5" />
              <span className="text-xs">Guided</span>
            </Button>

            <Button
              variant="ghost"
              className={navButtonClass("/memories")}
              onClick={() => navigate("/memories")}
            >
              <Layers className="w-5 h-5" />
              <span className="text-xs">Core</span>
            </Button>

            <Button
              variant="ghost"
              className={navButtonClass("/profile")}
              onClick={() => navigate("/profile")}
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>

        {/* Center: Actions (if provided) or default actions */}
        <div className="flex items-center h-full border-x border-app-border-divider">
          {actionButtons || (
            <>
              <Button variant="ghost" className={actionButtonClass}>
                <PlusCircle className="w-5 h-5" />
                <span className="text-xs">New Entry</span>
              </Button>

              <Button variant="ghost" className={actionButtonClass}>
                <Save className="w-5 h-5" />
                <span className="text-xs">Save</span>
              </Button>

              <Button variant="ghost" className={actionButtonClass}>
                <FileText className="w-5 h-5" />
                <span className="text-xs">Save to Core</span>
              </Button>

              <Button variant="ghost" className={actionButtonClass}>
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">AI Feedback</span>
              </Button>
            </>
          )}
        </div>

        {/* Right: Settings */}
        <div className="flex items-center h-full">
          <div className="px-4 border-l border-app-border-divider h-full flex items-center">
            <h1 className="text-sm font-semibold text-app-text-primary">Settings</h1>
          </div>
          
          <div className="flex items-center h-full">
            <Button
              variant="ghost"
              className={navButtonClass("/admin")}
              onClick={() => navigate("/admin")}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </Button>

            <Button
              variant="ghost"
              className={navButtonClass("/profile")}
              onClick={() => navigate("/profile")}
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedHeader;
