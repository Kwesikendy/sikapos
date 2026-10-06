import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { posApi } from '../api/pos.api';
import { formatGHS } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { BarChart3, RefreshCw, Download, Wallet, CreditCard, ShieldCheck, PieChart } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { tenant, primaryBranch } = useAuth();
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await posApi.getSales(100);
      setSalesSummary(res.summary);
    } catch (err: any) {
      setError('Failed to fetch sales reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const totalRev = salesSummary?.totalRevenue || 0;
  const momoRev = salesSummary?.momoTotal || 0;
  const cashRev = salesSummary?.cashTotal || 0;
  const vatEst = totalRev * 0.15;
  const nhilEst = totalRev * 0.025;
  const getfundEst = totalRev * 0.025;

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
            Financial & GRA Tax Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Daily, weekly, and monthly revenue summaries for {tenant?.businessName || 'your store'}.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={fetchReports}
            className="flex-1 sm:flex-none h-11 bg-white border-slate-200"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh Data
          </Button>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={staggerItem}>
          <Alert variant="error" className="shadow-xs">{error}</Alert>
        </motion.div>
      )}

      {/* Revenue Breakdown Grid */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Channels */}
        <Card glass className="p-6 border border-slate-200/80 bg-white shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#0D5C3A]" />
              <h3 className="text-base font-bold text-slate-900">Payment Method Breakdown</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">Recorded Sales</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Mobile Money (MTN / Telecel / AT)</span>
                <span className="text-[#0D5C3A] tabular-nums">{formatGHS(momoRev)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0D5C3A] h-full rounded-full transition-all"
                  style={{ width: totalRev > 0 ? `${(momoRev / totalRev) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Cash Register Payments</span>
                <span className="text-amber-700 tabular-nums">{formatGHS(cashRev)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all"
                  style={{ width: totalRev > 0 ? `${(cashRev / totalRev) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* GRA Statutory Tax Obligations */}
        <Card glass className="p-6 border border-slate-200/80 bg-white shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0D5C3A]" />
              <h3 className="text-base font-bold text-slate-900">Ghana Revenue Authority (GRA) Taxes</h3>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">Standard GRA</span>
          </div>

          <div className="space-y-3 text-xs font-medium text-slate-600 pt-1">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <span>Value Added Tax (VAT 15%)</span>
              <span className="font-bold text-slate-900 tabular-nums">{formatGHS(vatEst)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <span>National Health Insurance Levy (NHIL 2.5%)</span>
              <span className="font-bold text-slate-900 tabular-nums">{formatGHS(nhilEst)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <span>GETFund Levy (2.5%)</span>
              <span className="font-bold text-slate-900 tabular-nums">{formatGHS(getfundEst)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 text-sm font-extrabold text-slate-900">
              <span>Total Tax Obligations:</span>
              <span className="text-[#0D5C3A] tabular-nums">{formatGHS(vatEst + nhilEst + getfundEst)}</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ReportsPage;
