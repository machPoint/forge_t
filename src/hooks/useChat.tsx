import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  message: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  addUserMessage: (message: string) => void;
  addAssistantMessage: (message: string) => void;
  clearMessages: () => void;
  setMessages: (messages: ChatMessage[]) => void;
}

export const useChat = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      
      addMessage: (message: ChatMessage) => {
        set((state) => ({
          messages: [...state.messages, message]
        }));
      },
      
      addUserMessage: (message: string) => {
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          message,
          role: 'user',
          timestamp: new Date()
        };
        get().addMessage(userMessage);
      },
      
      addAssistantMessage: (message: string) => {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          message,
          role: 'assistant',
          timestamp: new Date()
        };
        get().addMessage(assistantMessage);
      },
      
      clearMessages: () => {
        set({ messages: [] });
      },
      
      setMessages: (messages: ChatMessage[]) => {
        set({ messages });
      }
    }),
    {
      name: 'forge-chat-storage',
      // Custom serialization to handle Date objects
      serialize: (state) => JSON.stringify(state, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      }),
      // Custom deserialization to restore Date objects
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          messages: parsed.messages?.map((msg: ChatMessage) => ({
            ...msg,
            timestamp: msg.timestamp?.__type === 'Date' 
              ? new Date(msg.timestamp.value) 
              : new Date(msg.timestamp)
          })) || []
        };
      }
    }
  )
);
