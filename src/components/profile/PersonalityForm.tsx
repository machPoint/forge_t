import React, { useState } from "react";
import { PersonalityProfile } from "@/pages/ProfilePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface PersonalityFormProps {
  personalityProfile: PersonalityProfile;
  onSave: (data: PersonalityProfile) => void;
  loading: boolean;
}

const PersonalityForm: React.FC<PersonalityFormProps> = ({ personalityProfile, onSave, loading }) => {
  // Ensure all fields have defined values to prevent uncontrolled to controlled input warnings
  const [formData, setFormData] = useState<PersonalityProfile>({
    big_five: {
      openness: personalityProfile?.big_five?.openness || null,
      conscientiousness: personalityProfile?.big_five?.conscientiousness || null,
      extraversion: personalityProfile?.big_five?.extraversion || null,
      agreeableness: personalityProfile?.big_five?.agreeableness || null,
      neuroticism: personalityProfile?.big_five?.neuroticism || null
    },
    cognitive_style: {
      thinking_mode: personalityProfile?.cognitive_style?.thinking_mode || null,
      decision_making: personalityProfile?.cognitive_style?.decision_making || null,
      response_tendency: personalityProfile?.cognitive_style?.response_tendency || null
    },
    emotional_regulation: {
      expression: personalityProfile?.emotional_regulation?.expression || null,
      coping_style: personalityProfile?.emotional_regulation?.coping_style || null,
      volatility: personalityProfile?.emotional_regulation?.volatility || null
    },
    attachment_style: personalityProfile?.attachment_style || null,
    locus_of_control: personalityProfile?.locus_of_control || null,
    motivational_orientation: personalityProfile?.motivational_orientation || [],
    self_concept: {
      self_esteem: personalityProfile?.self_concept?.self_esteem || null,
      identity_coherence: personalityProfile?.self_concept?.identity_coherence || null,
      core_narratives: personalityProfile?.self_concept?.core_narratives || []
    }
  });
  const [newMotivation, setNewMotivation] = useState("");
  const [newNarrative, setNewNarrative] = useState("");

  const handleBigFiveChange = (trait: keyof typeof formData.big_five, value: number[]) => {
    setFormData(prev => ({
      ...prev,
      big_five: {
        ...prev.big_five,
        [trait]: value[0]
      }
    }));
  };

  const handleSelectChange = (section: string, field: string, value: string | null) => {
    setFormData(prev => {
      if (section === "root") {
        return {
          ...prev,
          [field]: value
        };
      } else {
        const sectionKey = section as keyof PersonalityProfile;
        const sectionData = prev[sectionKey];
        
        if (sectionData && typeof sectionData === 'object') {
          return {
            ...prev,
            [sectionKey]: {
              ...sectionData,
              [field]: value
            }
          };
        }
        return prev;
      }
    });
  };

  const handleVolatilityChange = (value: number[]) => {
    setFormData(prev => ({
      ...prev,
      emotional_regulation: {
        ...prev.emotional_regulation,
        volatility: value[0]
      }
    }));
  };

  const handleAddMotivation = () => {
    if (newMotivation.trim() && !formData.motivational_orientation.includes(newMotivation.trim())) {
      setFormData(prev => ({
        ...prev,
        motivational_orientation: [...prev.motivational_orientation, newMotivation.trim()]
      }));
      setNewMotivation("");
    }
  };

  const handleRemoveMotivation = (item: string) => {
    setFormData(prev => ({
      ...prev,
      motivational_orientation: prev.motivational_orientation.filter(m => m !== item)
    }));
  };

  const handleAddNarrative = () => {
    if (newNarrative.trim() && !formData.self_concept.core_narratives.includes(newNarrative.trim())) {
      setFormData(prev => ({
        ...prev,
        self_concept: {
          ...prev.self_concept,
          core_narratives: [...prev.self_concept.core_narratives, newNarrative.trim()]
        }
      }));
      setNewNarrative("");
    }
  };

  const handleRemoveNarrative = (item: string) => {
    setFormData(prev => ({
      ...prev,
      self_concept: {
        ...prev.self_concept,
        core_narratives: prev.self_concept.core_narratives.filter(n => n !== item)
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Personality Profile</CardTitle>
          <CardDescription>
            This information helps OPAL understand your personality traits and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Big Five Personality Traits */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Big Five Personality Traits</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Openness to Experience</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.big_five.openness !== null ? formData.big_five.openness.toFixed(1) : "Not set"}
                  </span>
                </div>
                <Slider
                  value={[formData.big_five.openness !== null ? formData.big_five.openness : 0.5]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => handleBigFiveChange("openness", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Traditional, practical</span>
                  <span>Curious, imaginative</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Conscientiousness</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.big_five.conscientiousness !== null ? formData.big_five.conscientiousness.toFixed(1) : "Not set"}
                  </span>
                </div>
                <Slider
                  value={[formData.big_five.conscientiousness !== null ? formData.big_five.conscientiousness : 0.5]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => handleBigFiveChange("conscientiousness", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Spontaneous, flexible</span>
                  <span>Organized, disciplined</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Extraversion</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.big_five.extraversion !== null ? formData.big_five.extraversion.toFixed(1) : "Not set"}
                  </span>
                </div>
                <Slider
                  value={[formData.big_five.extraversion !== null ? formData.big_five.extraversion : 0.5]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => handleBigFiveChange("extraversion", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Reserved, reflective</span>
                  <span>Outgoing, energetic</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Agreeableness</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.big_five.agreeableness !== null ? formData.big_five.agreeableness.toFixed(1) : "Not set"}
                  </span>
                </div>
                <Slider
                  value={[formData.big_five.agreeableness !== null ? formData.big_five.agreeableness : 0.5]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => handleBigFiveChange("agreeableness", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Challenging, detached</span>
                  <span>Cooperative, compassionate</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Neuroticism</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.big_five.neuroticism !== null ? formData.big_five.neuroticism.toFixed(1) : "Not set"}
                  </span>
                </div>
                <Slider
                  value={[formData.big_five.neuroticism !== null ? formData.big_five.neuroticism : 0.5]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => handleBigFiveChange("neuroticism", value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Calm, resilient</span>
                  <span>Sensitive, reactive</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cognitive Style */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Cognitive Style</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="thinking_mode">Thinking Mode</Label>
                <Select
                  value={formData.cognitive_style.thinking_mode || "not_specified"}
                  onValueChange={(value) => handleSelectChange("cognitive_style", "thinking_mode", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select thinking mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="concrete">Concrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="decision_making">Decision Making</Label>
                <Select
                  value={formData.cognitive_style.decision_making || "not_specified"}
                  onValueChange={(value) => handleSelectChange("cognitive_style", "decision_making", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select decision style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="intuitive">Intuitive</SelectItem>
                    <SelectItem value="analytical">Analytical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="response_tendency">Response Tendency</Label>
                <Select
                  value={formData.cognitive_style.response_tendency || "not_specified"}
                  onValueChange={(value) => handleSelectChange("cognitive_style", "response_tendency", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select response style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="reflective">Reflective</SelectItem>
                    <SelectItem value="reactive">Reactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Emotional Regulation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Emotional Regulation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="expression">Emotional Expression</Label>
                <Select
                  value={formData.emotional_regulation.expression || "not_specified"}
                  onValueChange={(value) => handleSelectChange("emotional_regulation", "expression", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expression style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="suppressed">Suppressed</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="expressive">Expressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coping_style">Coping Style</Label>
                <Select
                  value={formData.emotional_regulation.coping_style || "not_specified"}
                  onValueChange={(value) => handleSelectChange("emotional_regulation", "coping_style", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select coping style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="avoidant">Avoidant</SelectItem>
                    <SelectItem value="engaged">Engaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Emotional Volatility</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.emotional_regulation.volatility !== null ? formData.emotional_regulation.volatility.toFixed(1) : "Not set"}
                </span>
              </div>
              <Slider
                value={[formData.emotional_regulation.volatility !== null ? formData.emotional_regulation.volatility : 0.5]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={handleVolatilityChange}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Stable emotions</span>
                <span>Variable emotions</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Attachment and Control */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Attachment & Control</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="attachment_style">Attachment Style</Label>
                <Select
                  value={formData.attachment_style || "not_specified"}
                  onValueChange={(value) => handleSelectChange("root", "attachment_style", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select attachment style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="secure">Secure</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                    <SelectItem value="avoidant">Avoidant</SelectItem>
                    <SelectItem value="disorganized">Disorganized</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locus_of_control">Locus of Control</Label>
                <Select
                  value={formData.locus_of_control || "not_specified"}
                  onValueChange={(value) => handleSelectChange("root", "locus_of_control", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select locus of control" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Motivational Orientation */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Motivational Orientation</h3>
            <p className="text-sm text-muted-foreground mb-4">What drives and motivates you?</p>
            
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.motivational_orientation.map((item, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {item}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveMotivation(item)} 
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="new_motivation"
                  value={newMotivation}
                  onChange={(e) => setNewMotivation(e.target.value)}
                  placeholder="Add motivation"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMotivation();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddMotivation}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Examples: achievement, connection, creativity, growth, security, autonomy
              </p>
            </div>
          </div>

          <Separator />

          {/* Self Concept */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Self Concept</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="self_esteem">Self Esteem</Label>
                <Select
                  value={formData.self_concept.self_esteem || "not_specified"}
                  onValueChange={(value) => handleSelectChange("self_concept", "self_esteem", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select self esteem level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identity_coherence">Identity Coherence</Label>
                <Select
                  value={formData.self_concept.identity_coherence || "not_specified"}
                  onValueChange={(value) => handleSelectChange("self_concept", "identity_coherence", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select identity coherence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="fragmented">Fragmented</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Core Narratives</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Key stories or beliefs that define how you see yourself
              </p>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.self_concept.core_narratives.map((item, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {item}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveNarrative(item)} 
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="new_narrative"
                  value={newNarrative}
                  onChange={(e) => setNewNarrative(e.target.value)}
                  placeholder="Add core narrative"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNarrative();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddNarrative}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Examples: "I overcome challenges", "I'm a creative problem-solver", "I prioritize relationships"
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default PersonalityForm;
