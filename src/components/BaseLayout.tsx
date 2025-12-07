import React from "react";
import WindowsRibbon from "./WindowsRibbon";

interface BaseLayoutProps {
  children: React.ReactNode;
  showRibbon?: boolean;
  ribbonProps?: Record<string, unknown>;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ 
  children, 
  showRibbon = true, 
  ribbonProps = {} 
}) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#111111] to-[#222222] dark:from-[#111111] dark:to-[#222222]">
      {/* Windows-style Ribbon */}
      {showRibbon && <WindowsRibbon {...ribbonProps} />}
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] dark:from-[#1a1a1a] dark:to-[#2a2a2a]">
        {children}
      </div>
    </div>
  );
};

export default BaseLayout;
