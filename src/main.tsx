import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/theme-vars.css'
import { initializeTheme } from './lib/themes'

// Initialize theme system before rendering
initializeTheme();

createRoot(document.getElementById("root")!).render(<App />);
