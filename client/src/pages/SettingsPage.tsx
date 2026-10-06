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
  const [branchName, setBranchName] = useState(primaryBranch?.name || '');
  const [region, setRegion] = useState(primaryBranch?.region || 'Greater Accra');
  const [gps, setGps] = useState(primaryBranch?.gps_digital_address || 'GA-000-0000');
  const [address, setAddress] = useState(primaryBranch?.physical_address || primaryBranch?.address || '');
  const [phone, setPhone] = useState(primaryBranch?.phone || '');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) setBusinessName(tenant.businessName);
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

              <Input
                label="Business / Store Name"
                placeholder="e.g. Mastermade Solutions Mart"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
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
