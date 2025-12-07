import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Frown, Meh, TrendingUp, TrendingDown, Calendar, FileText } from 'lucide-react';

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

interface DateSentimentAnalysisProps {
  date: Date;
  memories: Memory[];
}

// Simple sentiment analysis function (same as in SentimentAnalysis.tsx)
const analyzeSentiment = (text: string): SentimentScore => {
  try {
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
    
    // Count positive words
    Object.entries(positiveWords).forEach(([word, weight]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        positiveScore += matches.length * weight;
      }
    });
    
    // Count negative words
    Object.entries(negativeWords).forEach(([word, weight]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        negativeScore += matches.length * weight;
      }
    });
    
         // Normalize scores (adjusted for 0.2 scale)
     const totalWords = text.split(/\s+/).length;
     if (totalWords > 0) {
       const intensityMultiplier = Math.min(1.5, Math.max(0.8, totalWords / 100));
       positiveScore = Math.min(0.2, positiveScore * intensityMultiplier);
       negativeScore = Math.min(0.2, negativeScore * intensityMultiplier);
     }
     
     // Calculate neutral score
     const neutralScore = Math.max(0, 0.2 - positiveScore - negativeScore);
     
     // Calculate compound score
     const compoundScore = positiveScore - negativeScore;
     
     // Determine label with refined thresholds for 0.2 scale
     let label: 'positive' | 'negative' | 'neutral' = 'neutral';
     if (positiveScore > negativeScore && positiveScore > 0.03) {
       label = 'positive';
     } else if (negativeScore > positiveScore && negativeScore > 0.03) {
       label = 'negative';
     }
     
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
       return {
         positive: 0.067,
         negative: 0.067,
         neutral: 0.066,
         compound: 0,
         label: 'neutral'
       };
     }
};

const DateSentimentAnalysis: React.FC<DateSentimentAnalysisProps> = ({ date, memories }) => {
  // Analyze sentiment for all memories on this date
  const analyzedMemories = useMemo(() => {
    return memories.map(memory => ({
      ...memory,
      sentiment: analyzeSentiment(`${memory.title} ${memory.content} ${memory.summary}`.trim())
    }));
  }, [memories]);

  // Calculate overall sentiment for the date
  const overallSentiment = useMemo(() => {
    if (analyzedMemories.length === 0) return null;
    
    const totalPositive = analyzedMemories.reduce((sum, m) => sum + m.sentiment.positive, 0);
    const totalNegative = analyzedMemories.reduce((sum, m) => sum + m.sentiment.negative, 0);
    const totalNeutral = analyzedMemories.reduce((sum, m) => sum + m.sentiment.neutral, 0);
    const totalCompound = analyzedMemories.reduce((sum, m) => sum + m.sentiment.compound, 0);
    
    return {
      positive: totalPositive / analyzedMemories.length,
      negative: totalNegative / analyzedMemories.length,
      neutral: totalNeutral / analyzedMemories.length,
      compound: totalCompound / analyzedMemories.length,
               label: totalCompound > 0.03 ? 'positive' : totalCompound < -0.03 ? 'negative' : 'neutral'
    };
  }, [analyzedMemories]);

         // Get sentiment icon (adjusted for 0.2 scale) - all icons in pie chart blue
    const getSentimentIcon = (label: string, compound: number) => {
      if (label === 'positive' || compound > 0.03) {
        return <Heart className="w-4 h-4 text-[#60a5fa]" />;
      } else if (label === 'negative' || compound < -0.03) {
        return <Frown className="w-4 h-4 text-[#60a5fa]" />;
      } else {
        return <Meh className="w-4 h-4 text-[#60a5fa]" />;
      }
    };

   // Generate detailed sentiment summary
   const getSentimentSummary = (compound: number, positive: number, negative: number) => {
     if (compound > 0.15) {
       return "Very positive and uplifting day";
     } else if (compound > 0.08) {
       return "Generally positive with good energy";
     } else if (compound > 0.03) {
       return "Slightly positive, mostly content";
     } else if (compound < -0.15) {
       return "Challenging day with difficult emotions";
     } else if (compound < -0.08) {
       return "Somewhat negative, facing challenges";
     } else if (compound < -0.03) {
       return "Slightly negative, some concerns";
     } else {
       return "Balanced day, emotionally neutral";
     }
   };

   // Get emotional intensity level
   const getEmotionalIntensity = (positive: number, negative: number) => {
     const totalIntensity = positive + negative;
     if (totalIntensity > 0.15) return "High emotional intensity";
     if (totalIntensity > 0.08) return "Moderate emotional intensity";
     if (totalIntensity > 0.03) return "Low emotional intensity";
     return "Minimal emotional expression";
   };

  if (memories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-4" />
        <p>No core entries found for this date</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall sentiment summary */}
      {overallSentiment && (
        <Card className="bg-[#2a2a2a] border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-200 text-lg">Overall Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-100 mb-2">
                  {overallSentiment.compound.toFixed(3)}
                </div>
                <div className="text-sm text-gray-400">Compound Score</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getSentimentIcon(overallSentiment.label, overallSentiment.compound)}
                  <span className="text-lg font-semibold text-gray-100 capitalize">
                    {overallSentiment.label}
                  </span>
                </div>
                <div className="text-sm text-gray-400">Overall Mood</div>
              </div>
            </div>
            
            {/* Enhanced sentiment insights */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-300 mb-2">
                {getSentimentSummary(overallSentiment.compound, overallSentiment.positive, overallSentiment.negative)}
              </p>
              <p className="text-xs text-gray-400">
                {getEmotionalIntensity(overallSentiment.positive, overallSentiment.negative)}
              </p>
            </div>
            
            {/* Sentiment breakdown */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Positive</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${overallSentiment.positive * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-300 w-8 text-right">
                    {(overallSentiment.positive * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Neutral</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full" 
                      style={{ width: `${overallSentiment.neutral * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-300 w-8 text-right">
                    {(overallSentiment.neutral * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Negative</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${overallSentiment.negative * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-300 w-8 text-right">
                    {(overallSentiment.negative * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual memories */}
      <Card className="bg-[#2a2a2a] border-gray-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-200 text-lg">
            Core Entries ({memories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analyzedMemories.map((memory) => (
              <div key={memory.id} className="p-3 bg-[#333333] rounded-lg">
                <div className="flex items-start gap-3">
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
                      {memory.sentiment.compound.toFixed(3)}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-200 truncate">{memory.title}</h4>
                    <p className="text-sm text-gray-400 line-clamp-2">{memory.summary}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500 capitalize">{memory.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DateSentimentAnalysis;
