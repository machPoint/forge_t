import React, { useState } from "react";
import { BiographicalInfo } from "@/pages/ProfilePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface BiographicalFormProps {
  data: BiographicalInfo;
  onSave: (data: BiographicalInfo) => void;
  saving: boolean;
}

const BiographicalForm: React.FC<BiographicalFormProps> = ({ data, onSave, saving }) => {
  // Ensure all form fields have defined values to prevent uncontrolled to controlled input warnings
  const [formData, setFormData] = useState<BiographicalInfo>({
    name: data?.name || '',
    preferred_name: data?.preferred_name || '', // Keep for type compatibility
    pronouns: data?.pronouns || '', // Keep for type compatibility
    age: data?.age || null,
    location: data?.location || '',
    cultural_background: data?.cultural_background || '',
    spiritual_orientation: data?.spiritual_orientation || '',
    education_level: data?.education_level || '',
    occupation: data?.occupation || '',
    identity_labels: data?.identity_labels || []
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "age" ? (value ? parseInt(value, 10) : null) : value
    }));
  };

  // Removed label handling functions

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Biographical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age === null ? "" : formData.age}
                onChange={handleChange}
                placeholder="Your age (optional)"
              />
            </div>
            <div className="space-y-2">
              {/* Placeholder div for grid alignment */}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, Country, or Region"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cultural_background">Cultural Background</Label>
              <Input
                id="cultural_background"
                name="cultural_background"
                value={formData.cultural_background}
                onChange={handleChange}
                placeholder="Your cultural background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spiritual_orientation">Spiritual Orientation</Label>
              <Input
                id="spiritual_orientation"
                name="spiritual_orientation"
                value={formData.spiritual_orientation}
                onChange={handleChange}
                placeholder="Your spiritual beliefs (if any)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="education_level">Education Level</Label>
              <Input
                id="education_level"
                name="education_level"
                value={formData.education_level}
                onChange={handleChange}
                placeholder="Your highest education level"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="Your current occupation"
              />
            </div>
          </div>

          {/* Identity labels section removed */}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default BiographicalForm;
