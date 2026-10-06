import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  Bell,
  Search,
  Store,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CreditCard,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DotPattern } from '../visuals/DotPattern';
import { AmbientGlow } from '../visuals/AmbientGlow';
import { DecorativeGrid } from '../visuals/DecorativeGeometry';
import { CloudSyncStatus } from '../ui/CloudSyncStatus';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: Store, label: 'Point of Sale', path: '/pos' },
  { icon: Package, label: 'Inventory', path: '/dashboard/inventory' },
  { icon: CreditCard, label: 'Transactions', path: '/dashboard/transactions' },
  { icon: BarChart3, label: 'Reports', path: '/dashboard/reports' },
  { icon: Users, label: 'Team', path: '/dashboard/team' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

export const DashboardLayout: React.FC = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { user, tenant, primaryBranch, logout } = useAuth();

  const displayName = user?.fullName || 'Store Owner';
  const firstName = displayName.split(' ')[0] || 'Merchant';
  const storeName = tenant?.businessName || 'SikaPOS Store';
  const branchName = primaryBranch?.name || 'Main Branch';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SO';
  const roleLabel = user?.role === 'owner' ? 'Owner / Admin' : user?.role ? user.role.toUpperCase() : 'Owner / Admin';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 relative">
      {/* Visual Depth Background: Haynes-Inspired Layering */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <DotPattern variant="emerald" size="md" fadeMask="radial" opacity={0.65} />
        <AmbientGlow color="emerald" position="top-left" className="opacity-30" />
        <DecorativeGrid opacity={0.15} />
      </div>

      {/* Sidebar Navigation - Spatial Floating Panel */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarCollapsed ? '80px' : '260px',
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative z-30 h-screen flex flex-col bg-white/75 backdrop-blur-2xl border-r border-slate-200/50 shadow-[4px_0_30px_rgba(0,0,0,0.02)]"
      >
        {/* Brand / Store Logo Surface with Official SikaPOS Logo */}
        <div className="h-20 flex items-center px-4 sm:px-5 border-b border-slate-100/80 shrink-0">
          <NavLink to="/dashboard" className="flex items-center gap-3 shrink-0 focus:outline-none">
            <img
              src="/logo.png"
              alt="SikaPOS"
              className="h-10 w-auto object-contain rounded-xl drop-shadow-xs transition-transform hover:scale-105"
            />
          </NavLink>
          <AnimatePresence>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8, transition: { duration: 0.1 } }}
                className="ml-2.5 min-w-0"
              >
                <h1 className="text-[13px] font-extrabold text-slate-900 tracking-tight truncate leading-tight">
                  {storeName}
                </h1>
                <p className="text-[9px] uppercase tracking-widest text-[#0D5C3A] font-extrabold truncate">
                  {branchName}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-6 px-3.5 space-y-1 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex items-center px-3.5 py-3 rounded-xl transition-all group overflow-hidden',
                  isActive
                    ? 'text-[#0D5C3A] font-bold'
                    : 'text-slate-500 font-medium hover:bg-slate-100/70 hover:text-slate-900'
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
                      className="ml-3 truncate text-[14px] font-semibold"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </div>

        {/* User Account Footer */}
        <div className="p-4 border-t border-slate-100/80">
          <div
            onClick={() => logout('/login')}
            className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-100/80 transition-all cursor-pointer border border-transparent hover:border-slate-200/60 group"
            title="Click to log out"
          >
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm group-hover:bg-[#0D5C3A] transition-colors">
              {initials}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate leading-tight">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate font-semibold mt-0.5">{roleLabel}</p>
              </div>
            )}
            {!isSidebarCollapsed && (
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors ml-auto shrink-0" />
            )}
          </div>
        </div>

        {/* Collapse Sidebar Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all z-40 cursor-pointer"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </motion.aside>

      {/* Main Workspace Surface */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative h-screen overflow-hidden">
        {/* Floating Top Header with Kombai Soft Tactile Styling */}
        <header className="h-20 bg-white/75 backdrop-blur-xl border-b border-slate-200/60 px-6 sm:px-10 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0D5C3A] animate-pulse" />
                  Live Accra Ledger
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight hidden sm:block">
                Good day, {firstName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Soft Sunken Recessed Search Input */}
            <div className="relative hidden md:block group">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#0D5C3A] transition-colors" />
              <input
                type="text"
                placeholder="Search transactions, inventory..."
                className="h-10 pl-10 pr-4 sika-recessed-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]/50 transition-all w-64 placeholder:text-slate-400 text-slate-800"
              />
            </div>
            
            {/* Notification Control with Soft Tactile Press */}
            <button className="relative p-2.5 text-slate-500 hover:text-slate-900 sika-raised-sm sika-press cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border border-white" />
            </button>
            
            {/* Reusable Cloud Sync Status Component */}
            <CloudSyncStatus state="online" />
          </div>
        </header>

        {/* Content Workspace Surface */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
