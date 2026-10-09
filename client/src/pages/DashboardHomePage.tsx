import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { staggerContainer, staggerItem } from '../lib/motion';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { posApi, SaleReceipt, ProductItem } from '../api/pos.api';
import { formatGHS, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { 
  TrendingUp, 
  ArrowRight, 
  Wallet, 
  PackageSearch, 
  Smartphone,
  Plus,
  ScrollText,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Clock,
  ChevronRight,
  CheckCircle2,
  Calendar
} from 'lucide-react';

// Moondoog AI Inspired Component: Animated Number Ticker
const AnimatedNumber = ({ value }: { value: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(0, value, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate(v) {
          node.textContent = formatGHS(v);
        }
      });
      return () => controls.stop();
    }
  }, [value]);

  return <span ref={nodeRef}>{formatGHS(0)}</span>;
};

export const DashboardHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, primaryBranch } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<{ sales: SaleReceipt[]; summary: { totalRevenue: number; transactionCount: number; cashTotal: number; momoTotal: number } } | null>(null);
  const [productsData, setProductsData] = useState<{ products: ProductItem[] } | null>(null);
  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month'>('today');
  const [activeChartHover, setActiveChartHover] = useState<{ x: number; y: number; label: string; val: number } | null>(null);
  const { toast } = useToast();
  const [hasNotified, setHasNotified] = useState(false);

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
  const lowStockItems = allProducts.filter(p => (p.total_stock ?? 50) <= 20);
  const recentSales = salesData?.sales || [];

  useEffect(() => {
    if (!isLoading && !hasNotified && lowStockItems.length > 0) {
      toast.warning('Low Stock Alert', `You have ${lowStockItems.length} item(s) running low on stock.`);
      setHasNotified(true);
    }
  }, [isLoading, lowStockItems, hasNotified, toast]);

  const chartPoints = dateRange === 'today'
    ? [
        { label: '8 AM', val: totalRevenue * 0.1, x: 0, y: 100 },
        { label: '10 AM', val: totalRevenue * 0.25, x: 100, y: 30 },
        { label: '12 PM', val: totalRevenue * 0.45, x: 200, y: 60 },
        { label: '2 PM', val: totalRevenue * 0.60, x: 300, y: 40 },
        { label: '4 PM', val: totalRevenue * 0.85, x: 400, y: 20 },
        { label: '6 PM', val: totalRevenue, x: 500, y: 45 }
      ]
    : dateRange === '7days'
    ? [
        { label: 'Mon', val: totalRevenue * 0.4, x: 0, y: 80 },
        { label: 'Wed', val: totalRevenue * 0.7, x: 160, y: 50 },
        { label: 'Fri', val: totalRevenue * 0.9, x: 320, y: 10 },
        { label: 'Sun', val: totalRevenue, x: 500, y: 20 }
      ]
    : [
        { label: 'Wk 1', val: totalRevenue * 0.6, x: 0, y: 60 },
        { label: 'Wk 2', val: totalRevenue * 0.85, x: 160, y: 35 },
        { label: 'Wk 3', val: totalRevenue * 0.95, x: 320, y: 30 },
        { label: 'Wk 4', val: totalRevenue * 1.3, x: 500, y: 10 }
      ];

  const getChartPath = () => {
    if (dateRange === 'today') return "M 0,100 Q 100,30 200,60 T 400,20 T 500,45";
    if (dateRange === '7days') return "M 0,80 Q 80,40 160,50 T 320,10 T 500,20";
    return "M 0,60 Q 120,20 250,50 T 500,10";
  };
  const getGradientFill = () => {
    if (dateRange === 'today') return "M 0,100 Q 100,30 200,60 T 400,20 T 500,45 L 500,120 L 0,120 Z";
    if (dateRange === '7days') return "M 0,80 Q 80,40 160,50 T 320,10 T 500,20 L 500,120 L 0,120 Z";
    return "M 0,60 Q 120,20 250,50 T 500,10 L 500,120 L 0,120 Z";
  };

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
        className="relative sika-raised rounded-[22px] overflow-hidden p-4 sm:p-8 lg:p-10 transition-all"
      >
        {/* Ambient Emerald Lighting Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-bl from-[#0D5C3A]/10 via-[#0D5C3A]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 relative z-10 pb-6 sm:pb-8 border-b border-slate-100/80">
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
            <motion.h1 
              initial={{ backgroundPosition: "0% 50%" }}
              animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="text-2xl sm:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-emerald-600 to-slate-900 bg-[length:200%_auto]"
            >
              {tenant?.businessName || 'SikaPOS Store Overview'}
            </motion.h1>
          </div>

          {/* Action Hierarchy with Tactile Feedback */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <Button
              onClick={() => navigate('/dashboard/inventory')}
              variant="outline"
              size="md"
              className="h-12 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 rounded-xl shadow-xs sika-press w-full sm:w-auto justify-center"
              leftIcon={<Plus className="w-4 h-4 text-slate-500" />}
            >
              Add Product
            </Button>

            <Button 
              onClick={() => navigate('/pos')}
              size="lg"
              className="h-12 bg-[#0D5C3A] hover:bg-[#09432A] text-white font-extrabold px-6 rounded-xl shadow-lg shadow-[#0D5C3A]/25 cursor-pointer sika-press w-full sm:w-auto justify-center" 
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
                    <AnimatedNumber value={totalRevenue} />
                  </h2>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">
                    {transactionCount} {transactionCount === 1 ? 'sale' : 'sales'} recorded
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Integrated Chart Surface */}
          <div className="lg:col-span-7 flex flex-col justify-end">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue Trend</span>
              <div className="flex items-center gap-1 sika-recessed-sm p-1 self-start sm:self-auto">
                {(['today', '7days', 'month'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDateRange(tab)}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer sika-press",
                      dateRange === tab
                        ? "sika-raised-sm text-slate-900"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {tab === 'today' ? 'Today' : tab === '7days' ? '7 Days' : 'This Month'}
                  </button>
                ))}
              </div>
            </div>

            {/* Seamless Interactive SVG Curve in Inset Well */}
            <div className="h-44 w-full relative sika-recessed-sm p-3 overflow-visible mt-2">
              {isLoading ? (
                <Skeleton variant="rectangular" className="w-full h-full rounded-xl" />
              ) : (
                <div 
                  className="w-full h-full flex flex-col justify-between relative group"
                  onMouseLeave={() => setActiveChartHover(null)}
                >
                  <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible relative z-10 transition-transform duration-500 hover:scale-[1.01]">
                    <defs>
                      <linearGradient id="emeraldRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0D5C3A" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0D5C3A" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gradient Fill */}
                    <motion.path
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, d: getGradientFill() }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      fill="url(#emeraldRevenueGrad)"
                    />

                    {/* Smooth Emerald Line Path */}
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1, d: getChartPath() }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      fill="none"
                      stroke="#0D5C3A"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      className="drop-shadow-sm"
                    />

                    {/* Active Highlight Points */}
                    {chartPoints.map((pt, i) => (
                      <g 
                        key={i} 
                        className="cursor-crosshair outline-none"
                        onMouseEnter={() => setActiveChartHover(pt)}
                      >
                        <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />
                        <motion.circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r={activeChartHover?.label === pt.label ? 6 : 4} 
                          fill={activeChartHover?.label === pt.label ? "#0D5C3A" : "#ffffff"} 
                          stroke={activeChartHover?.label === pt.label ? "#ffffff" : "#0D5C3A"}
                          strokeWidth="2.5"
                          className="transition-all duration-300 shadow-xl"
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Interactive Tooltip Component */}
                  <AnimatePresence>
                    {activeChartHover && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 bg-slate-900 text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700 pointer-events-none"
                        style={{
                          left: `calc(${(activeChartHover.x / 500) * 100}% - 40px)`,
                          top: `${(activeChartHover.y / 120) * 100 - 30}%`,
                          transform: 'translate(-50%, -100%)'
                        }}
                      >
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeChartHover.label}</p>
                        <p className="text-sm font-black tracking-tight tabular-nums">{formatGHS(activeChartHover.val)}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* X-Axis Labels */}
                  <div className="flex justify-between text-[11px] font-extrabold text-slate-400 pt-1 px-1 relative z-10 pointer-events-none">
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
      {/* 2. SECONDARY METRICS BAR (KOMBAI SOFT RAISED SURFACE) */}
      {/* ---------------------------------------------------- */}
      <motion.div 
        variants={staggerItem} 
        className="sika-raised rounded-[22px] p-5 sm:p-7 space-y-6"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50/60 border border-slate-100 flex flex-col justify-center h-[100px]">
                <Skeleton variant="text" width={110} height={14} className="mb-2" />
                <Skeleton variant="text" width={80} height={32} />
              </div>
            ))
          ) : (
            <>
              {/* Total Transactions */}
              <motion.div whileHover={{ y: -4 }} className="space-y-1.5 p-3 sm:p-4 rounded-xl bg-slate-50/60 border border-slate-100 shadow-sm transition-all cursor-default">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Completed Sales</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-900 tabular-nums">{transactionCount}</h3>
                  <span className="text-xs text-slate-500 font-semibold">orders</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold">100% processed live</p>
              </motion.div>

              {/* Average Order Value */}
              <motion.div whileHover={{ y: -4 }} className="space-y-1.5 p-3 sm:p-4 rounded-xl bg-slate-50/60 border border-slate-100 shadow-sm transition-all cursor-default">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Avg Order Value</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-900 tabular-nums">{formatGHS(avgOrderValue)}</h3>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">per transaction</p>
              </motion.div>

              {/* MoMo Revenue */}
              <motion.div whileHover={{ y: -4 }} className="space-y-1.5 p-3 sm:p-4 rounded-xl bg-slate-50/60 border border-slate-100 shadow-sm transition-all cursor-default">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Mobile Money</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-[#0D5C3A] tabular-nums">{formatGHS(momoTotal)}</h3>
                </div>
                <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-amber-500" /> MTN & Telecel
                </p>
              </motion.div>

              {/* Stock Health */}
              <motion.div whileHover={{ y: -4 }} className="space-y-1.5 p-3 sm:p-4 rounded-xl bg-slate-50/60 border border-slate-100 shadow-sm transition-all cursor-pointer" onClick={() => navigate('/dashboard/inventory')}>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Active Inventory</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-900 tabular-nums">{allProducts.length}</h3>
                  <span className="text-xs text-slate-500 font-semibold">products</span>
                </div>
                {lowStockItems.length > 0 ? (
                  <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 animate-pulse" /> {lowStockItems.length} items low stock
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Stock healthy
                  </p>
                )}
              </motion.div>
            </>
          )}
        </div>

        {/* Tactile Channel Reconciliation Split Bar (Kombai Telemetry Inspired) */}
        <div className="pt-4 border-t border-slate-100/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px]">Channel Split:</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFCC00]" />
              <span className="font-bold text-slate-800">MoMo: {formatGHS(momoTotal)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
              <span className="font-bold text-slate-800">Cash: {formatGHS(Math.max(0, totalRevenue - momoTotal))}</span>
            </div>
          </div>

          <div className="w-full sm:w-56 h-3.5 sika-recessed-sm overflow-hidden flex p-0.5">
            <div
              style={{ width: `${totalRevenue > 0 ? Math.min(100, (momoTotal / totalRevenue) * 100) : 50}%` }}
              className="h-full bg-[#FFCC00] rounded-l-md transition-all duration-500"
              title="Mobile Money Portion"
            />
            <div
              style={{ width: `${totalRevenue > 0 ? Math.max(0, 100 - (momoTotal / totalRevenue) * 100) : 50}%` }}
              className="h-full bg-[#15803D] rounded-r-md transition-all duration-500"
              title="Cash Till Portion"
            />
          </div>
        </div>
      </motion.div>

      {/* ---------------------------------------------------- */}
      {/* 3. REALTIME OPERATIONS SURFACE (2-COLUMN SPATIAL)   */}
      {/* ---------------------------------------------------- */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Sales & Receipt Stream */}
        <div className="lg:col-span-7 sika-raised rounded-[22px] p-6 sm:p-8 space-y-6 relative overflow-hidden group">
          {/* Animated Border Beam */}
          <div className="absolute inset-0 pointer-events-none rounded-[22px] overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0">
            <motion.div 
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Sales Stream</h3>
                <p className="text-xs text-slate-500 font-medium">Realtime transactions stored in SQLite database</p>
              </div>
              <button 
                onClick={() => navigate('/dashboard/transactions')}
                className="text-xs font-extrabold text-[#0D5C3A] hover:underline flex items-center gap-1 cursor-pointer sika-press"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 sika-recessed-sm">
                  <Skeleton variant="text" width={140} height={20} />
                  <Skeleton variant="text" width={80} height={20} />
                </div>
              ))
            ) : recentSales.length === 0 ? (
              /* Contextual Empty State */
              <div className="text-center py-10 px-6 sika-recessed-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center mx-auto border border-emerald-200/60 shadow-2xs">
                  <ScrollText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">Your first sale is waiting</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Start a transaction from the POS register to see live activity, payment channel breakdowns, and statutory receipts.
                </p>
                <Button 
                  onClick={() => navigate('/pos')}
                  size="sm"
                  className="bg-[#0D5C3A] hover:bg-[#09432A] text-white font-bold rounded-xl px-4 mt-2 sika-press"
                >
                  Open POS Register
                </Button>
              </div>
            ) : (
              recentSales.map((sale, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.015, backgroundColor: 'rgba(248, 250, 252, 1)' }}
                  key={sale.id}
                  onClick={() => navigate('/dashboard/transactions')}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-transparent hover:border-slate-200/60 sika-raised-sm sika-press group cursor-pointer transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.02)] bg-white"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-[#0D5C3A] flex items-center justify-center font-extrabold text-xs shrink-0 group-hover:bg-[#0D5C3A] group-hover:text-white transition-all shadow-sm">
                      <ScrollText className="w-5 h-5" />
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
                    <p className="text-sm font-black text-slate-900 tabular-nums">
                      {formatGHS(sale.grand_total)}
                    </p>
                    <span className="inline-block text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 tracking-wider mt-0.5 group-hover:bg-slate-200 transition-colors">
                      {sale.payment_method}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Inventory Restock & Stock Health Alert */}
        <div className="lg:col-span-5 sika-raised rounded-[22px] p-6 sm:p-8 space-y-6 flex flex-col justify-between relative overflow-hidden group">
          {/* Ambient Inner Glow matching Moondoog Glass UI */}
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-colors duration-700" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Low Stock Alerts</h3>
                <p className="text-xs text-slate-500 font-medium">Items requiring quick replenishment</p>
              </div>
              <button 
                onClick={() => navigate('/dashboard/inventory')}
                className="text-xs font-extrabold text-[#0D5C3A] hover:underline cursor-pointer sika-press"
              >
                Catalog
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 text-center space-y-2 my-4">
                <CheckCircle2 className="w-8 h-8 text-[#0D5C3A] mx-auto" />
                <p className="text-sm font-extrabold text-slate-900">All Items Well Stocked</p>
                <p className="text-xs text-slate-500">No items are currently below the safety threshold of 20 units.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="p-3 sika-recessed-sm flex items-center justify-between">
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

          {/* Contextual Inventory Restock Callout with Tactile Button */}
          <div className="pt-4 border-t border-slate-100">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Stock Control</p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">Manage SKUs, barcodes and suppliers.</p>
              </div>
              <Button
                onClick={() => navigate('/dashboard/inventory')}
                size="sm"
                className="bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs px-3.5 h-9 rounded-xl sika-press"
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
