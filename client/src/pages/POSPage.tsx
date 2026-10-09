import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Wifi, 
  MoreVertical, 
  Minus, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ShoppingBag, 
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Smartphone,
  CreditCard,
  Printer,
  Sparkles,
  PackageSearch,
  AlertCircle,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, formatGHS } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { staggerContainer, staggerItem } from '../lib/motion';
import { Drawer } from '../components/ui/Drawer';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { posApi, ProductItem, SaleReceipt } from '../api/pos.api';
import { useAuth } from '../context/AuthContext';

interface CartItem {
  product: ProductItem;
  quantity: number;
}

export const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tenant, primaryBranch } = useAuth();
  
  // Real database states
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Items']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Checkout modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mtn_momo' | 'telecel_cash' | 'card'>('cash');
  const [amountTenderedInput, setAmountTenderedInput] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Receipt Modal State
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch real products from backend database
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await posApi.getProducts(searchQuery, selectedCategory === 'All Items' ? undefined : selectedCategory);
      setProducts(res.products || []);
      
      // Extract categories dynamically from returned products
      const uniqueCats = Array.from(
        new Set(
          (res.products || [])
            .map(p => p.category_name || 'General')
            .filter(Boolean)
        )
      );
      setCategories(['All Items', ...uniqueCats]);
    } catch (err) {
      console.error('Failed to load products from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard shortcut (F2 focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Seed sample products into SQLite if database is empty
  const handleSeedCatalog = async () => {
    setIsSeeding(true);
    const demoItems = [
      { name: 'Alvaro Pineapple 330ml', barcode: '893001001', sellingPrice: 8.50, costPrice: 6.00, initialStock: 45 },
      { name: 'Club Premium Lager 625ml', barcode: '893001002', sellingPrice: 15.00, costPrice: 11.00, initialStock: 120 },
      { name: 'Pepsodent Cavity Fighter 175g', barcode: '893001003', sellingPrice: 12.00, costPrice: 8.50, initialStock: 32 },
      { name: 'Gino Tomato Paste 70g', barcode: '893001004', sellingPrice: 3.50, costPrice: 2.20, initialStock: 250 },
      { name: 'Frytol Cooking Oil 1L', barcode: '893001005', sellingPrice: 45.00, costPrice: 36.00, initialStock: 15 },
      { name: 'Geisha Mackerel in Tomato Sauce', barcode: '893001006', sellingPrice: 18.00, costPrice: 13.50, initialStock: 60 },
      { name: 'Voltic Natural Mineral Water 500ml', barcode: '893001007', sellingPrice: 2.50, costPrice: 1.50, initialStock: 300 },
      { name: 'Ideal Milk 215g', barcode: '893001008', sellingPrice: 9.50, costPrice: 7.00, initialStock: 85 },
    ];

    try {
      for (const item of demoItems) {
        await posApi.createProduct(item);
      }
      await loadProducts();
    } catch (e) {
      console.error('Failed to seed catalog:', e);
    } finally {
      setIsSeeding(false);
    }
  };

  const addToCart = (product: ProductItem) => {
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

  const subtotal = cart.reduce((acc, item) => acc + (item.product.base_price * item.quantity), 0);
  const tax = subtotal * 0.15; // Statutory 15% rate
  const total = subtotal + tax;

  const handleOpenCheckout = () => {
    setAmountTenderedInput(total.toFixed(2));
    setCheckoutError(null);
    setIsCheckoutOpen(true);
  };

  const handleCompleteSale = async () => {
    setIsProcessingSale(true);
    setCheckoutError(null);
    try {
      const payloadItems = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.base_price,
      }));

      const tenderedAmount = paymentMethod === 'cash' 
        ? parseFloat(amountTenderedInput) || total 
        : total;

      if (paymentMethod === 'cash' && tenderedAmount < total) {
        setCheckoutError(`Amount tendered (${formatGHS(tenderedAmount)}) is less than total due (${formatGHS(total)})`);
        setIsProcessingSale(false);
        return;
      }

      const res = await posApi.createSale({
        items: payloadItems,
        paymentMethod,
        amountTendered: tenderedAmount,
        customerPhone: customerPhone ? customerPhone.trim() : undefined,
      });

      setReceipt(res);
      setIsCheckoutOpen(false);
      setCart([]);
      setCustomerPhone('');
      // Refresh inventory stock counts in real time
      await loadProducts();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setCheckoutError(err?.message || 'Failed to complete transaction. Please try again.');
    } finally {
      setIsProcessingSale(false);
    }
  };

  const cashierName = user?.fullName || 'Cashier Terminal';
  const cashierInitials = cashierName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const tillName = primaryBranch?.name || tenant?.businessName || 'Till #01';

  const handlePrintReceipt = () => {
    const receiptEl = document.getElementById('printable-pos-receipt');
    if (!receiptEl) {
      window.print();
      return;
    }
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace, sans-serif;
              margin: 0;
              padding: 12px;
              color: #000;
              background: #fff;
              width: 80mm;
              box-sizing: border-box;
            }
            * { box-sizing: border-box; }
            .border-b { border-bottom: 1px dashed #777; }
            .border-t { border-top: 1px dashed #777; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .flex { display: flex; justify-content: space-between; margin: 4px 0; }
            .text-xs { font-size: 12px; }
            .text-sm { font-size: 14px; }
            .text-base { font-size: 16px; }
            .text-lg { font-size: 18px; }
            .uppercase { text-transform: uppercase; }
            .tabular-nums { font-variant-numeric: tabular-nums; }
          </style>
        </head>
        <body>
          ${receiptEl.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(printIframe);
        } catch {
          // Ignore
        }
      }, 1500);
    }, 250);
  };

  const CartContent = () => (
    <div className="flex flex-col h-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.03)] border-l border-slate-200/60 z-10 relative">
      {/* Cart Header */}
      <div className="h-16 px-4 sm:px-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setIsMobileCartOpen(false)}
            className="lg:hidden p-1.5 -ml-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl cursor-pointer"
            aria-label="Close cart drawer"
          >
            <X className="w-4 h-4" />
          </button>
          <ShoppingBag className="w-5 h-5 text-slate-400" />
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Current Sale</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="bg-[#0D5C3A]/10 text-[#0D5C3A] font-bold border-none px-2.5">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} items
          </Badge>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
        <AnimatePresence initial={false}>
          {cart.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-dashed border-slate-300">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">Cart is empty</p>
              <p className="text-xs text-slate-400 text-center max-w-[200px]">Click any product from the catalog to start a sale</p>
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
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{formatGHS(item.product.base_price)}</p>
                  </div>
                  <p className="text-sm font-extrabold tabular-nums text-slate-900 shrink-0">
                    {formatGHS(item.product.base_price * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
                    <button 
                      onClick={() => updateQuantity(item.product.id, -1)} 
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-slate-500 hover:text-slate-900 active:scale-95 transition-all"
                    >
                      {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                    </button>
                    <span className="w-8 text-center font-bold text-[13px] tabular-nums">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, 1)} 
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-slate-500 hover:text-[#0D5C3A] active:scale-95 transition-all"
                    >
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
            <span className="tabular-nums font-semibold">{formatGHS(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[13px] text-slate-500 font-medium pb-3 border-b border-slate-100">
            <span>Tax (15% statutory)</span>
            <span className="tabular-nums font-semibold">{formatGHS(tax)}</span>
          </div>
          <div className="flex justify-between items-end pt-1">
            <span className="text-sm font-bold text-slate-900">Total Due</span>
            <span className="text-2xl font-extrabold text-[#0D5C3A] tabular-nums tracking-tight">{formatGHS(total)}</span>
          </div>
        </div>
        
        <Button 
          size="lg" 
          onClick={handleOpenCheckout}
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
    <div className="h-screen bg-slate-50 flex overflow-hidden font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 bg-dot-pattern">
      {/* Background Decorators */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-200/20 blur-[120px]" />
      </div>

      {/* Main POS Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 h-full relative">
        {/* POS Header */}
        <header className="h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2 -ml-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors mr-1 cursor-pointer border border-slate-200/60"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D5C3A] to-[#09432A] text-white flex items-center justify-center shadow-inner shrink-0 font-extrabold text-xs">
              {cashierInitials}
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold text-slate-900 leading-tight">{tillName}</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#0D5C3A] font-bold">{cashierName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full max-w-md mx-4 hidden md:block">
            <div className="relative group w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#0D5C3A] transition-colors" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search product name or barcode (Press F2)..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100/80 border border-slate-200/60 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]/50 transition-all placeholder:text-slate-400 shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="online" pulse className="px-2.5 py-1 bg-white border border-emerald-200 shadow-sm hidden sm:inline-flex">
              Realtime Sync
            </Badge>
            <button 
              onClick={loadProducts}
              className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white rounded-full border border-slate-200/60 shadow-sm cursor-pointer"
              title="Refresh Products"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-[#0D5C3A]")} />
            </button>
          </div>
        </header>

        {/* Mobile Quick Search Bar (Phone Only) */}
        <div className="px-4 py-2.5 md:hidden border-b border-slate-200/50 bg-white/70 backdrop-blur-xs shrink-0 z-10">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product name or barcode..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Tabs in Tactile Well */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-slate-200/50 bg-white/60 backdrop-blur-sm shrink-0 z-10">
          <div className="flex items-center gap-1.5 sika-recessed-sm p-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer sika-press",
                  selectedCategory === cat 
                    ? "sika-raised-sm text-slate-900" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="flex flex-col bg-white/70 border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm min-h-[140px]">
                  <Skeleton variant="rectangular" className="h-1.5 w-full rounded-none" />
                  <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
                    <Skeleton variant="rectangular" width={24} height={16} className="rounded-md" />
                    <Skeleton variant="text" width="80%" height={14} className="mt-2" />
                    <Skeleton variant="text" width="60%" height={14} />
                    <Skeleton variant="text" width={60} height={20} className="mt-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/70 backdrop-blur-md rounded-3xl border border-dashed border-slate-300 shadow-xs max-w-lg mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center mb-4">
                <PackageSearch className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">No Products in Store Catalog</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6 leading-relaxed">
                Your database inventory is currently empty. Populate real Ghanaian retail products to start taking live sales.
              </p>
              <Button 
                onClick={handleSeedCatalog} 
                isLoading={isSeeding}
                className="bg-[#0D5C3A] hover:bg-[#09432A] text-white px-6 h-12 rounded-xl shadow-md font-bold"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Seed Real Demo Catalog (8 Items)
              </Button>
            </div>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
            >
              {products.map((product) => {
                const isLowStock = (product.total_stock || 0) < 10;
                return (
                  <motion.button
                    key={product.id}
                    variants={staggerItem}
                    onClick={() => addToCart(product)}
                    className="group relative flex flex-col sika-raised-sm sika-press rounded-[20px] overflow-hidden text-left hover:border-[#0D5C3A]/60 hover:shadow-lg transition-all min-h-[140px] cursor-pointer"
                  >
                    <div className={cn(
                      "h-1.5 w-full",
                      isLowStock ? "bg-amber-500" : "bg-[#0D5C3A]"
                    )} />
                    <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md sika-recessed-sm",
                          isLowStock ? "text-amber-800" : "text-slate-600"
                        )}>
                          Stock: {product.total_stock ?? 50}
                        </span>
                        {product.category_name && (
                          <span className="text-[10px] text-slate-400 font-bold truncate max-w-[90px]">
                            {product.category_name}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[13px] sm:text-sm font-bold text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-[#0D5C3A] transition-colors">
                        {product.name}
                      </h3>
                      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[15px] sm:text-base font-black tabular-nums text-slate-900">
                          {formatGHS(product.base_price)}
                        </p>
                        <span className="w-7 h-7 rounded-lg bg-emerald-50 text-[#0D5C3A] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity sika-raised-sm">
                          <Plus className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </main>
        
        {/* Mobile Floating Cart Button */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40">
          <button 
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-between px-6 font-bold hover:bg-slate-800 transition-colors border border-slate-700 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>{cart.reduce((acc, item) => acc + item.quantity, 0)} Items</span>
            </div>
            <span className="tabular-nums font-extrabold text-emerald-400">{formatGHS(total)}</span>
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

      {/* PAYMENT & CHECKOUT MODAL */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => !isProcessingSale && setIsCheckoutOpen(false)}
        title="Complete Checkout"
        description="Select payment channel and complete real transaction."
        maxWidth="md"
      >
        <div className="space-y-6">
          {checkoutError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-semibold">{checkoutError}</p>
            </div>
          )}

          {/* Amount Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Grand Total Due</p>
              <p className="text-2xl font-extrabold text-[#0D5C3A] tabular-nums mt-0.5">{formatGHS(total)}</p>
            </div>
            <Badge variant="primary" className="bg-[#0D5C3A]/10 text-[#0D5C3A] font-bold border-none px-3 py-1">
              {cart.reduce((acc, item) => acc + item.quantity, 0)} items
            </Badge>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { id: 'cash', label: 'Cash', icon: DollarSign, color: 'text-emerald-600' },
                { id: 'mtn_momo', label: 'MTN MoMo', icon: Smartphone, color: 'text-amber-500' },
                { id: 'telecel_cash', label: 'Telecel Cash', icon: Smartphone, color: 'text-red-500' },
                { id: 'card', label: 'Bank Card', icon: CreditCard, color: 'text-blue-600' },
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl border text-left transition-all font-bold text-xs sm:text-sm cursor-pointer",
                      isSelected 
                        ? "bg-[#0D5C3A]/5 border-[#0D5C3A] text-slate-900 ring-2 ring-[#0D5C3A]/20" 
                        : "bg-white border-slate-200/80 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <div className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0", method.color)}>
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="truncate">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Inputs */}
          {paymentMethod === 'cash' ? (
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Amount Tendered (GH₵)
              </label>
              <input
                type="number"
                step="0.50"
                value={amountTenderedInput}
                onChange={e => setAmountTenderedInput(e.target.value)}
                placeholder="e.g. 50.00"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 font-bold text-lg focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A] outline-none"
              />
              {/* Quick Cash Suggestions */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[total, 20, 50, 100, 200].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountTenderedInput(val.toFixed(2))}
                    className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    GH₵ {val.toFixed(0)}
                  </button>
                ))}
              </div>

              {/* Change Calculation */}
              {parseFloat(amountTenderedInput) > total && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 font-bold text-sm">
                  <span>Change Due:</span>
                  <span className="text-lg tabular-nums">{formatGHS(parseFloat(amountTenderedInput) - total)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Customer Phone Number (Ghana)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="e.g. 0244123456"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 font-bold text-base focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A] outline-none"
              />
              <p className="text-xs text-slate-400">Used for prompt delivery and digital receipt SMS.</p>
            </div>
          )}

          {/* Complete Button */}
          <Button
            size="lg"
            onClick={handleCompleteSale}
            isLoading={isProcessingSale}
            className="w-full h-14 bg-[#0D5C3A] hover:bg-[#09432A] text-white font-extrabold text-base shadow-lg shadow-[#0D5C3A]/20"
          >
            Confirm & Complete Sale ({formatGHS(total)})
          </Button>
        </div>
      </Modal>

      {/* RECEIPT CONFIRMATION MODAL */}
      <Modal
        isOpen={!!receipt}
        onClose={() => setReceipt(null)}
        title="Receipt"
        maxWidth="md"
      >
        {receipt && (() => {
          const statutoryTax = receipt.tax_amount || receipt.tax_total || Math.max(0, Number((receipt.grand_total - receipt.subtotal).toFixed(2)));
          return (
            <div className="space-y-6">
              {/* Printable Receipt Card */}
              <div id="printable-pos-receipt" className="printable-receipt bg-white border border-slate-200 rounded-2xl p-5 space-y-4 text-slate-900 shadow-xs">
                <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
                  {tenant?.logo_url && (
                    <img 
                      src={tenant.logo_url} 
                      alt="Store Logo" 
                      className="mx-auto h-12 object-contain mb-2" 
                      style={{ height: '48px', width: 'auto', margin: '0 auto 8px auto', objectFit: 'contain' }}
                    />
                  )}
                  <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                    {tenant?.businessName || 'SikaPOS Store'}
                  </h3>
                  {primaryBranch && (
                    <p className="text-xs text-slate-500 font-medium">
                      {primaryBranch.name} • {primaryBranch.region}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 font-mono font-bold">
                    Receipt #{receipt.receipt_number}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(receipt.created_at).toLocaleString('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>

                {/* Line Items */}
                <div className="space-y-2 py-1 text-xs">
                  {receipt.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <span className="font-semibold text-slate-800 pr-2">
                        {item.quantity}x {item.product_name}
                      </span>
                      <span className="font-bold tabular-nums text-slate-900 shrink-0">
                        {formatGHS(item.line_total)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotal, Tax Breakdown, Grand Total */}
                <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-semibold">{formatGHS(receipt.subtotal)}</span>
                  </div>
                  {statutoryTax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax (Statutory)</span>
                      <span className="tabular-nums font-semibold">{formatGHS(statutoryTax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-slate-900 text-base pt-2 border-t border-slate-200">
                    <span>GRAND TOTAL</span>
                    <span className="text-[#0D5C3A] tabular-nums">{formatGHS(receipt.grand_total)}</span>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Payment Method:</span>
                    <span className="font-bold uppercase text-[#0D5C3A]">{receipt.payment_method.replace('_', ' ')}</span>
                  </div>
                  {receipt.amount_tendered && receipt.amount_tendered > receipt.grand_total && (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Amount Tendered:</span>
                        <span className="tabular-nums">{formatGHS(receipt.amount_tendered)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold">
                        <span>Change Given:</span>
                        <span className="tabular-nums">{formatGHS(receipt.change_due || (receipt.amount_tendered - receipt.grand_total))}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[11px] text-slate-400 space-y-0.5">
                  <p className="font-semibold text-slate-600">Thank you for your business!</p>
                  <p className="text-[10px]">Powered by SikaPOS</p>
                </div>
              </div>

              {/* Action Buttons (Strictly excluded from printout) */}
              <div className="no-print flex gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrintReceipt}
                  className="flex-1 h-12 font-bold border-slate-300"
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print Receipt
                </Button>
                <Button
                  onClick={() => setReceipt(null)}
                  className="flex-1 h-12 bg-[#0D5C3A] hover:bg-[#09432A] text-white font-extrabold"
                >
                  New Sale
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default POSPage;
