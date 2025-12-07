import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import MenuHandler from "./components/MenuHandler";
import AuthGuard from "@/components/AuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import JournalPage from "./pages/JournalPage";
import NotFound from "./pages/NotFound";
import ModulesPage from "./pages/ModulesPage";
import ModuleAdminPage from "./pages/ModuleAdminPage";
import CorePage from '@/pages/CorePage';
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import CustomizationsPage from "./pages/CustomizationsPage";
import { useState, useEffect, useCallback } from "react";
import { useJournal } from "@/hooks/useJournal";
import { toast } from "sonner";
import AiFeedbackFlyout from "@/components/AiFeedbackFlyout";
import { getAIFeedback } from '@/lib/openai';
import { getPersonaById } from '@/lib/aiPersonas';
import { getIdentityProfile } from '@/lib/identityProfileService';
import ConfigValidator from "./config/ConfigValidator";
import { themeManager, useTheme } from "@/lib/themes/simple-themes";

const queryClient = new QueryClient();

// Root Layout Component - Single source of theming and global UI
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const { addEntry, selectedEntry, updateEntry } = useJournal();
  const [showFeedback, setShowFeedback] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const { theme } = useTheme();

  // Define handleFeedbackRequest first
  const handleFeedbackRequest = useCallback(async () => {
    console.log('[RootLayout] handleFeedbackRequest called, selectedEntry:', selectedEntry);
    
    if (!selectedEntry) {
      toast.error('No entry selected for AI feedback');
      return;
    }
    
    setShowFeedback(true);
    setIsGeneratingFeedback(true);
    
    try {
      // Get the selected persona's prompt for AI feedback
      const selectedPersona = getPersonaById(selectedEntry.personaId || 'supportive');
      const personaPrompt = selectedPersona.prompt;
      
      console.log('[handleFeedbackRequest] Using persona:', {
        personaId: selectedEntry.personaId,
        personaName: selectedPersona.name,
        personaPrompt: personaPrompt
      });
      
      // Fetch the user's identity profile for personalized feedback
      let identityProfile = null;
      try {
        identityProfile = await getIdentityProfile();
        console.log('[handleFeedbackRequest] Identity profile fetched:', {
          hasBiographical: !!(identityProfile?.biographical),
          hasPersonality: !!(identityProfile?.personalityProfile),
          profileKeys: identityProfile ? Object.keys(identityProfile) : []
        });
      } catch (error) {
        console.error('[handleFeedbackRequest] Failed to fetch identity profile:', error);
      }
      
      // Get AI feedback using the selected entry content, persona prompt, and identity profile
      const feedback = await getAIFeedback(
        selectedEntry.content,
        personaPrompt, // Use the actual persona prompt
        identityProfile // Pass the actual identity profile
      );
      
      // Update the entry with the generated feedback
      updateEntry(selectedEntry.id, {
        ...selectedEntry,
        feedback: feedback
      });
      
      toast.success(`AI feedback generated successfully using ${selectedPersona.name}!`);
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      toast.error('Failed to generate AI feedback. Please try again.');
    } finally {
      setIsGeneratingFeedback(false);
    }
  }, [selectedEntry, updateEntry]);

  // Initialize configuration validation and theme on startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize theme system first
        console.log('[App] Initializing theme system...');
        themeManager.initialize();
        console.log('[App] Theme system initialized');
        
        console.log('[App] Starting configuration validation...');
        // Temporarily disable validation to debug startup issues
        // await ConfigValidator.validateOnStartup();
        console.log('[App] Configuration validation skipped for debugging');
      } catch (error) {
        console.error('[App] App initialization failed:', error);
        toast.error(`Initialization error: ${error.message}`);
      }
    };

    initializeApp();
  }, []);
  
  // Listen for AI Feedback request events from sidebar
  useEffect(() => {
    const handleOpenAIFeedback = (event: CustomEvent) => {
      console.log('[RootLayout] openAIFeedback event received:', event.detail);
      handleFeedbackRequest();
    };
    
    const handleShowFlyout = (event: CustomEvent) => {
      console.log('[RootLayout] showAIFeedbackFlyout event received:', event.detail);
      setShowFeedback(true);
    };
    
    console.log('[RootLayout] Setting up AI feedback event listeners');
    window.addEventListener('openAIFeedback', handleOpenAIFeedback as EventListener);
    window.addEventListener('showAIFeedbackFlyout', handleShowFlyout as EventListener);
    
    return () => {
      console.log('[RootLayout] Removing AI feedback event listeners');
      window.removeEventListener('openAIFeedback', handleOpenAIFeedback as EventListener);
      window.removeEventListener('showAIFeedbackFlyout', handleShowFlyout as EventListener);
    };
  }, [handleFeedbackRequest]);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: theme.styles.primaryBg, color: theme.styles.primaryText }}>
      {/* Global Windows-style Ribbon */}
      <MenuHandler />
      
      {/* Main Content Area with Theme Background */}
      <div className="flex-1 min-h-0" style={{ backgroundColor: theme.styles.primaryBg }}>
        {children}
      </div>
      
      {/* AI Feedback Flyout - Global component accessible from ribbon */}
      <AiFeedbackFlyout
        isOpen={showFeedback}
        onOpenChange={setShowFeedback}
        selectedEntry={selectedEntry}
        isGeneratingFeedback={isGeneratingFeedback}
      />
    </div>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return (
      <ErrorBoundary>
        <SplashScreen onComplete={handleSplashComplete} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <RootLayout>
                <Routes>
                  <Route path="/" element={
                    <AuthGuard>
                      <Index />
                    </AuthGuard>
                  } />
                  <Route path="/journal" element={
                    <AuthGuard>
                      <JournalPage />
                    </AuthGuard>
                  } />
                  <Route path="/core" element={<CorePage />} />
                  <Route path="/memories" element={<CorePage />} />
                  <Route path="/chat" element={
                    <AuthGuard>
                      <ChatPage />
                    </AuthGuard>
                  } />
                  <Route path="/modules" element={
                    <AuthGuard>
                      <ModulesPage />
                    </AuthGuard>
                  } />
                  <Route path="/modules/:moduleId" element={
                    <AuthGuard>
                      <JournalPage />
                    </AuthGuard>
                  } />
                  <Route path="/add-module" element={
                    <AuthGuard>
                      <ModuleAdminPage />
                    </AuthGuard>
                  } />
                  <Route path="/admin" element={
                    <AuthGuard>
                      <AdminPage />
                    </AuthGuard>
                  } />
                  <Route path="/profile" element={
                    <AuthGuard>
                      <ProfilePage />
                    </AuthGuard>
                  } />
                  <Route path="/customizations" element={
                    <AuthGuard>
                      <CustomizationsPage />
                    </AuthGuard>
                  } />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </RootLayout>
            </HashRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
