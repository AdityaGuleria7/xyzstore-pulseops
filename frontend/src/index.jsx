/**
 * Copyright © 2026 Aditya Guleria. All rights reserved.
 * XYZStore · PulseOps — proprietary software.
 * Unauthorized copying, reproduction, redistribution, or commercial reuse is prohibited.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import { queryClient } from './lib/queryClient';

// Proprietary UI protection: deter casual copying of the application shell.
// This is not a substitute for server-side access control or legal IP protection.
document.addEventListener('contextmenu', (event) => {
  if (!event.target.closest('input, textarea, select, [contenteditable="true"]')) event.preventDefault();
});
document.addEventListener('dragstart', (event) => {
  if (!event.target.closest('input, textarea, img')) event.preventDefault();
});
document.addEventListener('copy', (event) => {
  if (!event.target.closest('input, textarea, [contenteditable="true"]')) {
    event.preventDefault();
  }
});

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
