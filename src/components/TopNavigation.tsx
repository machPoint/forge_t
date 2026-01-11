import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from '@/components/ui/button';
import {
  Home,
  BookOpen,
  Target,
  Database,
  Settings,
  User,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from "@/lib/utils";
import UserProfile from './UserProfile';
import { ThemeToggle } from './ThemeToggle';
import opal from '@/lib/simple-opal-client';

// Define custom events for actions
export const TRIGGER_SAVE_ENTRY = 'trigger-save-entry';
export const TRIGGER_SAVE_TO_CORE = 'trigger-save-to-core';
export const TRIGGER_AI_FEEDBACK = 'trigger-ai-feedback';

const TopNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [opalStatus, setOpalStatus] = useState('disconnected');

  useEffect(() => {
    opal.on('statusChange', setOpalStatus);
    setOpalStatus(opal.getStatus());
    return () => {
      opal.off('statusChange', setOpalStatus);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const isJournalActive = location.pathname.startsWith('/journal');

  const dispatchAction = (eventName: string) => {
    window.dispatchEvent(new CustomEvent(eventName));
  };

  return (
    <div className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo / Brand */}
        <div className="font-bold text-xl tracking-tight mr-4 text-foreground flex items-center gap-2">
           Forge
        </div>

        {/* Main Navigation */}
        <NavigationMenu className="flex-1 max-w-none justify-start">
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer h-9 bg-transparent", isActive('/') && "bg-accent text-accent-foreground")}
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer h-9 bg-transparent", isJournalActive && "bg-accent text-accent-foreground")}
                onClick={() => navigate('/journal')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Journal
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer h-9 bg-transparent", isActive('/modules') && "bg-accent text-accent-foreground")}
                onClick={() => navigate('/modules')}
              >
                <Target className="w-4 h-4 mr-2" />
                Guided
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer h-9 bg-transparent", isActive('/core') && "bg-accent text-accent-foreground")}
                onClick={() => navigate('/core')}
              >
                <Database className="w-4 h-4 mr-2" />
                Core
              </NavigationMenuLink>
            </NavigationMenuItem>

             <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer h-9 bg-transparent", isActive('/profile') && "bg-accent text-accent-foreground")}
                onClick={() => navigate('/profile')}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </NavigationMenuLink>
            </NavigationMenuItem>

             <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer h-9 bg-transparent", isActive('/admin') && "bg-accent text-accent-foreground")}
                onClick={() => navigate('/admin')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Side Items */}
        <div className="flex items-center gap-2">
           {/* Connectivity Status */}
           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs text-muted-foreground border border-border/50">
             {opalStatus === 'ready' ? (
               <Wifi className="w-3.5 h-3.5 text-green-500" />
             ) : (
               <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
             )}
             <span className="hidden sm:inline">
               {opalStatus === 'ready' ? 'Online' : 'Offline'}
             </span>
          </div>

          <ThemeToggle />
          
          <div className="ml-2">
            <UserProfile variant="dropdown" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;
