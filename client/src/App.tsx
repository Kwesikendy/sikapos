import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MerchantSignupPage } from './pages/MerchantSignupPage';
import { StoreSetupPage } from './pages/StoreSetupPage';
import { LaunchReadinessPage } from './pages/LaunchReadinessPage';
import { CashierLoginPage } from './pages/CashierLoginPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/merchant-signup" element={<MerchantSignupPage />} />
        <Route path="/store-setup" element={<StoreSetupPage />} />
        <Route path="/launch-readiness" element={<LaunchReadinessPage />} />
        <Route path="/cashier-login" element={<CashierLoginPage />} />
        <Route path="/" element={<Navigate to="/merchant-signup" replace />} />
        <Route path="*" element={<Navigate to="/merchant-signup" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
