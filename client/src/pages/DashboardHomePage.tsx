import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  TrendingUp, 
  ArrowRight, 
  Wallet, 
  PackageSearch, 
  Users, 
  CreditCard 
} from 'lucide-react';

export const DashboardHomePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate network loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const kpis = [
    { title: 'Gross Sales', value: 'GH₵ 12,450.00', trend: '+14.2% vs yesterday', isPositive: true, icon: Wallet },
    { title: 'Total Orders', value: '143', trend: '+5.4% vs yesterday', isPositive: true, icon: CreditCard },
    { title: 'Active Inventory', value: '1,492', trend: '12 low stock items', isPositive: false, icon: PackageSearch },
    { title: 'Customers', value: '89', trend: '+12 new today', isPositive: true, icon: Users },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      {/* Header Actions */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Your store's performance at a glance today.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none h-11 bg-white">
            Export Report
          </Button>
          <Button className="flex-1 sm:flex-none h-11 shadow-md shadow-[#0D5C3A]/20" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Open POS Register
          </Button>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} glass className="p-5 relative overflow-hidden shadow-sm border-white/60 bg-white/70">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton variant="text" width={100} height={16} />
                  <Skeleton variant="circular" width={32} height={32} />
                </div>
                <div>
                  <Skeleton variant="text" width={140} height={32} className="mb-2" />
                  <Skeleton variant="text" width={120} height={20} />
                </div>
              </Card>
            ))
          : kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <Card key={idx} glass className="p-5 relative overflow-hidden group shadow-lg border-white/60 bg-white/70 hover:bg-white hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{kpi.title}</p>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-[#0D5C3A] transition-colors border border-slate-200/60">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-extrabold text-slate-900 tabular-nums tracking-tight">{kpi.value}</h3>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge 
                        variant={kpi.isPositive ? 'online' : 'amber'} 
                        className="font-bold border-none"
                      >
                        {kpi.isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
                        {kpi.trend}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Decorative gradient blob */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-[#0D5C3A]/0 to-[#0D5C3A]/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
                </Card>
              );
            })}
      </motion.div>

      {/* Charts / Tables Placeholder Area */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card glass className="lg:col-span-2 p-6 sm:p-8 min-h-[400px] flex flex-col shadow-lg border-white/60 bg-white/70">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Revenue Trend</h3>
            <select className="text-sm font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/20">
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            {isLoading ? (
              <div className="w-full h-full flex items-end justify-between p-8 gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" className="w-full flex-1 rounded-t-lg rounded-b-none" height={`${20 + Math.random() * 60}%`} />
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">[Area Chart Visualization]</p>
            )}
          </div>
        </Card>

        <Card glass className="p-6 sm:p-8 min-h-[400px] flex flex-col shadow-lg border-white/60 bg-white/70">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Recent Sales</h3>
            <button className="text-sm font-bold text-[#0D5C3A] hover:underline">View All</button>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <Skeleton variant="circular" width={36} height={36} />
                      <div className="space-y-2">
                        <Skeleton variant="text" width={100} height={14} />
                        <Skeleton variant="text" width={80} height={10} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Skeleton variant="text" width={60} height={14} />
                      <Skeleton variant="text" width={40} height={10} />
                    </div>
                  </div>
                ))
              : /* Mock Sales List */
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-[#0D5C3A] group-hover:text-white transition-colors">
                        #0{i}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Walk-in Customer</p>
                        <p className="text-[11px] text-slate-500 font-medium">12:4{i} PM • Till 1</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums text-slate-900">GH₵ {(i * 45).toFixed(2)}</p>
                      <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest mt-0.5">Paid</p>
                    </div>
                  </div>
                ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
