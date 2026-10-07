import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { StatusBadge } from '../components/ui/StatusBadge';
import { TableSkeleton } from '../components/ui/Skeletons';
import { posApi, ProductItem } from '../api/pos.api';
import { formatGHS } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { Package, Plus, Search, RefreshCw, Barcode, Tag, CheckCircle2 } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { tenant, primaryBranch } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formStock, setFormStock] = useState('50');
  const [formBarcode, setFormBarcode] = useState('');
  const [formIsTaxable, setFormIsTaxable] = useState(true);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await posApi.getProducts();
      setProducts(res.products || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load store inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Product name is required.');
      return;
    }
    const priceNum = parseFloat(formBasePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid selling price.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await posApi.createProduct({
        name: formName.trim(),
        sellingPrice: priceNum,
        costPrice: parseFloat(formCostPrice) || priceNum * 0.7,
        initialStock: parseInt(formStock, 10) || 0,
        branchId: primaryBranch?.id,
        barcode: formBarcode.trim() || undefined,
      });

      // Reset form & reload
      setFormName('');
      setFormBasePrice('');
      setFormCostPrice('');
      setFormStock('50');
      setFormBarcode('');
      setIsAddModalOpen(false);
      await fetchInventory();
    } catch (err: any) {
      setError(err.message || 'Failed to add product.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery)) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Stock Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage product items, prices, barcodes, and stock levels for {tenant?.businessName || 'your store'}.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={fetchInventory}
            className="flex-1 sm:flex-none h-11 bg-white border-slate-200"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none h-11 shadow-md shadow-[#0D5C3A]/20"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Item
          </Button>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={staggerItem}>
          <Alert variant="error" className="shadow-xs">{error}</Alert>
        </motion.div>
      )}

      {/* Filter & Search Bar */}
      <motion.div variants={staggerItem} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name, barcode, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500">
          <span>{filteredProducts.length} Items Listed</span>
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div variants={staggerItem}>
        <Card glass className="p-0 overflow-hidden border border-slate-200/80 shadow-card bg-white">
          {isLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Inventory Items Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {searchQuery ? 'No products match your search query.' : 'Add your first product item to start selling in the POS terminal.'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsAddModalOpen(true)} className="mt-2" leftIcon={<Plus className="w-4 h-4" />}>
                  Add Product Now
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-6">Product Details</th>
                    <th className="py-3.5 px-4">Barcode / SKU</th>
                    <th className="py-3.5 px-4 text-right">Cost Price</th>
                    <th className="py-3.5 px-4 text-right">Selling Price</th>
                    <th className="py-3.5 px-4 text-center">Stock Level</th>
                    <th className="py-3.5 px-6 text-center">Tax Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProducts.map((p) => {
                    const stock = p.total_stock || 0;
                    const stockStatus = stock <= 0 ? 'offline' : stock < 10 ? 'pending' : 'active';
                    const stockLabel = stock <= 0 ? 'Out of Stock' : stock < 10 ? `${stock} Low Stock` : `${stock} Units`;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          {p.category_name && (
                            <div className="text-xs text-slate-400 mt-0.5">{p.category_name}</div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-mono text-xs">
                          {p.barcode || p.sku || 'No Barcode'}
                        </td>
                        <td className="py-4 px-4 text-right tabular-nums text-slate-500">
                          {formatGHS(p.cost_price || 0)}
                        </td>
                        <td className="py-4 px-4 text-right tabular-nums font-bold text-[#0D5C3A]">
                          {formatGHS(p.base_price)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <StatusBadge status={stockStatus} label={stockLabel} />
                        </td>
                        <td className="py-4 px-6 text-center">
                          {p.is_taxable ? (
                            <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-[#0D5C3A]" /> GRA Taxable
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Tax Exempt</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Inventory Product"
        description="Enter product pricing, barcode, and initial stock level."
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 pt-2">
          <Input
            label="Product Name"
            placeholder="e.g. Milo Choc Malt 400g"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Selling Price (GH₵)"
              type="number"
              step="0.01"
              placeholder="48.00"
              value={formBasePrice}
              onChange={(e) => setFormBasePrice(e.target.value)}
              required
            />
            <Input
              label="Cost Price (GH₵)"
              type="number"
              step="0.01"
              placeholder="35.00"
              value={formCostPrice}
              onChange={(e) => setFormCostPrice(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Initial Stock Quantity"
              type="number"
              placeholder="50"
              value={formStock}
              onChange={(e) => setFormStock(e.target.value)}
            />
            <Input
              label="Barcode / EAN (Optional)"
              placeholder="e.g. 600123456789"
              value={formBarcode}
              onChange={(e) => setFormBarcode(e.target.value)}
              startIcon={<Barcode className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isTaxable"
              checked={formIsTaxable}
              onChange={(e) => setFormIsTaxable(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#0D5C3A] focus:ring-[#0D5C3A]"
            />
            <label htmlFor="isTaxable" className="text-xs font-bold text-slate-700 cursor-pointer">
              Apply Standard GRA Taxes (VAT + NHIL + GETFund) on checkout
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingText="Adding Product...">
              Add Product
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default InventoryPage;
