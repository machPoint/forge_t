import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + (100 / (duration / 50));
      });
    }, 50);

    // Phase transitions
    const phaseTimer = setTimeout(() => {
      if (currentPhase < 2) {
        setCurrentPhase(currentPhase + 1);
      }
    }, duration / 3);

    // Complete splash screen
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Allow fade out animation
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(phaseTimer);
      clearTimeout(completeTimer);
    };
  }, [currentPhase, duration, onComplete]);

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onComplete, 100);
  };

  const phases = [
    "Initializing Forge...",
    "Loading AI insights engine...",
    "Preparing your workspace..."
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
        >
          {/* Main content card - matching login page style */}
          <div className="w-full max-w-md mx-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="border-0 shadow-2xl bg-[#1a1a1a] text-white rounded-lg p-8"
            >
              {/* Header section - matching login page */}
              <div className="text-center pb-6">
                <div className="mx-auto w-12 h-12 bg-[#304c62] rounded-full flex items-center justify-center mb-4">
                  <User className="h-6 w-6 text-white" />
                </div>
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold mb-2"
                >
                  Forge
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-gray-400"
                >
                  AI-Powered Journal & Memory System
                </motion.p>
              </div>

              {/* Loading section */}
              <div className="space-y-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-center"
                >
                  <p className="text-sm text-gray-300 mb-4">
                    {phases[currentPhase]}
                  </p>

                  {/* Progress bar - matching login page button style */}
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
                    <motion.div
                      className="h-full bg-[#304c62] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>

                  <div className="text-xs text-gray-500">
                    {Math.round(progress)}%
                  </div>
                </motion.div>

                {/* Skip button - matching login page link style */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="text-center"
                >
                  <button
                    onClick={handleSkip}
                    className="text-sm text-[#304c62] hover:text-[#3d5a73] transition-colors underline"
                  >
                    Skip Intro
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
