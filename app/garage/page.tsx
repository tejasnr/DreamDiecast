'use client';

import { useGarage } from '@/hooks/useGarage';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Package, Calendar, ArrowRight, Car, Clock, CreditCard, CheckCircle, XCircle, ExternalLink, ShoppingBag, User, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ORDER_STATUS_DISPLAY } from '@/lib/constants';

export default function GaragePage() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading: itemsLoading } = useGarage();
  const { orders, loading: ordersLoading } = useOrders();
  const { initiateBalancePayment } = useCart();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'owned' | 'pre-orders' | 'orders'>('owned');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'order' | 'pre-order'>('all');

  const handlePayBalance = (item: { productId: string; name: string; price: number; image: string; id: string }) => {
    initiateBalancePayment({
      id: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      garageItemId: item.id
    });
    router.push('/checkout/details');
  };

  const ownedItems = items.filter(item => item.status === 'owned');
  const preOrderItems = items.filter(item => item.status === 'pre-ordered' || item.status === 'arrived');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (itemsLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-[1px] bg-accent"></span>
              <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">Personal Collection</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-display font-bold uppercase tracking-tighter leading-none">
              The <span className="text-white/20">Garage</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setActiveTab('owned')}
              className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${activeTab === 'owned' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              Owned ({ownedItems.length})
            </button>
            <button 
              onClick={() => setActiveTab('pre-orders')}
              className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${activeTab === 'pre-orders' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              Pre-Orders ({preOrderItems.length})
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${activeTab === 'orders' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              Orders ({orders.length})
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'owned' && (
            <motion.div
              key="owned"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {ownedItems.length === 0 ? (
                <div className="border border-white/10 p-20 text-center">
                  <Package className="mx-auto text-white/10 mb-6" size={48} />
                  <h2 className="text-2xl font-display font-bold uppercase mb-2">Your garage is empty</h2>
                  <p className="text-white/40 text-sm uppercase tracking-widest mb-8">Start building your collection today.</p>
                  <Link href="/current-stock" className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest hover:gap-4 transition-all">
                    Browse Inventory <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
                  {ownedItems.map((item) => (
                    <div key={item.id} className="bg-[#050505] p-8 group">
                      <div className="relative aspect-[16/9] mb-8 overflow-hidden bg-white/5">
                        <Image 
                          src={item.image} 
                          alt={item.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-white/10">
                          {item.scale}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-accent text-[10px] font-bold uppercase tracking-widest mb-1">{item.brand}</p>
                          <h3 className="text-xl font-display font-bold uppercase tracking-tight group-hover:text-accent transition-colors">{item.name}</h3>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white/40">
                          <Calendar size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            Acquired {new Date(item.purchasedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">#{item.id.slice(-4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'pre-orders' && (
            <motion.div
              key="pre-orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {preOrderItems.length === 0 ? (
                <div className="border border-white/10 p-20 text-center">
                  <Clock className="mx-auto text-white/10 mb-6" size={48} />
                  <h2 className="text-2xl font-display font-bold uppercase mb-2">No pre-orders found</h2>
                  <p className="text-white/40 text-sm uppercase tracking-widest mb-8">Check out our upcoming releases.</p>
                  <Link href="/pre-orders" className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest hover:gap-4 transition-all">
                    View Pre-orders <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
                  {preOrderItems.map((item) => (
                    <div key={item.id} className="bg-[#050505] p-8 group">
                      <div className="relative aspect-[16/9] mb-8 overflow-hidden bg-white/5">
                        <Image 
                          src={item.image} 
                          alt={item.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-white/10">
                          {item.scale}
                        </div>
                        <div className={`absolute bottom-4 right-4 px-3 py-1 text-[8px] font-bold uppercase tracking-widest border ${
                          item.status === 'arrived' ? 'bg-green-500/20 border-green-500/40 text-green-500' : 'bg-accent/20 border-accent/40 text-accent'
                        }`}>
                          {item.status}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-accent text-[10px] font-bold uppercase tracking-widest mb-1">{item.brand}</p>
                          <h3 className="text-xl font-display font-bold uppercase tracking-tight group-hover:text-accent transition-colors">{item.name}</h3>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white/40">
                          <Calendar size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            Ordered {new Date(item.purchasedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {item.status === 'arrived' && (
                          <button 
                            onClick={() => handlePayBalance(item)}
                            className="bg-accent text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all glow-orange"
                          >
                            Pay Balance
                          </button>
                        )}
                        <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">#{item.id.slice(-4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Order Type Filter */}
              <div className="flex gap-2 mb-6">
                {(['all', 'order', 'pre-order'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderTypeFilter(t)}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${
                      orderTypeFilter === t
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {t === 'all' ? 'All' : t === 'order' ? 'Orders' : 'Pre-Orders'}
                  </button>
                ))}
              </div>

              {orders.length === 0 ? (
                <div className="border border-white/10 p-20 text-center">
                  <ShoppingBag className="mx-auto text-white/10 mb-6" size={48} />
                  <h2 className="text-2xl font-display font-bold uppercase mb-2">No orders found</h2>
                  <p className="text-white/40 text-sm uppercase tracking-widest mb-8">You haven&apos;t placed any orders yet.</p>
                  <Link href="/current-stock" className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest hover:gap-4 transition-all">
                    Start Shopping <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders
                    .filter((order) => orderTypeFilter === 'all' || order.order_type === orderTypeFilter)
                    .map((order) => {
                    const statusDisplay = ORDER_STATUS_DISPLAY[order.order_status] || ORDER_STATUS_DISPLAY.pending;
                    return (
                    <div key={order.id} className="glass border border-white/10 p-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl rounded-full -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                        {/* Order Info */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Order ID</p>
                              <p className="text-sm font-mono font-bold text-white tracking-widest">#{order.id.slice(-8)}</p>
                            </div>
                            <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-sm border ${
                              order.order_type === 'pre-order'
                                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}>
                              {order.order_type === 'pre-order' ? 'PRE-ORDER' : 'ORDER'}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Transaction ID</p>
                            <div className="flex items-center gap-2 text-accent">
                              <CreditCard size={14} />
                              <span className="text-sm font-mono font-bold">{order.transaction_id}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Date</p>
                            <div className="flex items-center gap-2 text-white/60">
                              <Calendar size={14} className="text-accent" />
                              <span className="text-xs font-bold">
                                {order.createdAt && typeof order.createdAt === 'object' && 'toDate' in order.createdAt ? (order.createdAt as { toDate: () => Date }).toDate().toLocaleDateString() : new Date(order.createdAt as string | Date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status & Amount */}
                        <div className="space-y-6">
                          <div>
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Order Status</p>
                            <span className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border flex items-center gap-2 w-fit ${statusDisplay.bg} ${statusDisplay.border} ${statusDisplay.color}`}>
                              {order.order_status === 'completed' && <CheckCircle size={12} />}
                              {order.order_status === 'cancelled' && <XCircle size={12} />}
                              {order.order_status === 'pending' && <Loader2 size={12} className="animate-spin" />}
                              {statusDisplay.label}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Total Amount</p>
                            <div className="space-y-1">
                              {order.subtotal && (
                                <p className="text-[8px] text-white/40 uppercase tracking-widest">Subtotal: ₹{order.subtotal.toLocaleString()}</p>
                              )}
                              {order.shippingCharges !== undefined && (
                                <p className="text-[8px] text-white/40 uppercase tracking-widest">Shipping: ₹{order.shipping_details ? order.shippingCharges.toLocaleString() : 'FREE'}</p>
                              )}
                              <p className="text-3xl font-display font-bold text-white">₹{order.totalAmount.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Items & Proof */}
                        <div className="space-y-6">
                          {order.shipping_details && (
                            <div>
                              <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Shipping Details</p>
                              <div className="space-y-2 text-[10px] text-white/60 uppercase tracking-widest leading-relaxed">
                                <p className="flex items-center gap-2 font-bold text-white">
                                  <User size={10} className="text-accent" /> {order.shipping_details.name}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Phone size={10} className="text-accent" /> {order.shipping_details.phone}
                                </p>
                                <p className="flex items-start gap-2">
                                  <MapPin size={10} className="text-accent mt-0.5" />
                                  <span className="flex-1">
                                    {order.shipping_details.address}, {order.shipping_details.city}, {order.shipping_details.state} - {order.shipping_details.pincode}
                                  </span>
                                </p>
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Items ({order.items.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="relative w-10 h-10 bg-white/5 rounded-sm overflow-hidden border border-white/10 group/item">
                                  <Image src={item.image} alt={item.name} fill className="object-cover" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-[8px] font-bold">x{item.quantity}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Payment Proof</p>
                            <a
                              href={order.payment_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-accent text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                            >
                              View Screenshot <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
