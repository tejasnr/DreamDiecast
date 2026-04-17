'use client';

import { useGarage } from '@/hooks/useGarage';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Package, Calendar, ArrowRight, Clock, CreditCard, CheckCircle, XCircle, ExternalLink, ShoppingBag, User, Phone, MapPin, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FLAT_SHIPPING_RATE, ORDER_STATUS_DISPLAY, PO_STATUS_DISPLAY } from '@/lib/constants';
import PreOrderTimeline from '@/components/PreOrderTimeline';

function normalizePreOrderStatus(status?: string): string | undefined {
  if (!status) return undefined;
  if (status === 'pending' || status === 'confirmed') return 'waiting_for_stock';
  if (status === 'arrived') return 'stock_arrived';
  return status;
}

function mapGarageStatusToPOStatus(garageStatus?: string, poStatus?: string): string {
  const normalized = normalizePreOrderStatus(poStatus);
  if (garageStatus === 'arrived') {
    if (!normalized || ['deposit_submitted', 'deposit_verified', 'waiting_for_stock'].includes(normalized)) {
      return 'stock_arrived';
    }
  }
  if (normalized) return normalized;
  return garageStatus === 'arrived' ? 'stock_arrived' : 'deposit_verified';
}

function getBalanceState(po: any, effectiveStatus: string): 'pending' | 'submitted' | 'verified' {
  const normalized = normalizePreOrderStatus(po.status) ?? effectiveStatus;
  if (
    po.balancePaymentStatus === 'verified' ||
    ['balance_verified', 'shipped', 'delivered', 'fully_paid_shipped'].includes(normalized)
  ) {
    return 'verified';
  }
  if (po.balancePaymentStatus === 'submitted' || normalized === 'balance_submitted') {
    return 'submitted';
  }
  return 'pending';
}

export default function GaragePage() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading: itemsLoading } = useGarage();
  const { orders, loading: ordersLoading } = useOrders();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'owned' | 'pre-orders' | 'orders' | 'balance-payments'>('owned');
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'regular' | 'pre-order' | 'balance'>('all');

  // Fetch actual pre-orders for richer data + preOrder IDs for /pay links
  const preOrders = useQuery(
    api.preOrders.byUser,
    user
      ? {
          userId: user.convexUserId as Id<'users'>,
          email: user.email,
        }
      : 'skip'
  );

  useEffect(() => {
    const tabParam = searchParams.get('tab') ?? searchParams.get('filter');
    if (!tabParam) return;
    const normalized = tabParam.toLowerCase();
    let nextTab: 'owned' | 'pre-orders' | 'orders' | 'balance-payments' | null = null;

    if (['pre-orders', 'preorder', 'pre-order', 'preorders'].includes(normalized)) {
      nextTab = 'pre-orders';
    } else if (['balance-payments', 'balance', 'balancepayments', 'balance-payment'].includes(normalized)) {
      nextTab = 'balance-payments';
    } else if (['orders'].includes(normalized)) {
      nextTab = 'orders';
    } else if (['owned', 'purchases'].includes(normalized)) {
      nextTab = 'owned';
    }

    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [searchParams, activeTab]);

  const ownedItems = items.filter(item => item.status === 'owned');
  const preOrderItems = items.filter(item => item.status === 'pre-ordered' || item.status === 'arrived');

  const garageStatusByProduct = new Map<string, string>();
  for (const item of preOrderItems) {
    garageStatusByProduct.set(item.productId, item.status);
  }

  const computedPreOrders = (preOrders ?? []).map((po: any) => {
    const effectiveStatus = mapGarageStatusToPOStatus(
      garageStatusByProduct.get(po.productId as string),
      po.status
    );
    const totalPrice = po.totalPrice ?? po.price ?? 0;
    const depositPaid = po.depositPaid ?? po.depositAmount ?? 0;
    const balanceDue = Math.max(totalPrice - depositPaid, 0);
    const shippingCharges = po.shippingCharges ?? FLAT_SHIPPING_RATE;
    const totalToPay = balanceDue + shippingCharges;
    const balanceState = getBalanceState(po, effectiveStatus);

    return {
      ...po,
      effectiveStatus,
      totalPrice,
      depositPaid,
      balanceDue,
      shippingCharges,
      totalToPay,
      balanceState,
    };
  });

  // Build a map of productId -> preOrder for enriched data
  const poByProduct = new Map<string, any>();
  for (const po of computedPreOrders) {
    poByProduct.set(po.productId as string, po);
  }

  // Pre-orders that need balance payment (stock arrived, not yet paid)
  const pendingBalancePreOrders = computedPreOrders.filter((po: any) => (
    po.balanceState === 'pending' && po.effectiveStatus === 'stock_arrived'
  ));
  const submittedBalancePreOrders = computedPreOrders.filter((po: any) => po.balanceState === 'submitted');
  const verifiedBalancePreOrders = computedPreOrders.filter((po: any) => po.balanceState === 'verified');
  const completedBalancePreOrders = [...submittedBalancePreOrders, ...verifiedBalancePreOrders];

  const orderTypeLabel = (order: typeof orders[number]) => {
    if (order.items.some((item) => item.category === 'Balance Payment')) return 'Balance Payment';
    if (order.order_type === 'pre-order' || order.items.some((item) => item.category === 'Pre-Order')) return 'Pre-Order Deposit';
    return 'Order';
  };
  const isPreOrderOrder = (order: typeof orders[number]) =>
    order.order_type === 'pre-order' || order.items.some((item) => item.category === 'Pre-Order');
  const isBalanceOrder = (order: typeof orders[number]) =>
    order.items.some((item) => item.category === 'Balance Payment');
  const regularOrdersCount = orders.filter(
    (order) => !isPreOrderOrder(order) && !isBalanceOrder(order)
  ).length;
  const preOrderOrdersCount = orders.filter((order) => isPreOrderOrder(order)).length;
  const balanceOrdersCount = orders.filter((order) => isBalanceOrder(order)).length;
  const hasAnyBalanceActivity =
    pendingBalancePreOrders.length > 0 ||
    completedBalancePreOrders.length > 0 ||
    balanceOrdersCount > 0;
  const totalBalanceCount =
    pendingBalancePreOrders.length +
    submittedBalancePreOrders.length +
    verifiedBalancePreOrders.length +
    balanceOrdersCount;
  const filteredOrders = orders.filter((order) => {
    if (ordersFilter === 'all') return true;
    if (ordersFilter === 'pre-order') return isPreOrderOrder(order);
    if (ordersFilter === 'balance') return isBalanceOrder(order);
    return !isPreOrderOrder(order) && !isBalanceOrder(order);
  });

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
        {/* Banner for pending balance payments */}
        {pendingBalancePreOrders.length > 0 && activeTab !== 'balance-payments' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-accent/10 border border-accent/30 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-accent flex-shrink-0" />
              <p className="text-sm font-bold uppercase tracking-widest">
                You have {pendingBalancePreOrders.length} pre-order{pendingBalancePreOrders.length > 1 ? 's' : ''} awaiting balance payment
              </p>
            </div>
            <button
              onClick={() => setActiveTab('balance-payments')}
              className="bg-accent text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all rounded-sm flex-shrink-0"
            >
              Pay Now
            </button>
          </motion.div>
        )}

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
            <button
              onClick={() => setActiveTab('balance-payments')}
              className={`relative px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${
                activeTab === 'balance-payments'
                  ? 'bg-blue-500 text-white'
                  : pendingBalancePreOrders.length > 0
                    ? 'bg-accent/10 text-accent hover:bg-accent/20 border border-accent/30'
                    : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
              }`}
            >
              Balance Payments ({totalBalanceCount})
              {pendingBalancePreOrders.length > 0 && activeTab !== 'balance-payments' && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-accent rounded-full animate-pulse" />
              )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ownedItems.map((item) => (
                    <div key={item.id} className="bg-[#050505] p-8 group border border-white/10">
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
                <div className="space-y-4">
                  {preOrderItems.map((item, index) => {
                    const po = poByProduct.get(item.productId);
                    const poStatus = po?.effectiveStatus ?? mapGarageStatusToPOStatus(item.status);
                    const statusDisplay = PO_STATUS_DISPLAY[poStatus];
                    const totalPrice = po?.totalPrice ?? item.originalPrice ?? item.price;
                    const depositPaid = po?.depositPaid ?? item.price;
                    const balanceDue = Math.max(totalPrice - depositPaid, 0);
                    const shippingCharges = po?.shippingCharges ?? FLAT_SHIPPING_RATE;
                    const isStockArrived = poStatus === 'stock_arrived';

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`group border p-6 transition-colors ${
                          isStockArrived
                            ? 'bg-accent/5 border-accent/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row items-center gap-8">
                          <div className="relative w-full md:w-48 aspect-[16/9] overflow-hidden bg-black">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="flex-1 text-center md:text-left space-y-3">
                            <div>
                              <p className="text-accent text-[10px] font-bold uppercase tracking-widest mb-1">{item.brand} &bull; {item.scale}</p>
                              <h3 className="text-2xl font-display font-bold uppercase tracking-tight">{item.name}</h3>
                            </div>

                            <PreOrderTimeline status={poStatus} />

                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-white/40">
                              <div className="flex items-center gap-2">
                                <Calendar size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                  Applied: {new Date(item.purchasedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${statusDisplay?.color || 'text-white/40'}`}>
                                {statusDisplay?.label || poStatus}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-center md:items-end gap-4">
                            <div className="text-right">
                              <p className="text-[10px] text-white/20 uppercase tracking-widest mb-1">
                                Deposit: ₹{depositPaid.toLocaleString()} paid
                              </p>
                              {balanceDue > 0 ? (
                                <p className="text-xs text-white/40 uppercase tracking-widest">
                                  Balance: ₹{balanceDue.toLocaleString()} + ₹{shippingCharges} shipping
                                </p>
                              ) : (
                                <p className="text-xs text-green-400 uppercase tracking-widest">
                                  Fully deposited &bull; Shipping: ₹{shippingCharges}
                                </p>
                              )}
                            </div>

                            {isStockArrived && po && (
                              <Link
                                href={`/pay/${po._id}`}
                                className="bg-white text-black px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-2 glow-orange"
                              >
                                <CreditCard size={14} /> Pay Now &rarr;
                              </Link>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
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
              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={() => setOrdersFilter('all')}
                  className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${
                    ordersFilter === 'all' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  All ({orders.length})
                </button>
                <button
                  onClick={() => setOrdersFilter('regular')}
                  className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${
                    ordersFilter === 'regular' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  Orders ({regularOrdersCount})
                </button>
                <button
                  onClick={() => setOrdersFilter('pre-order')}
                  className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${
                    ordersFilter === 'pre-order' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  Pre-Order Deposits ({preOrderOrdersCount})
                </button>
                <button
                  onClick={() => setOrdersFilter('balance')}
                  className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${
                    ordersFilter === 'balance' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  Balance Payments ({balanceOrdersCount})
                </button>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="border border-white/10 p-20 text-center">
                  <ShoppingBag className="mx-auto text-white/10 mb-6" size={48} />
                  <h2 className="text-2xl font-display font-bold uppercase mb-2">No orders found</h2>
                  <p className="text-white/40 text-sm uppercase tracking-widest mb-8">No orders match this filter yet.</p>
                  <Link href="/current-stock" className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest hover:gap-4 transition-all">
                    Start Shopping <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => {
                    const typeLabel = orderTypeLabel(order);
                    const typeStyle =
                      typeLabel === 'Balance Payment'
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        : typeLabel === 'Pre-Order Deposit'
                          ? 'bg-accent/10 border-accent/30 text-accent'
                          : 'bg-white/5 border-white/10 text-white/40';
                    const statusDisplay = ORDER_STATUS_DISPLAY[order.order_status] || ORDER_STATUS_DISPLAY.pending;
                    return (
                    <div key={order.id} className="glass border border-white/10 p-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl rounded-full -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                        {/* Order Info */}
                        <div className="space-y-6">
                          <div>
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Order Type</p>
                            <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${typeStyle}`}>
                              {typeLabel}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Order ID</p>
                            <p className="text-sm font-mono font-bold text-white tracking-widest">#{order.id.slice(-8)}</p>
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

          {activeTab === 'balance-payments' && (
            <motion.div
              key="balance-payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Pending balance payments - pre-orders awaiting payment */}
              {pendingBalancePreOrders.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-accent flex items-center gap-2">
                    <AlertCircle size={14} /> Balance Due
                  </h2>
                  {pendingBalancePreOrders.map((po: any) => {
                    return (
                      <div key={po._id} className="border border-accent/30 bg-accent/5 p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl rounded-full -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="flex flex-col md:flex-row items-center gap-6 relative">
                          {/* Product image */}
                          {(po.productImage || po.image) && (
                            <div className="relative w-full md:w-32 aspect-[16/9] md:aspect-square overflow-hidden bg-black flex-shrink-0">
                              <Image
                                src={po.productImage || po.image}
                                alt={po.productName || po.name || 'Product'}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {/* Product info */}
                          <div className="flex-1 text-center md:text-left space-y-2">
                            <h3 className="text-xl font-display font-bold uppercase tracking-tight">
                              {po.productName || po.name}
                            </h3>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] uppercase tracking-widest">
                              <span className="text-white/40">
                                Total: ₹{po.totalPrice.toLocaleString()}
                              </span>
                              <span className="text-green-400">
                                Deposit Paid: ₹{po.depositPaid.toLocaleString()}
                              </span>
                              <span className="text-accent font-bold">
                                Balance: ₹{po.balanceDue.toLocaleString()} + ₹{po.shippingCharges} shipping
                              </span>
                            </div>
                            <p className="text-[10px] text-accent uppercase tracking-widest font-bold">
                              Stock has arrived — pay balance to receive your order
                            </p>
                            {po.balancePaymentStatus === 'rejected' && (
                              <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold">
                                Previous payment was rejected — please re-submit.
                              </p>
                            )}
                          </div>

                          {/* Pay button */}
                          <div className="flex flex-col items-center gap-2 flex-shrink-0">
                            <p className="text-2xl font-display font-bold text-accent">
                              ₹{po.totalToPay.toLocaleString()}
                            </p>
                            <Link
                              href={`/pay/${po._id}`}
                              className="bg-accent text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2 glow-orange"
                            >
                              <CreditCard size={14} /> Pay Now &rarr;
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Balance payments submitted / verified */}
              {completedBalancePreOrders.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
                    <CheckCircle size={14} /> Payments Received
                  </h2>
                  <div className="space-y-6">
                    {completedBalancePreOrders.map((po: any) => {
                      const statusKey = po.balanceState === 'verified' ? 'balance_verified' : 'balance_submitted';
                      const statusDisplay = PO_STATUS_DISPLAY[statusKey] || PO_STATUS_DISPLAY.balance_submitted;
                      const paidAt = po.balancePaidAt ? new Date(po.balancePaidAt).toLocaleDateString() : null;
                      const amountPaid = po.balanceAmount ?? po.totalToPay;

                      return (
                        <div key={po._id} className="glass border border-blue-500/20 p-8 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                            <div className="space-y-4">
                              <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Pre-Order</p>
                              <div className="flex items-center gap-4">
                                {(po.productImage || po.image) && (
                                  <div className="relative w-14 h-14 bg-white/5 rounded-sm overflow-hidden flex-shrink-0">
                                    <Image
                                      src={po.productImage || po.image}
                                      alt={po.productName || po.name || 'Product'}
                                      fill
                                      className="object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-display font-bold uppercase tracking-tight">
                                    {po.productName || po.name}
                                  </p>
                                  {(po.brand || po.scale) && (
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                      {[po.brand, po.scale].filter(Boolean).join(' • ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Payment Status</p>
                                <span className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border flex items-center gap-2 w-fit ${statusDisplay.bg} ${statusDisplay.border} ${statusDisplay.color}`}>
                                  {po.balanceState === 'verified' && <CheckCircle size={12} />}
                                  {po.balanceState === 'submitted' && <Loader2 size={12} className="animate-spin" />}
                                  {statusDisplay.label}
                                </span>
                              </div>
                              <div>
                                <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Amount Paid</p>
                                <p className="text-3xl font-display font-bold text-white">₹{amountPaid.toLocaleString()}</p>
                                {paidAt && (
                                  <div className="flex items-center gap-2 text-white/60 mt-2">
                                    <Calendar size={12} className="text-blue-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{paidAt}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              {po.balanceTransactionId && (
                                <div>
                                  <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Transaction ID</p>
                                  <div className="flex items-center gap-2 text-blue-400">
                                    <CreditCard size={14} />
                                    <span className="text-sm font-mono font-bold">{po.balanceTransactionId}</span>
                                  </div>
                                </div>
                              )}
                              {po.balancePaymentProofUrl && (
                                <div>
                                  <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Payment Proof</p>
                                  <a
                                    href={po.balancePaymentProofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                                  >
                                    View Screenshot <ExternalLink size={12} />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed balance payment orders */}
              {(() => {
                const balanceOrders = orders.filter((order) => isBalanceOrder(order));
                if (balanceOrders.length > 0) {
                  return (
                    <div className="space-y-4">
                      {(pendingBalancePreOrders.length > 0 || completedBalancePreOrders.length > 0) && (
                        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2 mt-4">
                          <CheckCircle size={14} /> Completed Payments
                        </h2>
                      )}
                      <div className="space-y-6">
                        {balanceOrders.map((order) => {
                          const statusDisplay = ORDER_STATUS_DISPLAY[order.order_status] || ORDER_STATUS_DISPLAY.pending;
                          return (
                            <div key={order.id} className="glass border border-blue-500/20 p-8 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
                                <div className="space-y-6">
                                  <div>
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Order Type</p>
                                    <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-400">
                                      Balance Payment
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Order ID</p>
                                    <p className="text-sm font-mono font-bold text-white tracking-widest">#{order.id.slice(-8)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Transaction ID</p>
                                    <div className="flex items-center gap-2 text-blue-400">
                                      <CreditCard size={14} />
                                      <span className="text-sm font-mono font-bold">{order.transaction_id}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-6">
                                  <div>
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Payment Status</p>
                                    <span className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border flex items-center gap-2 w-fit ${statusDisplay.bg} ${statusDisplay.border} ${statusDisplay.color}`}>
                                      {order.order_status === 'completed' && <CheckCircle size={12} />}
                                      {order.order_status === 'cancelled' && <XCircle size={12} />}
                                      {order.order_status === 'pending' && <Loader2 size={12} className="animate-spin" />}
                                      {statusDisplay.label}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-2">Amount Paid</p>
                                    <p className="text-3xl font-display font-bold text-white">₹{order.totalAmount.toLocaleString()}</p>
                                  </div>
                                </div>

                                <div className="space-y-6">
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
                                      className="inline-flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
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
                    </div>
                  );
                }
                return null;
              })()}

              {/* Empty state when nothing at all */}
              {!hasAnyBalanceActivity && (
                <div className="border border-white/10 p-20 text-center">
                  <CreditCard className="mx-auto text-white/10 mb-6" size={48} />
                  <h2 className="text-2xl font-display font-bold uppercase mb-2">No balance payments</h2>
                  <p className="text-white/40 text-sm uppercase tracking-widest mb-8">Balance payments will appear here when your pre-order stock arrives.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
