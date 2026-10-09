import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { posApi } from '../api/pos.api';
import { useAuth } from '../context/AuthContext';
import { Settings, Store, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { tenant, primaryBranch, setTenant, setPrimaryBranch, checkAuth } = useAuth();
  const [businessName, setBusinessName] = useState(tenant?.businessName || '');
  const [logoUrl, setLogoUrl] = useState(tenant?.logo_url || '');
  const [branchName, setBranchName] = useState(primaryBranch?.name || '');
  const [region, setRegion] = useState(primaryBranch?.region || 'Greater Accra');
  const [gps, setGps] = useState(primaryBranch?.gps_digital_address || 'GA-000-0000');
  const [address, setAddress] = useState(primaryBranch?.physical_address || primaryBranch?.address || '');
  const [phone, setPhone] = useState(primaryBranch?.phone || '');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      setBusinessName(tenant.businessName);
      if (tenant.logo_url) setLogoUrl(tenant.logo_url);
    }
    if (primaryBranch) {
      setBranchName(primaryBranch.name);
      if (primaryBranch.region) setRegion(primaryBranch.region);
      if (primaryBranch.gps_digital_address) setGps(primaryBranch.gps_digital_address);
      if (primaryBranch.physical_address || primaryBranch.address) setAddress(primaryBranch.physical_address || primaryBranch.address || '');
      if (primaryBranch.phone) setPhone(primaryBranch.phone);
    }
  }, [tenant, primaryBranch]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setError('Business / Store Name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await posApi.updateStoreSetup({
        businessName: businessName.trim(),
        tradeCategory: tenant?.tradeCategory || 'provision_supermarket',
        logoUrl,
        primaryBranch: {
          name: branchName.trim() || 'Main Branch',
          region,
          gpsDigitalAddress: gps,
          physicalAddress: address,
          phone
        }
      });

      setSuccessMsg('Store settings and branch location saved successfully.');
      await checkAuth();
    } catch (err: any) {
      setError(err.message || 'Failed to update store settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-4xl"
    >
      {/* Page Header */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Store Profile & Branch Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Configure business legal details, location address, and terminal preferences.
          </p>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={staggerItem}>
          <Alert variant="error" className="shadow-xs">{error}</Alert>
        </motion.div>
      )}

      {successMsg && (
        <motion.div variants={staggerItem}>
          <Alert variant="success" className="shadow-xs">{successMsg}</Alert>
        </motion.div>
      )}

      {/* Settings Form */}
      <motion.div variants={staggerItem}>
        <Card glass className="p-6 sm:p-8 border border-slate-200/80 bg-white shadow-card space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Store className="w-5 h-5 text-[#0D5C3A]" /> Store Identity
              </h3>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Store Logo" className="w-full h-full object-contain bg-white" />
                  ) : (
                    <Store className="w-10 h-10 text-slate-300" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Upload Logo"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setLogoUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <Input
                    label="Business / Store Name"
                    placeholder="e.g. Mastermade Solutions Mart"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-slate-500 font-medium">Click the image placeholder to upload your store logo (PNG, JPG). This logo will appear on your customer receipts and terminal screens.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0D5C3A]" /> Primary Branch Location
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Branch Name"
                  placeholder="e.g. Teshie Branch"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  required
                />
                <Input
                  label="Region"
                  placeholder="e.g. Greater Accra"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GhanaPost Digital GPS Address"
                  placeholder="e.g. GA-183-9024"
                  value={gps}
                  onChange={(e) => setGps(e.target.value)}
                />
                <Input
                  label="Contact Phone Number"
                  placeholder="e.g. 059 929 5299"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <Input
                label="Physical Address / Landmark"
                placeholder="e.g. Opposite Teshie First Junction, Accra"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-base font-bold text-slate-900 pb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0D5C3A]" /> Terminal Access Link
              </h3>
              <p className="text-sm text-slate-600">Share this link with your cashiers so they can log directly into this specific store terminal.</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={tenant ? `${window.location.origin}/cashier-login?storeId=${tenant.id}` : ''}
                  className="flex-1 h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 outline-none"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(tenant ? `${window.location.origin}/cashier-login?storeId=${tenant.id}` : '');
                    setSuccessMsg('Terminal link copied to clipboard!');
                    setTimeout(() => setSuccessMsg(null), 3000);
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Changes apply instantly across all POS terminals.
              </span>
              <Button type="submit" isLoading={isSaving} loadingText="Saving Changes...">
                Save Settings
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;
