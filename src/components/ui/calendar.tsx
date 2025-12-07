import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  entries: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    pinned?: boolean;
    starred?: boolean;
    archived?: boolean;
  }>;
  onDateClick?: (date: Date) => void;
  selectedDate?: Date | null;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  entries, 
  onDateClick, 
  selectedDate, 
  className = "" 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Safety check for entries
  if (!entries || !Array.isArray(entries)) {
    return (
      <div className={`${className} text-center text-gray-400 py-8`}>
        No entries available for calendar
      </div>
    );
  }

  // Get entries with dates for calendar dots
  const entriesByDate = entries.reduce((acc, entry) => {
    // Safety check for createdAt field
    if (!entry.createdAt) return acc;
    
    try {
      const date = new Date(entry.createdAt).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
    } catch (error) {
      console.warn('Invalid date for entry:', entry.id, entry.createdAt);
    }
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

  const handleDateClick = (day: { date: Date; day: number; hasEntry: boolean; isCurrentMonth: boolean }) => {
    if (day.isCurrentMonth && onDateClick) {
      onDateClick(day.date);
    }
  };

  return (
    <div className={`${className} min-w-[320px]`}>
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          className="text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-[#3e3e42]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
          className="text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-[#3e3e42]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {dayNames.map((day, index) => (
          <div key={`day-${index}`} className="text-xs font-medium text-gray-400 text-center py-1.5">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div 
            key={index} 
            className={`
              relative text-sm text-center py-2 cursor-pointer hover:bg-[#3e3e42] rounded transition-colors min-h-[40px] flex items-center justify-center
              ${day.isCurrentMonth ? 'text-white' : 'text-gray-600'}
              ${day.date.toDateString() === new Date().toDateString() ? 'bg-[#0e639c]' : ''}
              ${selectedDate && day.date.toDateString() === selectedDate.toDateString() ? 'bg-[#1177bb]' : ''}
              ${day.hasEntry ? 'hover:bg-[#4e4e52]' : ''}
            `}
            onClick={() => handleDateClick(day)}
            title={day.hasEntry ? `Click to view entries for ${day.date.toLocaleDateString()}` : ''}
          >
            {day.day}
            {day.hasEntry && (
              <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
