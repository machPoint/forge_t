import React from "react";
import { useJournal } from "@/hooks/useJournal";
import { useModules } from "@/hooks/useModules";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Info } from "lucide-react";

const GuidedStepsSidebar: React.FC = () => {
  const { activeModuleId, moduleProgress, updateModuleProgress, saveCompletedModuleToCore, resetModuleProgress } = useJournal();
  const { getModuleById } = useModules();
  const module = activeModuleId ? getModuleById(activeModuleId) : null;
  const progress = activeModuleId ? moduleProgress[activeModuleId] : null;
  const currentStep = progress?.currentStep || 0;
  const entries = progress?.entries || {};
  const totalSteps = module?.steps.length || 0;
  const completedCount = module?.steps.filter(
    (step) => {
      const entry = entries[step.id];
      return typeof entry === 'object' && entry?.completed;
    }
  ).length || 0;

  if (!module) return null;

  const handleStepClick = (idx: number) => {
    if (activeModuleId && progress && idx !== currentStep) {
      updateModuleProgress(activeModuleId, { currentStep: idx });
    }
  };
  
  const handleIntroClick = () => {
    if (activeModuleId && progress && currentStep !== -1) {
      updateModuleProgress(activeModuleId, { currentStep: -1 });
    }
  };

  const handleResetModule = () => {
    if (activeModuleId && confirm('Are you sure you want to reset this module? All progress will be lost.')) {
      resetModuleProgress(activeModuleId);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden bg-background text-foreground">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-foreground mb-1">{module.title}</h1>
        <p className="text-xs text-muted-foreground mb-1">{module.description}</p>
        {/* Progress bar */}
        <div className="w-full h-2 mt-2 mb-1 bg-muted" style={{
          borderRadius: 0
        }}>
          <div
            className="h-2 transition-all bg-primary"
            style={{ 
              width: `${(completedCount / totalSteps) * 100}%`, 
              borderRadius: 0 
            }}
          ></div>
        </div>
        <div className="text-[10px] text-muted-foreground mb-1">
          {completedCount} of {totalSteps} steps completed
        </div>
        
        {/* Save to Core button - only show when module is complete */}
        {progress?.isComplete && (
          <Button
            onClick={() => activeModuleId && saveCompletedModuleToCore(activeModuleId)}
            className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
            style={{
              borderRadius: 'var(--radius)'
            }}
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Save to Core
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
        {/* Introduction step - only show if module has an introduction */}
        {module.introduction && (
          <div
            className={`p-2 hover:bg-accent cursor-pointer ${
              currentStep === -1 ? 'bg-accent text-accent-foreground' : ''
            }`}
            style={{ borderRadius: 0 }}
            onClick={handleIntroClick}
          >
            <div className="flex items-start">
              <Info className="w-4 h-4 text-primary mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-medium text-foreground">Introduction</h3>
                <p className="text-xs text-muted-foreground mt-1">Module Overview & Instructions</p>
              </div>
            </div>
          </div>
        )}
        
        {module.steps.map((step, idx) => {
          const stepEntry = entries[step.id];
          let status: "not-started" | "in-progress" | "completed" = "not-started";
          if (typeof stepEntry === 'object' && stepEntry?.completed) status = "completed";
          else if (typeof stepEntry === 'object' && stepEntry?.content) status = "in-progress";
          else if (typeof stepEntry === 'string' && stepEntry) status = "in-progress";
          const isActive = idx === currentStep;
          return (
            <div
              key={step.id}
              className={`p-2 hover:bg-accent cursor-pointer ${
                isActive ? 'bg-accent text-accent-foreground' : ''
              }`}
              style={{ borderRadius: 0 }}
              onClick={() => handleStepClick(idx)}
            >
              <div className="flex items-start">
                <div className={`w-2 h-2 rounded-full mt-1 mr-3 flex-shrink-0 ${
                  status === "completed" ? 'bg-green-500' : 
                  status === "in-progress" ? 'bg-yellow-500' : 
                  'bg-muted-foreground/30'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-foreground">Step {idx + 1}</h3>
                    {status === "completed" && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5" style={{borderRadius: 0}}>Completed</span>
                    )}
                    {status === "in-progress" && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5" style={{borderRadius: 0}}>In Progress</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{step.title}</p>
                  {typeof stepEntry === 'object' && stepEntry?.lastSaved && (
                    <p className="text-xs text-muted-foreground/70 mt-1">Last saved: {format(new Date(stepEntry.lastSaved), "MMM d, yyyy HH:mm")}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Reset Module Button - show when there's any progress */}
      {(progress && (Object.keys(entries).length > 0 || progress.isComplete)) && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button
            onClick={handleResetModule}
            variant="outline"
            className="w-full text-muted-foreground border-border hover:bg-destructive hover:text-destructive-foreground"
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Module
          </Button>
        </div>
      )}
    </div>
  );
};

export default GuidedStepsSidebar;
