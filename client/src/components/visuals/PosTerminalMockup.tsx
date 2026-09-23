import React, { useState } from 'react';
import { formatGHS, cn } from '../../lib/utils';
import { ShoppingCart, Plus, Minus, CreditCard, Banknote, CheckCircle, Wifi, Store } from 'lucide-react';

interface MockProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

const INITIAL_PRODUCTS: MockProduct[] = [
  { id: '1', name: 'Milo Choc Malt 400g', category: 'Beverages', price: 48.0, stock: 24 },
  { id: '2', name: 'Ideal Evaporated Milk 160g', category: 'Dairy', price: 12.5, stock: 48 },
  { id: '3', name: 'Voltic Spring Water 1.5L', category: 'Water', price: 6.5, stock: 120 },
  { id: '4', name: 'Geisha Soap Aloe Vera 175g', category: 'Personal Care', price: 8.0, stock: 35 },
  { id: '5', name: 'Frytol Pure Veg Oil 1L', category: 'Cooking', price: 42.0, stock: 16 },
  { id: '6', name: 'Golden Drop Sunflower 1L', category: 'Cooking', price: 45.0, stock: 10 },
];

export const PosTerminalMockup: React.FC<{ className?: string }> = ({ className }) => {
  const [cart, setCart] = useState<{ [id: string]: number }>({
    '1': 1,
    '2': 2,
    '3': 2,
  });
  const [selectedPayment, setSelectedPayment] = useState<'momo' | 'cash' | 'telecel'>('momo');
  const [isCompleted, setIsCompleted] = useState(false);

  const addToCart = (productId: string) => {
    setIsCompleted(false);
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const removeFromCart = (productId: string) => {
    setIsCompleted(false);
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[productId] > 1) {
        updated[productId] -= 1;
      } else {
        delete updated[productId];
      }
      return updated;
    });
  };

  const items = Object.entries(cart)
    .map(([id, qty]) => {
      const prod = INITIAL_PRODUCTS.find((p) => p.id === id);
      return prod ? { ...prod, qty } : null;
    })
    .filter(Boolean) as (MockProduct & { qty: number })[];

  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const vat = subtotal * 0.15;
  const levies = subtotal * 0.05; // 2.5% NHIL + 2.5% GETFund
  const grandTotal = subtotal + vat + levies;

  const handleCharge = () => {
    if (items.length === 0) return;
    setIsCompleted(true);
    setTimeout(() => {
      setIsCompleted(false);
      setCart({ '1': 1, '2': 2 });
    }, 2800);
  };

  return (
    <div
      className={cn(
        'w-full rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Terminal Title Bar */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <Store className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200">Osu Oxford St. Branch</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Till #01</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cloud Synced</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1 text-slate-400">
            <Wifi className="w-3 h-3 text-slate-400" />
            <span>4G Online</span>
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-[360px]">
        {/* Left: Product Quick-Add Grid (7 cols) */}
        <div className="md:col-span-7 p-4 bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-400">Quick Catalog</span>
              <span className="text-slate-500">Tap to add to cart</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {INITIAL_PRODUCTS.map((prod) => {
                const countInCart = cart[prod.id] || 0;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => addToCart(prod.id)}
                    className={cn(
                      'p-2.5 rounded-xl border text-left transition-all active-depress flex flex-col justify-between h-20 select-none cursor-pointer',
                      countInCart > 0
                        ? 'bg-emerald-950/40 border-emerald-700/60 ring-1 ring-emerald-600'
                        : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800'
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {prod.name}
                      </span>
                      {countInCart > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#0D5C3A] text-white text-[10px] font-bold shrink-0">
                          {countInCart}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="font-mono font-bold text-emerald-400 tabular-nums">
                        {formatGHS(prod.price)}
                      </span>
                      <span className="text-[10px] text-slate-400">{prod.stock} in stock</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Fast barcode scanning enabled</span>
            <span className="text-emerald-400 font-medium">ESC/POS Thermal Ready</span>
          </div>
        </div>

        {/* Right: Active Cart & Tender Ticket (5 cols) */}
        <div className="md:col-span-5 p-4 bg-slate-950 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ticket #1042</span>
              </div>
              <span className="font-mono text-slate-400">{items.length} items</span>
            </div>

            {/* Cart Items List */}
            <div className="py-2.5 space-y-2 max-h-[140px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Cart is empty</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-0.5">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-slate-200 truncate font-medium">{item.name}</p>
                      <p className="text-slate-500 font-mono text-[11px]">
                        {item.qty} × {formatGHS(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center font-mono text-xs">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => addToCart(item.id)}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Settlement Section */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="space-y-1 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatGHS(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>GRA Tax (15% VAT + 5% Levies)</span>
                <span className="font-mono tabular-nums">{formatGHS(vat + levies)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-100 pt-1 border-t border-slate-800/80">
                <span>Total Due</span>
                <span className="font-mono text-sm text-emerald-400 tabular-nums">
                  {formatGHS(grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment Rail Selectors */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedPayment('momo')}
                className={cn(
                  'py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border cursor-pointer select-none',
                  selectedPayment === 'momo'
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                )}
              >
                MTN MoMo
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayment('telecel')}
                className={cn(
                  'py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border cursor-pointer select-none',
                  selectedPayment === 'telecel'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                )}
              >
                Telecel
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayment('cash')}
                className={cn(
                  'py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border cursor-pointer select-none',
                  selectedPayment === 'cash'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                )}
              >
                Cash
              </button>
            </div>

            {/* Complete Sale Action */}
            <button
              type="button"
              disabled={items.length === 0 || isCompleted}
              onClick={handleCharge}
              className={cn(
                'w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-all active-depress flex items-center justify-center gap-2 shadow-md cursor-pointer select-none',
                isCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0D5C3A] hover:bg-[#09432A] text-white disabled:opacity-50'
              )}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  <span>Settled via {selectedPayment === 'momo' ? 'MTN MoMo' : selectedPayment === 'telecel' ? 'Telecel Cash' : 'Cash'}</span>
                </>
              ) : (
                <span>Charge {formatGHS(grandTotal)}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
