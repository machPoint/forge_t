import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import TopNavigation from './TopNavigation';

const MenuHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unlisten = listen('menu-event', (event) => {
      switch (event.payload) {
        case 'new-entry':
          // Logic to create a new entry
          break;
        case 'go-home':
          navigate('/');
          break;
        case 'go_journal':
          navigate('/journal');
          break;
        case 'go_guided':
          navigate('/modules');
          break;
        case 'go_core':
          navigate('/core');
          break;
        case 'go_profile':
          navigate('/profile');
          break;
        case 'ai_feedback':
          // Logic for AI feedback
          break;
        case 'settings':
          navigate('/admin');
          break;
      }
    });

    return () => {
      unlisten.then(f => f());
    };
  }, [navigate]);

  return <TopNavigation />;
};

export default MenuHandler;
