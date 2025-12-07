/**
 * TemplateSelector Component
 * 
 * Allows users to select from predefined journal templates or quick prompts
 * to guide their writing and provide structure to their entries.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  FileText, 
  Clock, 
  Tag, 
  Sparkles, 
  ArrowRight,
  Shuffle,
  BookOpen
} from 'lucide-react';
import { 
  getContentConfig, 
  getTemplatesByCategory, 
  getQuickPromptsByCategory,
  getRandomQuickPrompt,
  getCategoryById,
  JournalTemplate 
} from '../../config/content.config';
import { isFeatureEnabled } from '../../config/features.config';

interface TemplateSelectorProps {
  onSelectTemplate: (template: JournalTemplate) => void;
  onSelectQuickPrompt: (prompt: string) => void;
  onStartBlank: () => void;
  className?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onSelectQuickPrompt,
  onStartBlank,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const contentConfig = getContentConfig();
  const templatesEnabled = isFeatureEnabled('advanced', 'templates');

  const templates = selectedCategory === 'all' 
    ? contentConfig.templates 
    : getTemplatesByCategory(selectedCategory);

  const quickPrompts = selectedCategory === 'all'
    ? contentConfig.quickPrompts
    : getQuickPromptsByCategory(selectedCategory);

  const handleTemplateSelect = (template: JournalTemplate) => {
    onSelectTemplate(template);
    setIsDialogOpen(false);
  };

  const handleQuickPromptSelect = (promptText: string) => {
    onSelectQuickPrompt(promptText);
    setIsDialogOpen(false);
  };

  const handleRandomPrompt = () => {
    const randomPrompt = getRandomQuickPrompt();
    handleQuickPromptSelect(randomPrompt.text);
  };

  const TemplateCard: React.FC<{ template: JournalTemplate }> = ({ template }) => {
    const category = getCategoryById(template.category);
    
    return (
      <Card 
        className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
        onClick={() => handleTemplateSelect(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {category && (
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                )}
                {template.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {template.description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Template Details */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {template.estimatedTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{template.estimatedTime} min</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>{template.prompts.length} prompts</span>
              </div>
            </div>

            {/* Sample Prompts Preview */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Sample prompts:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {template.prompts.slice(0, 2).map((prompt) => (
                  <li key={prompt.id} className="truncate">
                    • {prompt.question}
                  </li>
                ))}
                {template.prompts.length > 2 && (
                  <li className="text-xs italic">
                    +{template.prompts.length - 2} more prompts...
                  </li>
                )}
              </ul>
            </div>

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const QuickPromptCard: React.FC<{ prompt: {id: string; text: string; category: string} }> = ({ prompt }) => {
    const category = getCategoryById(prompt.category);
    
    return (
      <Card 
        className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
        onClick={() => handleQuickPromptSelect(prompt.text)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {category && (
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                )}
                <span className="text-xs text-muted-foreground capitalize">
                  {category?.name || prompt.category}
                </span>
              </div>
              <p className="text-sm font-medium">{prompt.text}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={className}>
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Button
          onClick={onStartBlank}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2"
        >
          <BookOpen className="h-6 w-6" />
          <span>Start Writing</span>
          <span className="text-xs text-muted-foreground">Blank entry</span>
        </Button>

        <Button
          onClick={handleRandomPrompt}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2"
        >
          <Shuffle className="h-6 w-6" />
          <span>Random Prompt</span>
          <span className="text-xs text-muted-foreground">Get inspired</span>
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              disabled={!templatesEnabled}
            >
              <Sparkles className="h-6 w-6" />
              <span>Use Template</span>
              <span className="text-xs text-muted-foreground">Guided writing</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Choose a Template or Prompt</DialogTitle>
              <DialogDescription>
                Select a structured template or quick prompt to guide your journaling session.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="templates" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="prompts">Quick Prompts</TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="space-y-4">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Categories
                  </Button>
                  {contentConfig.categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex items-center gap-2"
                    >
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </Button>
                  ))}
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>

                {templates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2" />
                    <p>No templates found for this category</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="prompts" className="space-y-4">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Categories
                  </Button>
                  {contentConfig.categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex items-center gap-2"
                    >
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </Button>
                  ))}
                </div>

                {/* Random Prompt Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleRandomPrompt}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Shuffle className="h-4 w-4" />
                    Get Random Prompt
                  </Button>
                </div>

                <Separator />

                {/* Quick Prompts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickPrompts.map((prompt) => (
                    <QuickPromptCard key={prompt.id} prompt={prompt} />
                  ))}
                </div>

                {quickPrompts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p>No prompts found for this category</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recent Quick Prompts */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Quick Start Prompts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contentConfig.quickPrompts.slice(0, 4).map((prompt) => (
            <QuickPromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
