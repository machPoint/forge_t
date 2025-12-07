import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import { useModules } from "@/hooks/useModules";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, MinusCircle, ArrowLeft } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import MainNavigation from "@/components/MainNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const AddModule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addModule } = useModules();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("personal-growth");
  const [icon, setIcon] = useState("BookOpen");
  
  const [steps, setSteps] = useState([
    { 
      id: uuidv4(), 
      title: "", 
      description: "", 
      prompt: "" 
    }
  ]);
  
  const handleAddStep = () => {
    setSteps([...steps, { 
      id: uuidv4(), 
      title: "", 
      description: "", 
      prompt: "" 
    }]);
  };
  
  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = [...steps];
      newSteps.splice(index, 1);
      setSteps(newSteps);
    }
  };
  
  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Make sure all steps have required fields
    const validSteps = steps.every(step => step.title && step.description && step.prompt);
    
    if (!title || !description || !validSteps) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields in the form.",
        variant: "destructive"
      });
      return;
    }
    
    // Create the new module
    const newModule = {
      id: uuidv4(),
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
    
    addModule(newModule);
    
    toast({
      title: "Module created",
      description: "Your new guided module has been created successfully."
    });
    
    navigate("/modules");
  };
  
  return (
    <div className="page-container bg-app-bg-primary text-app-text-primary">
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-app-bg-primary py-8">
        <div className="container max-w-3xl">
          <div className="mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Button variant="ghost" className="p-0" onClick={() => navigate("/")}>Home</Button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Button variant="ghost" className="p-0" onClick={() => navigate("/modules")}>Modules</Button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink>Create Module</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <Card className="bg-app-bg-tertiary border-app-border-primary text-app-text-primary">
            <CardHeader>
              <CardTitle>Create New Guided Module</CardTitle>
              <CardDescription className="text-app-text-secondary">
                Design a structured journaling module with multiple steps for guided reflection.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Module Title</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Enter a descriptive title" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Explain what this module is about and what users can expect" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal-growth">Personal Growth</SelectItem>
                        <SelectItem value="mindfulness">Mindfulness</SelectItem>
                        <SelectItem value="productivity">Productivity</SelectItem>
                        <SelectItem value="creativity">Creativity</SelectItem>
                        <SelectItem value="relationships">Relationships</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Select value={icon} onValueChange={setIcon}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BookOpen">Book</SelectItem>
                        <SelectItem value="Heart">Heart</SelectItem>
                        <SelectItem value="Brain">Brain</SelectItem>
                        <SelectItem value="Star">Star</SelectItem>
                        <SelectItem value="Sparkles">Sparkles</SelectItem>
                        <SelectItem value="Target">Target</SelectItem>
                      </SelectContent>
                    </Select>
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
                      className="flex items-center gap-1"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Step
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-6">
                      {steps.map((step, index) => (
                        <div key={step.id} className="space-y-3 p-4 border rounded-md relative">
                          <div className="absolute right-2 top-2">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveStep(index)}
                              disabled={steps.length === 1}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
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
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => navigate("/modules")}>
                  Cancel
                </Button>
                <Button type="submit">Create Module</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddModule;
