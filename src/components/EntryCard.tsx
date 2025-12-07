import React from "react";
import { JournalEntry, useJournal } from "@/hooks/useJournal";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EntryCardProps {
  entry: JournalEntry;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry }) => {
  const { selectedEntry, setSelectedEntry, deleteEntry } = useJournal();
  const isSelected = selectedEntry?.id === entry.id;

  const handleSelectEntry = () => {
    setSelectedEntry(entry);
  };

  const handleDeleteEntry = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEntry(entry.id);
  };

  // Format the date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <Card
      className={cn(
        "p-3 cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected
          ? "ring-2 ring-gray-400 dark:ring-gray-600 shadow-sm"
          : "hover:bg-gray-50 dark:hover:bg-gray-800"
      )}
      onClick={handleSelectEntry}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1 overflow-hidden mr-2">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate text-sm">
            {entry.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-xs">
            {formatDate(entry.createdAt)}
          </p>
        </div>
        <button
          className="text-gray-400 hover:text-destructive transition-colors p-1"
          onClick={handleDeleteEntry}
          aria-label="Delete entry"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </Card>
  );
};

export default EntryCard;
