import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Heart, 
  Target, 
  CircleHelp, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X,
  LogOut,
  AlertTriangle
} from "lucide-react";
import JournalExport from "@/components/JournalExport";
import UpdateManager from "@/components/UpdateManager";
import CustomizationManager from "@/components/CustomizationManager";
import { 
  getAIInsightsPrompt, 
  saveAIInsightsPrompt, 
  resetAIInsightsPrompt, 
  AIInsightsPrompt 
} from "@/lib/aiInsightsPrompt";
import { 
  getChatSystemPrompt, 
  saveChatSystemPrompt, 
  ChatSystemPrompt,
  defaultChatSystemPrompt 
} from "@/lib/chatSystemPrompt";
import { AIPersona, aiPersonas as defaultPersonas } from "@/lib/aiPersonas";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import OpalSettings from "@/components/OpalSettings";

// Define icon mapping
const iconOptions = [
  { id: "brain", label: "Brain", icon: <Brain className="h-4 w-4" /> },
  { id: "heart", label: "Heart", icon: <Heart className="h-4 w-4" /> },
  { id: "target", label: "Target", icon: <Target className="h-4 w-4" /> },
  { id: "psychology", label: "Psychology", icon: <CircleHelp className="h-4 w-4" /> },
];

const AdminPage = () => {
  // State for personas
  const [personas, setPersonas] = useLocalStorage<AIPersona[]>("aiPersonas", defaultPersonas);
  const [editingPersona, setEditingPersona] = useState<AIPersona | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("personas");
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedModel, setSelectedModel] = useLocalStorage<string>("selectedAIModel", "gpt-4o");

  // State for AI Insights prompt
  const [aiInsightsPrompt, setAiInsightsPrompt] = useState<AIInsightsPrompt>(getAIInsightsPrompt());
  const [isEditingInsights, setIsEditingInsights] = useState(false);
  const [tempInsightsPrompt, setTempInsightsPrompt] = useState<AIInsightsPrompt>(aiInsightsPrompt);

  // State for Chat system prompt
  const [chatSystemPrompt, setChatSystemPrompt] = useState<ChatSystemPrompt>(getChatSystemPrompt());
  const [isEditingChat, setIsEditingChat] = useState(false);
  const [tempChatPrompt, setTempChatPrompt] = useState<ChatSystemPrompt>(chatSystemPrompt);

  // Create a new persona
  const createNewPersona = () => {
    const newPersona: AIPersona = {
      id: `persona_${Date.now()}`,
      name: "New Persona",
      description: "Description of this persona",
      icon: "brain",
      prompt: "Enter the system prompt for this persona",
      accentColor: "rgb(74, 134, 232)",
    };
    setEditingPersona(newPersona);
    setIsDialogOpen(true);
  };

  // Edit an existing persona
  const editPersona = (persona: AIPersona) => {
    setEditingPersona({ ...persona });
    setIsDialogOpen(true);
  };

  // Save persona changes
  const savePersona = () => {
    if (!editingPersona) return;

    const isNew = !personas.some(p => p.id === editingPersona.id);
    
    if (isNew) {
      setPersonas([...personas, editingPersona]);
    } else {
      setPersonas(personas.map(p => 
        p.id === editingPersona.id ? editingPersona : p
      ));
    }
    
    setIsDialogOpen(false);
    setEditingPersona(null);
  };

  // Delete a persona
  const deletePersona = (id: string) => {
    setPersonas(personas.filter(p => p.id !== id));
  };

  // Handle input changes for editing persona
  const handlePersonaChange = (field: keyof AIPersona, value: string) => {
    if (!editingPersona) return;
    setEditingPersona({
      ...editingPersona,
      [field]: value
    });
  };

  // Reset personas to default
  const resetToDefault = () => {
    setPersonas(defaultPersonas);
  };

  // AI Insights prompt handlers
  const startEditingInsights = () => {
    setTempInsightsPrompt(aiInsightsPrompt);
    setIsEditingInsights(true);
  };

  const saveInsightsPrompt = () => {
    saveAIInsightsPrompt(tempInsightsPrompt);
    setAiInsightsPrompt(tempInsightsPrompt);
    setIsEditingInsights(false);
  };

  const cancelEditingInsights = () => {
    setTempInsightsPrompt(aiInsightsPrompt);
    setIsEditingInsights(false);
  };

  const resetInsightsPrompt = () => {
    const defaultPrompt = resetAIInsightsPrompt();
    setAiInsightsPrompt(defaultPrompt);
    setTempInsightsPrompt(defaultPrompt);
    setIsEditingInsights(false);
  };

  const handleInsightsPromptChange = (field: keyof AIInsightsPrompt, value: string) => {
    setTempInsightsPrompt({
      ...tempInsightsPrompt,
      [field]: value
    });
  };

  // Chat system prompt handlers
  const startEditingChat = () => {
    setTempChatPrompt(chatSystemPrompt);
    setIsEditingChat(true);
  };

  const saveChatPrompt = () => {
    saveChatSystemPrompt(tempChatPrompt);
    setChatSystemPrompt(tempChatPrompt);
    setIsEditingChat(false);
  };

  const cancelEditingChat = () => {
    setTempChatPrompt(chatSystemPrompt);
    setIsEditingChat(false);
  };

  const resetChatPrompt = () => {
    const defaultPrompt = defaultChatSystemPrompt;
    setChatSystemPrompt(defaultPrompt);
    setTempChatPrompt(defaultPrompt);
    saveChatSystemPrompt(defaultPrompt);
    setIsEditingChat(false);
  };

  const handleChatPromptChange = (field: keyof ChatSystemPrompt, value: string) => {
    setTempChatPrompt({
      ...tempChatPrompt,
      [field]: value
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-app-bg-primary to-app-bg-secondary">

      
      

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="personas">AI Personas</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="chat">Chat System</TabsTrigger>
            <TabsTrigger value="connection">OPAL Connection</TabsTrigger>
            <TabsTrigger value="customizations">Customizations</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>OPAL Connection Settings</CardTitle>
                <CardDescription>
                  Manage your connection to the OPAL AI server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OpalSettings isOpen={true} onClose={() => {}} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="personas" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-app-text-primary">AI Personas</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetToDefault}>
                  Reset to Default
                </Button>
                <Button onClick={createNewPersona}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Persona
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personas.map((persona) => (
                <Card key={persona.id} className="bg-app-bg-tertiary border-app-border-secondary">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {iconOptions.find(i => i.id === persona.icon)?.icon || <Brain className="h-5 w-5" />}
                        <CardTitle className="text-lg">{persona.name}</CardTitle>
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: persona.accentColor }}
                      />
                    </div>
                    <CardDescription>{persona.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm text-app-text-secondary line-clamp-3">
                      {persona.prompt}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deletePersona(persona.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => editPersona(persona)}
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            <Card className="bg-app-bg-tertiary border-app-border-secondary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>AI Insights System Prompt</span>
                  <div className="flex gap-2">
                    {!isEditingInsights ? (
                      <>
                        <Button variant="outline" size="sm" onClick={resetInsightsPrompt}>
                          Reset to Default
                        </Button>
                        <Button size="sm" onClick={startEditingInsights}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Prompt
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={cancelEditingInsights}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveInsightsPrompt}>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  Customize the system prompt that guides AI Insights analysis and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditingInsights ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Current Prompt Configuration</h4>
                      <div className="bg-app-bg-elevated p-4 rounded-md space-y-2">
                        <div><strong>Name:</strong> {aiInsightsPrompt.name}</div>
                        <div><strong>Description:</strong> {aiInsightsPrompt.description}</div>
                        <div><strong>Last Modified:</strong> {new Date(aiInsightsPrompt.lastModified).toLocaleString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">System Prompt Preview</h4>
                      <div className="bg-app-bg-elevated p-4 rounded-md max-h-40 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap text-app-text-primary">
                          {aiInsightsPrompt.systemPrompt.substring(0, 500)}
                          {aiInsightsPrompt.systemPrompt.length > 500 && "..."}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <Input
                          value={tempInsightsPrompt.name}
                          onChange={(e) => handleInsightsPromptChange('name', e.target.value)}
                          placeholder="Enter prompt name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <Input
                          value={tempInsightsPrompt.description}
                          onChange={(e) => handleInsightsPromptChange('description', e.target.value)}
                          placeholder="Enter prompt description"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">System Prompt</label>
                      <Textarea
                        value={tempInsightsPrompt.systemPrompt}
                        onChange={(e) => handleInsightsPromptChange('systemPrompt', e.target.value)}
                        placeholder="Enter the system prompt for AI Insights..."
                        className="min-h-[400px] font-mono text-sm"
                      />
                      <p className="text-xs text-app-text-secondary mt-2">
                        This prompt guides how AI Insights analyzes journal entries and memories. 
                        Include instructions for analysis framework, response format, tone, and personalization.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="chat" className="space-y-4">
            <Card className="bg-app-bg-tertiary border-app-border-secondary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Chat System Prompt</span>
                  <div className="flex gap-2">
                    {!isEditingChat ? (
                      <>
                        <Button variant="outline" size="sm" onClick={resetChatPrompt}>
                          Reset to Default
                        </Button>
                        <Button size="sm" onClick={startEditingChat}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Prompt
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={cancelEditingChat}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveChatPrompt}>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  Customize the system prompt that guides the AI Chat therapeutic companion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditingChat ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Current Prompt Configuration</h4>
                      <div className="bg-app-bg-elevated p-4 rounded-md space-y-2">
                        <div><strong>Name:</strong> {chatSystemPrompt.name}</div>
                        <div><strong>Description:</strong> {chatSystemPrompt.description}</div>
                        <div><strong>Last Modified:</strong> {new Date(chatSystemPrompt.lastModified).toLocaleString()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">System Prompt Preview</h4>
                      <div className="bg-app-bg-elevated p-4 rounded-md max-h-40 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap text-app-text-primary">
                          {chatSystemPrompt.systemPrompt.substring(0, 500)}
                          {chatSystemPrompt.systemPrompt.length > 500 && "..."}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input
                        value={tempChatPrompt.name}
                        onChange={(e) => handleChatPromptChange('name', e.target.value)}
                        placeholder="Enter prompt name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <Input
                        value={tempChatPrompt.description}
                        onChange={(e) => handleChatPromptChange('description', e.target.value)}
                        placeholder="Enter prompt description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">System Prompt</label>
                      <Textarea
                        value={tempChatPrompt.systemPrompt}
                        onChange={(e) => handleChatPromptChange('systemPrompt', e.target.value)}
                        placeholder="Enter the system prompt for the chat companion"
                        className="min-h-[300px] font-mono text-sm"
                      />
                      <p className="text-xs text-app-text-secondary mt-2">
                        This prompt guides how the AI Chat companion responds to users. 
                        Include instructions for therapeutic approach, conversation style, and personalization.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customizations" className="space-y-4">
            <Card className="bg-app-bg-tertiary border-app-border-secondary">
              <CardHeader>
                <CardTitle>Customization Manager</CardTitle>
                <CardDescription>
                  Configure branding, themes, and AI personalities for different use cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomizationManager />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-app-bg-tertiary border-app-border-secondary">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure global system settings and data management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* App Information Section */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-app-text-primary">Application Information</h3>
                  <div className="flex items-center gap-2 bg-app-bg-elevated p-3 rounded-md">
                    <div className="font-bold text-xl">FORGE</div>
                  </div>
                </div>

                {/* AI Model Selection Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-app-text-primary">AI Model Configuration</h3>
                  <div className="bg-app-bg-elevated p-4 rounded-md space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">OpenAI Model</p>
                        <p className="text-sm text-app-text-secondary">Select which AI model to use for therapeutic responses</p>
                      </div>
                      <Select 
                        value={selectedModel} 
                        onValueChange={setSelectedModel}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o">
                            <div className="flex flex-col">
                              <span className="font-medium">GPT-4o</span>
                              <span className="text-xs text-app-text-secondary">Latest, most capable model</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="gpt-4o-mini">
                            <div className="flex flex-col">
                              <span className="font-medium">GPT-4o-mini</span>
                              <span className="text-xs text-app-text-secondary">Faster, cost-effective version</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-xs text-app-text-tertiary">
                      Changes take effect immediately for new AI interactions
                    </div>
                  </div>
                </div>

                {/* Account Management Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-app-text-primary">Account Management</h3>
                  <div className="bg-app-bg-elevated p-4 rounded-md space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Sign Out</p>
                        <p className="text-sm text-app-text-secondary">Sign out of your account and return to the login screen</p>
                      </div>
                      <Button 
                        variant="destructive" 
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Journal Export Card */}
            <JournalExport />
            
            {/* Update Manager Card */}
            <UpdateManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Persona Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingPersona?.id.startsWith('persona_') ? 'Create New Persona' : 'Edit Persona'}</DialogTitle>
            <DialogDescription>
              Customize how this AI persona will interact with users.
            </DialogDescription>
          </DialogHeader>
          
          {editingPersona && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Name</label>
                <Input 
                  className="col-span-3" 
                  value={editingPersona.name} 
                  onChange={(e) => handlePersonaChange('name', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Description</label>
                <Input 
                  className="col-span-3" 
                  value={editingPersona.description} 
                  onChange={(e) => handlePersonaChange('description', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Icon</label>
                <Select 
                  value={editingPersona.icon} 
                  onValueChange={(value) => handlePersonaChange('icon', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(option => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center">
                          {option.icon}
                          <span className="ml-2">{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Accent Color</label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input 
                    value={editingPersona.accentColor} 
                    onChange={(e) => handlePersonaChange('accentColor', e.target.value)}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border border-gray-300" 
                    style={{ backgroundColor: editingPersona.accentColor }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <label className="text-right pt-2">System Prompt</label>
                <Textarea 
                  className="col-span-3 min-h-[120px]" 
                  value={editingPersona.prompt} 
                  onChange={(e) => handlePersonaChange('prompt', e.target.value)}
                  placeholder="Enter the system prompt that will guide this persona's behavior"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={savePersona}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Sign Out
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You'll need to enter your credentials again to access your journal and memories.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowLogoutConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                logout();
                setShowLogoutConfirm(false);
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OPAL Settings Modal is now handled by AppHeader */}
    </div>
  );
};

export default AdminPage;
