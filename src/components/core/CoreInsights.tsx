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

interface CoreEntry {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
  source: string;
  type: 'journal' | 'note' | 'summary';
}

interface CoreInsightsProps {
  coreEntries: CoreEntry[];
}

interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  relatedTags: string[];
}

const CoreInsights: React.FC<CoreInsightsProps> = ({ coreEntries }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(async () => {
    if (coreEntries.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Generating AI insights for core entries:', coreEntries.length);
      
      // Create a formatted context string from the core entries
      const memoriesContext = coreEntries.map(entry => (
        `ENTRY: ${entry.title}\n${entry.content}\nTAGS: ${entry.tags.join(', ')}\nSOURCE: ${entry.source}\nCREATED: ${entry.createdAt}\n---\n`
      )).join('\n');
      
      console.log('Generated memories context length:', memoriesContext.length);
      
      // Get the system prompt template (no parameters needed)
      const promptTemplate = getAIInsightsPrompt();
      
      console.log('Using system prompt:', promptTemplate.name);
      
      // Call getAIInsights with both required parameters
      const aiInsights = await getAIInsights(memoriesContext, promptTemplate.systemPrompt);
      
      if (Array.isArray(aiInsights)) {
        console.log('Successfully received', aiInsights.length, 'insights');
        setInsights(aiInsights);
      } else {
        console.error('AI insights response is not an array:', aiInsights);
        setError('Failed to parse AI insights response');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to generate insights: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [coreEntries]);

  useEffect(() => {
    if (coreEntries.length > 0) {
      generateInsights();
    }
  }, [generateInsights]);

  const getInsightIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pattern':
        return <TrendingUp className="w-4 h-4" />;
      case 'theme':
        return <Lightbulb className="w-4 h-4" />;
      case 'trend':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="h-full flex flex-col bg-[#1d1d1d] overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-200">Core Insights</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateInsights}
            disabled={isLoading || coreEntries.length === 0}
          >
            {isLoading ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 min-h-0">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">
              <Spinner size="lg" className="mx-auto mb-2" />
              Analyzing core entries...
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={generateInsights}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : coreEntries.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Brain className="w-12 h-12 mx-auto mb-2 text-gray-500" />
              <p>No core entries to analyze</p>
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No insights generated yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={generateInsights}
                className="mt-2"
              >
                Generate Insights
              </Button>
            </div>
          ) : (
            insights.map((insight) => (
              <Card key={insight.id} className="bg-[#2a2a2a] border-gray-600">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      <CardTitle className="text-sm text-gray-200">
                        {insight.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs bg-gray-700/20 text-gray-300">
                        {insight.type}
                      </Badge>
                      <span className={`text-xs ${getConfidenceColor(insight.confidence)}`}>
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-300 mb-3">
                    {insight.description}
                  </p>
                  
                  {insight.relatedTags && insight.relatedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {insight.relatedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs px-1 py-0 text-gray-400 border-gray-600"
                        >
                          <Tag className="w-2 h-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CoreInsights;
