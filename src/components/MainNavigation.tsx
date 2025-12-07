
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { Home, BookMarked, BookOpen, PlusCircle, Settings, User, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useJournal } from "@/hooks/useJournal";

const MainNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentMode, currentMode } = useJournal();
  
  const handleNavigation = (path: string, mode?: "freeform" | "guided") => {
    // Always set the mode first if provided
    if (mode) {
      setCurrentMode(mode);
    }
    
    // For guided journal, pass state to force guided mode
    if (mode === "guided") {
      navigate(path, { state: { forceGuidedMode: true } });
    } else if (mode === "freeform" && currentMode === "guided") {
      // When switching from guided to freeform, explicitly reset state
      navigate(path, { state: { forceGuidedMode: false, resetMode: true } });
    } else {
      navigate(path);
    }
  };
  
  // Determine if a button should be highlighted based on path and mode
  const isActive = (path: string, mode?: "freeform" | "guided") => {
    if (path === "/" && mode) {
      // For home and guided journal, check both path and mode
      return location.pathname === path && currentMode === mode;
    }
    // For other pages, just check the path
    return location.pathname === path;
  };
  
    return (
    <div className="flex items-center gap-4">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 text-sm text-app-text-secondary hover:bg-app-bg-secondary",
                isActive("/", "freeform") && "bg-app-bg-secondary text-app-text-primary"
              )}
              onClick={() => handleNavigation("/", "freeform")}
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 text-sm text-app-text-secondary hover:bg-app-bg-secondary",
                isActive("/modules") && "bg-app-bg-secondary text-app-text-primary"
              )}
              onClick={() => navigate("/modules")}
            >
              <BookMarked className="h-4 w-4" />
              Guided
            </Button>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 text-sm text-app-text-secondary hover:bg-app-bg-secondary",
                isActive("/memories") && "bg-app-bg-secondary text-app-text-primary"
              )}
              onClick={() => navigate("/memories")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                <path d="M7 8H17L19 12H5L7 8Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 3H16L17 8H7L8 3Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 12H19L18 17H6L5 12Z" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="17" width="6" height="4" stroke="currentColor" strokeWidth="1.5" />
                <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Core
            </Button>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 text-sm text-app-text-secondary hover:bg-app-bg-secondary",
                isActive("/chat") && "bg-app-bg-secondary text-app-text-primary"
              )}
              onClick={() => navigate("/chat")}
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 text-sm text-app-text-secondary hover:bg-app-bg-secondary",
                isActive("/modules") && "bg-app-bg-secondary text-app-text-primary"
              )}
              onClick={() => navigate("/modules")}
            >
              <BookOpen className="h-4 w-4" />
              Modules
            </Button>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 text-sm text-app-text-secondary hover:bg-app-bg-secondary",
                isActive("/add-module") && "bg-app-bg-secondary text-app-text-primary"
              )}
              onClick={() => navigate("/add-module")}
            >
              <PlusCircle className="h-4 w-4" />
              Create Module
            </Button>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 text-sm text-app-text-secondary hover:bg-app-bg-secondary",
                isActive("/profile") && "bg-app-bg-secondary text-app-text-primary"
              )}
              onClick={() => navigate("/profile")}
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 text-sm text-app-text-secondary hover:bg-app-bg-secondary",
                isActive("/admin") && "bg-app-bg-secondary text-app-text-primary"
              )}
              onClick={() => navigate("/admin")}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

export default MainNavigation;
