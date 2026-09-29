import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MerchantSignupPage } from './pages/MerchantSignupPage';
import { StoreSetupPage } from './pages/StoreSetupPage';
import { LaunchReadinessPage } from './pages/LaunchReadinessPage';
import { CashierLoginPage } from './pages/CashierLoginPage';
import { PosTerminalPage } from './pages/PosTerminalPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/merchant-signup" element={<MerchantSignupPage />} />
            <Route path="/store-setup" element={<StoreSetupPage />} />
            <Route path="/launch-readiness" element={<LaunchReadinessPage />} />
            <Route path="/cashier-login" element={<CashierLoginPage />} />
            <Route
              path="/terminal"
              element={
                <ProtectedRoute>
                  <PosTerminalPage />
                </ProtectedRoute>
              }
            />
            <Route path="/pos" element={<Navigate to="/terminal" replace />} />
            <Route path="/" element={<Navigate to="/merchant-signup" replace />} />
            <Route path="*" element={<Navigate to="/merchant-signup" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;

