import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import PublicCard from './pages/PublicCard'
import MyCard from './pages/MyCard'
import WalletPage from './pages/Wallet'
import Scan from './pages/Scan'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/c/:slug" element={<PublicCard />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<MyCard />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/scan" element={<Scan />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}