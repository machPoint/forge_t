import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJournal } from '@/hooks/useJournal';
import { 
  Home, 
  BookOpen, 
  Compass, 
  Database, 
  User, 
  Save, 
  PlusCircle, 
  FileText, 
  Settings, 
  Tag, 
  MessageSquare, 
  Sparkles,
  Palette,
  Layers,
  Copy,
  Scissors,
  Clipboard,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Navigation,
  Zap
} from 'lucide-react';

// Define tab types
type RibbonTab = {
  id: string;
  label: string;
  icon?: React.ReactNode;
};

// Define ribbon group types
type RibbonGroup = {
  id: string;
  label: string;
  items: RibbonItem[];
};

// Define ribbon item types
type RibbonItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  active?: boolean;
};

// Define props for the component
interface WindowsRibbonProps {
  onNewJournal?: () => void;
  onSave?: () => void;
  onFeedbackRequest?: () => void;
  onSaveToCore?: () => void;
  showFeedback?: boolean;
  onFeedbackToggle?: () => void;
}

const WindowsRibbon: React.FC<WindowsRibbonProps> = ({ 
  onNewJournal,
  onSave,
  onFeedbackRequest,
  onSaveToCore,
  showFeedback = false,
  onFeedbackToggle
}) => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const navigate = useNavigate();
  const { clearActiveModule } = useJournal();

  // Define tabs
  const tabs: RibbonTab[] = [
    { id: 'home', label: 'Home', icon: <Home size={16} /> },
    { id: 'journal', label: 'Journal', icon: <BookOpen size={16} /> },
    { id: 'guided', label: 'Guided', icon: <Navigation size={16} /> },
    { id: 'core', label: 'Core', icon: <Zap size={16} /> },
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
  ];

  // Define ribbon content for each tab
  const ribbonContent: Record<string, RibbonGroup[]> = {
    'home': [
      {
        id: 'navigation',
        label: 'Navigation',
        items: [
          { 
            id: 'home', 
            label: 'Home', 
            icon: <Home size={24} />, 
            onClick: () => {
              // Clear guided mode when navigating to home
              clearActiveModule();
              navigate('/');
            },
            size: 'large'
          },
          { 
            id: 'journal', 
            label: 'Journal', 
            icon: <BookOpen size={24} />, 
            onClick: () => {
              // Clear guided mode when navigating to journal
              clearActiveModule();
              navigate('/journal');
            },
            size: 'large'
          },
          { 
            id: 'guided', 
            label: 'Guided', 
            icon: <Compass size={24} />, 
            onClick: () => navigate('/modules'),
            size: 'large'
          },
          { 
            id: 'core', 
            label: 'Core', 
            icon: <Database size={24} />, 
            onClick: () => navigate('/memories'),
            size: 'large'
          },
        ]
      },
      {
        id: 'actions',
        label: 'Actions',
        items: [
          { 
            id: 'new-entry', 
            label: 'New Entry', 
            icon: <PlusCircle size={20} />, 
            onClick: onNewJournal,
            size: 'medium'
          },
          { 
            id: 'save', 
            label: 'Save', 
            icon: <Save size={20} />, 
            onClick: onSave,
            size: 'medium'
          },
          { 
            id: 'save-to-core', 
            label: 'Save to Core', 
            icon: <Database size={20} />, 
            onClick: () => {
              console.log('🔥🔥🔥 HOME TAB Save to Core clicked!');
              if (onSaveToCore) {
                console.log('🔥🔥🔥 Calling onSaveToCore from home tab');
                onSaveToCore();
              } else {
                console.error('🔥🔥🔥 No onSaveToCore handler!');
              }
            },
            size: 'medium'
          },
          { 
            id: 'feedback', 
            label: 'AI Feedback', 
            icon: <MessageSquare size={20} />, 
            onClick: () => {
              console.log('🔥🔥🔥 HOME TAB AI Feedback clicked!');
              // Call the feedback request handler to generate feedback AND open flyout
              if (onFeedbackRequest) {
                console.log('🔥🔥🔥 Calling onFeedbackRequest from home tab');
                onFeedbackRequest();
              } else {
                console.error('🔥🔥🔥 No onFeedbackRequest handler!');
              }
            },
            size: 'medium',
            active: showFeedback
          },
        ]
      },
      {
        id: 'settings',
        label: 'Settings',
        items: [
          { 
            id: 'settings', 
            label: 'Settings', 
            icon: <Settings size={20} />, 
            onClick: () => navigate('/admin'),
            size: 'medium'
          },
          { 
            id: 'profile', 
            label: 'Profile', 
            icon: <User size={20} />, 
            onClick: () => navigate('/profile'),
            size: 'medium'
          },
        ]
      }
    ],
    'journal': [
      {
        id: 'entries',
        label: 'Entries',
        items: [
          { 
            id: 'new-entry', 
            label: 'New Entry', 
            icon: <PlusCircle size={24} />, 
            onClick: onNewJournal,
            size: 'large'
          },
          { 
            id: 'save', 
            label: 'Save', 
            icon: <Save size={24} />, 
            onClick: onSave,
            size: 'large'
          },
          { 
            id: 'ai-feedback', 
            label: 'AI Feedback', 
            icon: <Sparkles size={24} />, 
            onClick: onFeedbackRequest,
            size: 'large'
          },
          { 
            id: 'save-to-core', 
            label: 'Save to Core', 
            icon: <Database size={24} />, 
            onClick: onSaveToCore,
            size: 'large'
          },
        ]
      },
      {
        id: 'formatting',
        label: 'Formatting',
        items: [
          { id: 'bold', label: 'Bold', icon: <Bold size={16} />, size: 'small' },
          { id: 'italic', label: 'Italic', icon: <Italic size={16} />, size: 'small' },
          { id: 'underline', label: 'Underline', icon: <Underline size={16} />, size: 'small' },
          { id: 'align-left', label: 'Left', icon: <AlignLeft size={16} />, size: 'small' },
          { id: 'align-center', label: 'Center', icon: <AlignCenter size={16} />, size: 'small' },
          { id: 'align-right', label: 'Right', icon: <AlignRight size={16} />, size: 'small' },
        ]
      },
      {
        id: 'clipboard',
        label: 'Clipboard',
        items: [
          { id: 'copy', label: 'Copy', icon: <Copy size={16} />, size: 'small' },
          { id: 'cut', label: 'Cut', icon: <Scissors size={16} />, size: 'small' },
          { id: 'paste', label: 'Paste', icon: <Clipboard size={16} />, size: 'small' },
        ]
      },
    ],
    'guided': [
      {
        id: 'modules',
        label: 'Modules',
        items: [
          { 
            id: 'new-module', 
            label: 'New Module', 
            icon: <PlusCircle size={24} />, 
            onClick: () => navigate('/add-module'),
            size: 'large'
          },
          { 
            id: 'modules-list', 
            label: 'All Modules', 
            icon: <Layers size={24} />, 
            onClick: () => navigate('/modules'),
            size: 'large'
          },
        ]
      },
      {
        id: 'progress',
        label: 'Progress',
        items: [
          { id: 'save-progress', label: 'Save Progress', icon: <Save size={20} />, size: 'medium' },
        ]
      },
    ],
    'core': [
      {
        id: 'insights',
        label: 'Insights',
        items: [
          { 
            id: 'ai-insights', 
            label: 'AI Insights', 
            icon: <Sparkles size={24} />, 
            onClick: () => navigate('/memories'),
            size: 'large'
          },
          { 
            id: 'tags', 
            label: 'Tags', 
            icon: <Tag size={24} />, 
            onClick: () => navigate('/memories'),
            size: 'large'
          },
        ]
      },
      {
        id: 'view',
        label: 'View',
        items: [
          { id: 'theme', label: 'Theme', icon: <Palette size={20} />, onClick: () => navigate('/customizations'), size: 'medium' },
        ]
      },
    ],
    'profile': [
      {
        id: 'user',
        label: 'User',
        items: [
          { 
            id: 'edit-profile', 
            label: 'Edit Profile', 
            icon: <User size={24} />, 
            onClick: () => navigate('/profile'),
            size: 'large'
          },
          { 
            id: 'ai-personas', 
            label: 'AI Personas', 
            icon: <MessageSquare size={24} />, 
            onClick: () => navigate('/chat'),
            size: 'large'
          },
        ]
      },
    ],
  };

  // Render ribbon item based on size
  const renderRibbonItem = (item: RibbonItem) => {
    switch (item.size) {
      case 'large':
        return (
          <button 
            key={item.id}
            onClick={() => {
              console.log('🚀🚀🚀 Ribbon button clicked:', item.id, item.label);
              if (item.onClick) {
                console.log('🚀🚀🚀 Calling item.onClick for:', item.id);
                item.onClick();
              } else {
                console.error('🚀🚀🚀 No onClick handler for:', item.id);
              }
            }}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-gray-200/10 transition-colors"
          >
            <div className="p-1">{item.icon}</div>
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        );
      case 'medium':
        return (
          <button 
            key={item.id}
            onClick={() => {
              console.log('🚀🚀🚀 MEDIUM Ribbon button clicked:', item.id, item.label);
              if (item.onClick) {
                console.log('🚀🚀🚀 Calling item.onClick for MEDIUM:', item.id);
                item.onClick();
              } else {
                console.error('🚀🚀🚀 No onClick handler for MEDIUM:', item.id);
              }
            }}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-gray-200/10 transition-colors"
          >
            <div className="p-0.5">{item.icon}</div>
            <span className="text-xs mt-0.5">{item.label}</span>
          </button>
        );
      case 'small':
      default:
        return (
          <button 
            key={item.id}
            onClick={item.onClick}
            className="flex items-center justify-center p-1 rounded hover:bg-gray-200/10 transition-colors"
            title={item.label}
          >
            {item.icon}
          </button>
        );
    }
  };

  return (
    <div className="w-full bg-[#1a1a1a] border-b border-[#333333] select-none shadow-sm">
      {/* Tabs */}
      <div className="flex bg-[#1d1d1d]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 flex items-center gap-2 text-sm font-medium transition-all duration-200
              ${activeTab === tab.id 
                ? 'bg-[#2a2a2a] text-[#60cdff] border-b-2 border-[#60cdff] shadow-sm' 
                : 'hover:bg-[#252525] text-gray-300 hover:text-gray-100'
              }`}
            onClick={() => {
              setActiveTab(tab.id);
              // Navigate to the corresponding page based on tab id
              switch(tab.id) {
                case 'home':
                  clearActiveModule();
                  navigate('/');
                  break;
                case 'journal':
                  clearActiveModule();
                  navigate('/journal');
                  break;
                case 'guided':
                  navigate('/journal', { state: { forceGuidedMode: true } });
                  break;
                case 'core':
                  navigate('/memories');
                  break;
                case 'profile':
                  navigate('/profile');
                  break;
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ribbon Content */}
      <div className="flex p-2 bg-[#1a1a1a]">
        {ribbonContent[activeTab]?.map(group => (
          <div key={group.id} className="flex flex-col mx-2 px-3 border-r border-[#333333] last:border-r-0">
            <div className="flex flex-wrap gap-1 items-start justify-center min-h-[40px]">
              {group.items.map(item => renderRibbonItem(item))}
            </div>
            <div className="text-[10px] text-center text-gray-400 mt-1 font-medium">
              {group.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WindowsRibbon;
