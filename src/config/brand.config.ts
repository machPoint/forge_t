/**
 * Brand Configuration for Generic Base Journaling Program
 * 
 * This file defines the branding and identity for the application.
 * Customize these values to create specialized versions for different audiences.
 */

export interface BrandConfig {
  appName: string;
  tagline: string;
  description: string;
  author: string;
  website?: string;
  supportEmail?: string;
  version: string;
  splashScreen: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
    logo?: string;
    showProgress?: boolean;
    duration?: number; // in milliseconds
  };
  about: {
    mission: string;
    features: string[];
    privacy: string;
  };
}

// Base configuration template for generic journaling
export const BASE_BRAND: BrandConfig = {
  appName: "Journal Base",
  tagline: "Your Personal Reflection Space",
  description: "A private, customizable journaling platform for personal growth and reflection",
  author: "Journal Base Team",
  website: "https://journalbase.app",
  supportEmail: "support@journalbase.app",
  version: "1.0.0",
  splashScreen: {
    title: "Welcome to Journal Base",
    subtitle: "Begin your journey of reflection and growth",
    backgroundImage: "/assets/branding/splash-bg.jpg",
    logo: "/assets/branding/logo.png",
    showProgress: true,
    duration: 3000
  },
  about: {
    mission: "To provide a private, secure, and customizable platform for personal journaling and reflection.",
    features: [
      "Private local storage - your data stays with you",
      "Rich text editing with formatting options",
      "Tagging and organization system",
      "Export capabilities (Markdown, Text, JSON)",
      "Customizable themes and branding",
      "Optional AI-powered insights and feedback"
    ],
    privacy: "All your journal entries are stored locally on your device. No data is sent to external servers unless you explicitly enable AI features."
  }
};

// Therapeutic journaling specialization example
export const THERAPEUTIC_BRAND: BrandConfig = {
  appName: "Mindful Journal",
  tagline: "AI-Powered Therapeutic Reflection",
  description: "A therapeutic journaling platform with AI-powered insights for mental health and personal growth",
  author: "Mindful Health Solutions",
  website: "https://mindfuljournal.app",
  supportEmail: "support@mindfuljournal.app",
  version: "1.0.0",
  splashScreen: {
    title: "Welcome to Mindful Journal",
    subtitle: "Your AI-powered companion for mental wellness",
    backgroundImage: "/assets/branding/therapeutic-splash-bg.jpg",
    logo: "/assets/branding/therapeutic-logo.png",
    showProgress: true,
    duration: 3000
  },
  about: {
    mission: "To support mental health and personal growth through AI-powered therapeutic journaling.",
    features: [
      "AI-powered therapeutic feedback and insights",
      "Guided reflection prompts and exercises",
      "Mood tracking and pattern analysis",
      "Private and secure - all data stored locally",
      "Export capabilities for sharing with therapists",
      "Customizable AI personas for different therapeutic approaches"
    ],
    privacy: "Your therapeutic data is completely private and stored locally. AI features are optional and only process data when explicitly requested."
  }
};

// Business/Professional journaling specialization example
export const PROFESSIONAL_BRAND: BrandConfig = {
  appName: "Executive Journal",
  tagline: "Strategic Reflection for Leaders",
  description: "A professional journaling platform designed for executives, entrepreneurs, and business leaders",
  author: "Leadership Development Corp",
  website: "https://executivejournal.pro",
  supportEmail: "support@executivejournal.pro",
  version: "1.0.0",
  splashScreen: {
    title: "Welcome to Executive Journal",
    subtitle: "Elevate your leadership through strategic reflection",
    backgroundImage: "/assets/branding/professional-splash-bg.jpg",
    logo: "/assets/branding/professional-logo.png",
    showProgress: true,
    duration: 2500
  },
  about: {
    mission: "To enhance leadership effectiveness through structured reflection and strategic thinking.",
    features: [
      "Strategic decision tracking and analysis",
      "Leadership reflection templates",
      "Goal setting and progress monitoring",
      "Team feedback integration capabilities",
      "Secure local storage with enterprise-grade privacy",
      "Export formats suitable for board presentations"
    ],
    privacy: "Designed for executive privacy with local storage and no external data transmission. Perfect for sensitive business reflections."
  }
};

// Active configuration - change this to switch brands
export const ACTIVE_BRAND = BASE_BRAND;

// Helper function to get current brand configuration
export function getBrandConfig(): BrandConfig {
  return ACTIVE_BRAND;
}

// Helper function to check if a feature should be enabled based on brand
export function isBrandFeatureEnabled(feature: string): boolean {
  const brand = getBrandConfig();
  
  switch (feature) {
    case 'ai_feedback':
      return brand.appName.includes('Mindful') || brand.appName.includes('Therapeutic');
    case 'business_templates':
      return brand.appName.includes('Executive') || brand.appName.includes('Professional');
    case 'mood_tracking':
      return brand.appName.includes('Mindful') || brand.appName.includes('Therapeutic');
    case 'strategic_templates':
      return brand.appName.includes('Executive') || brand.appName.includes('Professional');
    default:
      return true; // Base features are always enabled
  }
}
