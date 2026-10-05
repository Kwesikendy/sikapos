import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MerchantSignupPage } from './pages/MerchantSignupPage';
import { StoreSetupPage } from './pages/StoreSetupPage';
import { LaunchReadinessPage } from './pages/LaunchReadinessPage';
import { CashierLoginPage } from './pages/CashierLoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardHomePage } from './pages/DashboardHomePage';
import { POSPage } from './pages/POSPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/merchant-signup" element={<MerchantSignupPage />} />
        <Route path="/store-setup" element={<StoreSetupPage />} />
        <Route path="/launch-readiness" element={<LaunchReadinessPage />} />
        <Route path="/cashier-login" element={<CashierLoginPage />} />
        <Route path="/pos" element={<POSPage />} />
        
        {/* Dashboard Shell Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHomePage />} />
          {/* Future routes will be nested here */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
