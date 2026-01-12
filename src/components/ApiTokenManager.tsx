import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Plus, 
  Copy, 
  Trash2, 
  Key, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import authService from '@/lib/auth-service';
import Spinner from './ui/spinner';

interface ApiToken {
  id: string;
  name: string;
  token?: string;
  permissions: Record<string, boolean>;
  expires_at?: string;
  expiresAt?: string;
  created_at?: string;
  createdAt?: string;
}

const ApiTokenManager: React.FC = () => {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newTokenName, setNewTokenName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiTokens = await authService.getApiTokens();
      setTokens(apiTokens);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const createToken = async () => {
    if (!newTokenName.trim()) {
      setError('Token name is required');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const newToken = await authService.createApiToken(newTokenName.trim());
      setTokens(prev => [...prev, newToken]);
      setNewlyCreatedToken(newToken.token);
      setNewTokenName('');
      setShowCreateDialog(false);
      setSuccess('API token created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create token');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
      return;
    }

    try {
      await authService.deleteApiToken(tokenId);
      setTokens(prev => prev.filter(token => token.id !== tokenId));
      setSuccess('Token deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete token');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getExpiryStatus = (expiresAt?: string) => {
    if (!expiresAt) return { status: 'never', text: 'Never expires', color: 'bg-green-500/10 text-green-500' };
    if (isExpired(expiresAt)) return { status: 'expired', text: 'Expired', color: 'bg-red-500/10 text-red-500' };
    return { status: 'active', text: `Expires ${formatDate(expiresAt)}`, color: 'bg-yellow-500/10 text-yellow-500' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Tokens</h2>
          <p className="text-gray-600">Manage your API tokens for OPAL integration</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Token</DialogTitle>
              <DialogDescription>
                Create a new API token for OPAL integration. Keep this token secure as it provides access to your account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tokenName">Token Name</Label>
                <Input
                  id="tokenName"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="e.g., OPAL Integration"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createToken} disabled={isCreating || !newTokenName.trim()}>
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Token'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Newly Created Token Display */}
      {newlyCreatedToken && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Token Created Successfully!</CardTitle>
            <CardDescription className="text-green-600">
              Copy this token now. You won't be able to see it again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input
                value={newlyCreatedToken}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="sm"
                onClick={() => copyToClipboard(newlyCreatedToken)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setNewlyCreatedToken(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tokens List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : tokens.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Key className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No API tokens</h3>
            <p className="text-gray-600 mb-4">Create your first API token to get started with OPAL integration.</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Token
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tokens.map((token) => {
            const expiryStatus = getExpiryStatus(token.expires_at);
            return (
              <Card key={token.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{token.name}</h3>
                        <Badge variant="outline" className={expiryStatus.color}>
                          {expiryStatus.text}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created {formatDate(token.created_at)}</span>
                        </div>
                        {token.expires_at && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Expires {formatDate(token.expires_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(token.token)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteToken(token.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApiTokenManager; 