import React, { useState, useEffect } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import memoryService from '../lib/memoryService';

interface Memory {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source: string;
  type: 'journal' | 'note' | 'summary';
  starred?: boolean;
  archived?: boolean;
}

const ChatPage: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);

  // Load core entries for chat context
  useEffect(() => {
    const loadMemories = async () => {
      try {
        const result = await memoryService.getMemories({ includeArchived: false });
        if (Array.isArray(result)) {
          setMemories(result as Memory[]);
        }
      } catch (error) {
        console.error('Error loading core entries for chat:', error);
      }
    };
    loadMemories();
  }, []);

  return (
    <div className="flex-1 p-6">
      <h1 className="text-3xl font-bold mb-6 text-app-text-primary">Chat</h1>
      <div className="h-[calc(100vh-12rem)]">
        <ChatInterface 
          className="h-full rounded-lg border border-app-border-divider shadow-sm" 
          memories={memories}
        />
      </div>
    </div>
  );
};

export default ChatPage;
