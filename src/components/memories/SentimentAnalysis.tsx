import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, 
  Frown, 
  Meh, 
  Smile, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

interface Memory {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
  source: string;
  type: 'journal' | 'note' | 'summary' | string;
  starred?: boolean;
  archived?: boolean;
}

interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
  compound: number;
  label: 'positive' | 'negative' | 'neutral';
}

interface MemorySentiment extends Memory {
  sentiment: SentimentScore;
}

interface SentimentAnalysisProps {
  memories: Memory[];
}

const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ memories }) => {
  const [analyzedMemories, setAnalyzedMemories] = useState<MemorySentiment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analyze sentiment using a simple keyword-based approach
  const analyzeSentiment = async (text: string): Promise<SentimentScore> => {
    try {
      // Simple keyword-based sentiment analysis
      const lowerText = text.toLowerCase();
      
             // Positive words and their weights (refined to 0.2 scale)
       const positiveWords = {
         // Strong positive emotions
         'love': 0.2, 'adore': 0.2, 'passion': 0.2, 'ecstatic': 0.2, 'euphoric': 0.2,
         'joy': 0.2, 'bliss': 0.2, 'delighted': 0.2, 'thrilled': 0.2, 'elated': 0.2,
         
         // Moderate positive emotions
         'happy': 0.15, 'excited': 0.15, 'wonderful': 0.15, 'amazing': 0.15, 'fantastic': 0.15,
         'excellent': 0.15, 'brilliant': 0.15, 'awesome': 0.15, 'grateful': 0.15, 'blessed': 0.15,
         
         // Light positive emotions
         'good': 0.1, 'nice': 0.1, 'beautiful': 0.1, 'peaceful': 0.1, 'calm': 0.1,
         'content': 0.1, 'satisfied': 0.1, 'fulfilled': 0.1, 'inspired': 0.1, 'motivated': 0.1,
         'confident': 0.1, 'proud': 0.1, 'successful': 0.1, 'achievement': 0.1,
         
         // Subtle positive emotions
         'hope': 0.08, 'dream': 0.08, 'wonder': 0.08, 'smile': 0.08, 'laugh': 0.08,
         'celebrate': 0.08, 'victory': 0.08, 'win': 0.08, 'progress': 0.08, 'growth': 0.08,
         'learn': 0.08, 'discover': 0.08, 'create': 0.08, 'build': 0.08, 'help': 0.08,
         'support': 0.08, 'care': 0.08, 'kind': 0.08, 'gentle': 0.08, 'warm': 0.08,
         
         // Nuanced positive states
         'optimistic': 0.12, 'encouraged': 0.12, 'refreshed': 0.12, 'energized': 0.12,
         'focused': 0.12, 'determined': 0.12, 'resilient': 0.12, 'balanced': 0.12,
         'harmonious': 0.12, 'serene': 0.12, 'tranquil': 0.12, 'mindful': 0.12
       };
       
       // Negative words and their weights (refined to 0.2 scale)
       const negativeWords = {
         // Strong negative emotions
         'hate': 0.2, 'despise': 0.2, 'loathe': 0.2, 'terrified': 0.2, 'devastated': 0.2,
         'despair': 0.2, 'agony': 0.2, 'torture': 0.2, 'abuse': 0.2, 'violence': 0.2,
         
         // Moderate negative emotions
         'sad': 0.15, 'angry': 0.15, 'frustrated': 0.15, 'terrible': 0.15, 'awful': 0.15,
         'horrible': 0.15, 'depressed': 0.15, 'lonely': 0.15, 'scared': 0.15, 'afraid': 0.15,
         'fear': 0.15, 'pain': 0.15, 'hurt': 0.15, 'suffering': 0.15,
         
         // Light negative emotions
         'bad': 0.1, 'worried': 0.1, 'anxious': 0.1, 'struggle': 0.1, 'difficult': 0.1,
         'hard': 0.1, 'challenging': 0.1, 'stress': 0.1, 'overwhelmed': 0.1, 'exhausted': 0.1,
         'tired': 0.1, 'disappointed': 0.1, 'upset': 0.1, 'fail': 0.1, 'lose': 0.1,
         
         // Subtle negative emotions
         'defeat': 0.08, 'cry': 0.08, 'tears': 0.08, 'broken': 0.08, 'destroy': 0.08,
         'kill': 0.08, 'die': 0.08, 'death': 0.08, 'sick': 0.08, 'ill': 0.08,
         'disease': 0.08, 'cancer': 0.08, 'painful': 0.08, 'war': 0.08,
         
         // Nuanced negative states
         'confused': 0.12, 'uncertain': 0.12, 'doubtful': 0.12, 'hesitant': 0.12,
         'restless': 0.12, 'impatient': 0.12, 'irritated': 0.12, 'annoyed': 0.12,
         'jealous': 0.12, 'envious': 0.12, 'bitter': 0.12, 'resentful': 0.12
       };
      
      // Calculate sentiment scores
      let positiveScore = 0;
      let negativeScore = 0;
      
      // Negation words that can flip sentiment
      const negationWords = ['not', 'no', 'never', 'none', 'neither', 'nor', 'cannot', "can't", "don't", "doesn't", "didn't", "won't", "wouldn't", "couldn't", "shouldn't"];
      
      // Count positive words
      Object.entries(positiveWords).forEach(([word, weight]) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          matches.forEach(match => {
            const matchIndex = lowerText.indexOf(match);
            // Check if there's a negation word before this positive word
            const beforeText = lowerText.substring(Math.max(0, matchIndex - 50), matchIndex);
            const hasNegation = negationWords.some(neg => beforeText.includes(neg));
            
            if (hasNegation) {
              // Flip the sentiment
              negativeScore += weight * 0.7;
            } else {
              positiveScore += weight;
            }
          });
        }
      });
      
      // Count negative words
      Object.entries(negativeWords).forEach(([word, weight]) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          matches.forEach(match => {
            const matchIndex = lowerText.indexOf(match);
            // Check if there's a negation word before this negative word
            const beforeText = lowerText.substring(Math.max(0, matchIndex - 50), matchIndex);
            const hasNegation = negationWords.some(neg => beforeText.includes(neg));
            
            if (hasNegation) {
              // Flip the sentiment
              positiveScore += weight * 0.7;
            } else {
              negativeScore += weight;
            }
          });
        }
      });
      
             // Normalize scores based on text length and intensity (adjusted for 0.2 scale)
       const totalWords = text.split(/\s+/).length;
       if (totalWords > 0) {
         // More sophisticated normalization for finer scale
         const intensityMultiplier = Math.min(1.5, Math.max(0.8, totalWords / 100));
         positiveScore = Math.min(0.2, positiveScore * intensityMultiplier);
         negativeScore = Math.min(0.2, negativeScore * intensityMultiplier);
       }
       
       // Calculate neutral score (remaining sentiment)
       const neutralScore = Math.max(0, 0.2 - positiveScore - negativeScore);
       
       // Calculate compound score (-0.2 to 0.2)
       const compoundScore = positiveScore - negativeScore;
       
       // Determine label with refined thresholds for 0.2 scale
       let label: 'positive' | 'negative' | 'neutral' = 'neutral';
       if (positiveScore > negativeScore && positiveScore > 0.03) {
         label = 'positive';
       } else if (negativeScore > positiveScore && negativeScore > 0.03) {
         label = 'negative';
       }
       
       // Adjust for very strong sentiments
       if (positiveScore > 0.12) label = 'positive';
       if (negativeScore > 0.12) label = 'negative';
      
      return {
        positive: Math.round(positiveScore * 100) / 100,
        negative: Math.round(negativeScore * 100) / 100,
        neutral: Math.round(neutralScore * 100) / 100,
        compound: Math.round(compoundScore * 100) / 100,
        label
      };
    } catch (error) {
             // Silent fallback to neutral sentiment (adjusted for 0.2 scale)
       return {
         positive: 0.067,
         negative: 0.067,
         neutral: 0.066,
         compound: 0,
         label: 'neutral'
       };
    }
  };

  // Analyze all memories
  const analyzeAllMemories = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const analyzed: MemorySentiment[] = [];
      
      for (const memory of memories) {
        const textToAnalyze = `${memory.title} ${memory.content} ${memory.summary}`.trim();
        const sentiment = await analyzeSentiment(textToAnalyze);
        
        analyzed.push({
          ...memory,
          sentiment
        });
      }
      
      setAnalyzedMemories(analyzed);
    } catch (error) {
      setError('Failed to analyze sentiment. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [memories]);

  // Auto-analyze when memories change
  useEffect(() => {
    if (memories.length > 0 && analyzedMemories.length === 0) {
      analyzeAllMemories();
    }
  }, [memories.length, analyzedMemories.length, analyzeAllMemories]);

  // Calculate sentiment trends over time
  const sentimentTrends = useMemo(() => {
    if (analyzedMemories.length === 0) return [];
    
    const sortedMemories = [...analyzedMemories].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    return sortedMemories.map(memory => ({
      date: format(new Date(memory.createdAt), 'MMM dd'),
      sentiment: memory.sentiment.compound,
      positive: memory.sentiment.positive,
      negative: memory.sentiment.negative,
      neutral: memory.sentiment.neutral,
      title: memory.title
    }));
  }, [analyzedMemories]);

  // Calculate overall sentiment distribution
  const sentimentDistribution = useMemo(() => {
    if (analyzedMemories.length === 0) return [];
    
    const counts = {
      positive: 0,
      negative: 0,
      neutral: 0
    };
    
    analyzedMemories.forEach(memory => {
      counts[memory.sentiment.label]++;
    });
    
    return [
      { name: 'Positive', value: counts.positive, color: '#60a5fa' },
      { name: 'Neutral', value: counts.neutral, color: '#9ca3af' },
      { name: 'Negative', value: counts.negative, color: '#6b7280' }
    ];
  }, [analyzedMemories]);

  // Get sentiment icon (adjusted for 0.2 scale) - all icons in pie chart blue
  const getSentimentIcon = (label: string, compound: number) => {
    if (label === 'positive' || compound > 0.03) {
      return <Smile className="w-4 h-4 text-[#60a5fa]" />;
    } else if (label === 'negative' || compound < -0.03) {
      return <Frown className="w-4 h-4 text-[#60a5fa]" />;
    }
    return <Meh className="w-4 h-4 text-[#60a5fa]" />;
  };

  // Generate sentiment description
  const getSentimentDescription = (compound: number) => {
    if (compound > 0.15) return "Very positive and uplifting";
    if (compound > 0.08) return "Generally positive";
    if (compound > 0.03) return "Slightly positive";
    if (compound < -0.15) return "Very challenging";
    if (compound < -0.08) return "Somewhat negative";
    if (compound < -0.03) return "Slightly negative";
    return "Emotionally balanced";
  };

  // Calculate average sentiment
  const averageSentiment = useMemo(() => {
    if (analyzedMemories.length === 0) return 0;
    const sum = analyzedMemories.reduce((acc, memory) => acc + memory.sentiment.compound, 0);
    return sum / analyzedMemories.length;
  }, [analyzedMemories]);

  // Generate sentiment insights
  const sentimentInsights = useMemo(() => {
    if (analyzedMemories.length === 0) return null;
    
    const positiveMemories = analyzedMemories.filter(m => m.sentiment.label === 'positive');
    const negativeMemories = analyzedMemories.filter(m => m.sentiment.label === 'negative');
    const neutralMemories = analyzedMemories.filter(m => m.sentiment.label === 'neutral');
    
    const strongestPositive = positiveMemories.reduce((max, m) => 
      m.sentiment.compound > max.sentiment.compound ? m : max, 
      positiveMemories[0] || { sentiment: { compound: 0 } }
    );
    
    const strongestNegative = negativeMemories.reduce((max, m) => 
      m.sentiment.compound < max.sentiment.compound ? m : max, 
      negativeMemories[0] || { sentiment: { compound: 0 } }
    );
    
    return {
      positiveCount: positiveMemories.length,
      negativeCount: negativeMemories.length,
      neutralCount: neutralMemories.length,
      strongestPositive: strongestPositive.sentiment?.compound || 0,
      strongestNegative: strongestNegative.sentiment?.compound || 0,
      emotionalRange: Math.abs(strongestPositive.sentiment?.compound || 0) + Math.abs(strongestNegative.sentiment?.compound || 0)
    };
  }, [analyzedMemories]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Sentiment Analysis</h2>
          <p className="text-sm text-gray-400">Emotional patterns in your memories</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={analyzeAllMemories}
          disabled={isAnalyzing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>

      {error && (
        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="p-4">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {isAnalyzing ? (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400" />
          <h3 className="text-lg font-medium mb-2 text-gray-200">Analyzing Sentiment</h3>
          <p className="text-sm text-gray-400">Processing {memories.length} memories...</p>
        </div>
      ) : analyzedMemories.length > 0 ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#2a2a2a] border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Heart className="w-8 h-8 text-[#003153]" />
                  <div>
                    <div className="text-2xl font-bold text-gray-100">
                      {isNaN(averageSentiment) ? '0.000' : averageSentiment.toFixed(3)}
                    </div>
                    <div className="text-sm text-gray-400">Average Sentiment</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#2a2a2a] border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {averageSentiment > 0 ? (
                    <TrendingUp className="w-8 h-8 text-[#003153]" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-[#003153]" />
                  )}
                  <div>
                    <div className="text-2xl font-bold text-gray-100">
                      {isNaN(averageSentiment) ? 'Neutral' : averageSentiment > 0 ? 'Positive' : averageSentiment < 0 ? 'Negative' : 'Neutral'}
                    </div>
                    <div className="text-sm text-gray-400">Overall Trend</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getSentimentDescription(averageSentiment)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#2a2a2a] border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-[#003153]" />
                  <div>
                    <div className="text-2xl font-bold text-gray-100">
                      {analyzedMemories.length}
                    </div>
                    <div className="text-sm text-gray-400">Analyzed Core Entries</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sentiment Insights */}
          {sentimentInsights && (
            <Card className="bg-[#2a2a2a] border-gray-600">
              <CardHeader>
                <CardTitle className="text-gray-200">Sentiment Insights</CardTitle>
                <CardDescription className="text-gray-400">Detailed analysis of your emotional patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-[#333333] rounded-lg">
                    <div className="text-lg font-bold text-[#60a5fa]">{sentimentInsights.positiveCount}</div>
                    <div className="text-xs text-gray-400">Positive</div>
                  </div>
                  <div className="text-center p-3 bg-[#333333] rounded-lg">
                    <div className="text-lg font-bold text-[#6b7280]">{sentimentInsights.negativeCount}</div>
                    <div className="text-xs text-gray-400">Negative</div>
                  </div>
                  <div className="text-center p-3 bg-[#333333] rounded-lg">
                    <div className="text-lg font-bold text-[#9ca3af]">{sentimentInsights.neutralCount}</div>
                    <div className="text-xs text-gray-400">Neutral</div>
                  </div>
                  <div className="text-center p-3 bg-[#333333] rounded-lg">
                    <div className="text-lg font-bold text-[#3b82f6]">{sentimentInsights.emotionalRange.toFixed(3)}</div>
                    <div className="text-xs text-gray-400">Emotional Range</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#333333] rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Strongest Positive</div>
                    <div className="text-lg font-bold text-[#60a5fa]">{sentimentInsights.strongestPositive.toFixed(3)}</div>
                  </div>
                  <div className="text-center p-3 bg-[#333333] rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Strongest Negative</div>
                    <div className="text-lg font-bold text-[#6b7280]">{sentimentInsights.strongestNegative.toFixed(3)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Over Time */}
            <Card className="bg-[#2a2a2a] border-gray-600">
              <CardHeader>
                <CardTitle className="text-gray-200">Sentiment Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {sentimentTrends.length > 0 ? (
                    <LineChart data={sentimentTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis domain={[-0.2, 0.2]} stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          color: '#f3f4f6'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sentiment" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No sentiment data available
                    </div>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sentiment Distribution */}
            <Card className="bg-[#2a2a2a] border-gray-600">
              <CardHeader>
                <CardTitle className="text-gray-200">Sentiment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {sentimentDistribution.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={sentimentDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {sentimentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No sentiment distribution data
                    </div>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Memories with Sentiment */}
          <Card className="bg-[#2a2a2a] border-gray-600">
            <CardHeader>
              <CardTitle className="text-gray-200">Recent Memories by Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {analyzedMemories
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .map((memory) => (
                      <div key={memory.id} className="flex items-start gap-3 p-3 bg-[#333333] rounded-lg">
                        <div className="flex items-center gap-2">
                          {getSentimentIcon(memory.sentiment.label, memory.sentiment.compound)}
                          <Badge 
                            variant="outline"
                            className={`text-xs ${
                              memory.sentiment.label === 'positive' 
                                ? 'border-[#60a5fa] text-[#60a5fa]'
                                : memory.sentiment.label === 'negative'
                                ? 'border-[#6b7280] text-[#6b7280]'
                                : 'border-[#9ca3af] text-[#9ca3af]'
                            }`}
                          >
                            {memory.sentiment.compound.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-200 truncate">{memory.title}</h4>
                          <p className="text-sm text-gray-400 line-clamp-2">{memory.summary}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {format(new Date(memory.createdAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium mb-2 text-gray-200">No Sentiment Data</h3>
          <p className="text-sm text-gray-400">Add some memories to see sentiment analysis</p>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysis;
