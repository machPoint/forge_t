export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic' | 'grok';
}

// Default models as fallback - actual models are fetched dynamically from OpenAI API
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Latest, most capable model',
    provider: 'openai'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o-mini', 
    description: 'Faster, cost-effective version',
    provider: 'openai'
  }
];

export const getSelectedModel = (): string => {
  const model = localStorage.getItem('selectedAIModel') || 'gpt-4o-mini';
  console.log('[ModelConfig] Getting selected model:', model);
  return model;
};

export const setSelectedModel = (model: string): void => {
  console.log('[ModelConfig] Setting selected model:', model);
  localStorage.setItem('selectedAIModel', model);
  // Trigger a custom event to notify other parts of the app
  window.dispatchEvent(new CustomEvent('aiModelChanged', { detail: { model } }));
};

export const getModelConfig = (modelId: string): ModelConfig | undefined => {
  return AVAILABLE_MODELS.find(model => model.id === modelId);
};
