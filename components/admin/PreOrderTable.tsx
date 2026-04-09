'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  MessageCircle,
  Mail,
  ChevronDown,
  Plus,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import AddPreOrderModal from './AddPreOrderModal';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  waiting_for_stock: {
    label: 'Waiting for Stock',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  stock_arrived: {
    label: 'Stock Arrived',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  fully_paid_shipped: {
    label: 'Fully Paid / Shipped',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
};

const NEW_STATUSES = [
  'waiting_for_stock',
  'stock_arrived',
  'fully_paid_shipped',
  'cancelled',
] as const;

interface PreOrderTableProps {
  preOrders: any[];
}

export default function PreOrderTable({ preOrders }: PreOrderTableProps) {
  const { user } = useAuth();
  const updateStatus = useMutation(api.preOrders.updateStatus);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleStatusChange = async (
    preOrderId: string,
    newStatus: string
  ) => {
    setUpdatingId(preOrderId);
    try {
      await updateStatus({
        workosUserId: user?.workosUserId,
        preOrderId: preOrderId as Id<'preOrders'>,
        status: newStatus as any,
      });
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const generateWhatsAppLink = (po: any) => {
    const balanceDue = (po.totalPrice || 0) - (po.depositPaid || 0);
    const phone = (po.customerPhone || '').replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hi ${po.customerName}, your ${po.productName} is here! Please pay the remaining balance of ₹${balanceDue.toLocaleString()} to complete shipping.`
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  const generateMailtoLink = (po: any) => {
    const balanceDue = (po.totalPrice || 0) - (po.depositPaid || 0);
    const subject = encodeURIComponent(
      `Your ${po.productName} Pre-Order - Balance Due`
    );
    const body = encodeURIComponent(
      `Hi ${po.customerName},\n\nYour ${po.productName} has arrived! Please pay the remaining balance of ₹${balanceDue.toLocaleString()} to complete shipping.\n\nThank you,\nDream Diecast`
    );
    return `mailto:${po.customerEmail || ''}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold uppercase tracking-tight flex items-center gap-2">
          <ShoppingBag size={20} className="text-accent" /> Pre-Order Tracking
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            {preOrders.length} Orders
          </span>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-accent text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Add PO
          </button>
        </div>
      </div>

      {preOrders.length === 0 ? (
        <div className="text-center py-16 border border-white/5 carbon-pattern">
          <p className="text-white/40 uppercase tracking-widest text-[10px]">
            No pre-orders found.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                {[
                  'Customer',
                  'Product',
                  'Total',
                  'Deposit',
                  'Balance',
                  'Status',
                  'Action',
                ].map((h) => (
                  <th
                    key={h}
                    className="text-[10px] uppercase tracking-widest text-white/30 font-mono font-normal py-3 px-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preOrders.map((po: any) => {
                const status =
                  STATUS_CONFIG[po.normalizedStatus] ||
                  STATUS_CONFIG['waiting_for_stock'];
                const balanceDue =
                  (po.totalPrice || 0) - (po.depositPaid || 0);
                const hasPhone = !!po.customerPhone;
                const hasEmail = !!po.customerEmail;

                return (
                  <tr
                    key={po._id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Customer */}
                    <td className="py-3 px-3">
                      <div className="text-sm font-medium">
                        {po.customerName}
                      </div>
                      {po.customerPhone && (
                        <div className="text-[10px] text-white/30 font-mono">
                          {po.customerPhone}
                        </div>
                      )}
                      {po.source && (
                        <div className="text-[9px] text-accent/60 font-mono uppercase">
                          {po.source}
                        </div>
                      )}
                    </td>

                    {/* Product */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {po.productImage && (
                          <div className="relative w-10 h-10 bg-white/5 overflow-hidden flex-shrink-0">
                            <Image
                              src={po.productImage}
                              alt={po.productName || ''}
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-medium truncate max-w-[150px]">
                            {po.productName}
                          </div>
                          {po.productSku && (
                            <div className="text-[9px] text-white/30 font-mono">
                              {po.productSku}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-3 text-xs font-mono">
                      ₹{(po.totalPrice || 0).toLocaleString()}
                    </td>

                    {/* Deposit */}
                    <td className="py-3 px-3 text-xs font-mono text-green-400">
                      ₹{(po.depositPaid || 0).toLocaleString()}
                    </td>

                    {/* Balance */}
                    <td className="py-3 px-3 text-xs font-mono">
                      <span
                        className={
                          balanceDue > 0
                            ? 'text-orange-400'
                            : 'text-green-400'
                        }
                      >
                        ₹{balanceDue.toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <div className="relative">
                        {updatingId === po._id ? (
                          <Loader2
                            className="animate-spin text-accent"
                            size={16}
                          />
                        ) : (
                          <div className="relative inline-block">
                            <select
                              value={po.normalizedStatus}
                              onChange={(e) =>
                                handleStatusChange(
                                  po._id,
                                  e.target.value
                                )
                              }
                              className={`appearance-none text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 pr-7 border rounded-sm cursor-pointer ${status.color} ${status.bg} ${status.border} bg-transparent outline-none`}
                            >
                              {NEW_STATUSES.map((s) => (
                                <option
                                  key={s}
                                  value={s}
                                  className="bg-[#0a0a0a] text-white"
                                >
                                  {STATUS_CONFIG[s].label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={10}
                              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/30"
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {hasPhone ? (
                          <a
                            href={generateWhatsAppLink(po)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-green-500/10 hover:bg-green-500/30 text-green-400 rounded-sm transition-all"
                            title="Notify via WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </a>
                        ) : (
                          <div
                            className="p-2 bg-white/5 text-white/10 rounded-sm cursor-not-allowed"
                            title="No phone number"
                          >
                            <MessageCircle size={14} />
                          </div>
                        )}
                        {hasEmail ? (
                          <a
                            href={generateMailtoLink(po)}
                            className="p-2 bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 rounded-sm transition-all"
                            title="Notify via Email"
                          >
                            <Mail size={14} />
                          </a>
                        ) : (
                          <div
                            className="p-2 bg-white/5 text-white/10 rounded-sm cursor-not-allowed"
                            title="No email"
                          >
                            <Mail size={14} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddPreOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
