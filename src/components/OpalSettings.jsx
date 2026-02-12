import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertCircle, Loader2, Eye, EyeOff, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import { getSelectedModel, setSelectedModel as saveSelectedModel } from '@/lib/modelConfig';
import opal from "@/lib/simple-opal-client";
import authService from "@/lib/auth-service";
import JournalExport from "./JournalExport";
import JournalImport from "./JournalImport";

export default function OpalSettings({ isOpen, onClose }) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [tools, setTools] = useState([]);
  
  // OpenAI API testing state
  const [openaiStatus, setOpenaiStatus] = useState('unknown');
  const [openaiTesting, setOpenaiTesting] = useState(false);
  const [openaiError, setOpenaiError] = useState(null);
  const [openaiModels, setOpenaiModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  
  // OpenAI API key management state
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [openaiKeySaving, setOpenaiKeySaving] = useState(false);
  const [openaiKeyLoadStatus, setOpenaiKeyLoadStatus] = useState('loading');
  
  // Anthropic API key management state
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [anthropicKeySaving, setAnthropicKeySaving] = useState(false);
  const [anthropicKeyLoadStatus, setAnthropicKeyLoadStatus] = useState('loading');
  const [anthropicStatus, setAnthropicStatus] = useState('unknown');
  const [anthropicTesting, setAnthropicTesting] = useState(false);
  const [anthropicError, setAnthropicError] = useState(null);
  const [anthropicModels, setAnthropicModels] = useState([
    { id: 'claude-opus-4-6' },
    { id: 'claude-opus-4-5-20251101' },
    { id: 'claude-sonnet-4-5-20250929' },
    { id: 'claude-haiku-4-5-20251001' }
  ]);
  
  // AI Provider selection
  const [selectedProvider, setSelectedProvider] = useState(() => {
    return localStorage.getItem('ai_provider') || 'openai';
  });
  
  // AI Model selection state
  const [selectedModel, setSelectedModel] = useState(() => {
    return getSelectedModel();
  });
  
  const handleModelChange = (newModel) => {
    setSelectedModel(newModel); // Update local React state
    saveSelectedModel(newModel); // Update localStorage via modelConfig
    console.log('AI model changed to:', newModel);
  };

  useEffect(() => {
    // Get the token from the centralized auth service
    const currentToken = authService.getAccessToken();
    if (currentToken) {
      setToken(currentToken);
      opal.setToken(currentToken);
      // Automatically connect if we have a token
      if (opal.getStatus() !== 'ready') {
        opal.connect();
      }
    }
    
    // Load saved API keys - first try Tauri persistent storage, then localStorage
    const loadApiKeys = async () => {
      console.log('[OpalSettings] Loading API keys on startup...');
      
      // Load OpenAI key
      let savedOpenaiKey = null;
      if (window.__TAURI__) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          savedOpenaiKey = await invoke('load_openai_api_key');
          if (savedOpenaiKey) {
            console.log('[OpalSettings] ✅ Loaded OpenAI key from Tauri');
            localStorage.setItem('openai_api_key', savedOpenaiKey);
          }
        } catch (e) {
          console.error('[OpalSettings] Error loading OpenAI key from Tauri:', e);
        }
      }
      if (!savedOpenaiKey) {
        savedOpenaiKey = localStorage.getItem('openai_api_key');
      }
      if (savedOpenaiKey) {
        setOpenaiApiKey(savedOpenaiKey);
        setOpenaiKeyLoadStatus('loaded');
      } else {
        setOpenaiKeyLoadStatus('not-found');
      }
      
      // Load Anthropic key
      let savedAnthropicKey = null;
      if (window.__TAURI__) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          savedAnthropicKey = await invoke('load_anthropic_api_key');
          if (savedAnthropicKey) {
            console.log('[OpalSettings] ✅ Loaded Anthropic key from Tauri');
            localStorage.setItem('anthropic_api_key', savedAnthropicKey);
          }
        } catch (e) {
          console.error('[OpalSettings] Error loading Anthropic key from Tauri:', e);
        }
      }
      if (!savedAnthropicKey) {
        savedAnthropicKey = localStorage.getItem('anthropic_api_key');
      }
      if (savedAnthropicKey) {
        setAnthropicApiKey(savedAnthropicKey);
        setAnthropicKeyLoadStatus('loaded');
      } else {
        setAnthropicKeyLoadStatus('not-found');
      }
    };
    
    loadApiKeys();

    // Listen for OPAL events
    const handleStatusChange = async (newStatus) => {
      console.log('[OpalSettings] OPAL status changed to:', newStatus);
      setStatus(newStatus);
      if (newStatus === 'ready') {
        setIsConnecting(false);
        setError(null);
        
        // When OPAL becomes ready, send the saved API key if we have one
        const savedKey = localStorage.getItem('openai_api_key');
        console.log('[OpalSettings] OPAL is ready, checking for saved API key...');
        if (savedKey) {
          console.log('[OpalSettings] ✅ Found saved API key, sending to OPAL server:', savedKey.substring(0, 10) + '...');
          try {
            await opal.callTool('update_openai_key', { apiKey: savedKey });
            console.log('[OpalSettings] ✅ API key sent to OPAL server successfully');
          } catch (err) {
            console.error('[OpalSettings] ❌ Failed to send API key to OPAL server:', err);
          }
        } else {
          console.warn('[OpalSettings] ⚠️ No saved API key found in localStorage when OPAL became ready');
        }
      }
    };

    const handleToolsUpdate = (newTools) => {
      setTools(newTools);
    };

    const handleError = (errorData) => {
      setError(errorData.message || 'Connection error');
      setIsConnecting(false);
    };
    
    const handleAuthenticated = (user) => {
        // Handle successful authentication
        console.log("OPAL client authenticated for", user.username);
    };

    opal.on('statusChange', handleStatusChange);
    opal.on('toolsUpdated', handleToolsUpdate);
    opal.on('error', handleError);
    opal.on('authenticated', handleAuthenticated);

    // Set initial state
    setStatus(opal.getStatus());
    setTools(opal.getTools());

    return () => {
      opal.off('statusChange', handleStatusChange);
      opal.off('toolsUpdated', handleToolsUpdate);
      opal.off('error', handleError);
      opal.off('authenticated', handleAuthenticated);
    };
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await opal.connect();
    } catch (err) {
      setError(err.message);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await opal.disconnect();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReconnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await opal.connect();
    } catch (err) {
      setError(err.message);
      setIsConnecting(false);
    }
  };

  // Save OpenAI API key
  const saveOpenAIApiKey = async () => {
    if (!openaiApiKey.trim()) {
      setOpenaiError('Please enter a valid API key');
      return;
    }
    
    setOpenaiKeySaving(true);
    try {
      // Save to localStorage for frontend use
      localStorage.setItem('openai_api_key', openaiApiKey.trim());
      
      // Save to Tauri persistent storage for backend use on restart
      if (window.__TAURI__) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const result = await invoke('save_openai_api_key', { apiKey: openaiApiKey.trim() });
          console.log('✅ API key saved to Tauri persistent storage:', result);
          alert('API key saved successfully!\n\n' + result + '\n\nThe key will now persist across app restarts.');
        } catch (err) {
          console.error('❌ Failed to save API key to Tauri storage:', err);
          alert('Failed to save API key to persistent storage:\n\n' + err);
          throw new Error('Failed to save to persistent storage: ' + err);
        }
      } else {
        console.warn('⚠️ Not running in Tauri, skipping persistent storage save');
      }
      
      // Send to OPAL server to update environment for current session
      await opal.callTool('update_openai_key', { apiKey: openaiApiKey.trim() });
      
      setOpenaiError(null);
      // Auto-test the connection after saving
      setTimeout(() => testOpenAIConnection(), 500);
    } catch (error) {
      console.error('Error saving API key:', error);
      setOpenaiError('Failed to save API key: ' + error.message);
    } finally {
      setOpenaiKeySaving(false);
    }
  };

  // Save Anthropic API key
  const saveAnthropicApiKey = async () => {
    if (!anthropicApiKey.trim()) {
      setAnthropicError('Please enter a valid API key');
      return;
    }
    
    setAnthropicKeySaving(true);
    try {
      // Save to localStorage for frontend use
      localStorage.setItem('anthropic_api_key', anthropicApiKey.trim());
      
      // Save to Tauri persistent storage for backend use on restart
      if (window.__TAURI__) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const result = await invoke('save_anthropic_api_key', { apiKey: anthropicApiKey.trim() });
          console.log('✅ Anthropic API key saved to Tauri persistent storage:', result);
          alert('Anthropic API key saved successfully!\n\n' + result + '\n\nThe key will now persist across app restarts.');
        } catch (err) {
          console.error('❌ Failed to save Anthropic API key to Tauri storage:', err);
          alert('Failed to save Anthropic API key to persistent storage:\n\n' + err);
          throw new Error('Failed to save to persistent storage: ' + err);
        }
      } else {
        console.warn('⚠️ Not running in Tauri, skipping persistent storage save');
      }
      
      // Send to OPAL server to update environment for current session
      await opal.callTool('update_anthropic_key', { apiKey: anthropicApiKey.trim() });
      
      setAnthropicError(null);
      // Auto-test the connection after saving
      setTimeout(() => testAnthropicConnection(), 500);
    } catch (error) {
      console.error('Error saving Anthropic API key:', error);
      setAnthropicError('Failed to save API key: ' + error.message);
    } finally {
      setAnthropicKeySaving(false);
    }
  };

  // Test Anthropic API connection
  const testAnthropicConnection = async () => {
    setAnthropicTesting(true);
    setAnthropicError(null);
    setAnthropicStatus('testing');
    
    try {
      const result = await opal.callTool('test_anthropic_connection', {});
      console.log('Anthropic API test result:', result);
      
      // Parse the response
      let parsedResult;
      if (result && result.content && Array.isArray(result.content)) {
        try {
          const textContent = result.content[0]?.text;
          if (textContent) {
            const jsonMatch = textContent.match(/"success":\s*(true|false)/i);
            const isSuccess = jsonMatch && jsonMatch[1] === 'true';
            const errorMatch = textContent.match(/"error":\s*"([^"]+)"/i);
            const error = errorMatch ? errorMatch[1] : null;
            parsedResult = { success: isSuccess, error: error };
          }
        } catch (e) {
          console.error('Failed to parse MCP response:', e);
        }
      } else if (result && typeof result === 'object') {
        parsedResult = result;
      }
      
      const finalResult = parsedResult || result;
      
      if (finalResult && (finalResult.success === true || finalResult.isError === false)) {
        setAnthropicStatus('connected');
        // Models are already initialized in state, no need to set them again
      } else {
        setAnthropicStatus('error');
        setAnthropicError(finalResult?.error || 'Unknown error testing Anthropic connection');
      }
    } catch (error) {
      console.error('Anthropic API test error:', error);
      setAnthropicStatus('error');
      setAnthropicError(error.message || 'Failed to test Anthropic connection');
    } finally {
      setAnthropicTesting(false);
    }
  };

  // Fetch available OpenAI models
  const fetchOpenAIModels = async () => {
    setLoadingModels(true);
    try {
      const result = await opal.callTool('list_openai_models', { filter: 'gpt' });
      console.log('OpenAI models result:', result);
      
      // Parse the response
      let models = [];
      if (result && result.success && Array.isArray(result.models)) {
        models = result.models;
      } else if (result && result.content && Array.isArray(result.content)) {
        // Handle MCP wrapped response
        try {
          const textContent = result.content[0]?.text;
          if (textContent) {
            const parsed = JSON.parse(textContent);
            if (parsed.success && Array.isArray(parsed.models)) {
              models = parsed.models;
            }
          }
        } catch (e) {
          console.error('Failed to parse models response:', e);
        }
      }
      
      setOpenaiModels(models);
      console.log('Available OpenAI models:', models.map(m => m.id));
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  // Test OpenAI API connection
  const testOpenAIConnection = async () => {
    setOpenaiTesting(true);
    setOpenaiError(null);
    setOpenaiStatus('testing');
    
    try {
      // Call the backend to test OpenAI API
      const result = await opal.callTool('test_openai_connection', {});
      console.log('OpenAI API test result:', result);
      
      // Parse the response based on format
      let parsedResult;
      if (result && result.content && Array.isArray(result.content)) {
        // Handle MCP wrapped response format
        try {
          const textContent = result.content[0]?.text;
          if (textContent) {
            // Try to extract JSON from the text content
            const jsonMatch = textContent.match(/"success":\s*(true|false)/i);
            const isSuccess = jsonMatch && jsonMatch[1] === 'true';
            
            // Extract model count if available
            const modelCountMatch = textContent.match(/"modelCount":\s*(\d+)/i);
            const modelCount = modelCountMatch ? parseInt(modelCountMatch[1]) : 0;
            
            // Extract error if not success
            const errorMatch = textContent.match(/"error":\s*"([^"]+)"/i);
            const error = errorMatch ? errorMatch[1] : null;
            
            // Extract details
            const detailsMatch = textContent.match(/"details":\s*"([^"]+)"/i);
            const details = detailsMatch ? detailsMatch[1] : null;
            
            parsedResult = {
              success: isSuccess,
              modelCount: modelCount,
              error: error,
              details: details
            };
          }
        } catch (e) {
          console.error('Failed to parse MCP response:', e);
        }
      } else if (result && typeof result === 'object') {
        // Handle direct response object
        parsedResult = result;
      }
      
      // Use the parsed result or fallback to original result
      const finalResult = parsedResult || result;
      
      if (finalResult && (finalResult.success === true || finalResult.isError === false)) {
        setOpenaiStatus('connected');
        // Fetch the actual models list after successful connection test
        await fetchOpenAIModels();
      } else {
        setOpenaiStatus('error');
        setOpenaiError(
          finalResult?.error || 
          (finalResult?.details && typeof finalResult.details === 'string' ? finalResult.details : null) || 
          'Unknown error testing OpenAI connection'
        );
      }
    } catch (error) {
      console.error('OpenAI API test error:', error);
      setOpenaiStatus('error');
      setOpenaiError(error.message || 'Failed to test OpenAI connection');
    } finally {
      setOpenaiTesting(false);
    }
  };

  // In the AdminPage context, we always show the component
  // and don't need the modal overlay
  if (!isOpen && onClose) return null;

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Connection Settings
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
            )}
          </CardTitle>
          <CardDescription>
            Manage your connection to the AI server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <Badge variant={status === 'ready' ? 'default' : status === 'connected' ? 'secondary' : 'destructive'}>
              {status === 'ready' ? 'Ready' : status === 'connected' ? 'Connecting' : 'Disconnected'}
            </Badge>
          </div>

          {/* Token Display (Read-Only) */}
          <div className="space-y-2">
            <Label htmlFor="token">Active Authentication Token</Label>
            <div className="relative">
              <Input
                id="token"
                type={showToken ? "text" : "password"}
                value={token || "No token available. Please log in."}
                readOnly
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Connection Buttons */}
          <div className="flex justify-between items-center pt-2">
            {status === 'ready' ? (
              <Button onClick={handleDisconnect} variant="destructive">
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleConnect} disabled={isConnecting || !token}>
                {isConnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            )}

            {status === 'disconnected' && (
               <Button onClick={handleReconnect} variant="outline">
                 <RefreshCw className="mr-2 h-4 w-4" />
                 Reconnect
               </Button>
            )}
          </div>

          <div className="pt-4 text-center text-xs text-gray-500">
            Connection is now managed automatically through your login session.
          </div>
        </CardContent>
      </Card>
      
      {/* OpenAI API Connection Test Card */}
      <Card className="w-full mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Configuration
          </CardTitle>
          <CardDescription>
            Configure your AI model and test the OpenAI API connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Provider Selection */}
          <div className="space-y-2">
            <Label>AI Provider</Label>
            <Select value={selectedProvider} onValueChange={(value) => {
              setSelectedProvider(value);
              localStorage.setItem('ai_provider', value);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4, GPT-4o, etc.)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* OpenAI Configuration */}
          {selectedProvider === 'openai' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="openai-api-key"
                      type={showOpenaiKey ? "text" : "password"}
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    >
                      {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button 
                    onClick={saveOpenAIApiKey} 
                    disabled={openaiKeySaving || !openaiApiKey.trim()}
                    size="sm"
                  >
                    {openaiKeySaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Your API key is stored locally and sent securely to the OPAL server
                </div>
              </div>
            </>
          )}

          {/* Anthropic Configuration */}
          {selectedProvider === 'anthropic' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="anthropic-api-key">Anthropic API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="anthropic-api-key"
                      type={showAnthropicKey ? "text" : "password"}
                      value={anthropicApiKey}
                      onChange={(e) => setAnthropicApiKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    >
                      {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button 
                    onClick={saveAnthropicApiKey} 
                    disabled={anthropicKeySaving || !anthropicApiKey.trim()}
                    size="sm"
                  >
                    {anthropicKeySaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Your API key is stored locally and sent securely to the OPAL server
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="font-medium">API Status:</span>
            <Badge variant={
              (selectedProvider === 'openai' ? openaiStatus : anthropicStatus) === 'connected' ? 'default' : 
              (selectedProvider === 'openai' ? openaiStatus : anthropicStatus) === 'testing' ? 'secondary' : 
              (selectedProvider === 'openai' ? openaiStatus : anthropicStatus) === 'error' ? 'destructive' : 'outline'
            }>
              {(selectedProvider === 'openai' ? openaiStatus : anthropicStatus) === 'connected' ? 'Connected' : 
               (selectedProvider === 'openai' ? openaiStatus : anthropicStatus) === 'testing' ? 'Testing...' : 
               (selectedProvider === 'openai' ? openaiStatus : anthropicStatus) === 'error' ? 'Error' : 'Unknown'}
            </Badge>
          </div>

          {/* AI Model Selection */}
          <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">AI Model:</span>
                <div className="flex items-center gap-2">
                  <Select value={selectedModel} onValueChange={handleModelChange}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {selectedProvider === 'openai' ? (
                        loadingModels ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm">Loading models...</span>
                          </div>
                        ) : openaiModels.length > 0 ? (
                          openaiModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <span className="font-mono text-sm">{model.id}</span>
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                            <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                            <SelectItem value="gpt-4.1">gpt-4.1</SelectItem>
                            <SelectItem value="gpt-4.1-mini">gpt-4.1-mini</SelectItem>
                          </>
                        )
                      ) : (
                        anthropicModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <span className="font-mono text-sm">{model.id}</span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedProvider === 'openai' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchOpenAIModels}
                      disabled={loadingModels}
                      title="Refresh models list"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingModels ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Available Models Count */}
              {openaiModels.length > 0 && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Available Models:</span>
                  <Badge variant="outline">{openaiModels.length} GPT models available</Badge>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                {selectedProvider === 'openai' 
                  ? 'Models are fetched dynamically from OpenAI API. Changes take effect immediately.'
                  : 'Select from available Claude models. Changes take effect immediately.'}
              </div>
            </div>

          {/* Error Display */}
          {selectedProvider === 'openai' && openaiError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{openaiError}</AlertDescription>
            </Alert>
          )}
          {selectedProvider === 'anthropic' && anthropicError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{anthropicError}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {selectedProvider === 'openai' && openaiStatus === 'connected' && !openaiError && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                OpenAI API is working correctly. AI Feedback and other AI features should function properly.
              </AlertDescription>
            </Alert>
          )}
          {selectedProvider === 'anthropic' && anthropicStatus === 'connected' && !anthropicError && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Anthropic API is working correctly. AI Feedback and other AI features should function properly.
              </AlertDescription>
            </Alert>
          )}

          {/* Test Button */}
          <div className="flex justify-start pt-2">
            {selectedProvider === 'openai' ? (
              <Button 
                onClick={testOpenAIConnection} 
                disabled={openaiTesting || status !== 'ready'}
                variant="outline"
              >
                {openaiTesting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                {openaiTesting ? 'Testing Connection...' : 'Test OpenAI API'}
              </Button>
            ) : (
              <Button 
                onClick={testAnthropicConnection} 
                disabled={anthropicTesting || status !== 'ready'}
                variant="outline"
              >
                {anthropicTesting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                {anthropicTesting ? 'Testing Connection...' : 'Test Anthropic API'}
              </Button>
            )}
          </div>

          {status !== 'ready' && (
            <div className="text-sm text-gray-500">
              Connect to OPAL first to test API connection.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Journal Export Card */}
      <JournalExport className="w-full mt-6" />
      
      {/* Journal Import Card */}
      <JournalImport className="w-full mt-6" />
    </div>
  );
}