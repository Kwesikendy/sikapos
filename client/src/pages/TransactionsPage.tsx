import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { StatusBadge } from '../components/ui/StatusBadge';
import { TableSkeleton } from '../components/ui/Skeletons';
import { posApi, SaleReceipt } from '../api/pos.api';
import { formatGHS } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { CreditCard, RefreshCw, Receipt, Search, Eye, CheckCircle2, Wallet } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { tenant } = useAuth();
  const [sales, setSales] = useState<SaleReceipt[]>([]);
  const [summary, setSummary] = useState<{ totalRevenue: number; transactionCount: number; cashTotal: number; momoTotal: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<SaleReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await posApi.getSales(50);
      setSales(res.sales || []);
      setSummary(res.summary);
    } catch (err: any) {
      setError('Failed to load transaction history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredSales = sales.filter((s) =>
    s.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.payment_method.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.customer_phone && s.customer_phone.includes(searchQuery))
  );

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
            Sales & Transaction History
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Real-time receipt logs, MoMo payments, and GRA tax breakdowns for {tenant?.businessName || 'your store'}.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchTransactions}
          className="h-11 bg-white border-slate-200"
          leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh Logs
        </Button>
      </motion.div>

      {error && (
        <motion.div variants={staggerItem}>
          <Alert variant="error" className="shadow-xs">{error}</Alert>
        </motion.div>
      )}

      {/* Overview Cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card glass className="p-5 border-white/60 bg-white/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales Volume</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatGHS(summary?.totalRevenue || 0)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{summary?.transactionCount || 0} completed orders</p>
        </Card>
        <Card glass className="p-5 border-white/60 bg-white/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">MoMo Collections</p>
          <h3 className="text-2xl font-extrabold text-[#0D5C3A] mt-1 tabular-nums">
            {formatGHS(summary?.momoTotal || 0)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">MTN / Telecel MoMo</p>
        </Card>
        <Card glass className="p-5 border-white/60 bg-white/80 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Register Total</p>
          <h3 className="text-2xl font-extrabold text-amber-700 mt-1 tabular-nums">
            {formatGHS(summary?.cashTotal || 0)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Physical cash till</p>
        </Card>
      </motion.div>

      {/* Filter & Search Bar */}
      <motion.div variants={staggerItem} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by receipt number, customer phone, or payment method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
          />
        </div>
      </motion.div>

      {/* Transactions Table */}
      <motion.div variants={staggerItem}>
        <Card glass className="p-0 overflow-hidden border border-slate-200/80 shadow-card bg-white">
          {isLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filteredSales.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Sales Transactions Recorded</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {searchQuery ? 'No receipts match your search filter.' : 'Completed sales transactions will appear here in real time.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-6">Receipt #</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4 text-right">Subtotal</th>
                    <th className="py-3.5 px-4 text-right">GRA Tax</th>
                    <th className="py-3.5 px-6 text-right">Grand Total</th>
                    <th className="py-3.5 px-4 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSales.map((s) => {
                    const formattedDate = new Date(s.created_at).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const methodLabel =
                      s.payment_method === 'mtn_momo' ? 'MTN MoMo' :
                      s.payment_method === 'telecel_cash' ? 'Telecel Cash' :
                      s.payment_method === 'card' ? 'Visa / Mastercard' : 'Cash';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-mono text-xs font-bold text-slate-900">
                          {s.receipt_number}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500">{formattedDate}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                            {methodLabel}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right tabular-nums text-slate-500">
                          {formatGHS(s.subtotal)}
                        </td>
                        <td className="py-4 px-4 text-right tabular-nums text-slate-500">
                          {formatGHS(s.tax_amount)}
                        </td>
                        <td className="py-4 px-6 text-right tabular-nums font-bold text-[#0D5C3A]">
                          {formatGHS(s.grand_total)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0D5C3A] hover:bg-emerald-50 transition-colors"
                            title="View receipt breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title={`Receipt ${selectedReceipt.receipt_number}`}
          description={`Completed transaction on ${new Date(selectedReceipt.created_at).toLocaleString()}`}
        >
          <div className="space-y-4 pt-2 text-sm font-medium">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Payment Method</span>
                <span className="font-bold text-slate-900 uppercase">{selectedReceipt.payment_method}</span>
              </div>
              {selectedReceipt.customer_phone && (
                <div>
                  <span className="text-slate-500 block">Customer Phone</span>
                  <span className="font-mono text-slate-900">{selectedReceipt.customer_phone}</span>
                </div>
              )}
            </div>

            <div className="border-t border-b border-slate-100 py-3 space-y-2">
              <div className="flex justify-between text-slate-600 text-xs">
                <span>Subtotal Amount:</span>
                <span className="font-bold tabular-nums">{formatGHS(selectedReceipt.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-xs">
                <span>GRA Taxes (15% VAT + 2.5% NHIL + 2.5% GETFund):</span>
                <span className="font-bold tabular-nums">{formatGHS(selectedReceipt.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
                <span>Grand Total Paid:</span>
                <span className="text-[#0D5C3A] tabular-nums">{formatGHS(selectedReceipt.grand_total)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setSelectedReceipt(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default TransactionsPage;
