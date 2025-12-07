import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from './AuthModal';
import Spinner from './ui/spinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true, 
  fallback 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Show auth modal if authentication is required but user is not authenticated
    if (requireAuth && !isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [requireAuth, isLoading, isAuthenticated]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-app-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If user is not authenticated, show auth modal
  if (!isAuthenticated) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Welcome to Forge</h1>
              <p className="text-app-text-secondary mb-4">Please sign in to continue</p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default AuthGuard; 