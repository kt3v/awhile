import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { migrateFromLocalStorage } from './lib/migrateFromLocalStorage';
import { useStore } from './store/useStore';

async function init() {
  await migrateFromLocalStorage();
  await useStore.persist.rehydrate();
}

init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
