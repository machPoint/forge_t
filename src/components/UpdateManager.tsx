import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { getAppVersion, isTauri } from '@/lib/tauri-bridge';

interface UpdateManagerProps {
  className?: string;
}

export default function UpdateManager({ className }: UpdateManagerProps) {
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const isTauriApp = isTauri();

  useEffect(() => {
    async function loadVersion() {
      setIsLoading(true);
      try {
        const version = await getAppVersion();
        setCurrentVersion(version);
      } catch (error) {
        console.error('Failed to load app version:', error);
        setCurrentVersion('Unknown');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadVersion();
  }, []);

  // If not in Tauri desktop app, show a message
  if (!isTauriApp) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            App Updates
          </CardTitle>
          <CardDescription>
            Automatic updates are only available in the desktop app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You're using the web version. Download the desktop app to get automatic updates.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          App Version
        </CardTitle>
        <CardDescription>
          Forge desktop application version information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Version */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Current Version:</span>
          <Badge variant="outline">
            {isLoading ? 'Loading...' : currentVersion}
          </Badge>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You're running Forge Desktop App v{currentVersion}
          </AlertDescription>
        </Alert>

        <div className="text-xs text-gray-500 mt-4">
          <strong>Note:</strong> Update functionality will be available in a future release.
          For now, please check the GitHub repository for the latest version.
        </div>
      </CardContent>
    </Card>
  );
}
