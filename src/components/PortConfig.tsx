import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Settings, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { opalConfig } from '../lib/config';
import Spinner from './ui/spinner';

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    authService?: {
      setPreferredPort: (port: number) => void;
    };
    opalClient?: {
      setPreferredPort: (port: number) => void;
    };
  }
}

interface PortConfigProps {
  onPortChange?: (port: number) => void;
  className?: string;
}

const PortConfig: React.FC<PortConfigProps> = ({ onPortChange, className = '' }) => {
  const [currentPort, setCurrentPort] = useState(3002);
  const [testResults, setTestResults] = useState<Record<number, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setCurrentPort(opalConfig.getPort());
  }, []);

  const availablePorts = opalConfig.getAvailablePorts();

  const testPort = async (port: number): Promise<boolean> => {
    return await opalConfig.testPort(port);
  };

  const testAllPorts = async () => {
    setIsTesting(true);
    const results: Record<number, boolean> = {};
    
    for (const port of availablePorts) {
      results[port] = await testPort(port);
    }
    
    setTestResults(results);
    setIsTesting(false);
  };

  const handlePortChange = (port: number) => {
    setCurrentPort(port);
    opalConfig.setPort(port);
    onPortChange?.(port);
    
    // Update both auth service and OPAL client if they exist
    if (window.authService) {
      window.authService.setPreferredPort(port);
    }
    if (window.opalClient) {
      window.opalClient.setPreferredPort(port);
    }
  };

  const getStatusIcon = (port: number) => {
    if (!testResults.hasOwnProperty(port)) return null;
    
    return testResults[port] ? (
      <CheckCircle className="h-3 w-3 text-green-500" />
    ) : (
      <XCircle className="h-3 w-3 text-red-500" />
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          OPAL Server Port
        </CardTitle>
        <CardDescription className="text-xs">
          Configure connection to OPAL backend server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {availablePorts.map(port => (
            <Button
              key={port}
              variant={currentPort === port ? "default" : "outline"}
              size="sm"
              onClick={() => handlePortChange(port)}
              className="flex items-center gap-2 min-w-[60px]"
            >
              {port}
              {getStatusIcon(port)}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            Current: {currentPort}
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={testAllPorts}
            disabled={isTesting}
            className="flex items-center gap-1 text-xs"
          >
            {isTesting ? <Spinner size="sm" /> : <RefreshCw className="h-3 w-3" />}
            Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortConfig; 