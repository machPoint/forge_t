
import React from "react";
import { useJournal } from "@/hooks/useJournal";
import FreeformEditor from "./journal/FreeformEditor";
import GuidedEditor from "./journal/GuidedEditor";
import EmptyStateEditor from "./journal/EmptyStateEditor";
import NoModuleSelected from "./journal/NoModuleSelected";

interface JournalEditorProps {
  onFeedbackRequest: () => void;
  onSaveToCore?: () => void;
  saveToMemoryRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
  generateFeedbackRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ onFeedbackRequest, onSaveToCore, saveToMemoryRef, generateFeedbackRef }) => {
  const {
    entries,
    selectedEntry,
    currentMode,
    updateEntry,
    activeModuleId,
    moduleProgress,
    updateModuleProgress,
    setIsGeneratingFeedback,
    addFeedback,
    activePersonaId,
    addEntry,
    deleteEntry,
    toggleStarEntry,
    toggleArchiveEntry,
    togglePinEntry,
  } = useJournal();

  // Add a null check for the selectedEntry to avoid the "undefined is not iterable" error
  const validSelectedEntry = selectedEntry || null;

  return (
    <div className="h-full flex flex-col p-3">
      {currentMode === "freeform" && validSelectedEntry && (
        <FreeformEditor
          selectedEntry={validSelectedEntry}
          updateEntry={updateEntry}
          setIsGeneratingFeedback={setIsGeneratingFeedback}
          addFeedback={addFeedback}
          activePersonaId={activePersonaId}
          addEntry={addEntry}
          onFeedbackRequest={onFeedbackRequest}
          onSaveToCore={onSaveToCore}
          saveToMemoryRef={saveToMemoryRef}
          generateFeedbackRef={generateFeedbackRef}
          deleteEntry={deleteEntry}
          toggleStarEntry={toggleStarEntry}
          toggleArchiveEntry={toggleArchiveEntry}
          togglePinEntry={togglePinEntry}
        />
      )}

      {currentMode === "guided" && activeModuleId && (
        <GuidedEditor
          selectedEntry={validSelectedEntry}
          updateEntry={updateEntry}
          activeModuleId={activeModuleId}
          moduleProgress={moduleProgress || {}}
          updateModuleProgress={updateModuleProgress}
        />
      )}

      {(!validSelectedEntry && currentMode === "freeform") && (
        <EmptyStateEditor
          addEntry={addEntry}
          activePersonaId={activePersonaId}
          setIsGeneratingFeedback={setIsGeneratingFeedback}
          onFeedbackRequest={onFeedbackRequest}
        />
      )}
      
      {(!activeModuleId && currentMode === "guided") && (
        <NoModuleSelected />
      )}
    </div>
  );
};

export default JournalEditor;
