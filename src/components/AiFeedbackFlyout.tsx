import React from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Brain, Heart, Target, CircleHelp, X, Sparkles, Lightbulb, Compass, Shield, Star, Flame, Zap, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getPersonaById } from "@/lib/aiPersonas";
import { JournalEntry } from "@/hooks/useJournal";

const personaIcons: { [key: string]: React.ReactNode } = {
  brain: <Brain className="h-5 w-5" />,
  heart: <Heart className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
  psychology: <CircleHelp className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />,
  lightbulb: <Lightbulb className="h-5 w-5" />,
  compass: <Compass className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  flame: <Flame className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
  bookopen: <BookOpen className="h-5 w-5" />,
  // Legacy mappings for backward compatibility
  jungian: <CircleHelp className="h-5 w-5" />,
  cbt: <Brain className="h-5 w-5" />,
  supportive: <Heart className="h-5 w-5" />,
  stern: <Target className="h-5 w-5" />,
};

interface AiFeedbackFlyoutProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEntry?: JournalEntry | null;
  isGeneratingFeedback: boolean;
  children?: React.ReactNode; // For the trigger element
}

const AiFeedbackFlyout: React.FC<AiFeedbackFlyoutProps> = ({
  isOpen,
  onOpenChange,
  selectedEntry,
  isGeneratingFeedback,
  children
}) => {
  console.log('[AiFeedbackFlyout] Render with:', { isOpen, hasEntry: !!selectedEntry, isGeneratingFeedback });

  const persona = selectedEntry?.personaId 
    ? getPersonaById(selectedEntry.personaId)
    : null;

  // Clean up AI feedback text by removing escaped characters and improving formatting
  const cleanFeedbackText = (text: string): string => {
    if (!text) return text;
    
    let cleanedText = text;
    
    // First, try to parse as JSON if it looks like JSON
    if (typeof cleanedText === 'string' && (cleanedText.trim().startsWith('{') || cleanedText.trim().startsWith('"'))) {
      try {
        const parsed = JSON.parse(cleanedText);
        
        // Extract text from various possible JSON structures
        if (typeof parsed === 'object' && parsed !== null) {
          // Handle { "text": "content" } format
          if (parsed.text) {
            cleanedText = parsed.text;
          }
          // Handle { "feedback": "content" } format
          else if (parsed.feedback) {
            cleanedText = parsed.feedback;
          }
          // Handle { "content": "text" } format
          else if (parsed.content) {
            cleanedText = parsed.content;
          }
          // If it's just a plain object, convert to string
          else {
            cleanedText = JSON.stringify(parsed);
          }
        }
        // If parsed result is a string, use it directly
        else if (typeof parsed === 'string') {
          cleanedText = parsed;
        }
      } catch (e) {
        // If JSON parsing fails, continue with original text
        console.log('Failed to parse feedback as JSON, using as-is');
      }
    }
    
    // Now clean up the text formatting
    return cleanedText
      // Replace escaped newlines with actual newlines
      .replace(/\\n/g, '\n')
      // Remove extra backslashes
      .replace(/\\\\/g, '\\')
      // Clean up quotes
      .replace(/\\"/g, '"')
      // Remove any remaining escape characters before common punctuation
      .replace(/\\([.,!?;:])/g, '$1')
      // Remove surrounding quotes if the whole text is quoted
      .replace(/^"(.*)"$/s, '$1')
      // Clean up multiple consecutive newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim whitespace
      .trim();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
             <SheetContent 
         side="right" 
         className="bg-[#1d1d1d] border-l border-[#23232a] text-white !w-[80%] !max-w-[80%] !min-w-[80%]"
         aria-describedby="ai-feedback-content"
       >
         <SheetHeader>
           <SheetTitle className="text-lg font-semibold text-gray-200">AI Feedback</SheetTitle>
         </SheetHeader>
        
                 <div id="ai-feedback-content" className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {selectedEntry ? (
            <>
              {persona && (
                <div className="flex items-center gap-2 mb-4 p-2 bg-[#333333] rounded-lg border border-gray-700">
                  <div 
                    className="p-1.5 rounded-full"
                    style={{ backgroundColor: `${persona.accentColor}20` }}
                  >
                    {personaIcons[persona.id]}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-200">{persona.name}</div>
                    <div className="text-xs text-gray-400">{persona.description}</div>
                  </div>
                </div>
              )}
              
              {isGeneratingFeedback ? (
                <div className="space-y-3 animate-pulse">
                  <Skeleton className="h-4 w-full bg-gray-700" />
                  <Skeleton className="h-4 w-[90%] bg-gray-700" />
                  <Skeleton className="h-4 w-[95%] bg-gray-700" />
                  <Skeleton className="h-4 w-[85%] bg-gray-700" />
                  <Skeleton className="h-4 w-full bg-gray-700" />
                  <Skeleton className="h-4 w-[90%] bg-gray-700" />
                </div>
              ) : selectedEntry.feedback ? (
                <div className="max-w-none">
                  <div className="whitespace-pre-line text-sm leading-relaxed text-gray-300 px-1">
                    {cleanFeedbackText(selectedEntry.feedback)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">
                    AI feedback will appear here once generated.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">
                Select or create an entry to see AI feedback.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AiFeedbackFlyout;
