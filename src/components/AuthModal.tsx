import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { LoginCredentials, RegisterData } from '@/lib/auth-service';
import Spinner from './ui/spinner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  const validateForm = (isRegister: boolean): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (isRegister) {
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (isRegister) {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    try {
      const credentials: LoginCredentials = {
        username: formData.username,
        password: formData.password,
      };
      await login(credentials);
      onClose();
    } catch (error) {
      // Error is handled by the auth hook
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    try {
      const registerData: RegisterData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };
      await register(registerData);
      // Switch to login tab after successful registration
      setActiveTab('login');
      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      // Error is handled by the auth hook
    }
  };

  const getInputIcon = (field: string) => {
    switch (field) {
      case 'username':
        return <User className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'password':
      case 'confirmPassword':
        return <Lock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const renderInput = (field: keyof typeof formData, label: string, type: string = 'text') => {
    const isPassword = type === 'password';
    const showPasswordState = field === 'password' ? showPassword : showConfirmPassword;
    const setShowPasswordState = field === 'password' ? setShowPassword : setShowConfirmPassword;

    return (
      <div className="space-y-2">
        <Label htmlFor={field} className="text-sm font-medium">
          {label}
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-tertiary">
            {getInputIcon(field)}
          </div>
          <Input
            id={field}
            type={isPassword && !showPasswordState ? 'password' : 'text'}
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`pl-10 pr-10 ${validationErrors[field] ? 'border-red-500' : ''}`}
            placeholder={label}
            disabled={isLoading}
          />
          {isPassword && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPasswordState(!showPasswordState)}
            >
              {showPasswordState ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
        {validationErrors[field] && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {validationErrors[field]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4">
        <Card className="border-0 shadow-2xl bg-[#1a1a1a] text-white">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 bg-[#304c62] rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to Forge</CardTitle>
            <CardDescription className="text-app-text-secondary">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="login" className="data-[state=active]:bg-app-accent data-[state=active]:text-app-text-primary">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-app-accent data-[state=active]:text-app-text-primary">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  {renderInput('username', 'Username')}
                  {renderInput('password', 'Password', 'password')}

                  <Button
                    type="submit"
                    className="w-full bg-app-accent hover:bg-app-accent-hover text-app-text-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  {renderInput('username', 'Username')}
                  {renderInput('email', 'Email Address')}
                  {renderInput('password', 'Password', 'password')}
                  {renderInput('confirmPassword', 'Confirm Password', 'password')}

                  <div className="text-xs text-app-text-tertiary space-y-1">
                    <p>Password requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>At least 6 characters long</li>
                      <li>Username must be at least 3 characters</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-app-accent hover:bg-app-accent-hover text-app-text-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="border-red-500 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Demo Account Info */}
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                Demo Account: admin / password
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthModal; 