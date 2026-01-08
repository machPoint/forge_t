import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Home,
  BookOpen,
  Target,
  Database,
  Settings,
  User,
  Wifi,
  WifiOff,
  ChevronLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import UserProfile from './UserProfile';
import opal from '@/lib/simple-opal-client';

const SidebarNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [opalStatus, setOpalStatus] = React.useState('disconnected');

  React.useEffect(() => {
    opal.on('statusChange', setOpalStatus);
    setOpalStatus(opal.getStatus());
    return () => {
      opal.off('statusChange', setOpalStatus);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const items = [
    { title: "Home", url: "/", icon: Home },
    { title: "Journal", url: "/journal", icon: BookOpen },
    { title: "Guided", url: "/modules", icon: Target },
    { title: "Core", url: "/core", icon: Database },
    { title: "Profile", url: "/profile", icon: User },
    { title: "Settings", url: "/admin", icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 flex flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
        <div className="font-bold text-xl tracking-tight group-data-[collapsible=icon]:hidden">
          Forge
        </div>
        <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={isActive(item.url)}
                    onClick={() => navigate(item.url)}
                    tooltip={item.title}
                    className="transition-all duration-200 hover:translate-x-1"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 gap-4">
        <div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:px-0">
             {opalStatus === 'ready' ? (
               <Wifi className="w-4 h-4 text-green-500" />
             ) : (
               <WifiOff className="w-4 h-4 text-muted-foreground" />
             )}
             <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
               {opalStatus === 'ready' ? 'Online' : 'Offline'}
             </span>
          </div>
          
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

export default SidebarNavigation;
