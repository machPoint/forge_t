import React, { useMemo, useState, useCallback } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
// Define Memory interface here to avoid circular dependency
interface Memory {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source: string;
  type: 'journal' | 'note' | 'summary' | string;
  starred?: boolean;
  archived?: boolean;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { type DayContentProps } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Calendar as CalendarIcon, PieChart as PieChartIcon, Heart } from 'lucide-react';
import SentimentAnalysis from './SentimentAnalysis';
import DateSentimentAnalysis from './DateSentimentAnalysis';

interface MemoriesVisualizationsProps {
  memories: Memory[];
  isLoading: boolean;
}

const MemoriesVisualizations: React.FC<MemoriesVisualizationsProps> = ({ 
  memories,
  isLoading
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // Group memories by month for the bar chart
  const monthlyData = useMemo(() => {
    const groupedByMonth: Record<string, number> = {};
    
    memories.forEach(memory => {
      if (!memory.createdAt) return;
      
      try {
        const date = parseISO(memory.createdAt);
        const monthKey = format(date, 'MMM yyyy');
        
        if (!groupedByMonth[monthKey]) {
          groupedByMonth[monthKey] = 0;
        }
        
        groupedByMonth[monthKey]++;
      } catch (e) {
        console.error('Error parsing date:', memory.createdAt, e);
      }
    });
    
    // Convert to array format for Recharts
    return Object.entries(groupedByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        // Sort months chronologically
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        
        if (aYear !== bYear) {
          return parseInt(aYear) - parseInt(bYear);
        }
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(aMonth) - months.indexOf(bMonth);
      });
  }, [memories]);

  // Group memories by type for the pie chart
  const typeData = useMemo(() => {
    const groupedByType: Record<string, number> = {};
    
    memories.forEach(memory => {
      const type = memory.type || 'unknown';
      
      if (!groupedByType[type]) {
        groupedByType[type] = 0;
      }
      
      groupedByType[type]++;
    });
    
    return Object.entries(groupedByType)
      .map(([type, count]) => ({ type, count }));
  }, [memories]);

  // Colors for the pie chart
  const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c'];

  // Calendar data - memories by day
  const calendarData = useMemo(() => {
    const memoriesByDay: Record<string, Memory[]> = {};
    
    memories.forEach(memory => {
      if (!memory.createdAt) return;
      
      try {
        const date = parseISO(memory.createdAt);
        const dayKey = format(date, 'yyyy-MM-dd');
        
        if (!memoriesByDay[dayKey]) {
          memoriesByDay[dayKey] = [];
        }
        
        memoriesByDay[dayKey].push(memory);
      } catch (e) {
        console.error('Error parsing date:', memory.createdAt, e);
      }
    });
    
    return memoriesByDay;
  }, [memories]);

  // Get memories for a specific date
  const getMemoriesForDate = useCallback((date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    return calendarData[dayKey] || [];
  }, [calendarData]);

  // Handle calendar date click
  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Function to render calendar day contents
  const renderCalendarDay = (props: DayContentProps) => {
    // Extract date from the day props
    const date = props.date;
    const dayKey = format(date, 'yyyy-MM-dd');
    const dayMemories = calendarData[dayKey] || [];
    
    if (dayMemories.length === 0) return null;
    
    return (
      <div className="relative w-full h-full">
        <Badge 
          className="absolute bottom-0 right-0 text-[10px] px-1 py-0 min-w-4 h-4 flex items-center justify-center"
          variant="secondary"
        >
          {dayMemories.length}
        </Badge>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <BarChart3 className="w-16 h-16 mb-4" />
        <h3 className="text-xl font-medium mb-2">No data to visualize</h3>
                 <p className="text-center">Create some core entries to see visualizations here.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Tabs defaultValue="timeline" className="w-full flex flex-col h-full">
        <div className="p-4 flex-shrink-0">
          <TabsList className="mb-4">
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="types" className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              <span>Types</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>Sentiment</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 min-h-0 overflow-auto px-4 pb-4">
          <TabsContent value="timeline" className="mt-0 h-full">
            <Card>
              <CardHeader>
                <CardTitle>Core Entries Timeline</CardTitle>
                <CardDescription>Number of core entries created per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" name="Core Entries" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="types" className="mt-0 h-full">
            <Card>
              <CardHeader>
                <CardTitle>Core Entry Types</CardTitle>
                <CardDescription>Distribution of core entry types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                        label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-0 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left side - Calendar */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Core Entries Calendar</CardTitle>
                      <CardDescription>Click on a date to view sentiment analysis</CardDescription>
                    </div>
                    {selectedDate && (
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#3e3e42] transition-colors"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center p-3">
                    {isLoading ? (
                      <div className="text-center text-gray-400 py-8">
                        Loading calendar...
                      </div>
                    ) : memories && memories.length > 0 ? (
                      <Calendar
                        entries={memories}
                        className="rounded-md border border-gray-600 p-4 bg-[#2d2d2d]"
                        selectedDate={selectedDate}
                        onDateClick={handleDateClick}
                      />
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        No core entries available for calendar
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right side - Date-specific sentiment analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Date Sentiment Analysis</CardTitle>
                  <CardDescription>
                    {selectedDate 
                      ? `Sentiment for ${format(selectedDate, 'MMM dd, yyyy')} - ${getMemoriesForDate(selectedDate).length} core entries` 
                      : 'Click on a calendar date to see sentiment analysis'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    <DateSentimentAnalysis 
                      date={selectedDate}
                      memories={getMemoriesForDate(selectedDate)}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">Click on a calendar date to view sentiment analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="sentiment" className="mt-0 h-full">
            <SentimentAnalysis memories={memories} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default MemoriesVisualizations;
