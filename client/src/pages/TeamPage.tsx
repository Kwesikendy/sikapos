import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { StatusBadge } from '../components/ui/StatusBadge';
import { tenantApi } from '../api/tenant.api';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, KeyRound, UserCheck, Shield } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

export const TeamPage: React.FC = () => {
  const { tenant, primaryBranch, user } = useAuth();
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Cashier Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  const fetchStaff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await tenantApi.getCashiers();
      setCashiers(res || []);
    } catch (err: any) {
      setError('Failed to fetch staff list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Staff name is required.');
      return;
    }
    if (pin.length !== 4) {
      setError('Cashier PIN must be exactly 4 digits.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await tenantApi.createCashier({
        branchId: primaryBranch?.id || '',
        fullName: name.trim(),
        phoneNumber: phone.trim() || '0240000000',
        pin
      });

      setName('');
      setPhone('');
      setPin('');
      setIsAddModalOpen(false);
      await fetchStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to create cashier.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Store Team & Till Cashiers
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage cashier station profiles and 4-digit fast-switch PINs for {tenant?.businessName || 'your store'}.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="h-11 shadow-md shadow-[#0D5C3A]/20"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Till Cashier
        </Button>
      </motion.div>

      {error && (
        <motion.div variants={staggerItem}>
          <Alert variant="error" className="shadow-xs">{error}</Alert>
        </motion.div>
      )}

      {/* Staff Grid */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} glass className="p-5 border border-slate-200/80 bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width="3rem" height="3rem" />
                <div className="space-y-2 flex-1">
                  <Skeleton variant="text" width="60%" height="1.125rem" />
                  <Skeleton variant="text" width="40%" height="0.875rem" />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Skeleton variant="text" width="50%" height="0.75rem" />
                <Skeleton variant="rectangular" width="4rem" height="1.25rem" className="rounded-md" />
              </div>
            </Card>
          ))
        ) : (
          <>
            {/* Owner Card */}
            <Card glass className="p-5 border border-emerald-200 bg-white/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0D5C3A] text-white flex items-center justify-center font-bold text-base shadow-sm">
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'OW'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{user?.fullName || 'Store Owner'}</h3>
              <span className="inline-flex items-center text-xs font-bold text-[#0D5C3A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Shield className="w-3 h-3 mr-1" /> Store Owner / Admin
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Email: {user?.email || 'Registered Owner'}</span>
            <StatusBadge status="active" label="Full Control" />
          </div>
        </Card>

        {/* Cashiers */}
        {cashiers.map((c) => (
          <Card key={c.id} glass className="p-5 border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base border border-slate-200/60">
                {c.full_name ? c.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'CS'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{c.full_name}</h3>
                <span className="text-xs font-medium text-slate-500 block">Till Cashier • Terminal Station</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center font-mono">
                <KeyRound className="w-3.5 h-3.5 text-[#0D5C3A] mr-1" /> 4-Digit PIN Active
              </span>
              <StatusBadge status="active" label="Active" />
            </div>
          </Card>
        ))}
          </>
        )}
      </motion.div>

      {/* Add Cashier Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Till Cashier Profile"
        description="Assign a cashier name and 4-digit PIN for quick register access."
      >
        <form onSubmit={handleAddCashier} className="space-y-4 pt-2">
          <Input
            label="Cashier Full Name"
            placeholder="e.g. Abena Osei"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Mobile Phone Number"
            placeholder="e.g. 0244123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="4-Digit Till PIN"
            type="password"
            maxLength={4}
            placeholder="e.g. 1234"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            helperText="4 digits used to log in at the POS terminal"
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingText="Creating Profile...">
              Create Cashier
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default TeamPage;
