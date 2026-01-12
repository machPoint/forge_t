import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  BookOpen,
  Target,
  Database,
  Settings,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import UserProfile from './UserProfile';
import AIActivityIndicator from './AIActivityIndicator';
import opal from '@/lib/simple-opal-client';
import { useEffect } from 'react';
import { useJournal } from '@/hooks/useJournal';

const RibbonMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [opalStatus, setOpalStatus] = useState('disconnected');
  const { isGeneratingFeedback } = useJournal();

  useEffect(() => {
    opal.on('statusChange', setOpalStatus);
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
    if (opalStatus === 'connected') return 'Connecting';
    return 'Offline';
  };

  const getOpalStatusVariant = () => {
    if (opalStatus === 'ready') return 'default';
    if (opalStatus === 'connected') return 'secondary';
    return 'destructive';
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-full border-b border-border bg-background">
      {/* Main Ribbon Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-sm">
        {/* Left Section - Navigation */}
        <div className="flex items-center gap-2">
          {/* Home */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className={`flex items-center gap-2 text-xs ${isActive('/') ? 'bg-gray-600 hover:bg-gray-600' : ''}`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>

          {/* Journal */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/journal')}
            className={`flex items-center gap-2 text-xs ${isActive('/journal') ? 'bg-gray-600 hover:bg-gray-600' : ''}`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Journal</span>
          </Button>

          {/* Guided */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/modules')}
            className={`flex items-center gap-2 text-xs ${isActive('/modules') ? 'bg-gray-600 hover:bg-gray-600' : ''}`}
          >
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Guided</span>
          </Button>

          {/* Core */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/core')}
            className={`flex items-center gap-2 text-xs ${isActive('/core') || isActive('/memories') ? 'bg-gray-600 hover:bg-gray-600' : ''}`}
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Core</span>
          </Button>

          {/* Profile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className={`flex items-center gap-2 text-xs ${isActive('/profile') ? 'bg-gray-600 hover:bg-gray-600' : ''}`}
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className={`flex items-center gap-2 text-xs ${isActive('/admin') ? 'bg-gray-600 hover:bg-gray-600' : ''}`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>

        {/* Right Section - Status & User */}
        <div className="flex items-center gap-3">
          <AIActivityIndicator 
            isActive={isGeneratingFeedback} 
            message="Generating AI Feedback..." 
          />
          
          <Badge variant={getOpalStatusVariant()} className="flex items-center gap-1">
            {getOpalStatusIcon()}
            <span className="hidden sm:inline">{getOpalStatusText()}</span>
          </Badge>
          
          <ThemeToggle />
          
          <UserProfile variant="dropdown" />
        </div>
      </div>
    </div>
  );
};

export default RibbonMenu;
