import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModules } from "@/hooks/useModules";
import { PlusCircle, Edit, MinusCircle, ArrowLeft } from "lucide-react";
import * as LucideIcons from "lucide-react";
import MainNavigation from "@/components/MainNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { GuidedModule, ModuleStep } from "@/lib/modules";

const ModuleAdminPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { modules, addModule, updateModule } = useModules();
  
  // State for form and edit mode
  const [editMode, setEditMode] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("personal-growth");
  const [icon, setIcon] = useState("BookOpen");
  
  const [steps, setSteps] = useState<ModuleStep[]>([
    { 
      id: uuidv4(), 
      title: "", 
      description: "", 
      prompt: "" 
    }
  ]);
  
  // Load module data when editing
  useEffect(() => {
    if (selectedModuleId) {
      const moduleToEdit = modules.find(m => m.id === selectedModuleId);
      if (moduleToEdit) {
        setTitle(moduleToEdit.title);
        setDescription(moduleToEdit.description);
        setCategory(moduleToEdit.category);
        setIcon(moduleToEdit.icon);
        setSteps(moduleToEdit.steps.map(step => ({ ...step })));
      }
    }
  }, [selectedModuleId, modules]);
  
  // Start editing a module
  const handleEditModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setEditMode(true);
  };
  
  // Cancel editing and reset form
  const handleCancelEdit = () => {
    setEditMode(false);
    setSelectedModuleId(null);
    resetForm();
  };
  
  // Reset form to default values
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("personal-growth");
    setIcon("BookOpen");
    setSteps([{ 
      id: uuidv4(), 
      title: "", 
      description: "", 
      prompt: "" 
    }]);
  };
  
  // Add a new step to the module
  const handleAddStep = () => {
    setSteps([...steps, { 
      id: uuidv4(), 
      title: "", 
      description: "", 
      prompt: "" 
    }]);
  };
  
  // Remove a step from the module
  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = [...steps];
      newSteps.splice(index, 1);
      setSteps(newSteps);
    }
  };
  
  // Update a step's field
  const updateStep = (index: number, field: keyof ModuleStep, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };
  
  // Submit form to create or update module
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ModuleAdmin] Form submitted', { editMode, selectedModuleId, title, description });
    
    // Validate form
    const validSteps = steps.every(step => step.title && step.description && step.prompt);
    console.log('[ModuleAdmin] Form validation', { 
      hasTitle: !!title, 
      hasDescription: !!description, 
      validSteps, 
      stepsCount: steps.length 
    });
    
    if (!title || !description || !validSteps) {
      console.warn('[ModuleAdmin] Form validation failed');
      toast({
        title: "Missing information",
        description: "Please fill out all required fields in the form.",
        variant: "destructive"
      });
      return;
    }
    
    // Create the module object
    const moduleData = {
      id: editMode && selectedModuleId ? selectedModuleId : uuidv4(),
      title,
      description,
      category,
      icon,
      steps: steps.map(step => ({
        id: step.id,
        title: step.title,
        description: step.description,
        prompt: step.prompt
      }))
    };
    
    console.log('[ModuleAdmin] Module data prepared', moduleData);
    
    if (editMode && selectedModuleId) {
      // Update existing module
      console.log('[ModuleAdmin] Updating existing module', selectedModuleId);
      updateModule(selectedModuleId, moduleData);
      toast({
        title: "Module updated",
        description: "Your guided module has been updated successfully."
      });
    } else {
      // Add new module
      console.log('[ModuleAdmin] Adding new module');
      addModule(moduleData);
      toast({
        title: "Module created",
        description: "Your new guided module has been created successfully."
      });
    }
    
    // Reset and go back to list view
    console.log('[ModuleAdmin] Resetting form and returning to list view');
    resetForm();
    setEditMode(false);
    setSelectedModuleId(null);
  };
  
  // Render icon from name
  const renderIcon = (iconName: string) => {
    const iconSet = LucideIcons as unknown;
    const icons = iconSet as Record<string, React.ComponentType<{ className?: string }>>;
    const Icon = icons[iconName] || LucideIcons.BookOpen;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-app-bg-primary to-app-bg-secondary">

      
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-app-bg-secondary to-app-bg-elevated py-8">
        <div className="container max-w-6xl">
          <h1 className="text-3xl font-bold text-app-text-primary mb-8">Module Admin</h1>
          
          {/* Module Listing Section - Show only when not in edit mode */}
          {!editMode && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-app-text-primary">Existing Modules</h2>
              <Button 
                onClick={() => { setEditMode(true); setSelectedModuleId(null); }}
                className="bg-app-bg-tertiary hover:bg-app-bg-hover text-app-text-primary"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Module
              </Button>
            </div>
            
            {modules.length === 0 ? (
              <Card className="bg-app-bg-tertiary border-app-border-primary p-6">
                <div className="text-center py-8">
                  <h2 className="text-xl font-medium text-app-text-secondary mb-4">No modules yet</h2>
                  <p className="text-app-text-tertiary mb-8">Create your first module to get started.</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                  <Card 
                    key={module.id} 
                    className={cn(
                      "overflow-hidden hover:shadow-md transition-all duration-200 bg-app-bg-tertiary border-app-border-primary",
                      "hover:border-app-border-secondary"
                    )}
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-2">
                        <div className="mr-3 bg-app-bg-elevated p-2 rounded-full">
                          {renderIcon(module.icon)}
                        </div>
                        <div>
                        <h3 className="font-medium text-app-text-primary">{module.title}</h3>
                        <p className="text-sm text-app-text-secondary">{module.category}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm mb-4 text-app-text-secondary line-clamp-2">
                        {module.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs mb-4">
                        <span className="text-app-text-tertiary">{module.steps.length} steps</span>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditModule(module.id)}
                          className="bg-app-bg-tertiary hover:bg-app-bg-hover text-app-text-primary border-app-border-primary"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Module Creation/Editing Form - Show only when in edit mode */}
          {editMode && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-app-text-primary">
                  {selectedModuleId ? "Edit Module" : "Create New Module"}
                </h2>
                <Button 
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="bg-app-bg-tertiary hover:bg-app-bg-hover text-app-text-primary"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Modules
                </Button>
              </div>
              
              <Card className="bg-app-bg-tertiary border-app-border-primary">
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="module-title">Module Title</Label>
                        <Input 
                          id="module-title" 
                          value={title} 
                          onChange={(e) => setTitle(e.target.value)} 
                          placeholder="Enter a descriptive title" 
                          required 
                          className="bg-app-bg-secondary border-app-border-secondary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="module-category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="bg-app-bg-secondary border-app-border-secondary">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal-growth">Personal Growth</SelectItem>
                            <SelectItem value="emotional-wellbeing">Emotional Well-being</SelectItem>
                            <SelectItem value="productivity">Productivity</SelectItem>
                            <SelectItem value="self-care">Self-Care</SelectItem>
                            <SelectItem value="relationships">Relationships</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="module-description">Description</Label>
                        <Textarea 
                          id="module-description" 
                          value={description} 
                          onChange={(e) => setDescription(e.target.value)} 
                          placeholder="Explain what this module is about and what users can expect" 
                          required 
                          className="bg-app-bg-secondary border-app-border-secondary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="module-icon">Icon</Label>
                        <Select value={icon} onValueChange={setIcon}>
                          <SelectTrigger className="bg-app-bg-secondary border-app-border-secondary">
                            <SelectValue placeholder="Select an icon" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BookOpen">Book</SelectItem>
                            <SelectItem value="Heart">Heart</SelectItem>
                            <SelectItem value="PenSquare">Journal</SelectItem>
                            <SelectItem value="Brain">Brain</SelectItem>
                            <SelectItem value="Star">Star</SelectItem>
                            <SelectItem value="Sparkles">Sparkles</SelectItem>
                            <SelectItem value="Target">Target</SelectItem>
                            <SelectItem value="Compass">Compass</SelectItem>
                            <SelectItem value="Lightbulb">Lightbulb</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 flex items-center justify-start">
                        <div className="p-4 bg-app-bg-secondary rounded-md">
                          {renderIcon(icon)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Module Steps</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddStep}
                          className="flex items-center gap-1 bg-app-bg-secondary border-app-border-secondary"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Step
                        </Button>
                      </div>
                      
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-6">
                          {steps.map((step, index) => (
                            <div key={step.id} className="space-y-3 p-4 border border-app-border-secondary rounded-md relative bg-app-bg-elevated">
                              <div className="absolute right-2 top-2">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleRemoveStep(index)}
                                  disabled={steps.length === 1}
                                  className="text-app-text-secondary hover:text-app-text-primary"
                                >
                                  <MinusCircle className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="bg-app-bg-hover text-app-text-primary px-2 py-1 rounded text-xs font-medium">
                                  Step {index + 1}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`step-${index}-title`}>Title</Label>
                                <Input 
                                  id={`step-${index}-title`} 
                                  value={step.title} 
                                  onChange={(e) => updateStep(index, "title", e.target.value)} 
                                  placeholder="Step title" 
                                  required 
                                  className="bg-app-bg-secondary border-app-border-secondary"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`step-${index}-description`}>Description</Label>
                                <Input 
                                  id={`step-${index}-description`} 
                                  value={step.description} 
                                  onChange={(e) => updateStep(index, "description", e.target.value)} 
                                  placeholder="Brief step description" 
                                  required 
                                  className="bg-app-bg-secondary border-app-border-secondary"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`step-${index}-prompt`}>Writing Prompt</Label>
                                <Textarea 
                                  id={`step-${index}-prompt`} 
                                  value={step.prompt} 
                                  onChange={(e) => updateStep(index, "prompt", e.target.value)} 
                                  placeholder="The writing prompt for this step" 
                                  required 
                                  className="bg-app-bg-secondary border-app-border-secondary"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between py-6">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={handleCancelEdit}
                      className="bg-[#2a2a2a] border-[#444444]"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-[#4a4a4a] hover:bg-[#5a5a5a]"
                    >
                      {selectedModuleId ? "Update Module" : "Create Module"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleAdminPage;
