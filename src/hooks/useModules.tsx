
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GuidedModule, guidedModules as initialModules } from "@/lib/modules";

interface ModulesState {
  modules: GuidedModule[];
  addModule: (module: GuidedModule) => void;
  updateModule: (moduleId: string, updates: Partial<GuidedModule>) => void;
  deleteModule: (moduleId: string) => void;
  getModuleById: (moduleId: string) => GuidedModule | undefined;
}

export const useModules = create<ModulesState>()(
  persist(
    (set, get) => ({
      modules: initialModules || [],
      
      addModule: (module) => 
        set((state) => ({
          modules: [...(state.modules || []), module]
        })),
      
      updateModule: (moduleId, updates) => {
        console.log('[useModules] updateModule called', { moduleId, updates });
        set((state) => {
          const currentModules = state.modules || [];
          console.log('[useModules] Current modules before update', currentModules);
          const updatedModules = currentModules.map((module) =>
            module.id === moduleId ? { ...module, ...updates } : module
          );
          console.log('[useModules] Updated modules after update', updatedModules);
          return { modules: updatedModules };
        });
      },
      
      deleteModule: (moduleId) =>
        set((state) => ({
          modules: (state.modules || []).filter((module) => module.id !== moduleId)
        })),
      
      getModuleById: (moduleId) => {
        return (get().modules || []).find((module) => module.id === moduleId);
      }
    }),
    {
      name: "modules-storage",
    }
  )
);
