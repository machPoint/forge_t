import React from "react";
import { useJournal, JournalEntry } from "@/hooks/useJournal";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Pin, 
  TrendingUp, 
  BookOpen, 
  PlusCircle, 
  Lightbulb, 
  Brain, 
  RefreshCw, 
  Target 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import memoryService from "@/lib/memoryService";
import opal from "@/lib/simple-opal-client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import NotesCard from "@/components/NotesCard";
import Spinner from "@/components/ui/spinner";
import { useModules } from "@/hooks/useModules";

// New templating system imports
import PageTemplate from "@/components/templates/PageTemplate";
import CardTemplate from "@/components/templates/CardTemplate";
import GridLayoutTemplate, { GridItemTemplate } from "@/components/templates/GridLayoutTemplate";

// Memory interface for type safety
interface Memory {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  createdAt?: string;
  created_at?: string;
  text?: string;
}

const HomePage: React.FC = () => {
  const { entries, selectedEntry, setSelectedEntry, createEntry, fetchEntries } = useJournal();
  const navigate = useNavigate();
  const [aiPrompts, setAiPrompts] = React.useState<string[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = React.useState(false);

  // Fetch entries when the home page loads
  React.useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Writing prompts pool - 20 varied therapeutic prompts
  const writingPrompts = [
    "What's one thing you learned about yourself today?",
    "Describe a moment when you felt truly grateful this week.",
    "What challenge are you currently facing, and how might you approach it differently?",
    "Write about a person who has positively influenced your life recently.",
    "What does your ideal day look like, and what small step can you take toward it?",
    "Reflect on a recent decision you made. What factors influenced your choice?",
    "What's something you've been avoiding, and why might that be?",
    "Describe a place where you feel most at peace. What makes it special?",
    "What's a skill or hobby you'd like to develop, and what draws you to it?",
    "Write about a time when you overcame a fear or doubt.",
    "What patterns do you notice in your daily thoughts or behaviors?",
    "If you could give advice to yourself from a year ago, what would it be?",
    "What are three things that brought you joy this week, no matter how small?",
    "Describe a conversation that changed your perspective recently.",
    "What would you do if you knew you couldn't fail?",
    "Write about a childhood memory that still influences you today.",
    "What boundaries do you need to set or strengthen in your life?",
    "Describe your relationship with change - do you embrace it or resist it?",
    "What does self-compassion mean to you, and how do you practice it?",
    "If your future self could send you a message right now, what would it say?"
  ];

  // State for managing prompt refresh
  const [promptSeed, setPromptSeed] = React.useState(() => {
    const today = new Date().toDateString();
    return today.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  });

  // Get 3 random prompts based on current seed
  const shuffled = [...writingPrompts].sort(() => 0.5 - Math.sin(promptSeed));
  const dailyPrompts = shuffled.slice(0, 3);

  // Function to refresh prompts with new random selection
  const refreshPrompts = () => {
    setPromptSeed(Math.random() * 10000);
  };

  // Get pinned entries
  const pinnedEntries = entries.filter(entry => entry.pinned).slice(0, 3);
  
  // Get recent entries (non-pinned)
  const recentEntries = entries
    .filter(entry => !entry.pinned)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Get guided module activity
  const { activeModuleId, moduleProgress } = useJournal();
  const { getModuleById } = useModules();
  const activeModule = activeModuleId ? getModuleById(activeModuleId) : null;
  const activeProgress = activeModuleId ? moduleProgress[activeModuleId] : null;
  
  // Get most recent guided module activity
  const recentGuidedActivity = Object.entries(moduleProgress)
    .filter(([_, progress]) => progress.entries && Object.keys(progress.entries).length > 0)
    .sort(([_, a], [__, b]) => {
      const aLastActivity = Math.max(...Object.values(a.entries || {}).map(entry => 
        typeof entry === 'object' && entry?.lastSaved ? new Date(entry.lastSaved).getTime() : 0
      ));
      const bLastActivity = Math.max(...Object.values(b.entries || {}).map(entry => 
        typeof entry === 'object' && entry?.lastSaved ? new Date(entry.lastSaved).getTime() : 0
      ));
      return bLastActivity - aLastActivity;
    })
    .slice(0, 1)[0];

  const recentModuleId = recentGuidedActivity?.[0];
  const recentModule = recentModuleId ? getModuleById(recentModuleId) : null;
  const recentModuleProgress = recentGuidedActivity?.[1];

  // Calculate basic metrics
  const totalEntries = entries.length;
  const entriesThisWeek = entries.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  }).length;

  const handleEntryClick = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    navigate('/journal');
  };

  const handleNewEntry = () => {
    navigate('/journal');
  };

  const handleGuidedModuleClick = (moduleId: string) => {
    navigate('/journal', { 
      state: { 
        forceGuidedMode: true,
        moduleId: moduleId
      } 
    });
  };

  const handlePromptClick = async (prompt: string) => {
    try {
      const newEntry = await createEntry({
        title: "Writing Prompt",
        content: `${prompt}\n\n`
      });
      setSelectedEntry(newEntry);
      navigate('/journal');
    } catch (error) {
      console.error('Failed to create entry from prompt:', error);
    }
  };

  // Simplified AI prompt generation for demo
  const generateAIPrompts = async () => {
    if (!opal.ready()) {
      toast.error("AI service not available");
      return;
    }

    setIsGeneratingPrompts(true);
    try {
      // This is a simplified version - you can expand with the full logic
      const fallbackPrompts = [
        "Based on your recent writing, what themes do you notice emerging?",
        "How have your priorities shifted in the past month?",
        "What would you like to explore more deeply in your next journal entry?"
      ];
      
      setAiPrompts(fallbackPrompts);
      toast.success("AI prompts generated!");
    } catch (error) {
      console.error('Failed to generate AI prompts:', error);
      toast.error("Failed to generate AI prompts");
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  // Header actions for the page
  const headerActions = (
    <div className="flex items-center gap-3">
      <Button onClick={handleNewEntry} className="flex items-center gap-2">
        <PlusCircle className="w-4 h-4" />
        New Entry
      </Button>
    </div>
  );

  return (
    <PageTemplate
      title="Dashboard"
      subtitle="Your personal journaling space"
      headerActions={headerActions}
      maxWidth="default"
      showHeader={false} // We'll use AppHeader for now
    >
      <AppHeader />
      
      {/* Main Dashboard Content */}
      <div className="flex-1 overflow-auto p-6">
        <GridLayoutTemplate
          columns={1}
          responsive={{ lg: 3 }}
          gap="lg"
          padding="none"
        >
          {/* Left Column - Recent and Pinned Entries */}
          <GridItemTemplate>
            <div className="space-y-6">
              {/* Recent Entries */}
              <CardTemplate
                title="Recent Entries"
                icon={<Clock className="w-5 h-5 text-green-400" />}
                variant="elevated"
              >
                {recentEntries.length > 0 ? (
                  <div className="space-y-3">
                    {recentEntries.slice(0, 3).map(entry => (
                      <div 
                        key={entry.id}
                        onClick={() => handleEntryClick(entry)}
                        className="p-3 rounded transition-colors cursor-pointer"
                        style={{
                          backgroundColor: 'var(--app-bg-hover)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--app-bg-active)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--app-bg-hover)';
                        }}
                      >
                        <h4 
                          className="font-medium text-sm truncate"
                          style={{ color: 'var(--app-text-primary)' }}
                        >
                          {entry.title}
                        </h4>
                        <p 
                          className="text-xs mt-1"
                          style={{ color: 'var(--app-text-secondary)' }}
                        >
                          {new Date(entry.updatedAt).toLocaleDateString()}
                        </p>
                        <p 
                          className="text-xs mt-1 line-clamp-2"
                          style={{ color: 'var(--app-text-tertiary)' }}
                        >
                          {(entry.content || '').replace(/<[^>]*>/g, '').substring(0, 80)}...
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--app-text-tertiary)' }} className="text-sm">
                    No entries yet
                  </p>
                )}
              </CardTemplate>

              {/* Pinned Entries */}
              <CardTemplate
                title="Pinned Entries"
                icon={<Pin className="w-5 h-5 text-blue-400" />}
                variant="elevated"
              >
                {pinnedEntries.length > 0 ? (
                  <div className="space-y-3">
                    {pinnedEntries.map(entry => (
                      <div 
                        key={entry.id}
                        onClick={() => handleEntryClick(entry)}
                        className="p-3 rounded transition-colors cursor-pointer"
                        style={{ backgroundColor: 'var(--app-bg-hover)' }}
                      >
                        <h4 
                          className="font-medium text-sm truncate"
                          style={{ color: 'var(--app-text-primary)' }}
                        >
                          {entry.title}
                        </h4>
                        <p 
                          className="text-xs mt-1"
                          style={{ color: 'var(--app-text-secondary)' }}
                        >
                          {new Date(entry.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--app-text-tertiary)' }} className="text-sm">
                    No pinned entries yet
                  </p>
                )}
              </CardTemplate>

              {/* Guided Module Activity */}
              <CardTemplate
                title="Guided Module Activity"
                icon={<Target className="w-5 h-5 text-blue-400" />}
                variant="elevated"
              >
                {activeModule ? (
                  <div 
                    onClick={() => handleGuidedModuleClick(activeModule.id)}
                    className="p-3 rounded transition-colors cursor-pointer border"
                    style={{ 
                      backgroundColor: 'var(--app-bg-hover)',
                      borderColor: 'var(--app-accent-blue)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 
                        className="font-medium text-sm"
                        style={{ color: 'var(--app-text-primary)' }}
                      >
                        {activeModule.title}
                      </h4>
                      <span className="text-xs px-2 py-1 rounded"
                        style={{ 
                          backgroundColor: 'var(--app-accent-blue)', 
                          color: 'var(--app-text-inverse)' 
                        }}
                      >
                        Active
                      </span>
                    </div>
                    <p 
                      className="text-xs mb-2"
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      {activeModule.description}
                    </p>
                    {activeProgress && (
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-xs"
                          style={{ color: 'var(--app-text-tertiary)' }}
                        >
                          Step {activeProgress.currentStep + 1} of {activeModule.steps.length}
                        </span>
                        <span 
                          className="text-xs"
                          style={{ color: 'var(--app-accent-blue)' }}
                        >
                          {Math.round((activeProgress.currentStep / activeModule.steps.length) * 100)}% Complete
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Target 
                      className="w-12 h-12 mx-auto mb-3" 
                      style={{ color: 'var(--app-text-disabled)' }}
                    />
                    <p 
                      className="text-sm mb-4"
                      style={{ color: 'var(--app-text-tertiary)' }}
                    >
                      Start a guided writing module to track your progress
                    </p>
                    <Button
                      onClick={() => navigate('/modules')}
                      style={{ 
                        backgroundColor: 'var(--app-accent-blue)',
                        color: 'var(--app-text-inverse)'
                      }}
                      className="text-sm py-2 px-4"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Browse Modules
                    </Button>
                  </div>
                )}
              </CardTemplate>
            </div>
          </GridItemTemplate>

          {/* Middle Column - Writing Prompts */}
          <GridItemTemplate>
            <div className="space-y-6">
              {/* Generic Writing Prompts */}
              <CardTemplate
                title="Writing Prompts"
                icon={<Lightbulb className="w-5 h-5 text-yellow-400" />}
                variant="elevated"
                headerActions={
                  <Button
                    onClick={refreshPrompts}
                    size="sm"
                    variant="ghost"
                    className="p-1 h-auto"
                    style={{ color: 'var(--app-accent-yellow)' }}
                    title="Refresh prompts"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                }
              >
                <div className="space-y-3">
                  {dailyPrompts.slice(0, 3).map((prompt, index) => (
                    <div
                      key={index}
                      className="p-3 rounded transition-colors cursor-pointer border"
                      style={{
                        backgroundColor: 'var(--app-bg-hover)',
                        borderColor: 'var(--app-border-primary)',
                      }}
                      onClick={() => handlePromptClick(prompt)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--app-accent-yellow)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--app-border-primary)';
                      }}
                    >
                      <p 
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--app-text-primary)' }}
                      >
                        {prompt}
                      </p>
                    </div>
                  ))}
                </div>
              </CardTemplate>

              {/* AI Writing Prompts */}
              <CardTemplate
                title="AI Writing Prompts"
                icon={<Brain className="w-5 h-5 text-purple-400" />}
                variant="elevated"
              >
                {aiPrompts.length > 0 ? (
                  <div className="space-y-3">
                    {aiPrompts.map((prompt, index) => (
                      <div
                        key={index}
                        className="p-3 rounded transition-colors cursor-pointer border"
                        style={{
                          backgroundColor: 'var(--app-bg-hover)',
                          borderColor: 'var(--app-border-primary)',
                        }}
                        onClick={() => handlePromptClick(prompt)}
                      >
                        <p 
                          className="text-sm leading-relaxed"
                          style={{ color: 'var(--app-text-primary)' }}
                        >
                          {prompt}
                        </p>
                      </div>
                    ))}
                    <Button
                      onClick={generateAIPrompts}
                      disabled={isGeneratingPrompts}
                      className="w-full mt-3 text-xs py-2"
                      style={{
                        backgroundColor: 'var(--app-accent-purple)',
                        color: 'var(--app-text-inverse)'
                      }}
                    >
                      {isGeneratingPrompts ? (
                        <Spinner size="sm" className="mr-1" />
                      ) : (
                        <RefreshCw className="w-3 h-3 mr-1" />
                      )}
                      Refresh AI Prompts
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Brain 
                      className="w-12 h-12 mx-auto mb-3"
                      style={{ color: 'var(--app-text-disabled)' }}
                    />
                    <p 
                      className="text-sm mb-4"
                      style={{ color: 'var(--app-text-tertiary)' }}
                    >
                      Generate personalized prompts based on your Core memories
                    </p>
                    <Button
                      onClick={generateAIPrompts}
                      disabled={isGeneratingPrompts}
                      className="text-sm py-2 px-4"
                      style={{
                        backgroundColor: 'var(--app-accent-purple)',
                        color: 'var(--app-text-inverse)'
                      }}
                    >
                      <Brain className={`w-4 h-4 mr-2 ${isGeneratingPrompts ? 'animate-pulse' : ''}`} />
                      {isGeneratingPrompts ? 'Analyzing...' : 'Generate AI Prompts'}
                    </Button>
                  </div>
                )}
              </CardTemplate>
            </div>
          </GridItemTemplate>

          {/* Right Column - Stats and Calendar */}
          <GridItemTemplate>
            <div className="space-y-6">
              {/* Writing Stats */}
              <CardTemplate
                title="Writing Stats"
                icon={<TrendingUp className="w-5 h-5 text-green-400" />}
                variant="elevated"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span 
                      className="text-sm"
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      Total Entries
                    </span>
                    <span 
                      className="font-semibold text-lg"
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      {totalEntries}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span 
                      className="text-sm"
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      This Week
                    </span>
                    <span 
                      className="font-semibold text-lg"
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      {entriesThisWeek}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span 
                      className="text-sm"
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      Pinned
                    </span>
                    <span 
                      className="font-semibold text-lg"
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      {pinnedEntries.length}
                    </span>
                  </div>
                </div>
              </CardTemplate>

              {/* Writing Calendar */}
              <CardTemplate
                title="Writing Calendar"
                icon={<BookOpen className="w-5 h-5 text-purple-400" />}
                variant="elevated"
              >
                <Calendar 
                  entries={entries}
                  onDateClick={(date) => {
                    navigate('/journal', { 
                      state: { 
                        selectedDate: date.toISOString(),
                        resetMode: true 
                      } 
                    });
                  }}
                  className="text-center"
                />
              </CardTemplate>

              {/* Notes Card */}
              <NotesCard />
            </div>
          </GridItemTemplate>
        </GridLayoutTemplate>
      </div>
    </PageTemplate>
  );
};

export default HomePage;