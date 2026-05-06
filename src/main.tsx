import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import { registerSW } from 'virtual:pwa-register';
import App from './App';

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
