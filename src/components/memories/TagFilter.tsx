import React, { useState } from "react";
import { Tag, X, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onTagSelect: (tags: string[]) => void;
  className?: string;
}

const TagFilter: React.FC<TagFilterProps> = ({
  allTags,
  selectedTags,
  onTagSelect,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  // Filter tags based on search term
  const filteredTags = allTags
    .filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
  
  // Clear all selected tags
  const handleClearAll = () => {
    onTagSelect([]);
  };
  
  // Toggle a tag in the selected tags array
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagSelect(selectedTags.filter(t => t !== tag));
    } else {
      onTagSelect([...selectedTags, tag]);
    }
  };
  
  // Remove a single tag from selection
  const removeTag = (tag: string) => {
    onTagSelect(selectedTags.filter(t => t !== tag));
  };
  
  return (
    <div className={cn("px-2 py-1", className)}>
      {/* Compact header with controls inline */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Tag className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-200">Tags:</span>
          
          {/* Inline selected tag badges */}
          <div className="flex flex-wrap items-center gap-1 ml-1">
            {selectedTags.length === 0 && (
              <span className="text-sm text-gray-400 italic">None</span>
            )}
            
            {selectedTags.slice(0, 3).map(tag => (
              <Badge 
                key={tag} 
                variant="secondary"
                className="h-6 px-2 py-0 text-sm bg-gray-500/20 text-gray-400 border-gray-500/30 gap-1"
              >
                {tag}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeTag(tag)}
                  className="h-3 w-3 p-0 ml-0.5 text-gray-400 hover:text-gray-300 hover:bg-transparent"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
            
            {/* Show count badge if more than 3 tags */}
            {selectedTags.length > 3 && (
              <Badge className="h-6 px-2 py-0 text-sm bg-gray-500/20 text-gray-400">
                +{selectedTags.length - 3} more
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {selectedTags.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAll}
              className="h-6 px-2 text-sm text-gray-400 hover:text-gray-300"
            >
              Clear
            </Button>
          )}
          
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="h-6 px-2 text-sm text-gray-400 border-gray-500/30 hover:bg-gray-500/10"
              >
                <Plus className="h-2 w-2 mr-1" />
                Browse
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-[#1d1d1d] border-gray-600">
              <div className="p-2 border-b border-gray-600">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tags..."
                    className="pl-8 h-9 bg-[#2a2a2a] border-gray-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="h-72 overflow-auto">
                <div className="p-2 grid grid-cols-2 gap-1">
                  {filteredTags.length > 0 ? (
                    filteredTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                        className={cn(
                          "cursor-pointer justify-center py-1",
                          selectedTags.includes(tag) 
                            ? "bg-gray-500/20 text-gray-400 border-gray-500/30" 
                            : "text-gray-400 border-gray-600 hover:bg-gray-700/30"
                        )}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <div className="col-span-2 p-4 text-center text-gray-400">
                      No tags matching "{searchTerm}"
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-2 border-t border-gray-600 flex justify-between">
                <div className="text-xs text-gray-400">
                  {selectedTags.length} tag(s) selected
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="h-8 text-xs text-gray-400"
                >
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default TagFilter;
