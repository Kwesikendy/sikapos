import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Menu, 
  Wifi,
  MoreVertical,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, formatGHS } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { staggerContainer, staggerItem } from '../lib/motion';
import { Drawer } from '../components/ui/Drawer';
import { Skeleton } from '../components/ui/Skeleton';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  color: string;
}

const mockProducts: Product[] = [
  { id: '1', name: 'Alvaro Pineapple 330ml', price: 8.50, stock: 45, category: 'Beverages', color: 'bg-amber-500' },
  { id: '2', name: 'Club Premium Lager 625ml', price: 15.00, stock: 120, category: 'Beverages', color: 'bg-green-600' },
  { id: '3', name: 'Pepsodent Cavity Fighter 175g', price: 12.00, stock: 32, category: 'Toiletries', color: 'bg-red-500' },
  { id: '4', name: 'Gino Tomato Paste 70g', price: 3.50, stock: 250, category: 'Groceries', color: 'bg-rose-600' },
  { id: '5', name: 'Frytol Cooking Oil 1L', price: 45.00, stock: 15, category: 'Groceries', color: 'bg-yellow-500' },
  { id: '6', name: 'Geisha Mackerel in Tomato Sauce', price: 18.00, stock: 60, category: 'Groceries', color: 'bg-orange-500' },
  { id: '7', name: 'Voltic Natural Mineral Water 500ml', price: 2.50, stock: 300, category: 'Beverages', color: 'bg-blue-500' },
  { id: '8', name: 'Ideal Milk 215g', price: 9.50, stock: 85, category: 'Groceries', color: 'bg-sky-600' },
];

export const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching products
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const CartContent = () => (
    <div className="flex flex-col h-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.03)] border-l border-slate-200/60 z-10 relative">
      {/* Cart Header */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Current Sale</h2>
        </div>
        <Badge variant="primary" className="bg-[#0D5C3A]/10 text-[#0D5C3A] font-bold border-none px-2.5">
          {cart.reduce((acc, item) => acc + item.quantity, 0)} items
        </Badge>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
        <AnimatePresence initial={false}>
          {cart.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-dashed border-slate-300">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium">Cart is empty</p>
            </motion.div>
          ) : (
            cart.map(item => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-xs flex flex-col gap-3 group hover:border-[#0D5C3A]/30 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-900 leading-tight pr-2">{item.product.name}</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">GH₵ {item.product.price.toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-extrabold tabular-nums text-slate-900 shrink-0">
                    GH₵ {(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-slate-500 hover:text-slate-900 active:scale-95 transition-all">
                      {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                    </button>
                    <span className="w-8 text-center font-bold text-[13px] tabular-nums">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-slate-500 hover:text-[#0D5C3A] active:scale-95 transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Cart Totals & Checkout */}
      <div className="bg-white border-t border-slate-200/60 p-5 shrink-0 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-[13px] text-slate-500 font-medium">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatGHS(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[13px] text-slate-500 font-medium pb-3 border-b border-slate-100">
            <span>Tax (15%)</span>
            <span className="tabular-nums">{formatGHS(tax)}</span>
          </div>
          <div className="flex justify-between items-end pt-1">
            <span className="text-sm font-bold text-slate-900">Total Due</span>
            <span className="text-2xl font-extrabold text-[#0D5C3A] tabular-nums tracking-tight">{formatGHS(total)}</span>
          </div>
        </div>
        
        <Button 
          size="lg" 
          className="w-full h-14 text-base font-extrabold shadow-lg shadow-[#0D5C3A]/25"
          rightIcon={<ArrowRight className="w-5 h-5" />}
          disabled={cart.length === 0}
        >
          {cart.length === 0 ? 'Select Items to Charge' : `Charge ${formatGHS(total)}`}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Background Decorators */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-200/20 blur-[120px]" />
      </div>

      {/* Main POS Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 h-full relative">
        {/* POS Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors mr-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D5C3A] to-[#09432A] text-white flex items-center justify-center shadow-inner shrink-0 hidden sm:flex">
              <span className="text-xs font-bold">KM</span>
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold text-slate-900 leading-tight">Till #01</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#0D5C3A] font-bold">Kwabena M.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full max-w-md mx-4 hidden md:block">
            <div className="relative group w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#0D5C3A] transition-colors" />
              <input
                type="text"
                placeholder="Search products, barcode (F2)..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100/80 border border-slate-200/60 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]/50 transition-all placeholder:text-slate-400 shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="online" pulse className="px-2.5 py-1 bg-white border border-emerald-200 shadow-sm hidden sm:inline-flex">
              Synced
            </Badge>
            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white rounded-full border border-slate-200/60 shadow-sm md:hidden">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white rounded-full border border-slate-200/60 shadow-sm">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Categories / Tabs */}
        <div className="px-4 sm:px-6 py-4 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-slate-200/40 bg-white/40 backdrop-blur-sm shrink-0 z-10">
          {['All Items', 'Beverages', 'Groceries', 'Toiletries', 'Snacks', 'Alcoholic'].map((cat, i) => (
            <button
              key={cat}
              className={cn(
                "px-4 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all shadow-sm border",
                i === 0 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "bg-white text-slate-600 border-slate-200/60 hover:border-slate-300 hover:text-slate-900"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6">
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
          >
            {isLoading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="flex flex-col bg-white/70 border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm min-h-[140px]">
                  <Skeleton variant="rectangular" className="h-1.5 w-full rounded-none" />
                  <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
                    <Skeleton variant="rectangular" width={24} height={16} className="rounded-md" />
                    <Skeleton variant="text" width="80%" height={14} className="mt-2" />
                    <Skeleton variant="text" width="60%" height={14} />
                    <Skeleton variant="text" width={60} height={20} className="mt-auto" />
                  </div>
                </div>
              ))
            ) : (
              mockProducts.map((product) => (
                <motion.button
                  key={product.id}
                  variants={staggerItem}
                  onClick={() => addToCart(product)}
                  className="group relative flex flex-col bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-2xl overflow-hidden text-left hover:border-[#0D5C3A]/50 hover:shadow-lg transition-all active:scale-95 duration-200 shadow-sm min-h-[140px]"
                >
                  <div className={cn("h-1.5 w-full", product.color)} />
                  <div className="p-3 sm:p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {product.stock}
                      </span>
                    </div>
                    <h3 className="text-[13px] sm:text-sm font-bold text-slate-900 leading-tight mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="mt-auto">
                      <p className="text-[15px] sm:text-base font-extrabold tabular-nums text-slate-900">
                        GH₵ {product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </motion.div>
        </main>
        
        {/* Mobile Floating Cart Button */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40">
          <button 
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-between px-6 font-bold hover:bg-slate-800 transition-colors border border-slate-700"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5" />
              <span>{cart.reduce((acc, item) => acc + item.quantity, 0)} Items</span>
            </div>
            <span className="tabular-nums">GH₵ {total.toFixed(2)}</span>
          </button>
        </div>
      </div>

      {/* Persistent Cart Sidebar (Desktop) */}
      <aside className="hidden lg:block w-[380px] xl:w-[420px] shrink-0 h-full z-20">
        <CartContent />
      </aside>

      {/* Mobile Cart Drawer */}
      <Drawer
        isOpen={isMobileCartOpen}
        onClose={() => setIsMobileCartOpen(false)}
        position="right"
        size="full"
      >
        <div className="-mx-6 -mt-6 h-[calc(100vh)]">
          <CartContent />
        </div>
      </Drawer>
    </div>
  );
};
