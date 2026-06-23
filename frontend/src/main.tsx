import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthProvider.tsx'
import { ToastProvider } from './contexts/ToastContext.tsx'
import { GlobalToast } from './components/GlobalToast.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
        <GlobalToast />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
