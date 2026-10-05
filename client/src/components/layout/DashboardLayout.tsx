import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  Menu,
  Bell,
  Search,
  Store,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: Store, label: 'Point of Sale', path: '/cashier-login' },
  { icon: Package, label: 'Inventory', path: '/dashboard/inventory' },
  { icon: CreditCard, label: 'Transactions', path: '/dashboard/transactions' },
  { icon: BarChart3, label: 'Reports', path: '/dashboard/reports' },
  { icon: Users, label: 'Team', path: '/dashboard/team' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

export const DashboardLayout: React.FC = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Background Decorators */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-200/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-sky-200/20 blur-[100px]" />
      </div>

      {/* Sidebar Navigation */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarCollapsed ? '80px' : '260px',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative z-20 h-screen flex flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      >
        {/* Brand / Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D5C3A] to-[#09432A] text-white flex items-center justify-center shadow-inner shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <AnimatePresence>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10, transition: { duration: 0.1 } }}
                className="ml-3 min-w-0"
              >
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight truncate">
                  SikaPOS
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-[#0D5C3A] font-bold truncate">
                  Osu Branch
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex items-center px-3 py-2.5 rounded-xl transition-all group overflow-hidden',
                  isActive
                    ? 'text-[#0D5C3A] font-bold'
                    : 'text-slate-500 font-medium hover:bg-slate-100 hover:text-slate-900'
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-[#0D5C3A]/10 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-[#0D5C3A]" : "text-slate-400 group-hover:text-slate-600")} />
                
                <AnimatePresence>
                  {!isSidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="ml-3 truncate text-[14px]"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </div>

        {/* User & Settings Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200/60">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              KM
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">K. Mensah</p>
                <p className="text-[11px] text-slate-500 truncate font-medium">Owner / Admin</p>
              </div>
            )}
            {!isSidebarCollapsed && (
              <LogOut className="w-4 h-4 text-slate-400 hover:text-red-500 transition-colors ml-auto shrink-0" />
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all z-30"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/60 backdrop-blur-md border-b border-slate-200/60 px-6 sm:px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight hidden sm:block">
              Welcome back, Kwabena
            </h2>
            <div className="flex items-center gap-2 sm:hidden">
              <Badge variant="online" pulse>Online</Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Global Search */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transactions, items..."
                className="h-10 pl-9 pr-4 rounded-full bg-slate-100/80 border border-slate-200/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]/50 transition-all w-64 placeholder:text-slate-400"
              />
            </div>
            
            <button className="relative p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white rounded-full border border-slate-200/60 shadow-sm hover:shadow-md">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
            
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-6">
              <Badge variant="online" pulse className="px-3 py-1 bg-white border border-emerald-200 shadow-sm">
                Cloud Synced
              </Badge>
            </div>
          </div>
        </header>

        {/* Page Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
