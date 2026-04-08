'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Plus,
  Trash2,
  Edit2,
  LogOut,
  Package,
  DollarSign,
  Tag,
  Loader2,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  ShoppingBag,
  Truck,
  CheckCircle
} from 'lucide-react';

import Image from 'next/image';
import Link from 'next/link';
import AssetManager from '@/components/AssetManager';

interface Product {
  id: string;
  _id: Id<'products'>;
  name: string;
  price: number;
  image: string;
  category: string;
  brand: string;
  scale: string;
  description?: string;
  stock?: number;
  rating?: number;
  details?: {
    material?: string;
    features?: string[];
  };
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const products = useQuery(api.products.list) as Product[] | undefined;
  const preOrders = useQuery(
    api.preOrders.listAll,
    user?.role === 'admin' ? { workosUserId: user.workosUserId } : 'skip'
  );
  const fulfillmentOrders = useQuery(
    api.orders.listForFulfillment,
    user?.role === 'admin' ? { workosUserId: user.workosUserId } : 'skip'
  );

  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);
  const markProductArrived = useMutation(api.products.markArrived);
  const markPreOrderArrived = useMutation(api.preOrders.markArrived);

  const [activeTab, setActiveTab] = useState<'products' | 'pre-orders'>('products');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    category: 'New Arrival',
    brand: '',
    scale: '1/64',
    description: '',
    stock: '0',
    rating: '5',
    material: 'Diecast Metal',
    features: ''
  });

  const isAdmin = user?.role === 'admin';
  const loading = authLoading || products === undefined;

  // Redirect non-admins
  if (!authLoading && (!user || !isAdmin)) {
    router.push('/');
    return null;
  }

  const pendingFulfillmentCount = fulfillmentOrders?.length ?? 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      setUploadProgress(0);
      try {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
        const siteUrl = convexUrl.replace('.cloud', '.site');
        const res = await fetch(`${siteUrl}/upload`, {
          method: 'POST',
          body: file,
        });
        const data = await res.json();
        setFormData({ ...formData, image: data.url });
        setUploadProgress(100);
      } catch (err) {
        console.error('Error uploading file:', err);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const price = parseFloat(formData.price);
      const stock = parseInt(formData.stock);
      const rating = parseFloat(formData.rating);

      if (isNaN(price) || isNaN(stock) || isNaN(rating)) {
        alert('Please enter valid numbers for price, stock, and rating.');
        setSaving(false);
        return;
      }

      const productPayload = {
        workosUserId: user!.workosUserId,
        name: formData.name,
        price,
        image: formData.image,
        category: formData.category as 'Pre-Order' | 'In Stock' | 'New Arrival' | 'Bundle' | 'Current Stock',
        brand: formData.brand,
        scale: formData.scale,
        description: formData.description || undefined,
        stock,
        rating,
        details: {
          material: formData.material,
          features: formData.features.split(',').map(f => f.trim()).filter(f => f !== '')
        },
      };

      if (editingId) {
        await updateProduct({
          ...productPayload,
          id: editingId as Id<'products'>,
        });
      } else {
        await createProduct(productPayload);
      }

      setFormData({
        name: '',
        price: '',
        image: '',
        category: 'New Arrival',
        brand: '',
        scale: '1/64',
        description: '',
        stock: '0',
        rating: '5',
        material: 'Diecast Metal',
        features: ''
      });
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeProduct({ workosUserId: user!.workosUserId, id: id as Id<'products'> });
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const startEdit = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      image: product.image,
      category: product.category,
      brand: product.brand,
      scale: product.scale,
      description: product.description || '',
      stock: (product.stock || 0).toString(),
      rating: (product.rating || 5).toString(),
      material: product.details?.material || 'Diecast Metal',
      features: product.details?.features?.join(', ') || ''
    });
    setEditingId(product.id);
    setIsAdding(true);
  };

  const handleMarkPreOrderArrived = async (preOrderId: string) => {
    try {
      await markPreOrderArrived({
        workosUserId: user!.workosUserId,
        preOrderId: preOrderId as Id<'preOrders'>,
      });
    } catch (err) {
      console.error('Error marking as arrived:', err);
      alert('Failed to update status.');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (!isAdmin) return null;

  const productList = products ?? [];
  const preOrderList = preOrders ?? [];

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <span className="w-12 h-[2px] bg-accent" />
              <span className="text-accent font-mono text-xs tracking-[0.4em] uppercase">
                Garage Management
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter">
              Dashboard
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-sm border border-white/10 mr-4">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('pre-orders')}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'pre-orders' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
              >
                Pre-Orders ({productList.filter(p => p.category === 'Pre-Order').length + preOrderList.length})
              </button>
            </div>
            <Link
              href="/admin/orders"
              className="border border-white/10 hover:border-accent text-white/60 hover:text-accent px-6 py-4 font-display font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <ShoppingBag size={20} /> Orders
            </Link>
            <Link
              href="/admin/fulfillment"
              className="border border-white/10 hover:border-accent text-white/60 hover:text-accent px-6 py-4 font-display font-bold uppercase tracking-wider transition-all flex items-center gap-2 relative"
            >
              <Truck size={20} /> Fulfillment
              {pendingFulfillmentCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-[8px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                  {pendingFulfillmentCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsAssetManagerOpen(true)}
              className="border border-white/10 hover:border-accent text-white/60 hover:text-accent px-6 py-4 font-display font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <ImageIcon size={20} /> Assets
            </button>
            <button
              onClick={() => { setIsAdding(true); setEditingId(null); }}
              className="bg-accent text-white px-8 py-4 font-display font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all"
            >
              <Plus className="inline-block mr-2" size={20} /> Add Product
            </button>
            <button
              onClick={handleLogout}
              className="border border-white/10 hover:border-white/30 px-6 py-4 text-white/40 hover:text-white transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {isAdding && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setIsAdding(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="relative w-full max-w-2xl glass p-10 overflow-y-auto max-h-[90vh]"
              >
                <h2 className="text-3xl font-display font-bold uppercase mb-8">
                  {editingId ? 'Edit Product' : 'Add New Model'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Product Name</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                        placeholder="e.g. Pagani Huayra R"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Price (INR)</label>
                      <input
                        required
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                        placeholder="1950"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Brand</label>
                      <input
                        required
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                        placeholder="Tarmac Works"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors appearance-none"
                      >
                        <option value="New Arrival">New Arrival</option>
                        <option value="Pre-Order">Pre-Order</option>
                        <option value="Current Stock">Current Stock</option>
                        <option value="Bundle">Bundle</option>
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Product Image</label>
                      <div className="flex flex-col gap-4">
                        {formData.image && (
                          <div className="relative w-full aspect-video bg-white/5 border border-white/10 overflow-hidden group">
                            <Image
                              src={formData.image}
                              alt="Preview"
                              fill
                              className="object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, image: ''})}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="md:col-span-2 relative">
                            <input
                              required
                              type="url"
                              value={formData.image}
                              onChange={(e) => setFormData({...formData, image: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors pl-10"
                              placeholder="Image URL"
                            />
                            <LinkIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                          </div>
                          <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-widest flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden">
                              {uploading && (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${uploadProgress}%` }}
                                  className="absolute inset-0 bg-accent/20"
                                />
                              )}
                              <div className="flex items-center gap-2 relative z-10">
                                {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                {uploading ? `${Math.round(uploadProgress)}%` : 'Upload'}
                              </div>
                              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsAssetManagerOpen(true)}
                              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                            >
                              <ImageIcon size={16} /> Assets
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Scale</label>
                      <input
                        required
                        type="text"
                        value={formData.scale}
                        onChange={(e) => setFormData({...formData, scale: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                        placeholder="1/64"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Stock Quantity</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                        placeholder="10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Rating (0-5)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => setFormData({...formData, rating: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                        placeholder="4.8"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Material</label>
                      <input
                        type="text"
                        value={formData.material}
                        onChange={(e) => setFormData({...formData, material: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                        placeholder="Diecast Metal"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Features (comma separated)</label>
                      <input
                        type="text"
                        value={formData.features}
                        onChange={(e) => setFormData({...formData, features: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                        placeholder="Opening Hood, Rubber Tires, Detailed Interior"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors h-32 resize-none"
                        placeholder="Product details..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-accent text-white py-4 font-display font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : (editingId ? 'Update Product' : 'Add Product')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-8 border border-white/10 hover:bg-white/5 transition-all uppercase text-xs tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Product List */}
        {activeTab === 'products' ? (
          <div className="grid grid-cols-1 gap-4">
            {productList.filter(p => p.category !== 'Pre-Order').length === 0 ? (
              <div className="text-center py-24 border border-white/5 carbon-pattern">
                <p className="text-white/40 uppercase tracking-widest font-mono">No active inventory products.</p>
              </div>
            ) : (
              productList.filter(p => p.category !== 'Pre-Order').map((product) => (
                <div key={product.id} className="glass p-6 flex flex-col md:flex-row items-center gap-8 group">
                  <div className="relative w-32 h-20 bg-white/5 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-display font-bold uppercase tracking-tight mb-1">{product.name}</h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      <span className="flex items-center gap-1"><Tag size={12} className="text-accent" /> {product.category}</span>
                      <span className="flex items-center gap-1"><Package size={12} className="text-accent" /> {product.brand}</span>
                      <span className="flex items-center gap-1"><DollarSign size={12} className="text-accent" /> ₹{product.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => startEdit(product)}
                      className="p-3 bg-white/5 hover:bg-accent hover:text-white transition-all rounded-full"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-3 bg-white/5 hover:bg-red-500 hover:text-white transition-all rounded-full"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Pre-Order Products Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold uppercase tracking-tight flex items-center gap-2">
                  <Package size={20} className="text-accent" /> Pre-Order Models
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                  {productList.filter(p => p.category === 'Pre-Order').length} Models
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {productList.filter(p => p.category === 'Pre-Order').length === 0 ? (
                  <div className="text-center py-12 border border-white/5 carbon-pattern">
                    <p className="text-white/40 uppercase tracking-widest text-[10px]">No pre-order models defined.</p>
                  </div>
                ) : (
                  productList.filter(p => p.category === 'Pre-Order').map((product) => (
                    <div key={product.id} className="glass p-6 flex flex-col md:flex-row items-center gap-8 group">
                      <div className="relative w-32 h-20 bg-white/5 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-display font-bold uppercase tracking-tight mb-1">{product.name}</h3>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          <span className="flex items-center gap-1 text-accent"><Tag size={12} /> {product.category}</span>
                          <span className="flex items-center gap-1"><Package size={12} /> {product.brand}</span>
                          <span className="flex items-center gap-1"><DollarSign size={12} /> ₹{product.price}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={async () => {
                            try {
                              await markProductArrived({
                                workosUserId: user!.workosUserId,
                                id: product.id as Id<'products'>,
                              });
                            } catch (err) {
                              console.error('Error updating product category:', err);
                            }
                          }}
                          className="bg-white text-black px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-2"
                        >
                          <CheckCircle size={14} /> Mark as Arrived
                        </button>
                        <button
                          onClick={() => startEdit(product)}
                          className="p-3 bg-white/5 hover:bg-accent hover:text-white transition-all rounded-full"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Customer Pre-Orders Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold uppercase tracking-tight flex items-center gap-2">
                  <ShoppingBag size={20} className="text-accent" /> Customer Pre-Orders
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                  {preOrderList.length} Active Orders
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {preOrderList.length === 0 ? (
                  <div className="text-center py-12 border border-white/5 carbon-pattern">
                    <p className="text-white/40 uppercase tracking-widest text-[10px]">No customer pre-orders found.</p>
                  </div>
                ) : (
                  preOrderList.map((order: any) => (
                    <div key={order._id} className="glass p-6 flex flex-col md:flex-row items-center gap-8 group">
                      <div className="relative w-32 h-20 bg-white/5 overflow-hidden">
                        <Image
                          src={order.image}
                          alt={order.name}
                          fill
                          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-display font-bold uppercase tracking-tight mb-1">{order.name}</h3>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          <span className="flex items-center gap-1 text-accent"><DollarSign size={12} /> Paid: ₹{order.price}</span>
                          <span className="flex items-center gap-1"><Package size={12} /> {order.brand}</span>
                          <span className="flex items-center gap-1"><Loader2 size={12} className={order.status === 'arrived' ? 'text-green-500' : 'text-accent'} /> Status: {order.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {order.status !== 'arrived' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => handleMarkPreOrderArrived(order._id)}
                            className="bg-accent text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                          >
                            Mark as Arrived
                          </button>
                        )}
                        {order.status === 'arrived' && (
                          <span className="px-6 py-3 bg-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                            Arrived
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <AssetManager
        isOpen={isAssetManagerOpen}
        onClose={() => setIsAssetManagerOpen(false)}
        onSelect={(url) => {
          setFormData({ ...formData, image: url });
          setIsAssetManagerOpen(false);
        }}
      />
    </div>
  );
}
