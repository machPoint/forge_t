
import React, { useState } from "react";
import { useJournal, JournalEntry } from "@/hooks/useJournal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import JournalRichEditor from "../JournalRichEditor";
import AIPersonaSelector from "../AIPersonaSelector";
import { Send, Save, Star, Archive, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface EmptyStateEditorProps {
  addEntry: (entry: Partial<JournalEntry>) => void;
  activePersonaId: string;
  setIsGeneratingFeedback: (isGenerating: boolean) => void;
  onFeedbackRequest?: () => void;
}

const EmptyStateEditor: React.FC<EmptyStateEditorProps> = ({
  addEntry,
  activePersonaId,
  setIsGeneratingFeedback,
  onFeedbackRequest
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Handle content changes
  const handleContentChange = (value: string) => {
    // Ensure value is a string
    const safeValue = typeof value === 'string' ? value : '';
    setContent(safeValue);
  };

  // Save as new entry
  const handleSave = () => {
    addEntry({
      title: title || "Untitled Entry",
      content,
      personaId: activePersonaId
    });
    toast.success("New entry created");
  };

  // Removed generateFeedback function as it's now handled by the WindowsRibbon

  return (
    <Card className="h-full flex flex-col shadow-md border-gray-200/50 dark:border-gray-700/30 overflow-hidden">
      <CardHeader className="pb-0 bg-[#2d2d2d] border-b border-gray-500" style={{ borderRadius: 0 }}>
        <div className="flex items-center justify-between p-4">
          {/* Left Section - Title */}
          <div className="flex-1 mr-4">
            <Input
              placeholder="Entry title..."
              className="text-xl font-medium border-none shadow-none focus-visible:ring-0 px-0"
              onChange={(e) => setTitle(e.target.value)}
              value={title}
            />
          </div>
          
          {/* Center Section - Command Buttons */}
          <div className="flex items-center gap-1 mx-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-yellow-400 h-8 w-8 p-0"
              style={{ borderRadius: 0 }}
              aria-label="Star"
              disabled
            >
              <Star className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-200 h-8 w-8 p-0"
              style={{ borderRadius: 0 }}
              aria-label="Archive"
              disabled
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
              style={{ borderRadius: 0 }}
              aria-label="Delete"
              disabled
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Right Section - Persona Selector */}
          <div className="ml-4">
            <AIPersonaSelector />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto px-3 pt-3 pb-0 flex flex-col">
        <JournalRichEditor 
          content={content} 
          onChange={handleContentChange} 
          placeholder="Start journaling here..."
          className="flex-1"
        />
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2 py-3">
        <Button 
          variant="outline"
          onClick={handleSave} 
          className="flex items-center gap-2"
        >
          <Save size={16} />
          <span>Save</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmptyStateEditor;
