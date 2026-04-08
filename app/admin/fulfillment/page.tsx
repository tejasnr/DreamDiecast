'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  Package,
  User,
  MapPin,
  Phone,
  Truck,
  ShoppingBag
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function FulfillmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const orders = useQuery(
    api.orders.listForFulfillment,
    user?.role === 'admin' ? { workosUserId: user.workosUserId } : 'skip'
  );
  const markCompleted = useMutation(api.orders.markCompleted);

  const isAdmin = user?.role === 'admin';
  const loading = authLoading || (isAdmin && orders === undefined);

  if (!authLoading && (!user || !isAdmin)) {
    router.push('/');
    return null;
  }

  const markAsCompleted = async (orderId: string) => {
    try {
      await markCompleted({
        workosUserId: user!.workosUserId,
        orderId: orderId as Id<'orders'>,
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (!isAdmin) return null;

  const orderList = orders ?? [];

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-4 uppercase tracking-widest text-[10px] font-bold">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <h1 className="text-5xl md:text-8xl font-display font-bold uppercase tracking-tighter leading-none">
              Order <span className="text-white/20">Fulfillment</span>
            </h1>
            <p className="text-accent text-[10px] font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
              <Truck size={14} /> {orderList.length} Orders Ready for Packaging
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {orderList.length === 0 ? (
            <div className="text-center py-24 border border-white/5 carbon-pattern">
              <Package className="mx-auto text-white/10 mb-6" size={48} />
              <p className="text-white/40 uppercase tracking-widest font-mono">No orders pending fulfillment.</p>
              <Link href="/admin/orders" className="text-accent text-[10px] font-bold uppercase tracking-widest mt-4 inline-block hover:underline">
                Check all orders
              </Link>
            </div>
          ) : (
            orderList.map((order: any) => {
              const orderId = order._id as string;

              return (
                <div key={orderId} className="glass p-8 border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl rounded-full -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
                    {/* Order Info */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-1">Order ID</p>
                        <p className="text-sm font-mono font-bold text-white tracking-widest">#{orderId.slice(-8)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-1">Customer</p>
                        <div className="flex items-center gap-2 text-white/60">
                          <User size={14} className="text-accent" />
                          <span className="text-xs font-bold truncate">{order.userEmail}</span>
                        </div>
                      </div>
                      <div className="pt-4">
                        <span className="px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded-full border bg-accent/10 border-accent/20 text-accent">
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>

                    {/* Shipping Details - CRITICAL FOR PACKAGING */}
                    <div className="lg:col-span-2 space-y-4 bg-white/5 p-6 border border-white/5 rounded-sm">
                      <p className="text-[10px] text-accent uppercase tracking-widest font-bold mb-1 flex items-center gap-2">
                        <MapPin size={12} /> Shipping Label Information
                      </p>
                      {order.shippingDetails ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[8px] text-white/20 uppercase tracking-widest mb-1">Recipient Name</p>
                              <p className="text-sm font-bold text-white uppercase">{order.shippingDetails.name}</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-white/20 uppercase tracking-widest mb-1">Contact Number</p>
                              <p className="text-sm font-bold text-white flex items-center gap-2">
                                <Phone size={14} className="text-accent" /> {order.shippingDetails.phone}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[8px] text-white/20 uppercase tracking-widest mb-1">Full Address</p>
                            <p className="text-sm text-white/80 leading-relaxed uppercase">
                              {order.shippingDetails.address}<br />
                              {order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-red-500 font-bold uppercase tracking-widest">Missing Shipping Details!</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 justify-center">
                      <button
                        onClick={() => markAsCompleted(orderId)}
                        className="w-full bg-accent text-white py-5 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all glow-orange flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} /> Mark as Shipped
                      </button>
                      <p className="text-[8px] text-white/20 text-center uppercase tracking-widest">
                        This will update order status to &quot;Completed&quot;
                      </p>
                    </div>
                  </div>

                  {/* Items to Pack */}
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                      <ShoppingBag size={12} /> Items to Pack ({order.items.length})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {order.items.map((item: any, idx: any) => (
                        <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-sm border border-white/5 group/item">
                          <div className="relative w-16 h-12 bg-black rounded-sm overflow-hidden flex-shrink-0">
                            <Image src={item.image} alt={item.name} fill className="object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-white uppercase truncate">{item.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[8px] text-accent font-bold uppercase tracking-widest bg-accent/10 px-2 py-0.5">Qty: {item.quantity}</span>
                              <span className="text-[8px] text-white/40 uppercase tracking-widest">{item.scale}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
