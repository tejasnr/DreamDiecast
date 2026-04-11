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
  Link2,
  Check,
  X,
  ExternalLink,
  Eye,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import AddPreOrderModal from './AddPreOrderModal';
import { PO_STATUS_DISPLAY } from '@/lib/constants';

const ADMIN_STATUSES = [
  'deposit_submitted',
  'deposit_verified',
  'waiting_for_stock',
  'stock_arrived',
  'balance_submitted',
  'balance_verified',
  'shipped',
  'delivered',
  'fully_paid_shipped',
  'cancelled',
] as const;

interface PreOrderTableProps {
  preOrders: any[];
}

export default function PreOrderTable({ preOrders }: PreOrderTableProps) {
  const { user } = useAuth();
  const updateStatus = useMutation(api.preOrders.updateStatus);
  const updateBalancePaymentStatus = useMutation(api.preOrders.updateBalancePaymentStatus);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'balance'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleStatusChange = async (preOrderId: string, newStatus: string) => {
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

  const handleBalanceVerify = async (preOrderId: string, action: 'verified' | 'rejected') => {
    setUpdatingId(preOrderId);
    try {
      await updateBalancePaymentStatus({
        workosUserId: user?.workosUserId,
        preOrderId: preOrderId as Id<'preOrders'>,
        balancePaymentStatus: action,
      });
    } catch (err) {
      console.error('Error updating balance status:', err);
      alert('Failed to update balance payment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const generatePaymentLink = (po: any) => {
    return `https://dreamdiecast.in/pay/${po._id}`;
  };

  const handleSendPaymentLink = (po: any) => {
    const paymentUrl = generatePaymentLink(po);
    const balanceDue = (po.totalPrice || 0) - (po.depositPaid || 0);
    const total = balanceDue + 100;
    const phone = (po.customerPhone || '').replace(/[^0-9]/g, '');

    const message = encodeURIComponent(
      `Hi ${po.customerName}! 🚗\n\nGreat news — your *${po.productName}* has arrived at DreamDiecast!\n\nBalance Due: ₹${balanceDue.toLocaleString()}\nShipping: ₹100\nTotal to Pay: ₹${total.toLocaleString()}\n\nPay here: ${paymentUrl}\n\nThank you for your patience! 🙏`
    );

    // Copy payment link to clipboard
    navigator.clipboard.writeText(paymentUrl);
    setCopiedId(po._id);
    setTimeout(() => setCopiedId(null), 3000);

    // Open WhatsApp
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  const generateMailtoLink = (po: any) => {
    const balanceDue = (po.totalPrice || 0) - (po.depositPaid || 0);
    const paymentUrl = generatePaymentLink(po);
    const subject = encodeURIComponent(`Your ${po.productName} Pre-Order - Balance Due`);
    const body = encodeURIComponent(
      `Hi ${po.customerName},\n\nYour ${po.productName} has arrived! Please pay the remaining balance of ₹${balanceDue.toLocaleString()} + ₹100 shipping.\n\nPay here: ${paymentUrl}\n\nThank you,\nDream Diecast`
    );
    return `mailto:${po.customerEmail || ''}?subject=${subject}&body=${body}`;
  };

  const balancePendingOrders = preOrders.filter(
    (po: any) => po.balancePaymentStatus === 'submitted'
  );

  const displayOrders = activeTab === 'balance' ? balancePendingOrders : preOrders;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold uppercase tracking-tight flex items-center gap-2">
          <ShoppingBag size={20} className="text-accent" /> Pre-Order Tracking
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-0.5 rounded-sm border border-white/10">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
                activeTab === 'all' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              All ({preOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('balance')}
              className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all relative ${
                activeTab === 'balance' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              Balance Payments
              {balancePendingOrders.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[7px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                  {balancePendingOrders.length}
                </span>
              )}
            </button>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-accent text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Add PO
          </button>
        </div>
      </div>

      {displayOrders.length === 0 ? (
        <div className="text-center py-16 border border-white/5 carbon-pattern">
          <p className="text-white/40 uppercase tracking-widest text-[10px]">
            {activeTab === 'balance' ? 'No pending balance payments.' : 'No pre-orders found.'}
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
              {displayOrders.map((po: any) => {
                const statusConfig =
                  PO_STATUS_DISPLAY[po.normalizedStatus] ||
                  PO_STATUS_DISPLAY['waiting_for_stock'];
                const balanceDue = (po.totalPrice || 0) - (po.depositPaid || 0);
                const hasPhone = !!po.customerPhone;
                const hasEmail = !!po.customerEmail;
                const isStockArrived = po.normalizedStatus === 'stock_arrived';
                const isBalanceSubmitted = po.normalizedStatus === 'balance_submitted' || po.balancePaymentStatus === 'submitted';

                return (
                  <tr
                    key={po._id}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                      isBalanceSubmitted ? 'bg-yellow-500/5' : ''
                    }`}
                  >
                    {/* Customer */}
                    <td className="py-3 px-3">
                      <div className="text-sm font-medium">{po.customerName}</div>
                      {po.customerPhone && (
                        <div className="text-[10px] text-white/30 font-mono">{po.customerPhone}</div>
                      )}
                      {po.source && (
                        <div className="text-[9px] text-accent/60 font-mono uppercase">{po.source}</div>
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
                          <div className="text-xs font-medium truncate max-w-[150px]">{po.productName}</div>
                          {po.productSku && (
                            <div className="text-[9px] text-white/30 font-mono">{po.productSku}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-3 text-xs font-mono">₹{(po.totalPrice || 0).toLocaleString()}</td>

                    {/* Deposit */}
                    <td className="py-3 px-3 text-xs font-mono text-green-400">₹{(po.depositPaid || 0).toLocaleString()}</td>

                    {/* Balance */}
                    <td className="py-3 px-3 text-xs font-mono">
                      <span className={balanceDue > 0 ? 'text-orange-400' : 'text-green-400'}>
                        ₹{balanceDue.toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <div className="relative">
                        {updatingId === po._id ? (
                          <Loader2 className="animate-spin text-accent" size={16} />
                        ) : (
                          <div className="relative inline-block">
                            <select
                              value={po.normalizedStatus}
                              onChange={(e) => handleStatusChange(po._id, e.target.value)}
                              className={`appearance-none text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 pr-7 border rounded-sm cursor-pointer ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border} bg-transparent outline-none`}
                            >
                              {ADMIN_STATUSES.map((s) => (
                                <option key={s} value={s} className="bg-[#0a0a0a] text-white">
                                  {PO_STATUS_DISPLAY[s]?.adminLabel || s}
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
                        {/* Balance payment verification buttons */}
                        {isBalanceSubmitted && (
                          <>
                            {po.balancePaymentProofUrl && (
                              <a
                                href={po.balancePaymentProofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 rounded-sm transition-all"
                                title="View payment proof"
                              >
                                <Eye size={14} />
                              </a>
                            )}
                            <button
                              onClick={() => handleBalanceVerify(po._id, 'verified')}
                              className="p-2 bg-green-500/10 hover:bg-green-500/30 text-green-400 rounded-sm transition-all"
                              title="Verify balance payment"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleBalanceVerify(po._id, 'rejected')}
                              className="p-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-sm transition-all"
                              title="Reject balance payment"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}

                        {/* Send Payment Link button for stock_arrived */}
                        {isStockArrived && !isBalanceSubmitted && (
                          <button
                            onClick={() => handleSendPaymentLink(po)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/30 text-green-400 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all"
                            title="Send payment link via WhatsApp"
                          >
                            <Link2 size={12} />
                            {copiedId === po._id ? 'Copied!' : 'Payment Link'}
                          </button>
                        )}

                        {/* WhatsApp / Email buttons for other statuses */}
                        {!isStockArrived && !isBalanceSubmitted && (
                          <>
                            {hasPhone ? (
                              <a
                                href={`https://wa.me/${(po.customerPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${po.customerName}, update regarding your ${po.productName} pre-order from DreamDiecast.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-green-500/10 hover:bg-green-500/30 text-green-400 rounded-sm transition-all"
                                title="Notify via WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </a>
                            ) : (
                              <div className="p-2 bg-white/5 text-white/10 rounded-sm cursor-not-allowed" title="No phone number">
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
                              <div className="p-2 bg-white/5 text-white/10 rounded-sm cursor-not-allowed" title="No email">
                                <Mail size={14} />
                              </div>
                            )}
                          </>
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

      <AddPreOrderModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
