import React from "react";
import { BiographicalInfo } from "@/pages/ProfilePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BiographicalViewProps {
  data: BiographicalInfo;
  onEditClick: () => void;
}

const BiographicalView: React.FC<BiographicalViewProps> = ({ data, onEditClick }) => {
  // Debug logs to help diagnose property access issues
  console.log('[BiographicalView] Received data:', data);
  
  // Helper function to handle both camelCase and snake_case property names
  const getProperty = (obj: Record<string, any>, snakeKey: string, camelKey?: string): any => {
    // Try snake_case first, then camelCase if provided
    const value = obj[snakeKey] !== undefined ? obj[snakeKey] : 
                 (camelKey && obj[camelKey] !== undefined ? obj[camelKey] : undefined);
    console.log(`[BiographicalView] Getting property ${snakeKey}/${camelKey || ''}: ${value}`);
    return value;
  };

  // Safely access properties with both naming conventions
  const name = getProperty(data, 'name');
  const age = getProperty(data, 'age');
  const location = getProperty(data, 'location');
  const culturalBackground = getProperty(data, 'cultural_background', 'culturalBackground');
  const spiritualOrientation = getProperty(data, 'spiritual_orientation', 'spiritualOrientation');
  const educationLevel = getProperty(data, 'education_level', 'educationLevel');
  const occupation = getProperty(data, 'occupation');
  const identityLabels = getProperty(data, 'identity_labels', 'identityLabels') || [];
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Biographical Information</CardTitle>
        <button 
          onClick={onEditClick}
          className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          Edit
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</h3>
          <p className="text-base">{name || "Not specified"}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</h3>
          <p className="text-base">{age !== null ? age : "Not specified"}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
          <p className="text-base">{location || "Not specified"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cultural Background</h3>
            <p className="text-base">{culturalBackground || "Not specified"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Spiritual Orientation</h3>
            <p className="text-base">{spiritualOrientation || "Not specified"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Education Level</h3>
            <p className="text-base">{educationLevel || "Not specified"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupation</h3>
            <p className="text-base">{occupation || "Not specified"}</p>
          </div>
        </div>

        {Array.isArray(identityLabels) && identityLabels.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Identity Labels</h3>
            <div className="flex flex-wrap gap-2">
              {identityLabels.map((label, index) => (
                <Badge key={index} variant="secondary">{label}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BiographicalView;
