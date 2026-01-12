import React, { useState, useEffect } from 'react';

interface OpalLoginModalProps {
  isOpen: boolean;
  onLogin: (token: string) => void;
}

const OpalLoginModal: React.FC<OpalLoginModalProps> = ({ isOpen, onLogin }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Load remember me preference on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('remember-login');
    if (savedPreference !== null) {
      setRememberMe(savedPreference === 'true');
    }
  }, []);

  const handleLogin = () => {
    if (!token.trim()) {
      setError('Please enter your OPAL token.');
      return;
    }
    setError('');
    
    // Save remember me preference
    localStorage.setItem('remember-login', rememberMe.toString());
    
    // If remember me is disabled, only use sessionStorage (cleared on app close)
    if (!rememberMe) {
      // Clear localStorage token so it doesn't persist
      localStorage.removeItem('opal-token');
    }
    
    onLogin(token.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-[#18181b] rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">OPAL Login</h2>
        <p className="mb-4 text-gray-300 text-sm">
          Please paste your OPAL API token below to connect. You can generate a token in the OPAL Admin UI.
        </p>
        <input
          type="text"
          className="w-full p-2 rounded bg-[#23232a] text-white border border-gray-600 mb-2"
          placeholder="Paste OPAL token here..."
          value={token}
          onChange={e => setToken(e.target.value)}
          autoFocus
        />
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        
        <label className="flex items-center gap-2 text-sm text-gray-300 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded bg-[#23232a] border-gray-600 text-[#304c62] focus:ring-[#304c62] focus:ring-offset-0"
          />
          <span>Remember me (skip login on startup)</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          {rememberMe 
            ? 'Your session will persist across app restarts. Recommended for personal computers.'
            : 'You will need to login each time you start the app. Recommended for shared computers.'}
        </p>
        
        <button
          className="w-full bg-[#304c62] hover:bg-[#253a4d] text-gray-200 font-semibold py-2 rounded mt-2"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default OpalLoginModal; 