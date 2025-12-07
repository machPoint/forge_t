import React from "react";
import { PersonalityProfile } from "@/pages/ProfilePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface PersonalityViewProps {
  data: PersonalityProfile;
  onEditClick: () => void;
}

const PersonalityView: React.FC<PersonalityViewProps> = ({ data, onEditClick }) => {
  // Enhanced logging of input data with structured representation
  console.log('[PersonalityView] Rendering with data:', JSON.stringify(data, null, 2));

  // Helper function to display trait values with a label
  const renderTraitValue = (value: number | string | null | undefined, label: string) => {
    // Explicitly handle all falsy values to avoid rendering issues
    if (value === null || value === undefined || value === '' || value === 0) {
      return "Not specified";
    }
    
    // For string values that represent categories rather than numbers
    if (typeof value === 'string') {
      if (isNaN(parseFloat(value))) {
        return value.charAt(0).toUpperCase() + value.slice(1); // Capitalize first letter
      }
      // Handle numeric strings
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // If it's a valid number in string form, process as number
        return formatNumericValue(numValue);
      }
    }
    
    // Handle numeric values
    if (typeof value === 'number') {
      return formatNumericValue(value);
    }
    
    // Fallback for any other unexpected types
    return "Not specified";
  };
  
  // Helper function to format numeric values consistently
  const formatNumericValue = (value: number) => {
    // Map the value (typically 1-5 or 1-7 scale) to descriptive text
    const labels = ["Very Low", "Low", "Moderate", "High", "Very High"];
    
    // Normalize value to 0-1 range assuming 1-5 scale
    const normalizedValue = (value - 1) / 4; 
    const normalizedIndex = Math.min(Math.max(Math.floor(normalizedValue * labels.length), 0), labels.length - 1);
    
    return `${labels[normalizedIndex]} (${value})`;
  };
  
  // Validate data input to prevent rendering issues
  if (!data) {
    console.error('[PersonalityView] No personality profile data provided');
    return (
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Personality Traits</CardTitle>
            <Button variant="outline" size="sm" onClick={onEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-red-600 dark:text-red-400">Personality profile data is unavailable. Please try refreshing or click Edit to add your personality traits.</p>
        </CardContent>
      </Card>
    );
  }

  // Enhanced debugging with structured output for better tracing
  console.log('[PersonalityView] Processing data type:', typeof data);
  
  // Deeply validate nested objects with detailed logging
  const hasBigFive = Boolean(data && data.big_five && typeof data.big_five === 'object');
  const hasCognitiveStyle = Boolean(data && data.cognitive_style && typeof data.cognitive_style === 'object');
  const hasEmotionalRegulation = Boolean(data && data.emotional_regulation && typeof data.emotional_regulation === 'object');
  const hasSelfConcept = Boolean(data && data.self_concept && typeof data.self_concept === 'object');
  
  console.log('[PersonalityView] Structure validation:', { 
    hasBigFive, 
    hasCognitiveStyle, 
    hasEmotionalRegulation,
    attachmentStyle: data?.attachment_style,
    locusOfControl: data?.locus_of_control
  });
  
  // Enhanced structured logging for field-level values with improved clarity
  if (hasBigFive) {
    console.log('[PersonalityView] Big Five values:', {
      openness: data.big_five?.openness ?? 'missing',
      conscientiousness: data.big_five?.conscientiousness ?? 'missing',
      extraversion: data.big_five?.extraversion ?? 'missing',
      agreeableness: data.big_five?.agreeableness ?? 'missing',
      neuroticism: data.big_five?.neuroticism ?? 'missing'
    });
  } else {
    console.warn('[PersonalityView] Big Five section missing or invalid');
  }
  
  // Log all structure validation results for easier debugging
  console.log('[PersonalityView] Structure validation results:', { 
    hasBigFive, 
    hasCognitiveStyle, 
    hasEmotionalRegulation,
    hasSelfConcept,
    attachmentStyle: data?.attachment_style ?? 'missing',
    locusOfControl: data?.locus_of_control ?? 'missing',
    hasMotivationalOrientation: Array.isArray(data?.motivational_orientation)
  });
  
  // Create safe references to nested objects with enhanced safety and type checks
  const bigFive = {
    openness: hasBigFive ? (data.big_five?.openness ?? null) : null,
    conscientiousness: hasBigFive ? (data.big_five?.conscientiousness ?? null) : null,
    extraversion: hasBigFive ? (data.big_five?.extraversion ?? null) : null,
    agreeableness: hasBigFive ? (data.big_five?.agreeableness ?? null) : null,
    neuroticism: hasBigFive ? (data.big_five?.neuroticism ?? null) : null
  };
  
  const cognitiveStyle = {
    thinking_mode: hasCognitiveStyle ? (data.cognitive_style?.thinking_mode ?? null) : null,
    decision_making: hasCognitiveStyle ? (data.cognitive_style?.decision_making ?? null) : null,
    response_tendency: hasCognitiveStyle ? (data.cognitive_style?.response_tendency ?? null) : null
  };
  
  const emotionalRegulation = {
    expression: hasEmotionalRegulation ? (data.emotional_regulation?.expression ?? null) : null,
    coping_style: hasEmotionalRegulation ? (data.emotional_regulation?.coping_style ?? null) : null,
    volatility: hasEmotionalRegulation ? (data.emotional_regulation?.volatility ?? null) : null
  };
  
  const attachmentStyle = data?.attachment_style ?? null;
  const locusOfControl = data?.locus_of_control ?? null;
  
  // Ensure motivational orientation is always a valid array
  const motivationalOrientation = Array.isArray(data?.motivational_orientation) ? 
    data.motivational_orientation : [];
  
  const selfConcept = {
    self_esteem: hasSelfConcept ? (data.self_concept?.self_esteem ?? null) : null,
    identity_coherence: hasSelfConcept ? (data.self_concept?.identity_coherence ?? null) : null,
    core_narratives: hasSelfConcept && Array.isArray(data.self_concept?.core_narratives) ? 
      data.self_concept.core_narratives : []
  };
  
  // Check if any section has valid data to prompt edit if all empty
  const hasAnyData = [
    Object.values(bigFive).some(v => v !== null),
    Object.values(cognitiveStyle).some(v => v !== null),
    Object.values(emotionalRegulation).some(v => v !== null),
    attachmentStyle !== null,
    locusOfControl !== null,
    motivationalOrientation.length > 0,
    Object.values(selfConcept).some(v => v !== null && !Array.isArray(v)) || selfConcept.core_narratives.length > 0
  ].some(Boolean);
  
  // If no valid data in any section, show a more helpful prompt
  if (!hasAnyData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Personality Traits</CardTitle>
            <Button variant="default" onClick={onEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              Add Your Traits
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-gray-500 dark:text-gray-400">
            No personality traits have been specified yet. Click "Add Your Traits" to complete your profile.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // These variables are already declared above, so we don't need to redeclare them here

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Personality Traits</CardTitle>
          <Button 
            variant="default"
            size="sm"
            onClick={onEditClick}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Big Five Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">Big Five Personality Traits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Openness</h4>
              <p className="text-base">{renderTraitValue(bigFive.openness, "Openness")}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Conscientiousness</h4>
              <p className="text-base">{renderTraitValue(bigFive.conscientiousness, "Conscientiousness")}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Extraversion</h4>
              <p className="text-base">{renderTraitValue(bigFive.extraversion, "Extraversion")}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Agreeableness</h4>
              <p className="text-base">{renderTraitValue(bigFive.agreeableness, "Agreeableness")}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Neuroticism</h4>
              <p className="text-base">{renderTraitValue(bigFive.neuroticism, "Neuroticism")}</p>
            </div>
          </div>
        </div>

        {/* Cognitive Style Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">Cognitive Style</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Thinking Mode</h4>
              <p className="text-base">{cognitiveStyle.thinking_mode !== undefined && cognitiveStyle.thinking_mode !== null ? cognitiveStyle.thinking_mode : "Not specified"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Decision Making</h4>
              <p className="text-base">{cognitiveStyle.decision_making !== undefined && cognitiveStyle.decision_making !== null ? cognitiveStyle.decision_making : "Not specified"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Response Tendency</h4>
              <p className="text-base">{cognitiveStyle.response_tendency !== undefined && cognitiveStyle.response_tendency !== null ? cognitiveStyle.response_tendency : "Not specified"}</p>
            </div>
          </div>
        </div>

        {/* Emotional Regulation Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">Emotional Regulation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Expression</h4>
              <p className="text-base">{emotionalRegulation.expression !== undefined && emotionalRegulation.expression !== null ? emotionalRegulation.expression : "Not specified"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Coping Style</h4>
              <p className="text-base">{emotionalRegulation.coping_style !== undefined && emotionalRegulation.coping_style !== null ? emotionalRegulation.coping_style : "Not specified"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Volatility</h4>
              <p className="text-base">{emotionalRegulation.volatility !== undefined && emotionalRegulation.volatility !== null ? emotionalRegulation.volatility : "Not specified"}</p>
            </div>
          </div>
        </div>

        {/* Other Traits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Attachment Style</h4>
            <p className="text-base">{attachmentStyle || "Not specified"}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Locus of Control</h4>
            <p className="text-base">{locusOfControl || "Not specified"}</p>
          </div>
        </div>

        {/* Motivational Orientation */}
        {motivationalOrientation && motivationalOrientation.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Motivational Orientation</h4>
            <div className="flex flex-wrap gap-2">
              {motivationalOrientation.map((motivation, index) => (
                <Badge key={index} variant="secondary">{motivation}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Self Concept Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">Self Concept</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Self Esteem</h4>
              <p className="text-base">{selfConcept.self_esteem !== undefined && selfConcept.self_esteem !== null ? selfConcept.self_esteem : "Not specified"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Identity Coherence</h4>
              <p className="text-base">{selfConcept.identity_coherence !== undefined && selfConcept.identity_coherence !== null ? selfConcept.identity_coherence : "Not specified"}</p>
            </div>
          </div>

          {/* Core Narratives */}
          {selfConcept.core_narratives && selfConcept.core_narratives.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Core Narratives</h4>
              <div className="flex flex-wrap gap-2">
                {selfConcept.core_narratives.map((narrative, index) => (
                  <Badge key={index} variant="secondary">{narrative}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalityView;
