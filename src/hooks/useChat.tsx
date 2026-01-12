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
      // Custom storage to handle Date objects
      storage: {
        getItem: (name: string) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              messages: parsed.state?.messages?.map((msg: any) => ({
                ...msg,
                timestamp: msg.timestamp?.__type === 'Date' 
                  ? new Date(msg.timestamp.value) 
                  : new Date(msg.timestamp)
              })) || []
            }
          };
        },
        setItem: (name: string, value: any) => {
          const serialized = JSON.stringify(value, (key, val) => {
            if (val instanceof Date) {
              return { __type: 'Date', value: val.toISOString() };
            }
            return val;
          });
          localStorage.setItem(name, serialized);
        },
        removeItem: (name: string) => localStorage.removeItem(name)
      }
    }
  )
);
