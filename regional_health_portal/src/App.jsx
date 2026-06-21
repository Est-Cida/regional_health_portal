import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Top-level pages
import LoginPage          from './pages/LoginPage'
import RegionalDashboard  from './pages/RegionalDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'

// Country nested layout + sub-pages
import CountryLayout       from './pages/country/CountryLayout'
import CountryOverview     from './pages/country/CountryOverview'
import DiseaseDashboard    from './pages/country/DiseaseDashboard'
import OutbreaksDashboard  from './pages/country/OutbreaksDashboard'
import LaboratoryDashboard from './pages/country/LaboratoryDashboard'
import CapacityDashboard   from './pages/country/CapacityDashboard'
import FundingDashboard    from './pages/country/FundingDashboard'

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

      {/* Country — nested routes share layout + country/year selectors */}
      <Route
        path="/country"
        element={
          <ProtectedRoute allowedRoles={['country_admin', 'regional_admin', 'super_admin']}>
            <CountryLayout />
          </ProtectedRoute>
        }
      >
        <Route index            element={<CountryOverview />} />
        <Route path="diseases"  element={<DiseaseDashboard />} />
        <Route path="outbreaks" element={<OutbreaksDashboard />} />
        <Route path="laboratory" element={<LaboratoryDashboard />} />
        <Route path="capacity"  element={<CapacityDashboard />} />
        <Route path="funding"   element={<FundingDashboard />} />
      </Route>

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
