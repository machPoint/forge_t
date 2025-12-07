import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  TrendingUp, 
  Calendar, 
  Tag, 
  BarChart3, 
  Lightbulb,
  RefreshCw,
  Sparkles 
} from "lucide-react";

import { getAIInsights } from '@/lib/openai';
import { getAIInsightsPrompt } from '@/lib/aiInsightsPrompt';
import Spinner from '../ui/spinner';

interface Memory {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
  source: string;
  type: 'journal' | 'note' | 'summary';
}

interface MemoriesInsightsProps {
  memories: Memory[];
}

interface Insight {
  id: string;
  type: string; // Changed from enum to string to match getAIInsights return type
  title: string;
  description: string;
  confidence: number;
  relatedTags: string[];
}

// Utility to clean OpenAI response of Markdown code fences
function cleanAIResponse(response: string | Insight[]): string {
  // If response is already an array, stringify it
  if (Array.isArray(response)) {
    return JSON.stringify(response);
  }
  
  // Otherwise clean the string response
  return response
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

const MemoriesInsights: React.FC<MemoriesInsightsProps> = ({ memories }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawAIResponse, setRawAIResponse] = useState<string | Insight[] | null>(null); // For debugging

  // Mock insights for demonstration
  const generateMockInsights = (): Insight[] => {
    const tagFrequency = memories.reduce((acc, memory) => {
      memory.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topTags = Object.entries(tagFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);

    return [
      {
        id: "1",
        type: "pattern",
        title: "Consistent Productivity Focus",
        description: "You frequently write about work progress and integration projects. This shows a strong focus on technical development and continuous improvement.",
        confidence: 85,
        relatedTags: ["work", "progress", "integration"]
      },
      {
        id: "2", 
        type: "trend",
        title: "Increasing AI Integration Interest",
        description: "Recent memories show growing interest in AI-powered tools and automation. Consider exploring more AI integration opportunities.",
        confidence: 78,
        relatedTags: ["ai-summary", "development", "integration"]
      },
      {
        id: "3",
        type: "suggestion",
        title: "Memory Categorization Opportunity",
        description: `Your most frequent tags are: ${topTags.join(', ')}. Consider creating dedicated workflows for these areas.`,
        confidence: 72,
        relatedTags: topTags
      },
      {
        id: "4",
        type: "summary",
        title: "Weekly Reflection Pattern",
        description: "You tend to create more reflective content mid-week. This could be optimized for better insights capture.",
        confidence: 68,
        relatedTags: ["reflection", "patterns"]
      }
    ];
  };

  const generateInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRawAIResponse(null);
    try {
      // Prepare the context for OpenAI
      const context = memories.map(m => `Title: ${m.title}\nSummary: ${m.summary}\nContent: ${m.content}\nTags: ${m.tags.join(', ')}`).join('\n---\n');
      
      // Get the editable AI Insights prompt from localStorage
      const aiInsightsPrompt = getAIInsightsPrompt();
      const systemPrompt = aiInsightsPrompt.systemPrompt;
      
      console.log('Generating AI Insights with context length:', context.length);
      console.log('Using AI Insights prompt:', aiInsightsPrompt.name);
      const aiResponse = await getAIInsights(context, systemPrompt);
      console.log('AI Insights response received:', typeof aiResponse, Array.isArray(aiResponse));
      
      setRawAIResponse(aiResponse); // For debugging
      let newInsights: Insight[] = [];
      
      // Handle both string and array responses
      if (Array.isArray(aiResponse)) {
        // If aiResponse is already an array, use it directly
        console.log('AI Insights received as array with', aiResponse.length, 'items');
        console.log('First insight:', JSON.stringify(aiResponse[0]));
        newInsights = aiResponse;
        
        // Verify the insights have the expected structure
        const validInsights = aiResponse.every(item => 
          item && 
          typeof item.id === 'string' && 
          typeof item.type === 'string' && 
          typeof item.title === 'string' && 
          typeof item.description === 'string' && 
          typeof item.confidence === 'number' && 
          Array.isArray(item.relatedTags)
        );
        
        console.log('Insights have valid structure:', validInsights);
        
        if (!validInsights) {
          setError('AI Insights could not be generated. The response format was invalid.');
          setInsights([]);
          return;
        }
      } else {
        // If aiResponse is a string, try to parse it as JSON
        console.log('AI Insights received as string, attempting to parse');
        try {
          const cleaned = cleanAIResponse(aiResponse);
          newInsights = JSON.parse(cleaned);
          console.log('Successfully parsed string response into', newInsights.length, 'insights');
        } catch (e) {
          console.error('Failed to parse AI Insights response:', e);
          setError('AI Insights could not be generated. The response was not valid JSON.');
          setInsights([]);
          return;
        }
      }
      
      console.log('Setting', newInsights.length, 'insights');
      setInsights(newInsights);
      setLastGenerated(new Date());
    } catch (error) {
      console.error('Error generating AI Insights:', error);
      setError('AI Insights could not be generated. Please try again.');
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  }, [memories]);

  useEffect(() => {
    if (memories.length > 0) {
      generateInsights();
    }
  }, [memories.length, generateInsights]);

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'pattern': return <BarChart3 className="w-5 h-5 text-gray-400" />;
      case 'trend': return <TrendingUp className="w-5 h-5 text-gray-400" />;
      case 'suggestion': return <Lightbulb className="w-5 h-5 text-gray-400" />;
      case 'summary': return <Brain className="w-5 h-5 text-gray-400" />;
      default: return <Brain className="w-5 h-5 text-gray-400" />;
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    // Use blue consistently across all types
    return "bg-gray-500/20 text-gray-400";
  };

  const getConfidenceColor = (confidence: number) => {
    // Use blue consistently for all confidence scores
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const formatLastGenerated = () => {
    if (!lastGenerated) return '';
    return lastGenerated.toLocaleString();
  };

  return (
    <div className="h-full flex flex-col bg-[#1d1d1d]">
      {/* Header */}
      <div className="border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-gray-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">AI Insights</h1>
              <p className="text-sm text-gray-400">
                Discover patterns and trends in your core entries
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateInsights()}
            disabled={isLoading}
            className="flex items-center gap-2 text-gray-400 border-gray-500/30 hover:bg-gray-500/10"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Insights
          </Button>
        </div>
        
        {lastGenerated && (
          <p className="text-xs text-gray-500 mt-2">
            Last updated: {formatLastGenerated()}
          </p>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-900 text-red-200 rounded">
              <strong>Error:</strong> {error}
              {rawAIResponse && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Show raw AI response</summary>
                  <pre className="whitespace-pre-wrap text-xs text-gray-200 bg-gray-800 p-2 rounded mt-2">
                    {Array.isArray(rawAIResponse) ? JSON.stringify(rawAIResponse, null, 2) : rawAIResponse}
                  </pre>
                </details>
              )}
            </div>
          )}
          {memories.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                             <h3 className="text-lg font-medium mb-2">No Core Entries Yet</h3>
               <p className="text-sm">Add some core entries to see AI-powered insights</p>
            </div>
          ) : isLoading ? (
            <div className="text-center text-gray-400 py-12">
              <Spinner size="xl" className="mx-auto mb-4" />
                             <h3 className="text-lg font-medium mb-2">Analyzing Your Core Entries</h3>
              <p className="text-sm">AI is processing your data to generate insights...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#2a2a2a] border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-8 h-8 text-gray-400" />
                      <div>
                        <div className="text-2xl font-bold text-gray-100">{memories.length}</div>
                        <div className="text-sm text-gray-400">Total Core Entries</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#2a2a2a] border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Tag className="w-8 h-8 text-gray-400" />
                      <div>
                        <div className="text-2xl font-bold text-gray-100">
                          {new Set(memories.flatMap(m => m.tags)).size}
                        </div>
                        <div className="text-sm text-gray-400">Unique Tags</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#2a2a2a] border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-8 h-8 text-gray-400" />
                      <div>
                        <div className="text-2xl font-bold text-gray-100">{insights.length}</div>
                        <div className="text-sm text-gray-400">AI Insights</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights */}
              <div className="space-y-4">
                {insights.map((insight) => (
                  <Card key={insight.id} className="bg-[#2a2a2a] border-gray-600">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={getInsightColor(insight.type)}>
                            {getInsightIcon(insight.type)}
                          </div>
                          <div>
                            <CardTitle className="text-gray-200 text-lg">
                              {insight.title}
                            </CardTitle>
                            <Badge 
                              variant="outline" 
                              className="text-xs mt-1 capitalize border-gray-500"
                            >
                              {insight.type}
                            </Badge>
                          </div>
                        </div>
                        
                        <Badge className={`text-xs ${getConfidenceColor(insight.confidence)}`}>
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 leading-relaxed mb-3">
                        {insight.description}
                      </p>
                      
                      {insight.relatedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-gray-500 mr-2">Related:</span>
                          {insight.relatedTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs text-gray-400 border-gray-600"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MemoriesInsights;
