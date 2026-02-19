import * as React from "react";
import { useJournal } from "@/hooks/useJournal";
import { getPersonas, cachePersonas, getPersonasSync } from "@/lib/aiPersonas"; 
import { Check, ChevronsUpDown, Brain, Heart, Target, CircleHelp, Sparkles, Lightbulb, Compass, Shield, Star, Flame, Zap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const personaIcons: { [key: string]: React.ReactNode } = {
  brain: <Brain className="mr-2 h-4 w-4" />,
  heart: <Heart className="mr-2 h-4 w-4" />,
  target: <Target className="mr-2 h-4 w-4" />,
  psychology: <CircleHelp className="mr-2 h-4 w-4" />,
  sparkles: <Sparkles className="mr-2 h-4 w-4" />,
  lightbulb: <Lightbulb className="mr-2 h-4 w-4" />,
  compass: <Compass className="mr-2 h-4 w-4" />,
  shield: <Shield className="mr-2 h-4 w-4" />,
  star: <Star className="mr-2 h-4 w-4" />,
  flame: <Flame className="mr-2 h-4 w-4" />,
  zap: <Zap className="mr-2 h-4 w-4" />,
  bookopen: <BookOpen className="mr-2 h-4 w-4" />,
  // Legacy mappings for backward compatibility
  jungian: <CircleHelp className="mr-2 h-4 w-4" />,
  cbt: <Brain className="mr-2 h-4 w-4" />,
  supportive: <Heart className="mr-2 h-4 w-4" />,
  stern: <Target className="mr-2 h-4 w-4" />,
};

const AIPersonaSelector: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const { activePersonaId, setActivePersonaId, selectedEntry, updateEntry } = useJournal();

  // Determine the persona to display
  // If an entry is selected, use its persona. Otherwise, use the global active persona.
  const displayPersonaId = selectedEntry?.personaId || activePersonaId;

  // Get personas from database
  const [personas, setPersonas] = React.useState(() => {
    const cached = getPersonasSync();
    console.log('[AIPersonaSelector] Initial load (cached):', cached.map(p => ({ id: p.id, name: p.name })));
    return cached;
  });
  
  const [loading, setLoading] = React.useState(false);
  
  // Load personas from database on mount
  React.useEffect(() => {
    const loadPersonas = async () => {
      try {
        setLoading(true);
        console.log('[AIPersonaSelector] Loading personas from database');
        const loadedPersonas = await getPersonas();
        console.log('[AIPersonaSelector] Loaded personas:', loadedPersonas.map(p => ({ id: p.id, name: p.name })));
        setPersonas(loadedPersonas);
        cachePersonas(loadedPersonas);
      } catch (error) {
        console.error('[AIPersonaSelector] Error loading personas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPersonas();
    
    // Listen for custom event when personas are updated
    const handlePersonasUpdate = async () => {
      console.log('[AIPersonaSelector] Personas updated event, reloading');
      await loadPersonas();
    };
    window.addEventListener('personasUpdated', handlePersonasUpdate);
    
    return () => {
      window.removeEventListener('personasUpdated', handlePersonasUpdate);
    };
  }, []);
  
  // Refresh personas when popover opens
  React.useEffect(() => {
    if (open) {
      const refreshPersonas = async () => {
        try {
          console.log('[AIPersonaSelector] Refreshing personas on dropdown open');
          const loadedPersonas = await getPersonas();
          console.log('[AIPersonaSelector] Refreshed personas:', loadedPersonas.map(p => ({ id: p.id, name: p.name })));
          setPersonas(loadedPersonas);
          cachePersonas(loadedPersonas);
        } catch (error) {
          console.error('[AIPersonaSelector] Error refreshing personas:', error);
        }
      };
      
      refreshPersonas();
    }
  }, [open]);
  
  // Add defensive fallback for personas
  const safePersonas = personas || [];
  console.log('[AIPersonaSelector] Rendering with personas:', safePersonas.map(p => ({ id: p.id, name: p.name })));
  const currentPersona = safePersonas.find(persona => persona.id === displayPersonaId) || safePersonas[0];

  // If no personas are available, render a disabled button
  if (!currentPersona) {
    return (
      <Button
        variant="outline"
        role="combobox"
        className="w-[180px] justify-between"
        disabled
      >
        No Personas Loaded
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[180px] justify-between bg-[#3e3e42] border-gray-600 text-white hover:bg-[#4e4e52]"
          style={{ borderRadius: 0 }}
        >
          <div className="flex items-center">
            {personaIcons[currentPersona.id]}
            <span>{currentPersona.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[280px] p-0 bg-[#2d2d2d] border-gray-600 max-h-[300px] overflow-hidden z-50" 
        align="end" 
        side="bottom"
        sideOffset={4}
        style={{ borderRadius: 0, maxWidth: '280px' }}
      >
        <Command className="bg-[#2d2d2d] text-white">
          <CommandInput placeholder="Search AI personas..." className="bg-[#3e3e42] border-gray-600 text-white" />
          <CommandList className="bg-[#2d2d2d]">
            <CommandEmpty className="text-gray-400">No persona found.</CommandEmpty>
            <CommandGroup>
              {safePersonas.map((persona) => (
                <CommandItem
                  key={persona.id}
                  value={persona.name}
                  onSelect={() => {
                    setActivePersonaId(persona.id);
                    if (selectedEntry) {
                      updateEntry(selectedEntry.id, { personaId: persona.id });
                    }
                    setOpen(false);
                  }}
                  className="flex items-start py-2 text-white hover:bg-[#3e3e42]"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-start flex-col">
                      <div className="flex items-center">
                        {personaIcons[persona.id]}
                        <span>{persona.name}</span>
                      </div>
                      <p className="text-xs text-gray-400 ml-6">
                        {persona.description}
                      </p>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        displayPersonaId === persona.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AIPersonaSelector;
