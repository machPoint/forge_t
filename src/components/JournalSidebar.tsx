import React, { useState } from "react";
import { useJournal } from "@/hooks/useJournal";
import { Button } from "@/components/ui/button";
import { Clock, PlusCircle, Save, Database, MessageSquare, Pin } from 'lucide-react';
import EntryCard from "./EntryCard";
import { toast } from "sonner";
import memoryService from "@/lib/memoryService";

const JournalSidebar: React.FC = () => {
  const { entries, addEntry, selectedEntry, setSelectedEntry, updateEntry, setIsGeneratingFeedback } = useJournal();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get entries with dates for calendar dots
  const entriesByDate = entries.reduce((acc, entry) => {
    const date = new Date(entry.createdAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  // Calendar generation
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = current.toDateString();
      const hasEntry = entriesByDate[dateStr]?.length > 0;
      const isCurrentMonth = current.getMonth() === month;
      
      days.push({
        date: new Date(current),
        day: current.getDate(),
        hasEntry,
        isCurrentMonth
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendar();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  // Filter entries based on selected date, or show recent entries if no date selected
  const filteredEntries = selectedDate 
    ? entriesByDate[selectedDate.toDateString()] || []
    : entries.slice(0, 5);

  const recentEntries = filteredEntries;

  // Button handlers
  const handleSave = () => {
    if (selectedEntry) {
      updateEntry(selectedEntry.id, {
        title: selectedEntry.title,
        content: selectedEntry.content,
        updatedAt: new Date().toISOString()
      });
      toast.success('Journal entry saved');
    } else {
      toast.error('No entry selected to save');
    }
  };

  const handleSaveToCore = async () => {
    if (!selectedEntry) {
      toast.error('No entry selected to save to Core');
      return;
    }
    
    try {
      // No need to check OPAL connection since we're using direct API calls

      const memoryData = {
        title: selectedEntry.title,
        content: selectedEntry.content,
        source: "journal",
        tags: ["journal-entry"],
        summary: "",
      };

      await memoryService.createMemory(memoryData);
      toast.success("Entry saved to Core successfully!");
    } catch (error) {
      console.error("Failed to save to Core:", error);
      toast.error("Failed to save to Core");
    }
  };

  const handleAIFeedback = () => {
    if (!selectedEntry) {
      toast.error('No entry selected for AI feedback');
      return;
    }
    
    // Trigger the AI feedback flyout in the parent component
    // We need to communicate with the parent to open the flyout
    const event = new CustomEvent('openAIFeedback', { 
      detail: { entryId: selectedEntry.id } 
    });
    window.dispatchEvent(event);
  };

  const handleSettings = () => {
    toast.info('Settings panel would open here');
  };

  const handleProfile = () => {
    toast.info('Profile panel would open here');
  };

  const handleEntryClick = (entry: typeof entries[0]) => {
    setSelectedEntry(entry);
  };

  const handleDateClick = (day: { date: Date; day: number; hasEntry: boolean; isCurrentMonth: boolean }) => {
    if (day.isCurrentMonth) {
      const clickedDate = day.date;
      setSelectedDate(clickedDate);
      
      // Clear selected entry when switching dates
      setSelectedEntry(null);
      
      // If there are entries for this date, select the first one
      const dateEntries = entriesByDate[clickedDate.toDateString()];
      if (dateEntries && dateEntries.length > 0) {
        setSelectedEntry(dateEntries[0]);
      }
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    setSelectedEntry(null);
  };


  return (
    <div className="h-full flex flex-col bg-background text-foreground" style={{ borderRadius: 0 }}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-sm font-medium text-foreground">Journal</h1>
      </div>

      {/* Action Area - Icon Only */}
      <div className="flex justify-center items-center gap-2 p-3 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addEntry({ title: "New Entry", content: "" })}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="New Entry"
        >
          <PlusCircle className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="Save"
        >
          <Save className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveToCore}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="Save to Core"
        >
          <Database className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAIFeedback}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="AI Feedback"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>

      {/* Pinned Entries */}
      <div className="px-4 py-2 border-b border-border">
        <div className="flex items-center mb-2">
          <Pin className="w-4 h-4 mr-2 text-primary" />
          <h2 className="text-sm font-medium text-muted-foreground">PINNED ENTRIES</h2>
        </div>
        
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {recentEntries.filter(entry => entry.pinned).map(entry => (
            <div 
              key={entry.id} 
              className={`p-2 hover:bg-accent cursor-pointer ${
                selectedEntry?.id === entry.id ? 'bg-accent text-accent-foreground' : ''
              }`} 
              style={{ borderRadius: 0 }}
              onClick={() => handleEntryClick(entry)}
            >
              <div className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-1 mr-3 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-medium text-foreground truncate">{entry.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {(entry.content || '').replace(/<[^>]*>/g, '').substring(0, 60)}...
                  </p>
                </div>
              </div>
            </div>
          ))}
          {recentEntries.filter(entry => entry.pinned).length === 0 && (
            <p className="text-xs text-muted-foreground italic">No pinned entries</p>
          )}
        </div>
      </div>

      {/* Recent Entries */}
      <div className="flex-1 min-h-0 px-4 pb-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground">
              {selectedDate ? `ENTRIES FOR ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'RECENT ENTRIES'}
            </h2>
          </div>
          {selectedDate && (
            <button 
              onClick={clearDateFilter}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="space-y-1 flex-1 min-h-0 overflow-y-auto">
          {recentEntries.filter(entry => !entry.pinned).map(entry => (
            <div 
              key={entry.id} 
              className={`p-2 hover:bg-accent cursor-pointer ${
                selectedEntry?.id === entry.id ? 'bg-accent text-accent-foreground' : ''
              }`} 
              style={{ borderRadius: 0 }}
              onClick={() => handleEntryClick(entry)}
            >
              <div className="flex items-start">
                <div className="w-2 h-2 bg-foreground/20 rounded-full mt-1 mr-3 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-medium text-foreground truncate">{entry.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {(entry.content || '').replace(/<[^>]*>/g, '').substring(0, 60)}...
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar - at bottom */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-border">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="text-muted-foreground hover:text-foreground"
          >
            ‹
          </button>
          <h3 className="text-sm font-medium text-foreground">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="text-muted-foreground hover:text-foreground"
          >
            ›
          </button>
        </div>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((day, index) => (
            <div key={`day-${index}`} className="text-xs text-muted-foreground text-center py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid - reduced size */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div 
              key={index} 
              className={`
                relative text-xs text-center py-1 cursor-pointer hover:bg-accent
                ${day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                ${day.date.toDateString() === new Date().toDateString() ? 'bg-primary text-primary-foreground' : ''}
                ${selectedDate && day.date.toDateString() === selectedDate.toDateString() ? 'bg-accent ring-1 ring-primary' : ''}
              `}
              onClick={() => handleDateClick(day.date)}
            >
              {day.date.getDate()}
              {entriesByDate[day.date.toDateString()] && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default JournalSidebar;
