import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import CountryDashboard from './pages/CountryDashboard'
import RegionalDashboard from './pages/RegionalDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import './App.css'

function DefaultRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'super_admin')    return <Navigate to="/admin"   replace />
  if (user.role === 'regional_admin') return <Navigate to="/region"  replace />
  return <Navigate to="/country" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/country"
        element={
          <ProtectedRoute allowedRoles={['country_admin', 'regional_admin', 'super_admin']}>
            <CountryDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/region"
        element={
          <ProtectedRoute allowedRoles={['regional_admin', 'super_admin']}>
            <RegionalDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<DefaultRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
