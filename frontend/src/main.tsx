import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthProvider.tsx'
import { ToastProvider } from './contexts/ToastContext.tsx'
import { GlobalToast } from './components/GlobalToast.tsx'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <App />
          <GlobalToast />
        </ToastProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
)
