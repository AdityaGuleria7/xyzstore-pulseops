import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import { queryClient } from './lib/queryClient';

window.addEventListener('message', (event) => {
  if (event.data?.type === 'host:set-theme') {
    document.documentElement.classList.toggle('dark', event.data.theme === 'dark');
  }
});
window.parent.postMessage({ type: 'iframe:request-theme' }, '*');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
