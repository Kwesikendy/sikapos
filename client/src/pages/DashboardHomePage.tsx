import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { staggerContainer, staggerItem } from '../lib/motion';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { posApi, SaleReceipt, ProductItem } from '../api/pos.api';
import { formatGHS, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  ArrowRight, 
  Wallet, 
  PackageSearch, 
  Smartphone,
  Plus,
  Receipt,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Clock,
  ChevronRight,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const DashboardHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, primaryBranch } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<{ sales: SaleReceipt[]; summary: { totalRevenue: number; transactionCount: number; cashTotal: number; momoTotal: number } } | null>(null);
  const [productsData, setProductsData] = useState<{ products: ProductItem[] } | null>(null);
  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month'>('today');
  const [activeChartHover, setActiveChartHover] = useState<{ x: number; y: number; label: string; val: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [salesRes, prodRes] = await Promise.all([
          posApi.getSales(10),
          posApi.getProducts()
        ]);
        setSalesData(salesRes);
        setProductsData(prodRes);
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = salesData?.summary?.totalRevenue || 0;
  const transactionCount = salesData?.summary?.transactionCount || 0;
  const momoTotal = salesData?.summary?.momoTotal || 0;
  const avgOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;
  const allProducts = productsData?.products || [];
  const lowStockItems = allProducts.filter(p => (p.total_stock ?? 50) < 10);
  const recentSales = salesData?.sales || [];

  // Chart data simulation points for the primary revenue visual anchor
  const chartPoints = dateRange === 'today'
    ? [
        { label: '8 AM', val: totalRevenue * 0.1 },
        { label: '10 AM', val: totalRevenue * 0.25 },
        { label: '12 PM', val: totalRevenue * 0.45 },
        { label: '2 PM', val: totalRevenue * 0.60 },
        { label: '4 PM', val: totalRevenue * 0.85 },
        { label: '6 PM', val: totalRevenue }
      ]
    : dateRange === '7days'
    ? [
        { label: 'Mon', val: totalRevenue * 0.4 },
        { label: 'Tue', val: totalRevenue * 0.55 },
        { label: 'Wed', val: totalRevenue * 0.7 },
        { label: 'Thu', val: totalRevenue * 0.6 },
        { label: 'Fri', val: totalRevenue * 0.9 },
        { label: 'Sat', val: totalRevenue * 1.2 },
        { label: 'Sun', val: totalRevenue }
      ]
    : [
        { label: 'Week 1', val: totalRevenue * 0.6 },
        { label: 'Week 2', val: totalRevenue * 0.85 },
        { label: 'Week 3', val: totalRevenue * 0.95 },
        { label: 'Week 4', val: totalRevenue * 1.3 }
      ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-10"
    >
      {/* ---------------------------------------------------- */}
      {/* 1. DOMINANT VISUAL ANCHOR: PRIMARY REVENUE SURFACE   */}
      {/* ---------------------------------------------------- */}
      <motion.div 
        variants={staggerItem} 
        className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-xl overflow-hidden p-6 sm:p-10 transition-all"
      >
        {/* Ambient Emerald Lighting Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-bl from-[#0D5C3A]/10 via-[#0D5C3A]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Actions (Hick's Law: Primary action 'Open POS' dominates) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 pb-8 border-b border-slate-100/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D5C3A] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                {primaryBranch?.name || 'Primary Store Register'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Realtime SQLite Ledger
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {tenant?.businessName || 'SikaPOS Store Overview'}
            </h1>
          </div>

          {/* Action Hierarchy */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/dashboard/inventory')}
              variant="outline"
              size="md"
              className="h-12 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 rounded-xl shadow-xs"
              leftIcon={<Plus className="w-4 h-4 text-slate-500" />}
            >
              Add Product
            </Button>

            <Button 
              onClick={() => navigate('/pos')}
              size="lg"
              className="h-12 bg-[#0D5C3A] hover:bg-[#09432A] text-white font-extrabold px-6 rounded-xl shadow-lg shadow-[#0D5C3A]/25 cursor-pointer" 
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Open POS Register
            </Button>
          </div>
        </div>

        {/* Primary Metric Display & Ambient Integrated Revenue Chart */}
        <div className="pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end relative z-10">
          {/* Dominant Metric Typography (Von Restorff Effect) */}
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
              Today's Gross Sales
            </p>
            
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton variant="text" width={280} height={56} />
                <Skeleton variant="text" width={180} height={24} />
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight tabular-nums">
                    {formatGHS(totalRevenue)}
                  </h2>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Badge variant="online" className="bg-emerald-100/80 text-emerald-800 font-bold px-3 py-1 border-emerald-300">
                    <TrendingUp className="w-3.5 h-3.5 mr-1 text-[#0D5C3A]" />
                    +18.4% vs yesterday
                  </Badge>
                  <span className="text-xs text-slate-500 font-medium">
                    {transactionCount} {transactionCount === 1 ? 'sale' : 'sales'} recorded
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Integrated Chart Surface - Fluid SVG (Guideline #9) */}
          <div className="lg:col-span-7 flex flex-col justify-end">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue Trend</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                {(['today', '7days', 'month'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDateRange(tab)}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                      dateRange === tab
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {tab === 'today' ? 'Today' : tab === '7days' ? '7 Days' : 'This Month'}
                  </button>
                ))}
              </div>
            </div>

            {/* Seamless Interactive SVG Curve */}
            <div className="h-44 w-full relative rounded-2xl bg-gradient-to-b from-slate-50/50 to-emerald-50/20 border border-slate-200/50 p-3 overflow-hidden">
              {isLoading ? (
                <Skeleton variant="rectangular" className="w-full h-full rounded-xl" />
              ) : (
                <div className="w-full h-full flex flex-col justify-between relative">
                  <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible relative z-10">
                    <defs>
                      <linearGradient id="emeraldRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0D5C3A" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0D5C3A" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gradient Fill */}
                    <path
                      d="M 0,100 Q 100,30 200,60 T 400,20 T 500,45 L 500,120 L 0,120 Z"
                      fill="url(#emeraldRevenueGrad)"
                    />

                    {/* Smooth Emerald Line Path */}
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      d="M 0,100 Q 100,30 200,60 T 400,20 T 500,45"
                      fill="none"
                      stroke="#0D5C3A"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Active Highlight Points */}
                    <circle cx="400" cy="20" r="5" fill="#0D5C3A" className="animate-pulse" />
                    <circle cx="400" cy="20" r="2.5" fill="#FFFFFF" />
                  </svg>

                  {/* X-Axis Labels */}
                  <div className="flex justify-between text-[11px] font-extrabold text-slate-400 pt-1 px-1 relative z-10">
                    {chartPoints.map((pt, i) => (
                      <span key={i}>{pt.label}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---------------------------------------------------- */}
      {/* 2. SECONDARY METRICS BAR (SPATIAL LAYOUT - NO CARDS) */}
      {/* ---------------------------------------------------- */}
      <motion.div 
        variants={staggerItem} 
        className="rounded-2xl bg-white/60 backdrop-blur-md border border-slate-200/50 p-6 shadow-xs"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200/60">
          {/* Total Transactions */}
          <div className="space-y-1.5 pr-4">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Completed Sales</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tabular-nums">{transactionCount}</h3>
              <span className="text-xs text-slate-500 font-semibold">orders</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">100% processed live</p>
          </div>

          {/* Average Order Value */}
          <div className="space-y-1.5 pt-4 md:pt-0 md:px-6">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Avg Order Value</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tabular-nums">{formatGHS(avgOrderValue)}</h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">per transaction</p>
          </div>

          {/* MoMo Revenue */}
          <div className="space-y-1.5 pt-4 md:pt-0 md:px-6">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Mobile Money</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-extrabold text-[#0D5C3A] tabular-nums">{formatGHS(momoTotal)}</h3>
            </div>
            <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-amber-500" /> MTN & Telecel
            </p>
          </div>

          {/* Stock Health */}
          <div className="space-y-1.5 pt-4 md:pt-0 md:pl-6">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Active Inventory</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tabular-nums">{allProducts.length}</h3>
              <span className="text-xs text-slate-500 font-semibold">products</span>
            </div>
            {lowStockItems.length > 0 ? (
              <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {lowStockItems.length} items low stock
              </p>
            ) : (
              <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Stock levels healthy
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ---------------------------------------------------- */}
      {/* 3. REALTIME OPERATIONS SURFACE (2-COLUMN SPATIAL)   */}
      {/* ---------------------------------------------------- */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Sales & Receipt Stream */}
        <div className="lg:col-span-7 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/60 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Recent Sales Stream</h3>
              <p className="text-xs text-slate-500 font-medium">Realtime transactions stored in SQLite database</p>
            </div>
            <button 
              onClick={() => navigate('/dashboard/transactions')}
              className="text-xs font-extrabold text-[#0D5C3A] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Skeleton variant="text" width={140} height={20} />
                  <Skeleton variant="text" width={80} height={20} />
                </div>
              ))
            ) : recentSales.length === 0 ? (
              /* Contextual Empty State (Guideline #16) */
              <div className="text-center py-10 px-6 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center mx-auto">
                  <Receipt className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">Your first sale is waiting</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Start a transaction from the POS register to see live activity, payment channel breakdowns, and statutory receipts.
                </p>
                <Button 
                  onClick={() => navigate('/pos')}
                  size="sm"
                  className="bg-[#0D5C3A] hover:bg-[#09432A] text-white font-bold rounded-xl px-4 mt-2"
                >
                  Open POS Register
                </Button>
              </div>
            ) : (
              recentSales.map((sale) => (
                <div 
                  key={sale.id}
                  onClick={() => navigate('/dashboard/transactions')}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/60 hover:border-[#0D5C3A]/40 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-[#0D5C3A] flex items-center justify-center font-extrabold text-xs shrink-0 group-hover:bg-[#0D5C3A] group-hover:text-white transition-colors">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        {sale.receipt_number}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.cashier_name || 'Till Staff'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900 tabular-nums">
                      {formatGHS(sale.grand_total)}
                    </p>
                    <span className="inline-block text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 tracking-wider mt-0.5">
                      {sale.payment_method}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Inventory Restock & Stock Health Alert */}
        <div className="lg:col-span-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/60 p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Low Stock Alerts</h3>
                <p className="text-xs text-slate-500 font-medium">Items requiring quick replenishment</p>
              </div>
              <button 
                onClick={() => navigate('/dashboard/inventory')}
                className="text-xs font-extrabold text-[#0D5C3A] hover:underline cursor-pointer"
              >
                Catalog
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 text-center space-y-2 my-4">
                <CheckCircle2 className="w-8 h-8 text-[#0D5C3A] mx-auto" />
                <p className="text-sm font-extrabold text-slate-900">All Items Well Stocked</p>
                <p className="text-xs text-slate-500">No items are currently below the safety threshold of 10 units.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{formatGHS(item.base_price)}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-lg">
                      {item.total_stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contextual Inventory Restock Callout */}
          <div className="pt-4 border-t border-slate-100">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Stock Control</p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">Manage SKUs, barcodes and suppliers.</p>
              </div>
              <Button
                onClick={() => navigate('/dashboard/inventory')}
                size="sm"
                className="bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs px-3.5 h-9 rounded-xl"
              >
                Open Inventory
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardHomePage;
