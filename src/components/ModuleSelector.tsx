
import React from "react";
import { useJournal } from "@/hooks/useJournal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, RefreshCw, CheckCircle } from "lucide-react";
import { useModules } from "@/hooks/useModules";

const ModuleSelector: React.FC = () => {
  const { activeModuleId, moduleProgress, startNewModuleSession, setSelectedEntry, addEntry } = useJournal();
  const { modules } = useModules();

  const handleSelectModule = (moduleId: string) => {
    startNewModuleSession(moduleId);
    
    // Create a new entry for this module session
    const selectedModule = modules.find(m => m.id === moduleId);
    if (selectedModule && selectedModule.steps && selectedModule.steps.length > 0) {
      const firstStep = selectedModule.steps[0];
      const newEntry = {
        title: `${selectedModule.title} - ${firstStep.title}`,
        content: "",
        moduleId: moduleId,
        moduleStep: firstStep.id,
      };
      addEntry(newEntry);
    }
  };

  const getModuleStatusIcon = (moduleId: string) => {
    const progress = moduleProgress[moduleId];
    
    if (!progress) {
      return <ChevronRight className="h-5 w-5 text-gray-400" />;
    }
    
    if (progress.isComplete) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    
    return <RefreshCw className="h-5 w-5 text-amber-500" />;
  };

  // Ensure we have modules before trying to map over them
  const modulesList = Array.isArray(modules) ? modules : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-3">
        {modulesList.map((module) => {
          const isActive = module.id === activeModuleId;
          const progress = moduleProgress[module.id];
          const currentStep = progress?.currentStep || 0;
          const totalSteps = module.steps?.length || 0;
          
          // Calculate completed steps by checking entries (same logic as GuidedStepsSidebar)
          const completedCount = progress && module.steps ? module.steps.filter(
            (step) => {
              const entry = progress.entries?.[step.id];
              return typeof entry === 'object' && entry?.completed;
            }
          ).length : 0;
          
          const percentComplete = progress && totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
          
          return (
            <Card 
              key={module.id}
              className={cn(
                "p-4 transition-all duration-200 hover:shadow-md overflow-hidden",
                isActive ? "ring-2 ring-primary shadow-sm" : "hover:bg-gray-50"
              )}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800">{module.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>
                  
                  {progress && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          {progress.isComplete ? "Completed" : `${completedCount} of ${totalSteps} steps`}
                        </span>
                        <span className="text-xs font-semibold text-gray-700">
                          {percentComplete}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${percentComplete}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="ml-3 flex-shrink-0">
                  {getModuleStatusIcon(module.id)}
                </div>
              </div>
              
              <div className="mt-3 flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleSelectModule(module.id)}
                >
                  {progress && !progress.isComplete ? "Continue" : "Start"}
                </Button>
              </div>
            </Card>
          );
        })}

        {(!modulesList || modulesList.length === 0) && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No modules available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleSelector;
