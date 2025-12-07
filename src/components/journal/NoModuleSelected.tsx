
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NoModuleSelected: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#1a1a1a] dark:bg-[#1a1a1a] rounded-lg p-8">
      <h2 className="text-2xl font-bold text-gray-200 mb-4">Guided Modules</h2>
      <p className="text-gray-400 text-center mb-8 max-w-md">
        Select a guided module from the sidebar to begin a structured writing exercise.
      </p>
      <Button 
        variant="outline" 
        onClick={() => navigate("/modules")}
        className="bg-[#222222] hover:bg-[#333333] dark:bg-[#222222] dark:hover:bg-[#333333] text-gray-300 dark:text-gray-300 border-gray-700 dark:border-[#444444]"
      >
        Browse Modules
      </Button>
    </div>
  );
};

export default NoModuleSelected;
