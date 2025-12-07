import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Trash2, RefreshCw } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { cn } from '@/lib/utils';
import { getAIFeedback } from '@/lib/openai';
import { getChatSystemPrompt } from '@/lib/chatSystemPrompt';
import { getIdentityProfile } from '@/lib/identityProfileService';
import { useChat, ChatMessage as ChatMessageType } from '@/hooks/useChat';

interface SavedChat {
  id: string;
  title: string;
  messages: ChatMessageType[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  summary?: string;
}

interface ChatInterfaceProps {
  className?: string;
  memories?: Memory[]; // Core entries to reference in chat
}

interface Memory {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source: string;
  type: 'journal' | 'note' | 'summary' | string;
  starred?: boolean;
  archived?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className, memories = [] }) => {
  // Use memories/core entries to provide context when referenced by user
  const { messages, addUserMessage, addAssistantMessage, clearMessages, setMessages } = useChat();
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSavedChats, setShowSavedChats] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to find relevant core entries based on user message
  const findRelevantCoreEntries = (message: string): Memory[] => {
    if (!memories || memories.length === 0) return [];
    
    const messageLower = message.toLowerCase();
    const relevantEntries: Memory[] = [];
    const seenIds = new Set<string>();
    
    // Helper function to add unique entries
    const addUniqueEntry = (memory: Memory) => {
      if (!seenIds.has(memory.id)) {
        relevantEntries.push(memory);
        seenIds.add(memory.id);
        return true;
      }
      return false;
    };
    
    // Direct title matches (high priority)
    memories.forEach(memory => {
      const titleLower = memory.title.toLowerCase();
      if (messageLower.includes(titleLower) || titleLower.includes(messageLower)) {
        addUniqueEntry(memory);
      }
    });
    
    // Tag matches (medium priority)
    if (relevantEntries.length < 3) {
      memories.forEach(memory => {
        const hasMatchingTag = memory.tags?.some(tag => 
          messageLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(messageLower)
        );
        if (hasMatchingTag) {
          addUniqueEntry(memory);
        }
      });
    }
    
    // Content/summary matches (lower priority)
    if (relevantEntries.length < 2) {
      memories.forEach(memory => {
        const contentLower = memory.content.toLowerCase();
        const summaryLower = memory.summary.toLowerCase();
        
        // Check for keyword matches in content or summary
        const keywords = messageLower.split(/\s+/).filter(word => word.length > 3);
        const hasKeywordMatch = keywords.some(keyword => 
          contentLower.includes(keyword) || summaryLower.includes(keyword)
        );
        
        if (hasKeywordMatch) {
          addUniqueEntry(memory);
        }
      });
    }
    
    // Limit to top 3 most relevant entries
    return relevantEntries.slice(0, 3);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load saved chats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedChats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        const chatsWithDates = parsed.map((chat: SavedChat) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt)
        }));
        setSavedChats(chatsWithDates);
      } catch (error) {
        console.error('Error loading saved chats:', error);
      }
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedChats', JSON.stringify(savedChats));
  }, [savedChats]);

  // Load initial welcome message only if no messages exist
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessageType = {
        id: 'welcome',
        message: "Hello! I'm your AI therapeutic companion. I'm here to help you explore your thoughts, feelings, and experiences through conversation. What would you like to talk about today?",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length, setMessages]);

  const handleSendMessage = async (messageText: string) => {
    // Add user message using the store
    addUserMessage(messageText);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Get the custom system prompt from settings
      const chatPrompt = getChatSystemPrompt();
      
      // Build context from memories and conversation history
      let contextPrompt = `${chatPrompt.systemPrompt}

CONVERSATION CONTEXT:
`;

      // Find relevant core entries based on user message
      const relevantEntries = findRelevantCoreEntries(messageText);
      console.log(`[ChatInterface] Found ${relevantEntries.length} relevant core entries for: "${messageText}"`, relevantEntries.map(e => ({ id: e.id, title: e.title })));
      
      if (relevantEntries.length > 0) {
        contextPrompt += "\nRELEVANT CORE ENTRIES:\n";
        relevantEntries.forEach(entry => {
          contextPrompt += `\n**${entry.title}**\n`;
          contextPrompt += `Summary: ${entry.summary}\n`;
          if (entry.tags && entry.tags.length > 0) {
            contextPrompt += `Tags: ${entry.tags.join(', ')}\n`;
          }
          // Include a portion of the content if it's not too long
          const contentPreview = entry.content.length > 300 
            ? entry.content.substring(0, 300) + '...' 
            : entry.content;
          contextPrompt += `Content: ${contentPreview}\n`;
        });
        contextPrompt += "\n";
      } else {
        console.log(`[ChatInterface] No core entries found for message: "${messageText}". Available memories:`, memories?.map(m => ({ id: m.id, title: m.title, tags: m.tags })));
      }

      // Add recent conversation history for context
      const recentMessages = messages.slice(-6); // Last 6 messages for context
      if (recentMessages.length > 0) {
        contextPrompt += "\nRecent conversation:\n";
        recentMessages.forEach(msg => {
          contextPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.message}\n`;
        });
      }

      // Get user's identity profile - let getAIFeedback handle it like AI Insights does
      const identityProfile = await getIdentityProfile();
      console.log('🔍 Identity profile for chat:', !!identityProfile);

      contextPrompt += `\nCurrent user message: "${messageText}"

IMPORTANT: You DO have access to the user's core entries listed above under "RELEVANT CORE ENTRIES". Use this information directly in your response. Do not say you cannot access their entries - you can and should reference them specifically.

Please provide a thoughtful, therapeutic response that:
1. Acknowledges what the user shared
2. Directly references and discusses the relevant core entries provided above
3. Uses context from their memories/profile when appropriate
4. Asks insightful follow-up questions based on their actual entries
5. Offers therapeutic insights or perspectives
6. Maintains a warm, supportive tone

When core entries are provided above, reference them by name and discuss their specific content.
Keep responses conversational and not overly clinical.`;

      // Call the AI feedback function with the constructed context and identity profile
      const aiResponseRaw = await getAIFeedback(contextPrompt, 'therapeutic_chat', identityProfile);
      
      // Clean the AI response to extract just the text content
      let cleanMessage = '';
      if (typeof aiResponseRaw === 'string') {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(aiResponseRaw);
          if (parsed.text) {
            cleanMessage = parsed.text;
          } else {
            cleanMessage = aiResponseRaw;
          }
        } catch {
          // If not JSON, use as-is
          cleanMessage = aiResponseRaw;
        }
      } else if (aiResponseRaw && typeof aiResponseRaw === 'object' && 'text' in aiResponseRaw) {
        // If it's already an object with text property
        cleanMessage = (aiResponseRaw as { text: string }).text;
      } else {
        // Fallback to stringifying
        cleanMessage = JSON.stringify(aiResponseRaw);
      }
      
      // Remove any remaining JSON formatting artifacts
      cleanMessage = cleanMessage
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/\\n/g, '\n') // Convert \n to actual newlines
        .replace(/\\"/g, '"') // Convert \" to actual quotes
        .replace(/^\{[^}]*"text":\s*"/, '') // Remove JSON prefix like {"text": "
        .replace(/"\}$/, '') // Remove JSON suffix like "}
        .trim();
      
      setIsTyping(false);
      addAssistantMessage(cleanMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      addAssistantMessage("I'm sorry, I'm having trouble responding right now. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    clearMessages();
    setSelectedChatId(null); // Clear selected chat when starting fresh
    // Re-add welcome message
    const welcomeMessage: ChatMessageType = {
      id: 'welcome-new',
      message: "Chat cleared. How can I help you today?",
      role: 'assistant',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const handleRefresh = () => {
    // TODO: Implement refresh logic (reload conversation history)
    console.log('Refresh chat');
  };

  // Save current chat
  const handleSaveChat = () => {
    if (messages.length <= 1) return; // Don't save if only welcome message
    
    if (selectedChatId) {
      // Update existing chat
      setSavedChats(prev => prev.map(chat => 
        chat.id === selectedChatId 
          ? { ...chat, messages: [...messages], updatedAt: new Date() }
          : chat
      ));
    } else {
      // Create new chat
      const title = messages[1]?.message.substring(0, 50) + '...' || 'New Chat';
      const newChat: SavedChat = {
        id: Date.now().toString(),
        title,
        messages: [...messages],
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        summary: messages[1]?.message.substring(0, 100) + '...'
      };
      
      setSavedChats(prev => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
    }
  };

  // Load a saved chat
  const handleLoadChat = (chatId: string) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setSelectedChatId(chatId);
    }
  };

  // Delete a saved chat
  const handleDeleteChat = (chatId: string) => {
    setSavedChats(prev => prev.filter(c => c.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
    }
  };

  // Filter saved chats based on search
  const filteredChats = savedChats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={cn("flex h-full overflow-hidden", className)} style={{backgroundColor: '#2a2a2a'}}>
      {/* Saved Chats Sidebar */}
      {showSavedChats && (
        <div className="w-80 border-r border-gray-700 bg-[#1f1f1f] flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-100">Saved Chats</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSavedChats(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ×
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search saved chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Saved Chats List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {filteredChats.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No saved chats yet</p>
                  <p className="text-xs text-gray-500">Start a conversation to save it</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChatId === chat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#2a2a2a] hover:bg-[#333333] text-gray-200'
                    }`}
                    onClick={() => handleLoadChat(chat.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate mb-1">{chat.title}</h4>
                        <p className="text-xs text-gray-400 mb-2">
                          {chat.messages.length} messages
                        </p>
                        <p className="text-xs text-gray-400">
                          {chat.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                        className="text-gray-400 hover:text-red-400 p-1 h-6 w-6"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-700 p-4 bg-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSavedChats(!showSavedChats)}
                className="text-gray-400 hover:text-gray-200"
              >
                {showSavedChats ? '←' : '→'}
              </Button>
              <MessageCircle className="w-6 h-6 text-gray-400" />
              <div>
                <h2 className="text-lg font-semibold text-gray-100">
                  AI Chat
                </h2>
                <p className="text-sm text-gray-500">
                  Therapeutic conversation and support
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedChatId && (
                <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                  Loaded Chat
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {Math.max(0, messages.length - 1)} messages
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveChat}
                disabled={messages.length <= 1}
                className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
              >
                {selectedChatId ? 'Update Chat' : 'Save Chat'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 min-h-0" ref={scrollAreaRef} style={{backgroundColor: '#2a2a2a'}}>
          <div className="space-y-4" style={{backgroundColor: '#2a2a2a'}}>
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
                <p className="text-sm">
                  Share what's on your mind and I'll help you explore it together.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg.message}
                    role={msg.role}
                    timestamp={msg.timestamp}
                  />
                ))}
                
                {isTyping && (
                  <ChatMessage
                    message=""
                    role="assistant"
                    timestamp={new Date()}
                    isTyping={true}
                  />
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder="Share what's on your mind..."
        />
      </div>
    </div>
  );
};

export default ChatInterface;
