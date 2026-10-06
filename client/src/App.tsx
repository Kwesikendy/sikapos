import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { MerchantSignupPage } from './pages/MerchantSignupPage';
import { StoreSetupPage } from './pages/StoreSetupPage';
import { LaunchReadinessPage } from './pages/LaunchReadinessPage';
import { CashierLoginPage } from './pages/CashierLoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardHomePage } from './pages/DashboardHomePage';
import { InventoryPage } from './pages/InventoryPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { TeamPage } from './pages/TeamPage';
import { SettingsPage } from './pages/SettingsPage';
import { POSPage } from './pages/POSPage';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { LegalPage } from './pages/LegalPage';
import { CookieConsentBanner } from './components/legal/CookieConsentBanner';
const PosTerminalPage = POSPage;

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/merchant-signup" element={<MerchantSignupPage />} />
          <Route path="/cashier-login" element={<CashierLoginPage />} />
          <Route 
            path="/store-setup" 
            element={
              <ProtectedRoute fallbackPath="/login">
                <StoreSetupPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/launch-readiness" 
            element={
              <ProtectedRoute fallbackPath="/login">
                <LaunchReadinessPage />
              </ProtectedRoute>
            } 
          />

          {/* POS Terminal */}
          <Route 
            path="/pos" 
            element={
              <ProtectedRoute fallbackPath="/login">
                <POSPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/terminal" 
            element={
              <ProtectedRoute>
                <PosTerminalPage />
              </ProtectedRoute>
            } 
          />

          {/* Protected Dashboard Shell Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute fallbackPath="/login">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHomePage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Public Legal & Compliance Routes */}
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/legal/:tab" element={<LegalPage />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <InstallPrompt />
        <CookieConsentBanner />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

