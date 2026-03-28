import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ChatStreamingProvider } from './contexts/ChatStreamingContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import ActivityPage from './pages/ActivityPage'
import InvoicesPage from './pages/InvoicesPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import SettingsPage from './pages/SettingsPage'
import CostsPage from './pages/CostsPage'
import ChatPage from './pages/ChatPage'
import UsersPage from './pages/UsersPage'
import AccountPage from './pages/AccountPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <ChatStreamingProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route
              path="costs"
              element={
                <ProtectedRoute roles={['ADMIN', 'MASTER']}>
                  <CostsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute roles={['ADMIN', 'MASTER']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route path="account" element={<AccountPage />} />
            <Route
              path="settings"
              element={
                <ProtectedRoute roles={['MASTER']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </ChatStreamingProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
