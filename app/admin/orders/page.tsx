'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  User,
  CreditCard,
  Trash2,
  Search,
  MapPin,
  Phone,
  Truck
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const orders = useQuery(
    api.orders.listAll,
    user?.role === 'admin' ? { workosUserId: user.workosUserId } : 'skip'
  );
  const updateStatus = useMutation(api.orders.updateStatus);
  const removeOrder = useMutation(api.orders.remove);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isAdmin = user?.role === 'admin';
  const loading = authLoading || (isAdmin && orders === undefined);

  if (!authLoading && (!user || !isAdmin)) {
    router.push('/');
    return null;
  }

  const updateOrderStatus = async (orderId: string, paymentStatus: string, orderStatus: string) => {
    try {
      await updateStatus({
        workosUserId: user!.workosUserId,
        orderId: orderId as Id<'orders'>,
        paymentStatus: paymentStatus as 'submitted' | 'verified' | 'rejected',
        orderStatus: orderStatus as 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled',
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status.');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await removeOrder({
        workosUserId: user!.workosUserId,
        orderId: orderId as Id<'orders'>,
      });
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  const orderList = orders ?? [];
  const filteredOrders = orderList.filter((order: any) => {
    const orderId = order._id as string;
    const matchesSearch =
      orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-4 uppercase tracking-widest text-[10px] font-bold">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <h1 className="text-5xl md:text-8xl font-display font-bold uppercase tracking-tighter leading-none">
              Order <span className="text-white/20">Management</span>
            </h1>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/fulfillment"
              className="bg-accent/10 text-accent border border-accent/20 px-6 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all rounded-sm flex items-center gap-2"
            >
              <Truck size={14} /> Go to Fulfillment
            </Link>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input
                type="text"
                placeholder="Search Orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 pl-12 pr-6 py-4 text-xs uppercase tracking-widest outline-none focus:border-accent transition-all rounded-sm font-bold w-full md:w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/5 border border-white/10 px-6 py-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-accent transition-all rounded-sm appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-24 border border-white/5 carbon-pattern">
              <p className="text-white/40 uppercase tracking-widest font-mono">No orders found.</p>
            </div>
          ) : (
            filteredOrders.map((order: any) => {
              const orderId = order._id as string;
              const createdAt = order._creationTime ? new Date(order._creationTime).toLocaleDateString() : 'N/A';

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
                      <div>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-1">Date</p>
                        <div className="flex items-center gap-2 text-white/60">
                          <Clock size={14} className="text-accent" />
                          <span className="text-xs font-bold">{createdAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="space-y-4">
                      <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-1">Shipping Details</p>
                      {order.shippingDetails ? (
                        <div className="space-y-2 text-[10px] text-white/60 uppercase tracking-widest leading-relaxed">
                          <p className="flex items-center gap-2 font-bold text-white">
                            <User size={10} className="text-accent" /> {order.shippingDetails.name}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone size={10} className="text-accent" /> {order.shippingDetails.phone}
                          </p>
                          <p className="flex items-start gap-2">
                            <MapPin size={10} className="text-accent mt-0.5" />
                            <span className="flex-1">
                              {order.shippingDetails.address}, {order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-white/20 italic">No shipping details provided</p>
                      )}
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-1">Transaction ID</p>
                        <div className="flex items-center gap-2 text-accent">
                          <CreditCard size={14} />
                          <span className="text-sm font-mono font-bold">{order.transactionId}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-1">Total Amount</p>
                        <div className="space-y-1">
                          {order.subtotal && (
                            <p className="text-[8px] text-white/40 uppercase tracking-widest">Subtotal: ₹{order.subtotal.toLocaleString()}</p>
                          )}
                          {order.shippingCharges !== undefined && (
                            <p className="text-[8px] text-white/40 uppercase tracking-widest">Shipping: ₹{order.shippingCharges.toLocaleString()}</p>
                          )}
                          <p className="text-2xl font-display font-bold text-white">₹{order.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded-full border ${
                          order.paymentStatus === 'verified' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                          order.paymentStatus === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                          'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                        }`}>
                          {order.paymentStatus}
                        </span>
                        <span className="px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded-full border bg-white/5 border-white/10 text-white/40">
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>

                    {/* Payment Proof */}
                    <div className="space-y-4">
                      <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-1">Payment Proof</p>
                      <div className="relative w-full h-32 bg-white/5 rounded-sm overflow-hidden border border-white/10 group/proof">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.paymentProofUrl}
                          alt="Payment Proof"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/proof:scale-110"
                        />
                        <a
                          href={order.paymentProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/proof:opacity-100 transition-opacity"
                        >
                          <ExternalLink size={20} className="text-white" />
                        </a>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 justify-center">
                      {order.paymentStatus === 'submitted' && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(orderId, 'verified', 'processing')}
                            className="w-full bg-green-500 text-white py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={14} /> Verify Payment
                          </button>
                          <button
                            onClick={() => updateOrderStatus(orderId, 'rejected', 'cancelled')}
                            className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <XCircle size={14} /> Reject Payment
                          </button>
                        </>
                      )}

                      {order.paymentStatus === 'verified' && order.orderStatus !== 'completed' && (
                        <Link
                          href="/admin/fulfillment"
                          className="w-full bg-accent text-white py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                        >
                          <Truck size={14} /> Process in Fulfillment
                        </Link>
                      )}

                      <button
                        onClick={() => deleteOrder(orderId)}
                        className="w-full bg-white/5 text-white/20 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} /> Delete Record
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="flex flex-wrap gap-4">
                      {order.items.map((item: any, idx: any) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/5 p-2 rounded-sm border border-white/5">
                          <div className="relative w-8 h-8 bg-black rounded-sm overflow-hidden">
                            {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" referrerPolicy="no-referrer" />}
                          </div>
                          <div className="text-[8px] uppercase tracking-widest">
                            <p className="font-bold text-white/60 truncate max-w-[100px]">{item.name}</p>
                            <p className="text-accent">Qty: {item.quantity}</p>
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
