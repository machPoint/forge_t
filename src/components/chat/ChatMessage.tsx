import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  role, 
  timestamp, 
  isTyping = false 
}) => {
  const isUser = role === 'user';
  
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarFallback className="bg-gray-600 dark:bg-gray-700 text-white">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[70%] space-y-1",
        isUser ? "items-end" : "items-start"
      )}>
        <Card className={cn(
          "relative",
          isUser 
            ? "text-white border-gray-600" 
            : "border-gray-600"
        )} style={{
          backgroundColor: isUser ? '#4a4a4a' : '#3a3a3a'
        }}>
          <CardContent className="p-3">
            {isTyping ? (
              <div className="flex items-center gap-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message}
              </p>
            )}
          </CardContent>
        </Card>
        
        <div className={cn(
          "text-xs text-gray-500 px-1",
          isUser ? "text-right" : "text-left"
        )}>
          {timestamp instanceof Date 
            ? timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            : new Date(timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
          }
        </div>
      </div>
      
      {isUser && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarFallback className="bg-green-500 text-white">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
