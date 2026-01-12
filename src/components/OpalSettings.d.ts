import React from 'react';

interface OpalSettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
}

declare const OpalSettings: React.FC<OpalSettingsProps>;
export default OpalSettings;
