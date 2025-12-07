import React from "react";
import { useJournal, JournalEntry } from "@/hooks/useJournal";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Pin, TrendingUp, BookOpen, PlusCircle, Lightbulb, Brain, RefreshCw, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import memoryService from "@/lib/memoryService";
import opal from "@/lib/simple-opal-client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import NotesCard from "@/components/NotesCard";
import Spinner from "@/components/ui/spinner";
import { useModules } from "@/hooks/useModules";

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

  const generateAIPrompts = async () => {
    if (!opal.ready()) {
      toast.error("AI service not available");
      return;
    }

    setIsGeneratingPrompts(true);
    try {
      // Get Core memories for analysis (more important than journal entries)
      const coreMemoriesResponse = await memoryService.getMemories({});
      
      console.log('🔥 Core memories response:', coreMemoriesResponse);
      
      // Extract the actual memories array from the response
      let coreMemories: Memory[] = [];
      if (Array.isArray(coreMemoriesResponse)) {
        coreMemories = coreMemoriesResponse as Memory[];
      } else if (coreMemoriesResponse && typeof coreMemoriesResponse === 'object') {
        const response = coreMemoriesResponse as { content?: Memory[]; memories?: Memory[] };
        coreMemories = response.content || response.memories || [];
      }
      
      console.log('🔥 Extracted core memories:', coreMemories);
      
      if (!coreMemories || coreMemories.length === 0) {
        console.log('🔥 No core memories found, falling back to journal entries');
        // Fallback to recent journal entries if no Core memories
        const recentEntries = entries.slice(0, 2);
        if (recentEntries.length === 0) {
          toast.error("No entries found to analyze");
          return;
        }
        
        // Use journal entries as fallback
        const entriesContext = recentEntries.map(entry => ({
          title: entry.title,
          content: (entry.content || '').replace(/<[^>]*>/g, '').substring(0, 300),
          date: entry.createdAt
        }));
        
        const promptRequest = {
          memoriesContext: entriesContext.map(e => `${e.title}: ${e.content}`).join('\n\n'),
          systemPrompt: "Generate exactly 3 personalized writing prompts as questions based on the user's recent journal entries. Each prompt must be a complete question ending with a question mark (?). Focus on therapeutic self-reflection and personal growth. Format each prompt as a separate line starting with a number (1., 2., 3.).",
          identityProfile: null
        };
        
        const response = await opal.callTool('get_ai_insights', promptRequest);
        console.log('🔥 AI Response from journal entries:', response);
        
        if (response && response.content && Array.isArray(response.content)) {
          // Extract insights from the content array
          const insights = response.content;
          console.log('🔥 Extracted insights from journal entries:', insights);
          
          if (insights.length > 0) {
            // Extract prompts from the insights
            const allPrompts = insights
              .map(insight => insight.description || insight.title || insight)
              .filter(text => typeof text === 'string' && text.trim().length > 0)
              .slice(0, 3);
            
            console.log('🔥 Using fallback insights as prompts:', allPrompts);
            
            if (allPrompts.length > 0) {
              console.log('🔥 Setting AI prompts from journal entries (content):', allPrompts);
              setAiPrompts(allPrompts);
              toast.success("AI prompts generated from your recent entries!");
              return;
            }
          }
        } else if (response && response.insights) {
          // Fallback: try the old insights property
          const insights = response.insights;
          if (Array.isArray(insights) && insights.length > 0) {
            const allPrompts = insights
              .map(insight => insight.description || insight.title || insight)
              .filter(text => typeof text === 'string' && text.trim().length > 0)
              .slice(0, 3);
            
            if (allPrompts.length > 0) {
              console.log('🔥 Setting AI prompts from journal entries (insights property):', allPrompts);
              setAiPrompts(allPrompts);
              toast.success("AI prompts generated from your recent entries!");
              return;
            }
          }
        }
        
        toast.error("Could not generate AI prompts from journal entries");
        return;
      }

      // Remove debug logs since we've fixed the structure issue

      // Check if we have valid memories after filtering (handle both 'content' and 'text' fields)
      const validMemories = coreMemories.filter(memory => {
        if (!memory) return false;
        // Check if memory has content field or text field with parseable JSON
        if (memory.content) {
          console.log('🔥 Memory has content field:', memory.content.substring(0, 100));
          return true;
        }
        if (memory.text && typeof memory.text === 'string') {
          try {
            const parsed = JSON.parse(memory.text);
            console.log('🔥 Memory has text field, parsed JSON:', parsed);
            return Array.isArray(parsed) && parsed.length > 0;
          } catch (e) {
            console.log('🔥 Failed to parse memory text as JSON:', memory.text.substring(0, 100));
            return false;
          }
        }
        return false;
      });
      console.log('Valid memories count:', validMemories.length);
      
      if (validMemories.length === 0) {
        toast.error("No Core entries with valid content found to analyze");
        return;
      }

      // Prepare context for AI analysis using Core memories (only last 2 to save tokens)
      const memoriesContext = coreMemories
        .slice(0, 2) // Get most recent 2 only
        .filter(memory => {
          if (!memory) return false;
          if (memory.content) return true;
          if (memory.text && typeof memory.text === 'string') {
            try {
              const parsed = JSON.parse(memory.text);
              return Array.isArray(parsed) && parsed.length > 0;
            } catch (e) {
              return false;
            }
          }
          return false;
        })
        .map(memory => {
          let content = '';
          if (memory.content) {
            content = memory.content;
            console.log('🔥 Using content field for memory:', content.substring(0, 100));
          } else if (memory.text && typeof memory.text === 'string') {
            try {
              const parsed = JSON.parse(memory.text);
              // Extract content from the parsed JSON array
              if (Array.isArray(parsed) && parsed.length > 0) {
                // Take the first memory from the array and use its content
                const firstMemory = parsed[0];
                content = firstMemory.content || firstMemory.text || firstMemory.description || '';
                console.log('🔥 Extracted content from parsed text field:', content.substring(0, 100));
              }
            } catch (e) {
              console.error('Failed to parse memory text:', e);
              content = '';
            }
          }
          
          const memoryContext = {
            title: memory.title || 'Core Memory',
            content: content.substring(0, 300), // Shorter content to save tokens
            summary: memory.summary || '',
            tags: memory.tags || [],
            date: memory.createdAt || memory.created_at,
            id: memory.id
          };
          
          console.log('🔥 Created memory context:', memoryContext);
          return memoryContext;
        });

      // Call AI Insights to analyze patterns and generate prompts (using correct tool name)
      const promptRequest = {
        memoriesContext: memoriesContext.map(m => `${m.title}: ${m.content}`).join('\n\n'),
        systemPrompt: "Generate exactly 3 personalized writing prompts as questions based on the user's Core memories. Each prompt must be a complete question ending with a question mark (?). Focus on therapeutic self-reflection and personal growth. Format each prompt as a separate line starting with a number (1., 2., 3.).",
        identityProfile: null
      };

      const response = await opal.callTool('get_ai_insights', promptRequest);
      
      console.log('🔥 AI Response received:', response);
      
      if (response && response.content && Array.isArray(response.content)) {
        // Extract insights from the content array
        const insights = response.content;
        console.log('🔥 Extracted insights from content:', insights);
        
        if (insights.length > 0) {
          // The AI response has a nested structure where content[0].text contains the actual insights
          let allPrompts = [];
          
          for (const insight of insights) {
            if (insight.type === 'text' && insight.text) {
              try {
                // Parse the text field which contains the actual insights JSON
                const parsedText = JSON.parse(insight.text);
                console.log('🔥 Parsed text field:', parsedText);
                
                if (parsedText.insights && Array.isArray(parsedText.insights)) {
                  // Extract prompts from the parsed insights
                  const prompts = parsedText.insights
                    .map(insight => insight.description || insight.title || '')
                    .filter(text => typeof text === 'string' && text.trim().length > 0)
                    .slice(0, 3);
                  
                  allPrompts = prompts;
                  console.log('🔥 Extracted prompts from parsed insights:', allPrompts);
                  break;
                }
              } catch (e) {
                console.log('🔥 Failed to parse text field as JSON:', e);
                // Fallback: try to use the text directly if it's not JSON
                if (typeof insight.text === 'string' && insight.text.trim().length > 10) {
                  allPrompts = [insight.text.substring(0, 200)];
                }
              }
            }
          }
          
          console.log('🔥 Final allPrompts:', allPrompts);
          
          if (allPrompts.length > 0) {
            console.log('🔥 Setting AI prompts from content:', allPrompts);
            setAiPrompts(allPrompts);
            toast.success("AI prompts generated!");
            return;
          }
        }
        
        console.log('🔥 No valid prompts found in insights');
        toast.error("No valid prompts found in AI response");
      } else if (response && response.insights) {
        // Fallback: try the old insights property
        const insights = response.insights;
        console.log('🔥 Fallback: extracted insights from insights property:', insights);
        
        if (Array.isArray(insights) && insights.length > 0) {
          const allPrompts = insights
            .map(insight => insight.description || insight.title || insight)
            .filter(text => typeof text === 'string' && text.trim().length > 0)
            .slice(0, 3);
          
          if (allPrompts.length > 0) {
            console.log('🔥 Setting AI prompts from insights property:', allPrompts);
            setAiPrompts(allPrompts);
            toast.success("AI prompts generated!");
            return;
          }
        }
        
        console.log('🔥 Could not extract prompts from insights property');
        toast.error("Could not generate prompts from AI response");
      } else {
        console.log('🔥 No valid response structure found');
        toast.error("Invalid response structure from AI");
      }
    } catch (error) {
      console.error('Failed to generate AI prompts:', error);
      toast.error("Failed to generate AI prompts");
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  return (
    <div className="page-container bg-app-bg-primary text-app-text-primary">
      <div className="flex-1 overflow-auto p-6 bg-app-bg-primary">
        <div className="max-w-7xl mx-auto">


          {/* Dashboard Grid - New Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Left Column - Recent and Pinned Entries */}
            <div className="space-y-6">
              {/* Recent Entries Card */}
              <Card className="bg-app-bg-elevated border-app-border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-app-text-primary flex items-center text-lg">
                    <Clock className="w-5 h-5 mr-2 text-green-400" />
                    Recent Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentEntries.length > 0 ? (
                    <div className="space-y-3">
                      {recentEntries.slice(0, 3).map(entry => (
                        <div 
                          key={entry.id}
                          onClick={() => handleEntryClick(entry)}
                          className="p-3 bg-app-bg-hover hover:bg-app-bg-active cursor-pointer rounded transition-colors"
                        >
                          <h4 className="text-app-text-primary font-medium text-sm truncate">{entry.title}</h4>
                          <p className="text-app-text-secondary text-xs mt-1">
                            {new Date(entry.updatedAt).toLocaleDateString()}
                          </p>
                          <p className="text-app-text-tertiary text-xs mt-1 line-clamp-2">
                            {(entry.content || '').replace(/<[^>]*>/g, '').substring(0, 80)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-app-text-tertiary text-sm">No entries yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Pinned Entries Card */}
              <Card className="bg-app-bg-elevated border-app-border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-app-text-primary flex items-center text-lg">
                    <Pin className="w-5 h-5 mr-2 text-blue-400" />
                    Pinned Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pinnedEntries.length > 0 ? (
                    <div className="space-y-3">
                      {pinnedEntries.slice(0, 3).map(entry => (
                        <div 
                          key={entry.id}
                          onClick={() => handleEntryClick(entry)}
                          className="p-3 bg-app-bg-hover hover:bg-app-bg-active cursor-pointer rounded transition-colors"
                        >
                          <h4 className="text-app-text-primary font-medium text-sm truncate">{entry.title}</h4>
                          <p className="text-app-text-secondary text-xs mt-1">
                            {new Date(entry.updatedAt).toLocaleDateString()}
                          </p>
                          <p className="text-app-text-tertiary text-xs mt-1 line-clamp-2">
                            {(entry.content || '').replace(/<[^>]*>/g, '').substring(0, 80)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-app-text-tertiary text-sm">No pinned entries yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Guided Module Activity Card */}
              <Card className="bg-app-bg-elevated border-app-border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-app-text-primary flex items-center text-lg">
                    <Target className="w-5 h-5 mr-2 text-blue-400" />
                    Guided Module Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeModule ? (
                    <div className="space-y-3">
                      <div 
                        onClick={() => handleGuidedModuleClick(activeModule.id)}
                        className="p-3 bg-app-bg-hover hover:bg-app-bg-active cursor-pointer rounded transition-colors border border-blue-500"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-app-text-primary font-medium text-sm">{activeModule.title}</h4>
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Active</span>
                        </div>
                        <p className="text-app-text-secondary text-xs mb-2">{activeModule.description}</p>
                        {activeProgress && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-app-text-tertiary">
                              Step {activeProgress.currentStep + 1} of {activeModule.steps.length}
                            </span>
                            <span className="text-xs text-blue-400">
                              {Math.round((activeProgress.currentStep / activeModule.steps.length) * 100)}% Complete
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : recentModule ? (
                    <div className="space-y-3">
                      <div 
                        onClick={() => handleGuidedModuleClick(recentModule.id)}
                        className="p-3 bg-app-bg-hover hover:bg-app-bg-active cursor-pointer rounded transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-app-text-primary font-medium text-sm">{recentModule.title}</h4>
                          <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">Recent</span>
                        </div>
                        <p className="text-app-text-secondary text-xs mb-2">{recentModule.description}</p>
                        {recentModuleProgress && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-app-text-tertiary">
                              Last activity: {new Date(Math.max(...Object.values(recentModuleProgress.entries || {}).map(entry => 
                                typeof entry === 'object' && entry?.lastSaved ? new Date(entry.lastSaved).getTime() : 0
                              ))).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-app-text-secondary">
                              {Object.keys(recentModuleProgress.entries || {}).length} steps completed
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => navigate('/modules')}
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2"
                      >
                        View All Modules
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Target className="w-12 h-12 mx-auto text-app-text-disabled mb-3" />
                      <p className="text-app-text-tertiary text-sm mb-4">Start a guided writing module to track your progress</p>
                      <Button
                        onClick={() => navigate('/modules')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Browse Modules
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

                           </div>

            {/* Middle Column - Two Prompt Cards */}
            <div className="space-y-6">
              {/* Generic Writing Prompts Card */}
              <Card className="bg-app-bg-elevated border-app-border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between text-lg">
                    <div className="flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                      Generic Writing Prompts
                    </div>
                    <Button
                      onClick={refreshPrompts}
                      size="sm"
                      variant="ghost"
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 p-1 h-auto"
                      title="Refresh prompts"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dailyPrompts.slice(0, 3).map((prompt, index) => (
                      <div
                        key={index}
                        className="p-3 bg-app-bg-hover hover:bg-app-bg-active cursor-pointer rounded transition-colors border border-app-border-primary hover:border-yellow-400"
                        onClick={() => handlePromptClick(prompt)}
                      >
                        <p className="text-app-text-primary text-sm leading-relaxed">
                          {prompt}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Writing Prompts Card */}
              <Card className="bg-app-bg-elevated border-app-border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-app-text-primary flex items-center text-lg">
                    <Brain className="w-5 h-5 mr-2 text-purple-400" />
                    AI Writing Prompts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiPrompts.length > 0 ? (
                    <div className="space-y-3">
                      {aiPrompts.map((prompt, index) => (
                        <div
                          key={index}
                          className="p-3 bg-app-bg-hover hover:bg-app-bg-active cursor-pointer rounded transition-colors border border-app-border-primary hover:border-purple-400"
                          onClick={() => handlePromptClick(prompt)}
                        >
                          <p className="text-app-text-primary text-sm leading-relaxed">
                            {prompt}
                          </p>
                        </div>
                      ))}
                      <Button
                        onClick={generateAIPrompts}
                        disabled={isGeneratingPrompts}
                        className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white text-xs py-2"
                      >
                        {isGeneratingPrompts ? <Spinner size="sm" className="mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                        Refresh AI Prompts
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Brain className="w-12 h-12 mx-auto text-app-text-disabled mb-3" />
                      <p className="text-app-text-tertiary text-sm mb-4">Generate personalized prompts based on your Core memories</p>
                      <Button
                        onClick={generateAIPrompts}
                        disabled={isGeneratingPrompts}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-4"
                      >
                        <Brain className={`w-4 h-4 mr-2 ${isGeneratingPrompts ? 'animate-pulse' : ''}`} />
                        {isGeneratingPrompts ? 'Analyzing...' : 'Generate AI Prompts'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Stats and Calendar */}
            <div className="space-y-6">
              {/* Writing Stats Card */}
              <Card className="bg-app-bg-elevated border-app-border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-app-text-primary flex items-center text-lg">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    Writing Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-app-text-secondary text-sm">Total Entries</span>
                      <span className="text-app-text-primary font-semibold text-lg">{totalEntries}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-app-text-secondary text-sm">This Week</span>
                      <span className="text-app-text-primary font-semibold text-lg">{entriesThisWeek}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-app-text-secondary text-sm">Pinned</span>
                      <span className="text-app-text-primary font-semibold text-lg">{pinnedEntries.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

                             {/* Writing Calendar Card */}
               <Card className="bg-app-bg-elevated border-app-border-primary">
                 <CardHeader className="pb-3">
                   <CardTitle className="text-app-text-primary flex items-center text-lg">
                     <BookOpen className="w-5 h-5 mr-2 text-purple-400" />
                     Writing Calendar
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <Calendar 
                     entries={entries}
                     onDateClick={(date) => {
                       // Navigate to journal page with selected date
                       navigate('/journal', { 
                         state: { 
                           selectedDate: date.toISOString(),
                           resetMode: true 
                         } 
                       });
                     }}
                     className="text-center"
                   />
                 </CardContent>
               </Card>

               {/* Notes Card */}
               <NotesCard />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
