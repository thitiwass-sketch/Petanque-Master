import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProviderComponent } from './context/AuthContext';

createRoot(document.getElementById('root')!).render(
  <AuthProviderComponent>
    <App />
  </AuthProviderComponent>
);
