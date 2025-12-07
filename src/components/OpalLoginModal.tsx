import React, { useState } from 'react';

interface OpalLoginModalProps {
  isOpen: boolean;
  onLogin: (token: string) => void;
}

const OpalLoginModal: React.FC<OpalLoginModalProps> = ({ isOpen, onLogin }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!token.trim()) {
      setError('Please enter your OPAL token.');
      return;
    }
    setError('');
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