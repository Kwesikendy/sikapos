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
import { useToast } from '../components/ui/Toast';
import { Package, Plus, Search, RefreshCw, Barcode, Tag, CheckCircle2, Edit3 } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { tenant, primaryBranch } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit Product Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [formRestockAmount, setFormRestockAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formStock, setFormStock] = useState('50');
  const [formBarcode, setFormBarcode] = useState('');
  const [formIsTaxable, setFormIsTaxable] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState('');

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

  const openEditModal = (p: ProductItem) => {
    setSelectedProduct(p);
    setFormName(p.name);
    setFormBasePrice(p.base_price.toString());
    setFormCostPrice((p.cost_price || 0).toString());
    setFormBarcode(p.barcode || '');
    setFormIsTaxable(p.is_taxable === 1);
    setFormImageUrl(p.image_url || '');
    setFormRestockAmount('0');
    setIsEditModalOpen(true);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
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
      await posApi.updateProduct(selectedProduct.id, {
        name: formName.trim(),
        sellingPrice: priceNum,
        costPrice: parseFloat(formCostPrice) || priceNum * 0.7,
        barcode: formBarcode.trim() || undefined,
        imageUrl: formImageUrl || undefined,
        isTaxable: formIsTaxable,
      });

      const restockNum = parseInt(formRestockAmount, 10);
      if (restockNum > 0 && primaryBranch?.id) {
        await posApi.adjustStock(selectedProduct.id, primaryBranch.id, restockNum);
      }

      toast.success('Product Updated', `${formName} has been successfully updated.`);
      
      setIsEditModalOpen(false);
      await fetchInventory();
    } catch (err: any) {
      setError(err.message || 'Failed to update product.');
    } finally {
      setIsSaving(false);
    }
  };

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
        imageUrl: formImageUrl || undefined,
      });

      // Reset form & reload
      setFormName('');
      setFormBasePrice('');
      setFormCostPrice('');
      setFormStock('50');
      setFormBarcode('');
      setFormImageUrl('');
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
                    <th className="py-3.5 px-6 text-right">Action</th>
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
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover bg-white" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-300" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{p.name}</div>
                              {p.category_name && (
                                <div className="text-xs text-slate-400 mt-0.5">{p.category_name}</div>
                              )}
                            </div>
                          </div>
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
                        <td className="py-4 px-6 text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs font-bold px-3 border-slate-200 text-slate-600 hover:text-[#0D5C3A]" 
                            leftIcon={<Edit3 className="w-3 h-3" />}
                            onClick={() => openEditModal(p)}
                          >
                            Edit
                          </Button>
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
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center shrink-0 overflow-hidden relative">
              {formImageUrl ? (
                <img src={formImageUrl} alt="Product" className="w-full h-full object-cover bg-white" />
              ) : (
                <Package className="w-8 h-8 text-slate-300" />
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Upload Product Image"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setFormImageUrl(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <div className="flex-1 space-y-1 mt-2">
              <label className="text-sm font-bold text-slate-700">Product Image <span className="text-slate-400 font-normal">(Optional)</span></label>
              <p className="text-xs text-slate-500">Upload an image of the product to make it easier for cashiers to identify on the POS terminal.</p>
            </div>
          </div>

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

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Inventory Product"
        description="Update pricing, barcode, or restock items."
      >
        <form onSubmit={handleEditProduct} className="space-y-4 pt-2">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center shrink-0 overflow-hidden relative">
              {formImageUrl ? (
                <img src={formImageUrl} alt="Product" className="w-full h-full object-cover bg-white" />
              ) : (
                <Package className="w-8 h-8 text-slate-300" />
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Upload Product Image"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setFormImageUrl(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <div className="flex-1 space-y-1 mt-2">
              <label className="text-sm font-bold text-slate-700">Product Image <span className="text-slate-400 font-normal">(Optional)</span></label>
              <p className="text-xs text-slate-500">Update the product image.</p>
            </div>
          </div>

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
              label="Restock Quantity (Add to existing)"
              type="number"
              placeholder="0"
              value={formRestockAmount}
              onChange={(e) => setFormRestockAmount(e.target.value)}
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
              id="isTaxableEdit"
              checked={formIsTaxable}
              onChange={(e) => setFormIsTaxable(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#0D5C3A] focus:ring-[#0D5C3A]"
            />
            <label htmlFor="isTaxableEdit" className="text-xs font-bold text-slate-700 cursor-pointer">
              Apply Standard GRA Taxes (VAT + NHIL + GETFund) on checkout
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} loadingText="Saving...">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default InventoryPage;
