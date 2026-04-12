'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { motion } from 'motion/react';
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
  ShoppingBag,
  Truck,
  CheckCircle,
  MessageCircle,
  EyeOff,
  Eye,
} from 'lucide-react';

import Image from 'next/image';
import Link from 'next/link';
import AssetManager from '@/components/AssetManager';
import ProductForm from '@/components/admin/ProductForm';
import PreOrderTable from '@/components/admin/PreOrderTable';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { WHATSAPP_COMMUNITY_LINK } from '@/lib/constants';
import { formatEta } from '@/lib/format';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const products = useQuery(api.products.list);
  const preOrders = useQuery(
    api.preOrders.listAll,
    user?.role === 'admin' ? { workosUserId: user.workosUserId } : 'skip'
  );
  const fulfillmentOrders = useQuery(
    api.orders.listForFulfillment,
    user?.role === 'admin' ? { workosUserId: user.workosUserId } : 'skip'
  );
  const pendingOrdersCount = useQuery(api.orders.countPendingVerification) ?? 0;

  const removeProduct = useMutation(api.products.remove);
  const markProductArrived = useMutation(api.products.markArrived);
  const markPreOrdersArrived = useMutation(api.preOrders.markArrivedByProduct);
  const updateProduct = useMutation(api.products.update);

  const [activeTab, setActiveTab] = useState<'products' | 'pre-orders'>(
    'products'
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    variant: 'danger' | 'default';
    onConfirm: () => void;
  } | null>(null);

  const isAdmin = user?.role === 'admin';
  const loading = authLoading || products === undefined;

  if (!authLoading && (!user || !isAdmin)) {
    router.push('/');
    return null;
  }

  const pendingFulfillmentCount = fulfillmentOrders?.length ?? 0;

  const showConfirm = (title: string, message: string, variant: 'danger' | 'default', onConfirm: () => void) => {
    setConfirmModal({ title, message, variant, onConfirm });
  };

  const handleDelete = (product: any) => {
    showConfirm(
      'Delete Product',
      `This will permanently remove "${product.name}". This action cannot be undone.`,
      'danger',
      async () => {
        try {
          await removeProduct({
            workosUserId: user!.workosUserId,
            id: product.id as Id<'products'>,
          });
        } catch (err) {
          console.error('Error deleting product:', err);
        }
      }
    );
  };

  const handleStatusChange = (product: any, status: string, message: string) => {
    showConfirm(
      status === 'unlisted' ? 'Unlist Product' : 'Re-list Product',
      message,
      status === 'unlisted' ? 'danger' : 'default',
      async () => {
        try {
          await updateProduct({
            workosUserId: user!.workosUserId,
            id: product.id as Id<'products'>,
            status,
          });
        } catch (err) {
          console.error(`Error updating product status:`, err);
        }
      }
    );
  };

  const handleArrived = (product: any) => {
    showConfirm(
      'Mark as Arrived',
      `Mark "${product.name}" as arrived? This will convert it to in-stock and notify all pre-order customers.`,
      'default',
      async () => {
        try {
          await markProductArrived({
            workosUserId: user!.workosUserId,
            id: product.id as Id<'products'>,
          });
          await markPreOrdersArrived({
            workosUserId: user!.workosUserId,
            productId: product.id as Id<'products'>,
          });
          const message = `🚗 *${product.name}* has arrived!\n\nPlease make your remaining payments here:\nhttps://dreamdiecast.in/pre-orders`;
          if (WHATSAPP_COMMUNITY_LINK) {
            navigator.clipboard.writeText(message);
            window.open(WHATSAPP_COMMUNITY_LINK, '_blank');
          } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
          }
        } catch (err) {
          console.error('Error marking product as arrived:', err);
        }
      }
    );
  };

  const startEdit = (product: any) => {
    setEditProduct(product);
    setIsFormOpen(true);
  };

  const startAdd = () => {
    setEditProduct(null);
    setIsFormOpen(true);
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

  // Extract unique names and SKUs for autocomplete
  const nameSuggestions = [...new Set(productList.map((p: any) => p.name).filter(Boolean))];
  const skuSuggestions = [...new Set(productList.map((p: any) => p.sku).filter(Boolean))];

  // Determine listing type for filtering
  const isPreOrderProduct = (p: any) =>
    p.listingType === 'pre-order' ||
    p.category === 'Pre-Order' ||
    p.isPreorder === true;

  const inStockProducts = productList.filter((p) => !isPreOrderProduct(p));
  const preOrderProducts = productList.filter((p) => isPreOrderProduct(p));

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
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'products'
                    ? 'bg-white text-black'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('pre-orders')}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activeTab === 'pre-orders'
                    ? 'bg-white text-black'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                Pre-Orders (
                {preOrderProducts.length + preOrderList.length})
              </button>
            </div>
            <Link
              href="/admin/orders"
              className="border border-white/10 hover:border-accent text-white/60 hover:text-accent px-6 py-4 font-display font-bold uppercase tracking-wider transition-all flex items-center gap-2 relative"
            >
              <ShoppingBag size={20} /> Orders
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-[8px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                  {pendingOrdersCount}
                </span>
              )}
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
              onClick={startAdd}
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

        {/* Product Form Modal */}
        <ProductForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditProduct(null);
          }}
          editProduct={editProduct}
          nameSuggestions={nameSuggestions}
          skuSuggestions={skuSuggestions}
        />

        {/* Product List */}
        {activeTab === 'products' ? (
          <div className="grid grid-cols-1 gap-4">
            {inStockProducts.length === 0 ? (
              <div className="text-center py-24 border border-white/5 carbon-pattern">
                <p className="text-white/40 uppercase tracking-widest font-mono">
                  No active inventory products.
                </p>
              </div>
            ) : (
              inStockProducts.map((product: any) => (
                <div
                  key={product.id}
                  className={`glass p-6 flex flex-col md:flex-row items-center gap-8 group ${product.status === 'unlisted' ? 'opacity-50' : ''}`}
                >
                  <div className="relative w-32 h-20 bg-white/5 overflow-hidden">
                    {product.image && (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-display font-bold uppercase tracking-tight mb-1">
                      {product.name}
                    </h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      <span className="flex items-center gap-1">
                        <Tag size={12} className="text-accent" />{' '}
                        {product.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package size={12} className="text-accent" />{' '}
                        {product.brand}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} className="text-accent" />{' '}
                        ₹{product.price}
                      </span>
                      {product.sku && (
                        <span className="text-white/20">
                          SKU: {product.sku}
                        </span>
                      )}
                      {product.listingType && (
                        <span className="text-accent/60">
                          {product.listingType}
                        </span>
                      )}
                      {product.status === 'unlisted' && (
                        <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded-sm">
                          <EyeOff size={10} /> Unlisted
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Unlist / Re-list toggle */}
                    {product.status === 'unlisted' ? (
                      <button
                        onClick={() => handleStatusChange(product, 'active', `Re-list "${product.name}"?`)}
                        className="p-3 bg-accent/20 hover:bg-accent hover:text-white transition-all rounded-full"
                        title="Re-list product"
                      >
                        <Eye size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(product, 'unlisted', `Unlist "${product.name}" from the store?`)}
                        className="p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all rounded-full"
                        title="Unlist product"
                      >
                        <EyeOff size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(product)}
                      className="p-3 bg-white/5 hover:bg-accent hover:text-white transition-all rounded-full"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
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
                  <Package size={20} className="text-accent" /> Pre-Order
                  Models
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                  {preOrderProducts.length} Models
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {preOrderProducts.length === 0 ? (
                  <div className="text-center py-12 border border-white/5 carbon-pattern">
                    <p className="text-white/40 uppercase tracking-widest text-[10px]">
                      No pre-order models defined.
                    </p>
                  </div>
                ) : (
                  preOrderProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className={`glass p-6 flex flex-col md:flex-row items-center gap-8 group ${product.status === 'unlisted' ? 'opacity-50' : ''}`}
                    >
                      <div className="relative w-32 h-20 bg-white/5 overflow-hidden">
                        {product.image && (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-display font-bold uppercase tracking-tight mb-1">
                          {product.name}
                        </h3>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          <span className="flex items-center gap-1 text-accent">
                            <Tag size={12} /> Pre-Order
                          </span>
                          {product.status === 'unlisted' && (
                            <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded-sm">
                              <EyeOff size={10} /> Unlisted
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Package size={12} /> {product.brand}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign size={12} /> Advance: ₹
                            {product.bookingAdvance ?? product.price}
                          </span>
                          {product.totalFinalPrice && (
                            <span className="text-white/20">
                              Total: ₹{product.totalFinalPrice}
                            </span>
                          )}
                          {product.eta && (
                            <span className="text-white/20">
                              ETA: {formatEta(product.eta)}
                            </span>
                          )}
                          {product.sku && (
                            <span className="text-white/20">
                              SKU: {product.sku}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Arrived + WA — always visible for PO products (hidden if already converted to Current Stock) */}
                        {product.category !== 'Current Stock' && (
                          <button
                            onClick={() => handleArrived(product)}
                            className="bg-white text-black px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-2"
                          >
                            <CheckCircle size={14} /> <MessageCircle size={14} /> Arrived + WA
                          </button>
                        )}

                        {/* Toggle unlist / re-list */}
                        {product.status === 'unlisted' ? (
                          <button
                            onClick={() => handleStatusChange(product, 'active', `Re-list "${product.name}"?`)}
                            className="bg-accent/20 text-accent px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-2"
                          >
                            <Eye size={14} /> Re-list
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(product, 'unlisted', `Unlist "${product.name}" from the public pre-orders page?`)}
                            className="p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all rounded-full"
                            title="Stop PO / Unlist"
                          >
                            <EyeOff size={18} />
                          </button>
                        )}

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

            {/* Customer Pre-Orders Table */}
            <PreOrderTable preOrders={preOrderList} />
          </div>
        )}
      </div>

      <AssetManager
        isOpen={isAssetManagerOpen}
        onClose={() => setIsAssetManagerOpen(false)}
      />

      <ConfirmModal
        isOpen={!!confirmModal}
        title={confirmModal?.title || ''}
        message={confirmModal?.message || ''}
        variant={confirmModal?.variant || 'default'}
        onConfirm={() => confirmModal?.onConfirm()}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  );
}
