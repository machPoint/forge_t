import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BiographicalForm from "@/components/profile/BiographicalForm";
import BiographicalView from "@/components/profile/BiographicalView";
import PersonalityForm from "@/components/profile/PersonalityForm";
import PersonalityView from "@/components/profile/PersonalityView";
import ProfileHistory from "@/components/profile/ProfileHistory";
import opal from "@/lib/simple-opal-client";
import Spinner from "@/components/ui/spinner";

// Define the identity profile types
export interface BiographicalInfo {
  name: string;
  preferred_name: string;
  pronouns: string;
  age: number | null;
  location: string;
  cultural_background: string;
  spiritual_orientation: string;
  education_level: string;
  occupation: string;
  identity_labels: string[];
}

export interface BigFive {
  openness: number | null;
  conscientiousness: number | null;
  extraversion: number | null;
  agreeableness: number | null;
  neuroticism: number | null;
}

export interface CognitiveStyle {
  thinking_mode: "abstract" | "concrete" | null;
  decision_making: "intuitive" | "analytical" | null;
  response_tendency: "reflective" | "reactive" | null;
}

export interface EmotionalRegulation {
  expression: "suppressed" | "moderate" | "expressive" | null;
  coping_style: "avoidant" | "engaged" | null;
  volatility: number | null;
}

export interface SelfConcept {
  self_esteem: "low" | "moderate" | "high" | null;
  identity_coherence: "stable" | "in-progress" | "fragmented" | null;
  core_narratives: string[];
}

export interface PersonalityProfile {
  big_five: BigFive;
  cognitive_style: CognitiveStyle;
  emotional_regulation: EmotionalRegulation;
  attachment_style: "secure" | "anxious" | "avoidant" | "disorganized" | null;
  locus_of_control: "internal" | "external" | null;
  motivational_orientation: string[];
  self_concept: SelfConcept;
}

export interface MetaInfo {
  confidence_levels: {
    big_five: number | null;
    attachment_style: number | null;
    motivational_orientation: number | null;
  };
  inference_sources: ("user_input" | "interaction_inference" | "manual_tagging")[];
  last_updated: string;
}

export interface IdentityProfile {
  userId: string;
  biographical: BiographicalInfo;
  personality_profile: PersonalityProfile;
  meta: MetaInfo;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("biographical");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<IdentityProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Fetch the user's profile on component mount
  useEffect(() => {
    const waitForConnectionAndFetchProfile = async () => {
      try {
        setLoading(true);
        
        // Wait for OPAL client to be ready before making the tool call
        if (!opal.ready()) {
          console.log('[ProfilePage] OPAL not ready, waiting for connection...');
          
          try {
            // Use the new waitForReady method with a 10 second timeout
            await opal.waitForReady(10000);
            console.log('[ProfilePage] OPAL connection confirmed ready');
          } catch (readyError) {
            console.warn('[ProfilePage] Error waiting for OPAL ready state:', readyError.message);
            // We'll continue anyway and let the callTool method throw if needed
          }
        } else {
          console.log('[ProfilePage] OPAL connection already ready');
        }
        
        console.log('[ProfilePage] Calling getIdentityProfile tool...');
        const result = await opal.callTool("getIdentityProfile", {});
        
        // Log complete raw response for debugging
        console.log('[ProfilePage] Raw response from getIdentityProfile:', result);
        console.log('[ProfilePage] Response type:', typeof result);
        console.log('[ProfilePage] Result keys:', result ? Object.keys(result).join(', ') : 'undefined');
        
        // Check for nullish result
        if (!result) {
          console.error('[ProfilePage] getIdentityProfile returned null/undefined result');
          setError('Profile data is empty. Please try again later.');
          setLoading(false);
          return;
        }
        
        // Check if the response contains an error message from the backend
        if (result && result.error === true) {
          console.error('[ProfilePage] Error from getIdentityProfile tool:', result.message);
          setError(result.message || 'Failed to load profile. Please try again.');
          setLoading(false);
          return;
        }
        
        // Check for expected profile structure
        if (typeof result !== 'object') {
          console.error('[ProfilePage] getIdentityProfile returned non-object result:', result);
          setError('Received invalid profile format. Please try again.');
          setLoading(false);
          return;
        }
        
        // Parse the profile data from the content array if present
        let profileData;
        try {
          // Check if the result has the content array structure (typical OPAL response)
          if (result.content && Array.isArray(result.content) && result.content.length > 0 && result.content[0].text) {
            // Parse the JSON string from content[0].text
            console.log('[ProfilePage] Found content array with text, attempting to parse');
            profileData = JSON.parse(result.content[0].text);
            console.log('[ProfilePage] Successfully parsed profile data from content:', profileData);
          } else {
            // If not in the content array, use the result as is
            console.log('[ProfilePage] No content array found, using result directly');
            profileData = result;
          }
        } catch (parseError) {
          console.error('[ProfilePage] Error parsing profile data from content:', parseError);
          setError('Error parsing profile data. Please try again.');
          setLoading(false);
          return;
        }

        // Now check for the profile sections in the parsed data
        // The response structure is nested: result.identityProfile.biographical
        console.log('[ProfilePage] Checking for identityProfile in response:', !!profileData.identityProfile);
        
        // Extract the identityProfile object if it exists
        const identityProfile = profileData.identityProfile || {};
        console.log('[ProfilePage] Extracted identityProfile:', identityProfile);
        
        // Extract biographical data from the nested structure
        const biographical = identityProfile.biographical || profileData.biographical || profileData.biographicalProfile || {};
        
        // IMPORTANT: Extract personality data from the nested structure
        // The response structure is nested: result.identityProfile.personality
        const personalityProfile = 
          identityProfile.personality || 
          profileData.personalityProfile || 
          profileData.personality_profile || {};
        
        // Verify mandatory sections exist
        if (!biographical || !personalityProfile) {
          console.error('[ProfilePage] Missing critical profile sections after parsing:', { 
            hasBiographical: !!biographical, 
            hasPersonalityProfile: !!personalityProfile
          });
        }
        
        // Log critical sections before proceeding
        console.log('[ProfilePage] Biographical section after parsing:', biographical);
        console.log('[ProfilePage] Personality profile section after parsing:', personalityProfile);
        
        // Create a clean profile object with consistent structure and normalized field names
        
        // Normalize field names between camelCase and snake_case
        const normalizedBiographical = {};
        // Convert camelCase to snake_case for all biographical fields
        if (biographical) {
          // Map of camelCase keys to snake_case keys for biographical fields
          const bioFieldMap = {
            'name': 'name', // same in both
            'preferredName': 'preferred_name',
            'pronouns': 'pronouns', // same in both
            'age': 'age', // same in both
            'location': 'location', // same in both
            'culturalBackground': 'cultural_background',
            'spiritualOrientation': 'spiritual_orientation',
            'educationLevel': 'education_level',
            'occupation': 'occupation', // same in both
            'identityLabels': 'identity_labels'
          };
          
          // Copy all fields with normalized names
          Object.keys(bioFieldMap).forEach(camelKey => {
            const snakeKey = bioFieldMap[camelKey];
            // Try both camelCase and snake_case versions
            const value = biographical[camelKey] !== undefined ? 
              biographical[camelKey] : 
              biographical[snakeKey];
            
            if (value !== undefined) {
              normalizedBiographical[snakeKey] = value;
            }
          });
        }
        
        // Similarly normalize personality profile fields
        const normalizedPersonalityProfile: Record<string, unknown> = {};
        if (personalityProfile) {
          // Handle big_five section - Debug version with better logs
          const hasBigFive = Boolean(personalityProfile.big_five || personalityProfile.bigFive);
          console.log('[ProfilePage] Does personality profile have big_five/bigFive?', hasBigFive);
          
          // Deep inspect the big_five object to debug why values are null
          if (hasBigFive) {
            // IMPORTANT: Prioritize camelCase version (bigFive) which contains real values
            // The snake_case version (big_five) appears to have only null values
            const camelBigFive = personalityProfile.bigFive || {};
            const snakeBigFive = personalityProfile.big_five || {};
            
            // Log each property separately to catch edge cases
            console.log('[ProfilePage] Snake big_five inspection:', {
              openness: snakeBigFive.openness,
              conscientiousness: snakeBigFive.conscientiousness,
              extraversion: snakeBigFive.extraversion,
              agreeableness: snakeBigFive.agreeableness,
              neuroticism: snakeBigFive.neuroticism,
              emptyObject: Object.keys(snakeBigFive).length === 0
            });
            
            console.log('[ProfilePage] Camel bigFive inspection:', {
              openness: camelBigFive.openness,
              conscientiousness: camelBigFive.conscientiousness,
              extraversion: camelBigFive.extraversion,
              agreeableness: camelBigFive.agreeableness,
              neuroticism: camelBigFive.neuroticism,
              emptyObject: Object.keys(camelBigFive).length === 0
            });
            
            // Create the big_five object with explicit values
            normalizedPersonalityProfile['big_five'] = {
              // Important: Use explicit 0 or number checks to handle edge cases
              openness: typeof camelBigFive.openness === 'number' ? camelBigFive.openness : 
                       typeof snakeBigFive.openness === 'number' ? snakeBigFive.openness : null,
              conscientiousness: typeof camelBigFive.conscientiousness === 'number' ? camelBigFive.conscientiousness : 
                                typeof snakeBigFive.conscientiousness === 'number' ? snakeBigFive.conscientiousness : null,
              extraversion: typeof camelBigFive.extraversion === 'number' ? camelBigFive.extraversion :
                          typeof snakeBigFive.extraversion === 'number' ? snakeBigFive.extraversion : null,
              agreeableness: typeof camelBigFive.agreeableness === 'number' ? camelBigFive.agreeableness :
                           typeof snakeBigFive.agreeableness === 'number' ? snakeBigFive.agreeableness : null,
              neuroticism: typeof camelBigFive.neuroticism === 'number' ? camelBigFive.neuroticism :
                        typeof snakeBigFive.neuroticism === 'number' ? snakeBigFive.neuroticism : null
            };
            
            // Log the constructed big_five object to verify
            console.log('[ProfilePage] Constructed big_five object:', normalizedPersonalityProfile['big_five']);
          } else {
            // If neither big_five nor bigFive exists, ensure the structure exists
            normalizedPersonalityProfile['big_five'] = { 
              openness: null,
              conscientiousness: null,
              extraversion: null,
              agreeableness: null,
              neuroticism: null
            };
          }
          
          // Handle cognitive_style section with improved validation
          const hasCognitiveStyle = Boolean(personalityProfile.cognitive_style || personalityProfile.cognitiveStyle);
          console.log('[ProfilePage] Does personality profile have cognitive_style/cognitiveStyle?', hasCognitiveStyle);
          
          if (hasCognitiveStyle) {
            // Prioritize camelCase version which contains the real values
            const camelCogStyle = personalityProfile.cognitiveStyle || {};
            const snakeCogStyle = personalityProfile.cognitive_style || {};
            
            // Log each property separately for better debugging
            console.log('[ProfilePage] Snake cognitive_style inspection:', {
              thinking_mode: snakeCogStyle.thinking_mode,
              decision_making: snakeCogStyle.decision_making,
              response_tendency: snakeCogStyle.response_tendency,
              emptyObject: Object.keys(snakeCogStyle).length === 0
            });
            
            console.log('[ProfilePage] Camel cognitiveStyle inspection:', {
              thinkingMode: camelCogStyle.thinkingMode,
              decisionMaking: camelCogStyle.decisionMaking,
              responseTendency: camelCogStyle.responseTendency,
              emptyObject: Object.keys(camelCogStyle).length === 0
            });
            
            normalizedPersonalityProfile['cognitive_style'] = {
              thinking_mode: camelCogStyle.thinkingMode || snakeCogStyle.thinking_mode || null,
              decision_making: camelCogStyle.decisionMaking || snakeCogStyle.decision_making || null,
              response_tendency: camelCogStyle.responseTendency || snakeCogStyle.response_tendency || null
            };
            
            // Log the constructed cognitive_style object to verify
            console.log('[ProfilePage] Constructed cognitive_style object:', normalizedPersonalityProfile['cognitive_style']);
          } else {
            // If neither cognitive_style nor cognitiveStyle exists, ensure the structure exists
            normalizedPersonalityProfile['cognitive_style'] = {
              thinking_mode: null,
              decision_making: null,
              response_tendency: null
            };
          }
          
          // Handle emotional_regulation section with improved validation
          const hasEmotionalRegulation = Boolean(personalityProfile.emotional_regulation || personalityProfile.emotionalRegulation);
          console.log('[ProfilePage] Does personality profile have emotional_regulation/emotionalRegulation?', hasEmotionalRegulation);
          
          if (hasEmotionalRegulation) {
            // Prioritize camelCase version which contains the real values
            const camelEmoReg = personalityProfile.emotionalRegulation || {};
            const snakeEmoReg = personalityProfile.emotional_regulation || {};
            
            // Log each property separately for better debugging
            console.log('[ProfilePage] Snake emotional_regulation inspection:', {
              expression: snakeEmoReg.expression,
              coping_style: snakeEmoReg.coping_style,
              volatility: snakeEmoReg.volatility,
              emptyObject: Object.keys(snakeEmoReg).length === 0
            });
            
            console.log('[ProfilePage] Camel emotionalRegulation inspection:', {
              expression: camelEmoReg.expression,
              copingStyle: camelEmoReg.copingStyle,
              volatility: camelEmoReg.volatility,
              emptyObject: Object.keys(camelEmoReg).length === 0
            });
            
            // Properly handle string and number values
            normalizedPersonalityProfile['emotional_regulation'] = {
              expression: camelEmoReg.expression || snakeEmoReg.expression || null,
              coping_style: camelEmoReg.copingStyle || snakeEmoReg.coping_style || null,
              volatility: typeof camelEmoReg.volatility === 'number' ? camelEmoReg.volatility :
                          typeof snakeEmoReg.volatility === 'number' ? snakeEmoReg.volatility : null
            };
            
            // Log the constructed object to verify
            console.log('[ProfilePage] Constructed emotional_regulation object:', normalizedPersonalityProfile['emotional_regulation']);
          } else {
            // If neither object exists, ensure the structure is present
            normalizedPersonalityProfile['emotional_regulation'] = {
              expression: null,
              coping_style: null,
              volatility: null
            };
          }
          
          // Handle other properties with improved validation and logging
          // Explicitly prioritize camelCase versions which contain the real values
          console.log('[ProfilePage] Attachment style values:', {
            camelCase: personalityProfile.attachmentStyle,
            snakeCase: personalityProfile.attachment_style
          });
          
          // Prioritize camelCase version first
          normalizedPersonalityProfile['attachment_style'] = 
            personalityProfile.attachmentStyle || personalityProfile.attachment_style || null;
            
          console.log('[ProfilePage] Locus of control values:', {
            camelCase: personalityProfile.locusOfControl,
            snakeCase: personalityProfile.locus_of_control
          });
          
          // Prioritize camelCase version first
          normalizedPersonalityProfile['locus_of_control'] = 
            personalityProfile.locusOfControl || personalityProfile.locus_of_control || null;
            
          console.log('[ProfilePage] Motivational orientation values:', {
            camelCase: personalityProfile.motivationalOrientation,
            snakeCase: personalityProfile.motivational_orientation
          });
          
          // Properly handle array values - prioritize camelCase version first
          normalizedPersonalityProfile['motivational_orientation'] = 
            Array.isArray(personalityProfile.motivationalOrientation) ? personalityProfile.motivationalOrientation :
            Array.isArray(personalityProfile.motivational_orientation) ? personalityProfile.motivational_orientation : [];
          
          // Handle self_concept section with improved validation
          const hasSelfConcept = Boolean(personalityProfile.self_concept || personalityProfile.selfConcept);
          console.log('[ProfilePage] Does personality profile have self_concept/selfConcept?', hasSelfConcept);
          
          if (hasSelfConcept) {
            // Prioritize camelCase version which contains the real values
            const camelSelfCon = personalityProfile.selfConcept || {};
            const snakeSelfCon = personalityProfile.self_concept || {};
            
            // Log each property separately for better debugging
            console.log('[ProfilePage] Snake self_concept inspection:', {
              self_esteem: snakeSelfCon.self_esteem,
              identity_coherence: snakeSelfCon.identity_coherence,
              core_narratives: snakeSelfCon.core_narratives,
              emptyObject: Object.keys(snakeSelfCon).length === 0
            });
            
            console.log('[ProfilePage] Camel selfConcept inspection:', {
              selfEsteem: camelSelfCon.selfEsteem,
              identityCoherence: camelSelfCon.identityCoherence,
              coreNarratives: camelSelfCon.coreNarratives,
              emptyObject: Object.keys(camelSelfCon).length === 0
            });
            
            // Properly handle string, array, and null values
            normalizedPersonalityProfile['self_concept'] = {
              self_esteem: camelSelfCon.selfEsteem || snakeSelfCon.self_esteem || null,
              identity_coherence: camelSelfCon.identityCoherence || snakeSelfCon.identity_coherence || null,
              core_narratives: Array.isArray(camelSelfCon.coreNarratives) ? camelSelfCon.coreNarratives :
                             Array.isArray(snakeSelfCon.core_narratives) ? snakeSelfCon.core_narratives : []
            };
            
            // Log the constructed object to verify
            console.log('[ProfilePage] Constructed self_concept object:', normalizedPersonalityProfile['self_concept']);
          } else {
            // If neither object exists, ensure the structure is present
            normalizedPersonalityProfile['self_concept'] = {
              self_esteem: null,
              identity_coherence: null,
              core_narratives: []
            };
          }
        }
        
        // Log the normalized data
        console.log('[ProfilePage] Normalized biographical data:', normalizedBiographical);
        console.log('[ProfilePage] Normalized personality profile data:', normalizedPersonalityProfile);
        
        const safeProfile = {
          // Keep non-profile fields from the original result
          ...result,
          // Add the normalized parsed profile sections
          biographical: normalizedBiographical,
          personality_profile: normalizedPersonalityProfile,
          meta: profileData.meta || {
            confidence_levels: {},
            inference_sources: [],
            last_updated: new Date().toISOString()
          }
        };
        
        // Ensure identity_labels is always an array
        if (!Array.isArray(safeProfile.biographical.identity_labels)) {
          safeProfile.biographical.identity_labels = [];
        }
        
        
        // Validate the profile structure after construction
        console.log('[ProfilePage] SafeProfile keys:', Object.keys(safeProfile));
        console.log('[ProfilePage] Has biographical:', !!safeProfile.biographical);
        console.log('[ProfilePage] Has personality_profile:', !!safeProfile.personality_profile);
setProfile(safeProfile);
        setError(null);
        console.log("Profile loaded successfully:", safeProfile);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    waitForConnectionAndFetchProfile();
  }, []);
  
  // Retry loading the profile
  const handleRetry = () => {
    setError(null);
    
    setLoading(true);
    const fetchProfile = async () => {
      try {
        // Add a slight delay before retry to ensure auth context is fully established
        await new Promise(resolve => setTimeout(resolve, 500));
        const result = await opal.callTool("getIdentityProfile", {});
        
        // Check if the response contains an error message from the backend
        if (result && result.error === true) {
          console.error('Error from getIdentityProfile tool on retry:', result.message);
          setError(result.message || 'Failed to load profile. Please try again.');
          return;
        }
        
        // Ensure the profile structure is complete with all required fields
        const safeProfile = {
          ...result,
          biographical: {
            name: '',
            preferred_name: '',
            pronouns: '',
            age: null,
            location: '',
            cultural_background: '',
            spiritual_orientation: '',
            education_level: '',
            occupation: '',
            identity_labels: [],
            ...(result?.biographical || {})
          },
          personality_profile: result?.personality_profile || {
            big_five: {
              openness: null,
              conscientiousness: null,
              extraversion: null,
              agreeableness: null,
              neuroticism: null
            },
            cognitive_style: {
              thinking_mode: null,
              decision_making: null,
              response_tendency: null
            },
            emotional_regulation: {
              expression: null,
              coping_style: null,
              volatility: null
            },
            attachment_style: null,
            locus_of_control: null,
            motivational_orientation: [],
            self_concept: {
              self_esteem: null,
              identity_coherence: null,
              core_narratives: []
            }
          },
          meta: result?.meta || {
            confidence_levels: {
              big_five: null,
              attachment_style: null,
              motivational_orientation: null
            },
            inference_sources: [],
            last_updated: new Date().toISOString()
          }
        };
        
        // Ensure identity_labels is always an array
        if (!Array.isArray(safeProfile.biographical.identity_labels)) {
          safeProfile.biographical.identity_labels = [];
        }
        
        setProfile(safeProfile);
        setError(null);
        console.log("Profile loaded with safe defaults on retry:", safeProfile);
      } catch (err) {
        console.error("Error fetching profile on retry:", err);
        setError("Failed to load profile. Please try again later or refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  };

  // Handle saving the biographical information
  const handleSaveBiographical = async (data: BiographicalInfo) => {
    if (!profile) return;
    
    try {
      setSaving(true);
      await opal.callTool("updateProfileSection", {
        section: "biographical",
        data
      });
      
      // Update local state
      setProfile({
        ...profile,
        biographical: data
      });
      
      setError(null);
    } catch (err) {
      console.error("Error saving biographical info:", err);
      setError("Failed to save biographical information. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle saving the personality profile
  const handleSavePersonality = async (data: PersonalityProfile) => {
    if (!profile) return;
    
    try {
      setSaving(true);
      
      // Log the exact data we're trying to save
      console.log('[ProfilePage] Saving personality_profile with data:', data);
      
      // Use snake_case consistently for both section name and data
      // This matches how the biographical section works
      await opal.callTool("updateProfileSection", {
        section: "personality_profile",
        data: data // Use the snake_case data structure from the form
      });
      
      // Update local state with the same data
      setProfile({
        ...profile,
        personality_profile: data
      });
      
      setError(null);
    } catch (err) {
      console.error("Error saving personality profile:", err);
      setError("Failed to save personality profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-app-border-divider">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-app-text-secondary">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <h1 className="text-xl font-bold text-app-text-primary">Profile</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Psychological Identity Profile</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="mb-3">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                setLoading(true);
                handleRetry();
              }} 
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            >
              Retry Loading Profile
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="xl" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="biographical">Biographical</TabsTrigger>
              <TabsTrigger value="personality">Personality Traits</TabsTrigger>
              <TabsTrigger value="about">About This Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="biographical">
              {profile && (
                (() => {
                  // Debug logs to check exact data structure before rendering
                  console.log('[ProfilePage] Rendering BiographicalView with data:', profile.biographical);
                  console.log('[ProfilePage] Name value:', profile.biographical?.name);
                  console.log('[ProfilePage] Data type:', typeof profile.biographical);
                  console.log('[ProfilePage] Is data empty?', Object.keys(profile.biographical || {}).length === 0);
                  
                  return editMode ? (
                    <BiographicalForm 
                      data={profile.biographical} 
                      onSave={(data) => {
                        handleSaveBiographical(data);
                        setEditMode(false); // Switch back to view mode after saving
                      }}
                      saving={saving}
                    />
                  ) : (
                    <BiographicalView 
                      data={profile.biographical}
                      onEditClick={() => setEditMode(true)}
                    />
                  );
                })()
              )}
            </TabsContent>
            
            <TabsContent value="personality">
              {profile && (
                editMode ? (
                  <PersonalityForm 
                    personalityProfile={profile.personality_profile} 
                    onSave={(data) => {
                      handleSavePersonality(data);
                      setEditMode(false); // Switch back to view mode after saving
                    }}
                    loading={saving}
                  />
                ) : (
                  <PersonalityView 
                    data={profile.personality_profile}
                    onEditClick={() => setEditMode(true)}
                  />
                )
              )}
            </TabsContent>
            
            {/* History tab removed as it's not needed */}
            
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About Your Psychological Identity Profile</CardTitle>
                  <CardDescription>
                    This information helps OPAL understand you better and provide more personalized assistance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Your psychological identity profile is stored securely on the OPAL server and is only accessible
                    to you and the AI agents you interact with. This data is never transmitted to third parties or
                    used for advertising or analytics.
                  </p>
                  <p>
                    The profile includes information about your personality traits, cognitive style, emotional
                    regulation, attachment style, and more. This helps OPAL's AI agents understand your preferences,
                    communication style, and needs better.
                  </p>
                  <p>
                    You can update this information at any time, and OPAL will adapt its responses accordingly.
                  </p>
                  {profile && profile.meta && profile.meta.last_updated && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      <p>Last updated: {new Date(profile.meta.last_updated).toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
