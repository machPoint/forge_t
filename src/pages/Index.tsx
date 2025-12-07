import React, { useEffect } from "react";
import HomePage from "./HomePage";
import { useAuth } from "@/hooks/useAuth";
import opal from '@/lib/simple-opal-client';
import authService from '@/lib/auth-service';

const Index: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Initialize OPAL connection with JWT token when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const accessToken = authService.getAccessToken();
      if (accessToken) {
        // Set the JWT token for OPAL connection
        opal.setToken(accessToken);
        opal.autoConnect();
      }
    } else {
      // Disconnect OPAL if user is not authenticated
      opal.disconnect();
    }
  }, [isAuthenticated, user]);

  return <HomePage />;
};

export default Index;
