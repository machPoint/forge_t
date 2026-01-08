import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  LogOut, 
  Settings, 
  Shield, 
  Calendar,
  Key
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { User as UserType } from '@/lib/auth-service';
import Spinner from './ui/spinner';

interface UserProfileProps {
  variant?: 'dropdown' | 'card';
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ variant = 'dropdown', className = '' }) => {
  const { user, logout, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'user':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={user.username} />
              <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none">{user.username}</p>
                <Badge variant="outline" className={`${getRoleColor(user.role)} text-[10px] h-5 px-1.5`}>
                  {user.role}
                </Badge>
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Key className="mr-2 h-4 w-4" />
            <span>API Tokens</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            <Calendar className="mr-2 h-3 w-3" />
            <span>Since {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
          >
            {isLoggingOut ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Card className={`w-full max-w-sm ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Avatar className="h-16 w-16 mx-auto">
            <AvatarImage src="" alt={user.username} />
            <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-medium">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-xl">{user.username}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Role</span>
          </div>
          <Badge 
            variant="outline" 
            className={`${getRoleColor(user.role)} text-xs font-medium`}
          >
            {user.role}
          </Badge>
        </div>

        {user.created_at && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Member since</span>
            </div>
            <span className="text-sm text-gray-900">
              {formatDate(user.created_at)}
            </span>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            disabled
          >
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            disabled
          >
            <Key className="mr-2 h-4 w-4" />
            API Tokens
          </Button>
        </div>

        <Separator />

        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Signing out...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserProfile; 