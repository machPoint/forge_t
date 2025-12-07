
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useModules } from "@/hooks/useModules";
import { PlusCircle, Edit } from "lucide-react";
import { useJournal } from "@/hooks/useJournal";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { useTheme } from "@/lib/themes/simple-themes";

const ModulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { modules } = useModules();
  const { startNewModuleSession, moduleProgress } = useJournal();
  const { theme } = useTheme();

  const renderIcon = (iconName: string) => {
    // Cast to unknown first to avoid TypeScript error
    const iconSet = LucideIcons as unknown;
    // Then cast to the appropriate type
    const icons = iconSet as Record<string, React.ComponentType<{ className?: string }>>;
    const Icon = icons[iconName] || LucideIcons.BookOpen;
    return <Icon className="h-5 w-5" />;
  };

  const handleSelectModule = (moduleId: string) => {
    // Start the module session first
    startNewModuleSession(moduleId);
    
    // Navigate to the dedicated module route
    navigate(`/modules/${moduleId}`, { 
      replace: true, 
      state: { 
        forceGuidedMode: true,
        activeModuleId: moduleId 
      } 
    });
  };

  const [selectedModule, setSelectedModule] = React.useState<string | null>(null);

  return (
    <div className="h-full flex" style={{ backgroundColor: theme.styles.primaryBg, color: theme.styles.primaryText }}>
        {/* Left Sidebar - Module List */}
        <div className="bg-app-sidebar border-r min-w-[280px] max-w-[320px] w-[25%] flex-shrink-0 transition-all duration-200" style={{ borderColor: theme.styles.primaryBorder }}>
          <div className="p-4 border-b border-app-border-divider">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-app-text-primary">Modules</h2>
              <Button 
                onClick={() => navigate("/add-module")} 
                size="sm"
                className="bg-app-bg-secondary hover:bg-app-bg-tertiary text-app-text-primary border-app-border-primary"
              >
                <PlusCircle className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm text-app-text-secondary">Select a module to begin</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {modules.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-app-text-tertiary text-sm mb-4">No modules available</p>
                <Button 
                  onClick={() => navigate("/add-module")} 
                  size="sm"
                  className="bg-app-bg-secondary hover:bg-app-bg-tertiary text-app-text-primary"
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  Create Module
                </Button>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {modules.map((module) => {
                  const progress = moduleProgress[module.id];
                  const currentStep = progress?.currentStep || 0;
                  const totalSteps = module.steps.length;
                  
                  // Calculate completed steps by checking entries (same logic as GuidedStepsSidebar)
                  const completedCount = progress && module.steps ? module.steps.filter(
                    (step) => {
                      const entry = progress.entries?.[step.id];
                      return typeof entry === 'object' && entry?.completed;
                    }
                  ).length : 0;
                  
                  const percentComplete = progress && totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
                  const isSelected = selectedModule === module.id;
                  
                  return (
                    <Card 
                      key={module.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 border-gray-600",
                        isSelected 
                          ? "bg-[#0e639c]" 
                          : "bg-[#3e3e42] hover:bg-[#4a4a4f]"
                      )}
                      onClick={() => setSelectedModule(module.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          <div className="bg-gray-700 p-1.5 rounded-md flex-shrink-0">
                            {renderIcon(module.icon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-app-text-primary text-sm truncate">
                              {module.title}
                            </h3>
                            <p className="text-xs text-app-text-secondary mb-2">
                              {module.category}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-app-text-tertiary">{totalSteps} steps</span>
                              {progress && (
                                <span className="font-medium text-app-text-secondary">
                                  {percentComplete}%
                                </span>
                              )}
                            </div>
                            
                            {progress && (
                              <div className="w-full bg-app-bg-secondary rounded-full h-1">
                                <div 
                                  className="bg-app-bg-active h-1 rounded-full transition-all duration-300" 
                                  style={{ width: `${percentComplete}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.styles.primaryBg }}>
          {selectedModule ? (
            <div>
              {(() => {
                const module = modules.find(m => m.id === selectedModule);
                if (!module) return null;
                
                const progress = moduleProgress[module.id];
                const currentStep = progress?.currentStep || 0;
                const totalSteps = module.steps.length;
                
                // Calculate completed steps by checking entries (same logic as GuidedStepsSidebar)
                const completedCount = progress && module.steps ? module.steps.filter(
                  (step) => {
                    const entry = progress.entries?.[step.id];
                    return typeof entry === 'object' && entry?.completed;
                  }
                ).length : 0;
                
                const percentComplete = progress && totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
                
                return (
                  <div className="max-w-2xl">
                    <div className="flex items-center mb-6">
                      <div className="mr-4 bg-app-bg-secondary p-3 rounded-lg">
                        {renderIcon(module.icon)}
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-app-text-primary">{module.title}</h1>
                        <p className="text-app-text-secondary">{module.category}</p>
                      </div>
                    </div>
                    
                    <p className="text-app-text-primary mb-6 leading-relaxed">
                      {module.description}
                    </p>
                    
                    <div className="bg-app-bg-secondary rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-app-text-secondary">Progress</span>
                        <span className="text-sm font-medium text-app-text-primary">
                          {progress ? `${completedCount}/${totalSteps} steps` : `0/${totalSteps} steps`}
                        </span>
                      </div>
                      <div className="w-full bg-app-bg-tertiary rounded-full h-2 mb-2">
                        <div 
                          className="bg-app-bg-active h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentComplete}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-app-text-tertiary">
                        {percentComplete}% complete
                      </p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => handleSelectModule(module.id)}
                        className="bg-app-bg-secondary hover:bg-app-bg-tertiary text-app-text-primary"
                      >
                        {progress && !progress.isComplete ? "Continue Module" : "Start Module"}
                      </Button>
                      <Button 
                        onClick={() => navigate(`/add-module?edit=${module.id}`)}
                        variant="outline"
                        className="border-app-border-primary text-app-text-secondary hover:bg-app-bg-secondary"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Module
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-xl font-medium text-app-text-secondary mb-2">Guided Modules</h2>
                <p className="text-app-text-tertiary mb-8">Select a guided module from the sidebar to begin a structured writing exercise.</p>
                {modules.length === 0 && (
                  <Button onClick={() => navigate("/add-module")} className="bg-app-bg-secondary hover:bg-app-bg-tertiary text-app-text-primary">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Browse Modules
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default ModulesPage;
