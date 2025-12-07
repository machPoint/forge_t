import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';

interface AIActivityIndicatorProps {
  isActive: boolean;
  message?: string;
}

const AIActivityIndicator: React.FC<AIActivityIndicatorProps> = ({ 
  isActive, 
  message = 'AI Working...' 
}) => {
  if (!isActive) return null;

  return (
    <Badge 
      variant="secondary" 
      className="flex items-center gap-2 bg-blue-600/20 text-blue-400 border-blue-500/30"
    >
      <Loader2 className="w-3 h-3 animate-spin" />
      <Sparkles className="w-3 h-3" />
      <span className="text-xs">{message}</span>
    </Badge>
  );
};

export default AIActivityIndicator;
