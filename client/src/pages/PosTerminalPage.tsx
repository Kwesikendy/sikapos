import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Check,
  CreditCard,
  Banknote,
  Smartphone,
  RotateCcw,
  Printer,
  History,
  Store,
  LogOut,
  User,
  KeyRound,
  PackagePlus,
  X,
  Receipt as ReceiptIcon,
  Tag,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { posApi, ProductItem, SaleReceipt, StaffMember } from '../api/pos.api';
import { authApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import { formatGHS } from '../lib/utils';
import { PinKeypad } from '../components/ui/PinKeypad';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';

interface CartItem {
  product: ProductItem;
  quantity: number;
}

export const PosTerminalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, tenant: authTenant, logout: authLogout, loginWithPin } = useAuth();

  // Active cashier & user context
  const [currentUser, setCurrentUser] = useState<any>(authUser);
  const [currentTenant, setCurrentTenant] = useState<any>(authTenant);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Products catalog & categories
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Cart & Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [applyGraTax, setApplyGraTax] = useState(true);

  // Checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mtn_momo' | 'telecel_cash' | 'at_money'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [momoPhone, setMomoPhone] = useState('0244123456');
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Completed receipt modal
  const [completedReceipt, setCompletedReceipt] = useState<SaleReceipt | null>(null);

  // Switch cashier PIN modal
  const [showSwitchCashierModal, setShowSwitchCashierModal] = useState(false);
  const [selectedTargetStaff, setSelectedTargetStaff] = useState<StaffMember | null>(null);
  const [switchPinError, setSwitchPinError] = useState<string | null>(null);
  const [isSwitchingPin, setIsSwitchingPin] = useState(false);

  // Sales history & shift drawer
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [salesHistory, setSalesHistory] = useState<SaleReceipt[]>([]);
  const [todaySummary, setTodaySummary] = useState<{ totalRevenue: number; transactionCount: number; cashTotal: number; momoTotal: number }>({
    totalRevenue: 0,
    transactionCount: 0,
    cashTotal: 0,
    momoTotal: 0,
  });

  // Quick Add Product modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Provisions');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCost, setNewProductCost] = useState('');
  const [newProductStock, setNewProductStock] = useState('50');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [addProductError, setAddProductError] = useState<string | null>(null);

  // Search input ref for barcode scanning or keyboard focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    loadUserContext();
    loadCatalog();
    loadStaff();
  }, []);

  const loadUserContext = async () => {
    try {
      const res = await authApi.getCurrentUser();
      setCurrentUser(res.user);
      setCurrentTenant(res.tenant);
    } catch (err) {
      navigate('/cashier-login');
    }
  };

  const loadStaff = async () => {
    try {
      const staff = await posApi.getPublicStaff();
      setStaffList(staff);
    } catch (err) {
      console.error('Failed to load staff:', err);
    }
  };

  const loadCatalog = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await posApi.getProducts();
      setProducts(res.products);
      setCategories(res.categories);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadSalesHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await posApi.getSales(25);
      setSalesHistory(res.sales);
      setTodaySummary(res.summary);
    } catch (err) {
      console.error('Failed to load sales history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery.trim()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return Number(
      cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0).toFixed(2)
    );
  }, [cart]);

  // GRA Standard: 15% VAT, 2.5% NHIL, 2.5% GETFund = 20% effective tax on taxable supplies
  const taxes = useMemo(() => {
    if (!applyGraTax || subtotal === 0) {
      return { nhil: 0, getfund: 0, vat: 0, totalTax: 0, grandTotal: subtotal };
    }
    const nhil = Number((subtotal * 0.025).toFixed(2));
    const getfund = Number((subtotal * 0.025).toFixed(2));
    const vat = Number((subtotal * 0.15).toFixed(2));
    const totalTax = Number((nhil + getfund + vat).toFixed(2));
    const grandTotal = Number((subtotal + totalTax).toFixed(2));
    return { nhil, getfund, vat, totalTax, grandTotal };
  }, [subtotal, applyGraTax]);

  // Quick tender buttons for cash
  const suggestedTenders = useMemo(() => {
    const total = taxes.grandTotal;
    if (total === 0) return [];
    const notes = [10, 20, 50, 100, 200];
    const suggestions = new Set<number>();
    suggestions.add(total);
    for (const note of notes) {
      if (note >= total) {
        suggestions.add(note);
      }
    }
    // Next rounded multiple of 50 or 100
    suggestions.add(Math.ceil(total / 50) * 50);
    suggestions.add(Math.ceil(total / 100) * 100);
    return Array.from(suggestions).sort((a, b) => a - b).slice(0, 4);
  }, [taxes.grandTotal]);

  const changeDue = useMemo(() => {
    const tenderNum = parseFloat(cashTendered);
    if (isNaN(tenderNum)) return 0;
    return Math.max(0, Number((tenderNum - taxes.grandTotal).toFixed(2)));
  }, [cashTendered, taxes.grandTotal]);

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashTendered(taxes.grandTotal.toString());
    setCheckoutError(null);
    setShowCheckoutModal(true);
  };

  // Submit Sale
  const handleProcessSale = async () => {
    if (isProcessingSale) return;

    if (paymentMethod === 'cash') {
      const tendered = parseFloat(cashTendered);
      if (isNaN(tendered) || tendered < taxes.grandTotal) {
        setCheckoutError('Cash tendered is less than the transaction total.');
        return;
      }
    }

    setIsProcessingSale(true);
    setCheckoutError(null);

    try {
      const sale = await posApi.createSale({
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.selling_price,
        })),
        paymentMethod,
        amountTendered: paymentMethod === 'cash' ? parseFloat(cashTendered) : taxes.grandTotal,
        customerPhone: paymentMethod !== 'cash' ? momoPhone : undefined,
        applyTax: applyGraTax,
      });

      // Clear cart, close checkout modal, show printable electronic receipt
      setCart([]);
      setShowCheckoutModal(false);
      setCompletedReceipt(sale);

      // Refresh catalog stock
      loadCatalog();
    } catch (err: any) {
      setCheckoutError(err.message || 'Transaction could not be completed.');
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Handle Switch Cashier PIN
  const handleSwitchPinComplete = async (enteredPin: string) => {
    if (!selectedTargetStaff || isSwitchingPin) return;
    setIsSwitchingPin(true);
    setSwitchPinError(null);

    try {
      await authApi.loginWithPin(selectedTargetStaff.tenantId, selectedTargetStaff.id, enteredPin);
      setShowSwitchCashierModal(false);
      setSelectedTargetStaff(null);
      await loadUserContext();
    } catch (err: any) {
      setSwitchPinError(err.message || 'Incorrect PIN entered.');
    } finally {
      setIsSwitchingPin(false);
    }
  };

  // Quick Add Product
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingProduct) return;
    if (!newProductName.trim() || !newProductPrice) return;
    setIsAddingProduct(true);
    setAddProductError(null);
    try {
      await posApi.createProduct({
        name: newProductName.trim(),
        category: newProductCategory,
        sellingPrice: parseFloat(newProductPrice),
        costPrice: newProductCost ? parseFloat(newProductCost) : 0,
        stockQuantity: parseInt(newProductStock) || 0,
      });
      setShowAddProductModal(false);
      setNewProductName('');
      setNewProductPrice('');
      setNewProductCost('');
      await loadCatalog();
    } catch (err: any) {
      setAddProductError(err.message || 'Failed to add product');
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top POS Operating Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <Link
            to="/launch-readiness"
            className="flex items-center gap-2 text-slate-800 hover:text-emerald-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#00A859] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              S
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                {currentTenant?.business_name || 'Mensah Stores Osu'}
              </span>
              <span className="text-[11px] text-slate-500 block leading-none">
                Terminal Stand #ACC-04 · Osu Oxford St.
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search & Barcode Lookup */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search product name or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00A859] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Cashier Indicator & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Product Button */}
          <button
            type="button"
            onClick={() => setShowAddProductModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <PackagePlus className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Add Item</span>
          </button>

          {/* Shift & Sales History */}
          <button
            type="button"
            disabled={isLoadingHistory}
            onClick={async () => {
              await loadSalesHistory();
              setShowHistoryDrawer(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isLoadingHistory ? (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            ) : (
              <History className="w-4 h-4 text-slate-500" />
            )}
            <span className="hidden sm:inline">Shift History</span>
          </button>

          {/* Active Cashier Switcher */}
          <button
            type="button"
            onClick={() => {
              setSelectedTargetStaff(staffList[0] || null);
              setShowSwitchCashierModal(true);
            }}
            className="flex items-center gap-2 p-1.5 pl-2 rounded-xl bg-emerald-50/80 border border-emerald-200 hover:bg-emerald-100/60 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#00A859] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'C'}
            </div>
            <div className="hidden sm:block leading-none pr-1">
              <span className="text-xs font-bold text-slate-900 block truncate max-w-[100px]">
                {currentUser?.full_name || 'Cashier'}
              </span>
              <span className="text-[10px] text-emerald-800 font-medium block">
                Tap to Switch PIN
              </span>
            </div>
          </button>

          {/* Exit / Back to Store Setup */}
          <Link
            to="/store-setup"
            title="Store Configuration"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Store className="w-4 h-4" />
          </Link>

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Terminal Grid: 8 cols catalog + 4 cols cart */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* LEFT COLUMN: Product Catalog (lg: 8 cols) */}
        <div className="lg:col-span-8 flex flex-col border-r border-slate-200 bg-[#FAFCFB] overflow-y-auto">
          
          {/* Mobile search bar */}
          <div className="p-3 md:hidden border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Category Tabs: Clean segmented buttons (No pill badges) */}
          <div className="p-4 border-b border-slate-200/80 bg-white flex items-center gap-2 overflow-x-auto select-none scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {isLoadingProducts ? (
              <div className="py-20 text-center text-slate-400 text-sm">
                Loading product catalog...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-600">No matching products found</p>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#00A859] rounded-xl hover:bg-[#00924C] transition-colors"
                >
                  Add This Product to Inventory
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {filteredProducts.map((product) => {
                  const inCartItem = cart.find((i) => i.product.id === product.id);
                  const isLowStock = product.stock_quantity <= product.low_stock_threshold;

                  return (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`group relative p-3.5 rounded-2xl bg-white border transition-all text-left flex flex-col justify-between select-none cursor-pointer active:scale-[0.98] ${
                        inCartItem
                          ? 'border-[#00A859] ring-2 ring-[#00A859]/20 shadow-xs'
                          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        {/* Top: Category and stock info as clean unboxed text */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                          <span>{product.category}</span>
                          <span className={isLowStock ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                            {product.stock_quantity} in stock
                          </span>
                        </div>

                        {/* Product Title */}
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#00A859] transition-colors line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                      </div>

                      {/* Bottom Price & Add Action */}
                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 tabular-nums">
                          {formatGHS(product.selling_price)}
                        </span>

                        {inCartItem ? (
                          <div className="w-6 h-6 rounded-lg bg-[#00A859] text-white flex items-center justify-center text-xs font-extrabold shadow-2xs">
                            {inCartItem.quantity}
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-[#00A859] flex items-center justify-center transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Till Cart & Checkout (lg: 4 cols) */}
        <div className="lg:col-span-4 flex flex-col bg-white h-full border-t lg:border-t-0 select-none">
          
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Current Sale</h3>
              <span className="text-xs text-slate-400 font-medium">
                ({cart.reduce((total, i) => total + i.quantity, 0)} items)
              </span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Cart Item Lines */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Till cart is empty</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tap items on the left or scan a barcode to begin checkout.
                  </p>
                </div>
              </div>
            ) : (
              cart.map((item) => {
                const lineTotal = item.product.selling_price * item.quantity;
                return (
                  <div key={item.product.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {formatGHS(item.product.selling_price)} each
                      </p>
                    </div>

                    {/* Quantity Adjustment Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 cursor-pointer active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold tabular-nums text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="w-20 text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900 tabular-nums">
                        {formatGHS(lineTotal)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Pricing & Tax Breakdown */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold tabular-nums text-slate-900">{formatGHS(subtotal)}</span>
            </div>

            {/* Tax Mode Toggle */}
            <div className="pt-1.5 pb-1 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={applyGraTax}
                  onChange={(e) => setApplyGraTax(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#00A859] focus:ring-0 accent-[#00A859]"
                />
                <span>Include GRA Tax (15% VAT + NHIL/GETFund)</span>
              </label>
              <span className="font-bold tabular-nums text-slate-900">{formatGHS(taxes.totalTax)}</span>
            </div>

            {applyGraTax && subtotal > 0 && (
              <div className="pl-5 text-[11px] text-slate-400 space-y-0.5">
                <div className="flex justify-between">
                  <span>NHIL (2.5%)</span>
                  <span>{formatGHS(taxes.nhil)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GETFund (2.5%)</span>
                  <span>{formatGHS(taxes.getfund)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard VAT (15%)</span>
                  <span>{formatGHS(taxes.vat)}</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
              <span className="text-sm font-extrabold text-slate-900">Total Payable</span>
              <span className="text-xl font-extrabold text-[#00A859] tabular-nums">
                {formatGHS(taxes.grandTotal)}
              </span>
            </div>

            {/* Big Checkout Trigger Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                cart.length > 0
                  ? 'bg-[#00A859] hover:bg-[#00924C] text-white shadow-md hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Collect Payment</span>
              <span className="font-mono">({formatGHS(taxes.grandTotal)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* CHECKOUT MODAL: Cash or Mobile Money Payment */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Complete Transaction</h3>
                <p className="text-xs text-slate-500">Select payment channel and confirm customer funds</p>
              </div>
              <button
                type="button"
                disabled={isProcessingSale}
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Payment Channel Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isProcessingSale}
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                      paymentMethod === 'cash'
                        ? 'border-[#00A859] bg-emerald-50/80 text-emerald-900 ring-2 ring-[#00A859]'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingSale}
                    onClick={() => setPaymentMethod('mtn_momo')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                      paymentMethod === 'mtn_momo'
                        ? 'border-[#00A859] bg-emerald-50/80 text-emerald-900 ring-2 ring-[#00A859]'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-amber-500" />
                    <span>MTN MoMo</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingSale}
                    onClick={() => setPaymentMethod('telecel_cash')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                      paymentMethod === 'telecel_cash'
                        ? 'border-[#00A859] bg-emerald-50/80 text-emerald-900 ring-2 ring-[#00A859]'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-rose-500" />
                    <span>Telecel Cash</span>
                  </button>
                </div>
              </div>

              {/* Total Due Display */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase">Amount Due</span>
                <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                  {formatGHS(taxes.grandTotal)}
                </span>
              </div>

              {/* CASH INPUT & CHANGE CALCULATION */}
              {paymentMethod === 'cash' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cash Tendered (GH₵)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      disabled={isProcessingSale}
                      min={taxes.grandTotal}
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A859] tabular-nums disabled:opacity-60"
                    />
                  </div>

                  {/* Suggested Quick Tender Notes */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold">Quick Notes:</span>
                    {suggestedTenders.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        disabled={isProcessingSale}
                        onClick={() => setCashTendered(amount.toString())}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer tabular-nums disabled:opacity-50"
                      >
                        GH₵ {amount}
                      </button>
                    ))}
                  </div>

                  {/* Change Due Output */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">Change Due to Customer</span>
                    <span className="text-lg font-extrabold text-[#00A859] tabular-nums">
                      {formatGHS(changeDue)}
                    </span>
                  </div>
                </div>
              ) : (
                /* MOBILE MONEY PHONE PROMPT */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Customer Mobile Money Number
                    </label>
                    <input
                      type="tel"
                      disabled={isProcessingSale}
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      placeholder="e.g. 0244123456"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A859] disabled:opacity-60"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Customer receives USSD approval prompt on phone to authorize debit.
                    </p>
                  </div>
                </div>
              )}

              {checkoutError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {checkoutError}
                </div>
              )}

              <button
                type="button"
                disabled={isProcessingSale}
                onClick={handleProcessSale}
                className="w-full py-3.5 bg-[#00A859] hover:bg-[#00924C] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingSale && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                <span>{isProcessingSale ? 'Processing Transaction...' : 'Complete & Generate Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ELECTRONIC RECEIPT MODAL */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
            {/* Thermal Receipt Visual */}
            <div className="p-6 font-mono text-xs text-slate-800 space-y-4">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  {currentTenant?.business_name || 'Mensah Stores Osu'}
                </h3>
                <p className="text-[11px] text-slate-500">Oxford Street, Osu, Accra</p>
                <p className="text-[10px] text-slate-400">GPS: GA-183-9024 · Tel: 0244123456</p>
                <p className="text-[10px] text-slate-400">TIN: P0012345678</p>
              </div>

              <div className="space-y-1 text-[11px] text-slate-500 pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Receipt No:</span>
                  <span className="font-bold text-slate-900">{completedReceipt.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date / Time:</span>
                  <span>{new Date(completedReceipt.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span className="font-bold text-slate-800">
                    {completedReceipt.cashier_name || currentUser?.full_name || 'Kwabena Mensah'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Channel:</span>
                  <span className="uppercase font-bold text-slate-800">
                    {completedReceipt.payment_method.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Item Lines */}
              <div className="space-y-1.5 py-1 border-b border-dashed border-slate-300">
                {completedReceipt.items?.map((it) => (
                  <div key={it.id} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[180px]">
                      {it.quantity}x {it.product_name}
                    </span>
                    <span className="font-bold tabular-nums">{formatGHS(it.line_total)}</span>
                  </div>
                ))}
              </div>

              {/* Subtotal, Tax Breakdown, Total */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatGHS(completedReceipt.subtotal)}</span>
                </div>
                {completedReceipt.tax_amount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>GRA Tax (15% VAT + levies)</span>
                    <span className="tabular-nums">{formatGHS(completedReceipt.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                  <span>GRAND TOTAL</span>
                  <span className="tabular-nums">{formatGHS(completedReceipt.grand_total)}</span>
                </div>

                {completedReceipt.payment_method === 'cash' && completedReceipt.amount_tendered && (
                  <div className="pt-1 text-[11px] text-slate-500 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Cash Tendered:</span>
                      <span className="tabular-nums">{formatGHS(completedReceipt.amount_tendered)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-800">
                      <span>Change:</span>
                      <span className="tabular-nums">{formatGHS(completedReceipt.change_due || 0)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
                <p>Thank you for shopping with us!</p>
                <p className="mt-0.5">Powered by SikaPOS Akoma Commerce Cloud</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedReceipt(null)}
                className="flex-1 py-2.5 px-3 bg-[#00A859] hover:bg-[#00924C] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Next Sale</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SWITCH CASHIER PIN MODAL */}
      {showSwitchCashierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <h3 className="text-base font-extrabold text-slate-900">Switch Cashier PIN</h3>
                <p className="text-xs text-slate-500">Tap your shift profile and enter your 4-digit PIN</p>
              </div>
              <button
                type="button"
                disabled={isSwitchingPin}
                onClick={() => setShowSwitchCashierModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Staff selector */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {staffList.map((st) => {
                const isSelected = selectedTargetStaff?.id === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    disabled={isSwitchingPin}
                    onClick={() => {
                      setSelectedTargetStaff(st);
                      setSwitchPinError(null);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer disabled:opacity-60 ${
                      isSelected
                        ? 'border-[#00A859] bg-emerald-50 text-emerald-900 ring-2 ring-[#00A859]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 mx-auto mb-1 flex items-center justify-center text-xs font-bold">
                      {st.initials}
                    </div>
                    <p className="text-xs font-bold truncate">{st.name.split(' ')[0]}</p>
                    <span className="text-[10px] text-slate-400 block truncate">{st.role}</span>
                  </button>
                );
              })}
            </div>

            {selectedTargetStaff && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-700">
                  Enter 4-digit PIN for {selectedTargetStaff.name}:
                </p>
                <PinKeypad
                  onComplete={handleSwitchPinComplete}
                  isLoading={isSwitchingPin}
                  error={switchPinError}
                  onClearError={() => setSwitchPinError(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHIFT HISTORY & TRANSACTIONS DRAWER */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col text-left animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Shift & Till Summary</h3>
                <p className="text-xs text-slate-500">Live transactions recorded during today's shift</p>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shift Metrics */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Sales</span>
                <span className="text-base font-extrabold text-[#00A859] tabular-nums">
                  {formatGHS(todaySummary.totalRevenue)}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {todaySummary.transactionCount} transactions
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cash Collected</span>
                <span className="text-base font-extrabold text-slate-900 tabular-nums">
                  {formatGHS(todaySummary.cashTotal)}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  MoMo: {formatGHS(todaySummary.momoTotal)}
                </span>
              </div>
            </div>

            {/* Sales List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {salesHistory.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  No sales recorded on this till today.
                </div>
              ) : (
                salesHistory.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setCompletedReceipt(s);
                      setShowHistoryDrawer(false);
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#00A859] transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{s.receipt_number}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {s.payment_method.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-900 tabular-nums block">
                        {formatGHS(s.grand_total)}
                      </span>
                      <span className="text-[10px] text-[#00A859] font-semibold">View Receipt</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Add Product to Inventory</h3>
                <p className="text-xs text-slate-500">Immediately available for checkout on this till</p>
              </div>
              <button
                type="button"
                disabled={isAddingProduct}
                onClick={() => setShowAddProductModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              {addProductError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {addProductError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  disabled={isAddingProduct}
                  placeholder="e.g. Bel-Aqua Mineral Water 1.5L"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00A859] disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newProductCategory}
                    disabled={isAddingProduct}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#00A859] disabled:opacity-60"
                  >
                    <option value="Provisions">Provisions</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Household">Household</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    disabled={isAddingProduct}
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00A859] disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (GH₵)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    disabled={isAddingProduct}
                    placeholder="0.00"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00A859] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (GH₵)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    disabled={isAddingProduct}
                    placeholder="0.00"
                    value={newProductCost}
                    onChange={(e) => setNewProductCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00A859] disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isAddingProduct}
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingProduct}
                  className="px-5 py-2 bg-[#00A859] hover:bg-[#00924C] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isAddingProduct && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                  <span>{isAddingProduct ? 'Adding Product...' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL LOADING OVERLAYS */}
      <LoadingOverlay
        isOpen={isProcessingSale}
        message="Processing Transaction"
        submessage="Authorizing payment and creating electronic receipt..."
      />

      <LoadingOverlay
        isOpen={isLoggingOut}
        message="Signing Out"
        submessage="Ending active cashier session and securing till..."
      />
    </div>
  );
};
