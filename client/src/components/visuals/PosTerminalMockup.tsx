import React, { useState } from 'react';
import { formatGHS, cn } from '../../lib/utils';
import { ShoppingCart, CheckCircle, Wifi, Store, TrendingUp, Smartphone, ArrowUpRight, Zap } from 'lucide-react';

export const PosTerminalMockup: React.FC<{ className?: string }> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'till'>('dashboard');
  const [momoSettled, setMomoSettled] = useState(false);

  const triggerMomoDemo = () => {
    setMomoSettled(true);
    setTimeout(() => setMomoSettled(false), 3000);
  };

  return (
    <div className={cn('relative w-full select-none', className)}>
      {/* Soft mint organic curve background glow inspired by the reference design */}
      <div className="absolute -top-10 -right-10 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-72 h-72 bg-teal-50/70 rounded-full blur-2xl -z-10 pointer-events-none" />

      {/* Main Hardware Composition Container */}
      <div className="relative bg-gradient-to-b from-slate-50 to-slate-100/80 rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
        
        {/* Top Floating Controls */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-[#00A859]" />
            <span className="ml-2 text-xs font-semibold text-slate-500 hidden sm:inline">
              SikaPOS Akoma Terminal OS
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'dashboard'
                  ? 'bg-[#00A859] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Sales Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('till')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'till'
                  ? 'bg-[#00A859] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Countertop Till
            </button>
          </div>
        </div>

        {/* The Realistic Hardware Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          
          {/* Main Desktop POS Screen (8 cols) */}
          <div className="lg:col-span-8 flex flex-col items-center">
            {/* Display Monitor Bezel */}
            <div className="w-full bg-slate-900 rounded-2xl p-2.5 shadow-2xl border-4 border-slate-800">
              
              {/* Screen Display Content */}
              <div className="bg-white rounded-xl overflow-hidden min-h-[340px] flex flex-col">
                
                {/* Dashboard Screen Header */}
                <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#00A859]" />
                    <span className="font-semibold text-slate-100">Osu Oxford St. Store</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">Till #01</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[#00A859] font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#00A859] animate-pulse" />
                      Live MoMo Synced
                    </span>
                  </div>
                </div>

                {/* Dashboard Metrics / Till Switch */}
                {activeTab === 'dashboard' ? (
                  <div className="p-4 space-y-4">
                    {/* Top Stat Cards */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#0D5C3A]">
                          Today's Revenue
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">
                            {formatGHS(4280.5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-[#00A859] font-semibold mt-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>+18.4% today</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          Transactions
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">
                            84 Orders
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Avg: GH₵ 50.95
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">
                          MoMo Rails
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">
                            94% Digital
                          </span>
                        </div>
                        <span className="text-[11px] text-amber-700 font-medium mt-1 block">
                          Instant Payout
                        </span>
                      </div>
                    </div>

                    {/* Live Checkout Stream */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">Recent Checkout Feeds</span>
                        <span className="text-[10px] text-slate-400 font-mono">Real-time GRA Sync</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-[10px]">
                              MTN
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">Milo 400g, Voltic 1.5L x2</p>
                              <span className="text-[10px] text-slate-400 font-mono">Receipt #1042 • 14:28</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900">{formatGHS(61.0)}</span>
                            <span className="block text-[10px] font-semibold text-[#00A859]">Paid MoMo</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-[10px]">
                              TEL
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">Ideal Milk x4, Sugar 1kg</p>
                              <span className="text-[10px] text-slate-400 font-mono">Receipt #1041 • 14:25</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900">{formatGHS(75.5)}</span>
                            <span className="block text-[10px] font-semibold text-[#00A859]">Paid Telecel</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Interactive Till View */
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                      <span className="font-bold text-slate-700">Quick Till Items</span>
                      <span className="font-mono text-emerald-700 font-bold">Total: {formatGHS(88.0)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Frytol Oil 1L</p>
                          <span className="text-[11px] text-[#00A859] font-mono font-bold">{formatGHS(42.0)}</span>
                        </div>
                        <span className="w-5 h-5 rounded-full bg-[#00A859] text-white flex items-center justify-center text-xs font-bold">
                          1
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Golden Drop 1L</p>
                          <span className="text-[11px] text-[#00A859] font-mono font-bold">{formatGHS(46.0)}</span>
                        </div>
                        <span className="w-5 h-5 rounded-full bg-[#00A859] text-white flex items-center justify-center text-xs font-bold">
                          1
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={triggerMomoDemo}
                      className={cn(
                        'w-full py-3 px-4 rounded-xl font-bold text-xs transition-all active-depress flex items-center justify-center gap-2 cursor-pointer shadow-sm',
                        momoSettled
                          ? 'bg-[#00A859] text-white'
                          : 'bg-[#00A859] hover:bg-[#00924C] text-white'
                      )}
                    >
                      {momoSettled ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-200" />
                          <span>Paid GH₵ 88.00 via MTN MoMo</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Tap for Instant MoMo Checkout</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Monitor Metallic Stand Base */}
            <div className="w-20 h-6 bg-slate-400 rounded-b-lg shadow-md -mt-1 flex justify-center">
              <div className="w-12 h-full bg-slate-500 rounded-b-sm" />
            </div>
            <div className="w-36 h-2.5 bg-slate-300 rounded-full shadow-sm -mt-0.5" />
          </div>

          {/* Compact Countertop Till Terminal & Desktop Succulent Plant (4 cols) */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4 items-center justify-end">
            
            {/* Countertop POS Till Device with Thermal Receipt */}
            <div className="w-full max-w-[240px] bg-white rounded-2xl p-3 border border-slate-200 shadow-xl relative">
              <div className="h-2 w-16 bg-slate-300 rounded-full mx-auto mb-2" />
              
              {/* Thermal Receipt Paper Roll coming out */}
              <div className="bg-amber-50/80 border-t-2 border-b-2 border-dashed border-amber-300/80 p-2.5 rounded-sm font-mono text-[9px] text-slate-700 leading-tight space-y-1 shadow-2xs">
                <div className="text-center font-bold pb-1 border-b border-dashed border-amber-300">
                  SIKAPOS RECEIPT
                </div>
                <div className="flex justify-between">
                  <span>Milo Malt 400g</span>
                  <span>48.00</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT 15% + Levies</span>
                  <span>10.50</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-dashed border-amber-300 text-slate-900">
                  <span>TOTAL PAID</span>
                  <span className="text-[#00A859]">GH₵ 58.50</span>
                </div>
                <div className="text-center text-[8px] text-slate-500 pt-1">
                  MTN MOMO APPROVED
                </div>
              </div>

              {/* NFC Contactless Reader Icon */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <Smartphone className="w-3.5 h-3.5 text-[#00A859]" />
                  <span>Tap MoMo / Card</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#00A859]" />
              </div>
            </div>

            {/* Desktop Minimalist Potted Plant (as in reference image!) */}
            <div className="flex flex-col items-center select-none pt-2">
              {/* Green Leaves */}
              <div className="flex items-end justify-center -space-x-1">
                <div className="w-3.5 h-6 bg-emerald-600 rounded-full transform -rotate-25 shadow-xs" />
                <div className="w-4 h-8 bg-emerald-500 rounded-full shadow-xs" />
                <div className="w-3.5 h-6 bg-emerald-700 rounded-full transform rotate-25 shadow-xs" />
              </div>
              {/* Ceramic Terracotta Pot */}
              <div className="w-10 h-7 bg-amber-700 rounded-b-xl border-t-2 border-amber-900 shadow-sm flex items-center justify-center">
                <span className="text-[8px] font-bold text-amber-200">Sika</span>
              </div>
              {/* Plant Shadow */}
              <div className="w-12 h-1.5 bg-slate-300/60 rounded-full blur-[1px] mt-0.5" />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
