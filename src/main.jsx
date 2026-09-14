import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DatabaseProvider } from './contexts/DatabaseContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { LocationProvider } from './contexts/LocationContext.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import AppRoutes from './routes/Route.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DatabaseProvider>
        <AuthProvider>
          <LocationProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </LocationProvider>
        </AuthProvider>
      </DatabaseProvider>
    </BrowserRouter>
  </StrictMode>
)
