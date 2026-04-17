'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useGarage } from '@/hooks/useGarage';
import { motion } from 'motion/react';
import { Loader2, Clock, Calendar, ArrowRight, CreditCard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import PreOrderTimeline from '@/components/PreOrderTimeline';
import { FLAT_SHIPPING_RATE, PO_STATUS_DISPLAY } from '@/lib/constants';

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

export default function MyPreOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading: itemsLoading } = useGarage();

  // Also fetch actual pre-orders from convex for richer data
  const preOrders = useQuery(
    api.preOrders.byUser,
    user
      ? {
          userId: user.convexUserId as Id<'users'>,
          email: user.email,
        }
      : 'skip'
  );

  const preOrderItems = items.filter(item => item.status === 'pre-ordered' || item.status === 'arrived');

  if (authLoading || itemsLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

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

    return {
      ...po,
      effectiveStatus,
      totalPrice,
      depositPaid,
      balanceDue,
      shippingCharges,
      totalToPay,
    };
  });

  // Build a map of productId -> preOrder for enriched data
  const poByProduct = new Map<string, any>();
  for (const po of computedPreOrders) {
    poByProduct.set(po.productId as string, po);
  }

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-[1px] bg-accent"></span>
              <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">Pending Arrivals</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-display font-bold uppercase tracking-tighter leading-none">
              Pre-<span className="text-white/20">Orders</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <Link href="/garage" className="px-6 py-3 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
              Owned ({items.filter(i => i.status === 'owned').length})
            </Link>
            <Link href="/garage/pre-orders" className="px-6 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest">
              Pre-Orders ({preOrderItems.length})
            </Link>
          </div>
        </div>

        {preOrderItems.length === 0 ? (
          <div className="border border-white/10 p-20 text-center">
            <Clock className="mx-auto text-white/10 mb-6" size={48} />
            <h2 className="text-2xl font-display font-bold uppercase mb-2">No active pre-orders</h2>
            <p className="text-white/40 text-sm uppercase tracking-widest mb-8">You haven&apos;t secured any upcoming releases yet.</p>
            <Link href="/pre-orders" className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest hover:gap-4 transition-all">
              View The Vault <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {preOrderItems.map((item, index) => {
              const po = poByProduct.get(item.productId);
              const poStatus = po?.effectiveStatus ?? mapGarageStatusToPOStatus(item.status, po?.status);
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

                      {/* Timeline stepper */}
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
      </div>
    </main>
  );
}
