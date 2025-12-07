
import React, { useState, useEffect } from "react";
import { useJournal, JournalEntry, ModuleProgress, StepEntry } from "@/hooks/useJournal";
import { useModules } from "@/hooks/useModules";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import JournalRichEditor from "../JournalRichEditor";
import { ArrowRight, ArrowLeft, Save, Check, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GuidedEditorProps {
  selectedEntry: JournalEntry | null;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  activeModuleId: string;
  moduleProgress: {
    [moduleId: string]: ModuleProgress;
  };
  updateModuleProgress: (
    moduleId: string, 
    updates: Partial<ModuleProgress>
  ) => void;
}

const GuidedEditor: React.FC<GuidedEditorProps> = ({
  selectedEntry,
  updateEntry,
  activeModuleId,
  moduleProgress,
  updateModuleProgress,
}) => {
  const { modules } = useModules();
  const [content, setContent] = useState("");

  // Get the current module from the dynamic modules store
  const { getModuleById } = useModules();
  const currentModule = activeModuleId ? getModuleById(activeModuleId) : null;

  // Initialize module progress if missing
  useEffect(() => {
    if (activeModuleId && !moduleProgress[activeModuleId]) {
      console.log('[GuidedEditor] Module progress missing, creating default progress for:', activeModuleId);
      // Start at -1 if module has introduction, otherwise start at 0
      const hasIntro = currentModule?.introduction;
      const defaultProgress = {
        moduleId: activeModuleId,
        currentStep: hasIntro ? -1 : 0,
        isComplete: false,
        entries: {},
      };
      updateModuleProgress(activeModuleId, defaultProgress);
    }
  }, [activeModuleId, moduleProgress, updateModuleProgress, currentModule]);
  const currentProgress = activeModuleId ? moduleProgress[activeModuleId] : null;
  const currentStepIndex = currentProgress?.currentStep || 0;
  // Ensure steps array exists before accessing it
  const currentSteps = currentModule?.steps || [];
  const currentStep = currentSteps[currentStepIndex];

  // Load content when step changes
  useEffect(() => {
    if (currentProgress && currentStep) {
      const stepEntry = currentProgress.entries?.[currentStep.id];
      let stepContent = "";
      
      if (typeof stepEntry === 'string') {
        stepContent = stepEntry;
      } else if (stepEntry && typeof stepEntry === 'object') {
        stepContent = stepEntry.content;
      }
      
      setContent(stepContent);
    }
  }, [currentProgress, currentStep]);

  // Handle content changes - only update local state, no auto-save
  const handleContentChange = (value: string) => {
    setContent(value);
    // Don't update the selected entry directly - we'll handle saving separately
  };
  
  // Save current progress without navigation or completion
  const handleSaveProgress = async () => {
    console.log('[GuidedEditor] Save button clicked', {
      activeModuleId,
      hasCurrentModule: !!currentModule,
      hasCurrentProgress: !!currentProgress,
      hasCurrentStep: !!currentStep,
      currentStepIndex,
      contentLength: content.length
    });
    
    if (!activeModuleId || !currentModule || !currentProgress || !currentStep) {
      console.warn('[GuidedEditor] Save blocked - missing required data');
      return;
    }
    
    try {
      // Strip HTML tags from content for clean text storage
      const cleanContent = content.replace(/<[^>]*>/g, '').trim();
      
      // Get current completion status (preserve existing completion status)
      const existingEntry = currentProgress.entries?.[currentStep.id];
      const isCompleted = existingEntry && typeof existingEntry === 'object' ? existingEntry.completed : false;
      
      // Save current step content with timestamp to module progress
      updateModuleProgress(activeModuleId, {
        entries: {
          ...(currentProgress.entries || {}),
          [currentStep.id]: {
            content: cleanContent,
            lastSaved: new Date().toISOString(),
            completed: isCompleted, // Don't auto-complete, preserve existing status
          },
        },
      });
      
      toast.success("Progress saved");
    } catch (error) {
      console.error("Failed to save progress:", error);
      toast.error("Failed to save progress");
    }
  };

  // Explicitly mark current step as completed
  const handleCompleteStep = () => {
    console.log('[GuidedEditor] Complete Step button clicked');
    if (!activeModuleId || !currentModule || !currentProgress || !currentStep) {
      console.warn('[GuidedEditor] Complete Step blocked - missing required data');
      return;
    }
    
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    
    updateModuleProgress(activeModuleId, {
      entries: {
        ...(currentProgress.entries || {}),
        [currentStep.id]: {
          content: cleanContent,
          lastSaved: new Date().toISOString(),
          completed: true, // Explicitly mark as completed
        },
      },
    });
    
    toast.success("Step completed!");
    
    // Move to next step if available
    if (currentSteps && currentStepIndex < currentSteps.length - 1) {
      const nextStep = currentStepIndex + 1;
      updateModuleProgress(activeModuleId, { currentStep: nextStep });
      
      // Load content from next step if it exists
      let nextStepContent = "";
      if (currentProgress.entries && currentSteps[nextStep]) {
        const stepEntry = currentProgress.entries[currentSteps[nextStep].id];
        if (typeof stepEntry === 'string') {
          nextStepContent = stepEntry;
        } else if (stepEntry && typeof stepEntry === 'object') {
          nextStepContent = stepEntry.content;
        }
      }
      setContent(nextStepContent);
    }
  };
  
  // Navigate to next step without completion (save and go)
  const handleNextStep = () => {
    console.log('[GuidedEditor] Next button clicked');
    if (!activeModuleId || !currentModule || !currentProgress) {
      console.warn('[GuidedEditor] Next blocked - missing required data');
      return;
    }
    
    // Save current step content but don't mark as completed
    if (currentStep) {
      const cleanContent = content.replace(/<[^>]*>/g, '').trim();
      const existingEntry = currentProgress.entries?.[currentStep.id];
      const isCompleted = existingEntry && typeof existingEntry === 'object' ? existingEntry.completed : false;
      
      updateModuleProgress(activeModuleId, {
        entries: {
          ...(currentProgress.entries || {}),
          [currentStep.id]: {
            content: cleanContent,
            lastSaved: new Date().toISOString(),
            completed: isCompleted, // Preserve completion status
          },
        },
      });
    }
    
    // Move to next step if available
    if (currentSteps && currentStepIndex < currentSteps.length - 1) {
      const nextStep = currentStepIndex + 1;
      updateModuleProgress(activeModuleId, { currentStep: nextStep });
      
      // Load content from next step if it exists
      let nextStepContent = "";
      if (currentProgress.entries && currentSteps[nextStep]) {
        const stepEntry = currentProgress.entries[currentSteps[nextStep].id];
        if (typeof stepEntry === 'string') {
          nextStepContent = stepEntry;
        } else if (stepEntry && typeof stepEntry === 'object') {
          nextStepContent = stepEntry.content;
        }
      }
      setContent(nextStepContent);
    }
  };
  
  // Complete the entire module (when all steps are completed)
  const handleCompleteModule = () => {
    if (!activeModuleId || !currentModule || !currentProgress) return;
    
    // Save current step as completed first
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    
    updateModuleProgress(activeModuleId, {
      entries: {
        ...(currentProgress.entries || {}),
        [currentStep.id]: {
          content: cleanContent,
          lastSaved: new Date().toISOString(),
          completed: true,
        },
      },
      isComplete: true,
    });
    
    toast.success("Module completed! Ready to save to Core.");
  };

  const handlePrevStep = () => {
    if (!activeModuleId || !currentModule || !currentProgress) return;
    
    // Save current step content but preserve completion status
    if (currentStep) {
      const cleanContent = content.replace(/<[^>]*>/g, '').trim();
      const existingEntry = currentProgress.entries?.[currentStep.id];
      const isCompleted = existingEntry && typeof existingEntry === 'object' ? existingEntry.completed : false;
      
      updateModuleProgress(activeModuleId, {
        entries: {
          ...(currentProgress.entries || {}),
          [currentStep.id]: {
            content: cleanContent,
            lastSaved: new Date().toISOString(),
            completed: isCompleted, // Preserve completion status
          },
        },
      });
    }
    
    // Move to previous step if available (or to intro if on step 0 and intro exists)
    if (currentStepIndex > 0) {
      const prevStep = currentStepIndex - 1;
      updateModuleProgress(activeModuleId, { currentStep: prevStep });
      
      // Load content from previous step if it exists
      let prevStepContent = "";
      if (currentProgress.entries && currentSteps[prevStep]) {
        const stepEntry = currentProgress.entries[currentSteps[prevStep].id];
        if (typeof stepEntry === 'string') {
          prevStepContent = stepEntry;
        } else if (stepEntry && typeof stepEntry === 'object') {
          prevStepContent = stepEntry.content;
        }
      }
      setContent(prevStepContent);
    }
  };

  if (!currentModule) {
    return null;
  }
  
  // If currentStepIndex is -1, show the introduction page
  if (currentStepIndex === -1 && currentModule.introduction) {
    return (
      <Card className="h-full flex flex-col shadow-md border-gray-200/50 dark:border-gray-700/30 overflow-hidden forge-card">
        <CardHeader>
          <h2 className="text-2xl font-semibold">{currentModule.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-xs font-medium bg-blue-500/10 text-blue-500 px-2 py-1" style={{borderRadius: 0}}>
              Introduction
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto px-6 pt-3 pb-6">
          <div className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-line text-app-text-primary leading-relaxed">
              {currentModule.introduction}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end py-3">
          <Button 
            onClick={() => {
              if (activeModuleId) {
                updateModuleProgress(activeModuleId, { currentStep: 0 });
              }
            }}
            className="flex items-center gap-2"
            style={{
              backgroundColor: 'var(--forge-button-primary)',
              borderColor: 'var(--forge-button-primary)',
              color: 'white'
            }}
          >
            <span>Begin Step 1</span>
            <ArrowRight size={16} />
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!currentStep) {
    return null;
  }
  
  // Check if current step is completed
  const currentStepEntry = currentProgress?.entries?.[currentStep.id];
  const isCurrentStepCompleted = currentStepEntry && typeof currentStepEntry === 'object' && currentStepEntry.completed;
  
  // Check if all steps are completed
  const allStepsCompleted = currentSteps.every(step => {
    const stepEntry = currentProgress?.entries?.[step.id];
    return stepEntry && typeof stepEntry === 'object' && stepEntry.completed;
  });
  
  // Check if we're on the last step
  const isLastStep = currentStepIndex === currentSteps.length - 1;

  return (
    <Card className="h-full flex flex-col shadow-md border-gray-200/50 dark:border-gray-700/30 overflow-hidden forge-card">
      <CardHeader>
        <h2 className="text-2xl font-semibold">{currentModule.title}</h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="text-xs font-medium bg-primary/10 text-primary px-2 py-1" style={{borderRadius: 0}}>
            Step {currentStepIndex + 1} of {currentSteps?.length || 0}
          </div>
          {currentProgress?.isComplete && (
            <div className="text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1" style={{borderRadius: 0}}>
              Complete
            </div>
          )}
          {isCurrentStepCompleted && (
            <div className="text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1" style={{borderRadius: 0}}>
              Step Complete
            </div>
          )}
        </div>
        
        <div className="p-4 border mt-3 forge-card" style={{
          backgroundColor: 'var(--forge-card-bg)',
          borderColor: 'var(--forge-border-primary)',
          borderRadius: 0
        }}>
          <h3 className="font-medium mb-1" style={{color: 'var(--forge-text-primary)'}}>{currentStep.title}</h3>
          <p className="text-sm mb-2" style={{color: 'var(--forge-text-secondary)'}}>{currentStep.description}</p>
          <p className="italic" style={{color: 'var(--forge-text-primary)'}}>{currentStep.prompt}</p>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto px-3 pt-0 pb-0 flex flex-col">
        <JournalRichEditor 
          content={content} 
          onChange={handleContentChange} 
          placeholder="Write your response here..."
          className="flex-1"
          disableAutoSave={true}
        />
      </CardContent>
      
      <CardFooter className="flex justify-between py-3">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0 && !currentModule.introduction}
            className={cn(
              "flex items-center gap-2",
              (currentStepIndex === 0 && !currentModule.introduction) ? "invisible" : ""
            )}
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={handleSaveProgress}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            <span>Save</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Complete Step button - only show if step is not completed yet */}
          {!isCurrentStepCompleted && (
            <Button 
              onClick={handleCompleteStep}
              className="flex items-center gap-2"
              style={{
                backgroundColor: 'var(--forge-success)',
                borderColor: 'var(--forge-success)',
                color: 'white'
              }}
            >
              <Check size={16} />
              <span>Complete Step</span>
            </Button>
          )}
          
          {/* Next button - only show if not on last step */}
          {!isLastStep && (
            <Button 
              onClick={handleNextStep}
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </Button>
          )}
          
          {/* Complete Module button - only show if all steps are completed */}
          {allStepsCompleted && !currentProgress?.isComplete && (
            <Button 
              onClick={handleCompleteModule}
              className="flex items-center gap-2"
              style={{
                backgroundColor: 'var(--forge-button-primary)',
                borderColor: 'var(--forge-button-primary)',
                color: 'white'
              }}
            >
              <CheckCircle size={16} />
              <span>Complete Module</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default GuidedEditor;
