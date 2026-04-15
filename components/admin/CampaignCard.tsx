'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  Users,
  RotateCcw,
} from 'lucide-react';
import ProcurementStepper, {
  type ProcurementStage,
} from './ProcurementStepper';

interface CampaignProduct {
  _id: Id<'products'>;
  name: string;
  sku: string;
  image: string;
  brand: string;
  scale: string;
  allocatedStock: number | undefined;
  unitsSold: number;
  procurementStage: ProcurementStage | undefined;
  totalDepositsCollected: number;
  totalLockedBalances: number;
  totalFinalPrice: number;
  balanceRequestsSent: boolean;
  status: string | undefined;
}

interface CampaignCardProps {
  product: CampaignProduct;
  preOrderCount: number;
  pendingBalanceCount: number;
  verifiedBalanceCount: number;
  workosUserId: string;
  onStageChange: (productId: Id<'products'>, stage: ProcurementStage) => void;
  onRequestBalances: (productId: Id<'products'>) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_LABELS: Record<string, string> = {
  deposit_submitted: 'Deposit Submitted',
  deposit_verified: 'Deposit Verified',
  waiting_for_stock: 'Waiting for Stock',
  stock_arrived: 'Stock Arrived',
  balance_submitted: 'Balance Submitted',
  balance_verified: 'Balance Verified',
  shipped: 'Shipped',
  delivered: 'Delivered',
  fully_paid_shipped: 'Fully Paid',
  cancelled: 'Cancelled',
  pending: 'Pending',
  confirmed: 'Confirmed',
  arrived: 'Arrived',
};

export default function CampaignCard({
  product,
  preOrderCount,
  pendingBalanceCount,
  verifiedBalanceCount,
  workosUserId,
  onStageChange,
  onRequestBalances,
}: CampaignCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Only fetch detail when expanded
  const detail = useQuery(
    api.campaigns.getCampaignDetail,
    expanded
      ? { workosUserId, productId: product._id }
      : 'skip'
  );

  const isSoldOut =
    product.allocatedStock !== undefined &&
    product.unitsSold >= product.allocatedStock;

  const stockDisplay =
    product.allocatedStock !== undefined
      ? `${product.unitsSold} / ${product.allocatedStock}`
      : `${product.unitsSold} / ∞`;

  const stockPercent =
    product.allocatedStock !== undefined && product.allocatedStock > 0
      ? Math.min(100, Math.round((product.unitsSold / product.allocatedStock) * 100))
      : 0;

  const canRequestBalances =
    product.procurementStage === 'inventory_ready' &&
    !product.balanceRequestsSent &&
    pendingBalanceCount > 0;

  return (
    <div className="border border-white/10 hover:border-white/20 transition-all">
      {/* Header */}
      <div className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="relative w-12 h-12 bg-white/5 overflow-hidden shrink-0">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-white/10" />
            )}
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-display font-bold uppercase tracking-tight truncate">
                {product.name}
              </h3>
              {isSoldOut && (
                <span className="text-[9px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400 px-2 py-0.5 shrink-0">
                  Sold Out
                </span>
              )}
              {product.status === 'unlisted' && (
                <span className="text-[9px] font-bold uppercase tracking-widest bg-zinc-500/20 text-zinc-400 px-2 py-0.5 shrink-0">
                  Unlisted
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-white/40 font-mono mt-1">
              <span>{product.brand}</span>
              <span>{product.scale}</span>
              {product.sku && <span>SKU: {product.sku}</span>}
            </div>
          </div>
        </div>

        {/* Stock + Financial Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Stock bar */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Stock
              </span>
              <span className="text-sm font-mono text-white/70">
                {stockDisplay} sold
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isSoldOut ? 'bg-red-500' : 'bg-accent'
                }`}
                style={{ width: `${stockPercent}%` }}
              />
            </div>
            {detail?.waitlistCount !== undefined && detail.waitlistCount > 0 && (
              <p className="text-[10px] font-mono text-white/30 mt-1 flex items-center gap-1">
                <Users size={10} /> {detail.waitlistCount} on waitlist
              </p>
            )}
          </div>

          {/* Pending balance */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Pending Balance
            </span>
            <p
              className={`text-xl font-mono font-bold ${
                product.totalLockedBalances > 0
                  ? 'text-amber-400'
                  : 'text-white/20'
              }`}
            >
              {formatCurrency(product.totalLockedBalances)}
            </p>
            <div className="flex gap-3 text-[10px] font-mono text-white/30">
              <span>Deposits: {formatCurrency(product.totalDepositsCollected)}</span>
              <span>
                Balances: {verifiedBalanceCount}/{preOrderCount} verified
              </span>
            </div>
          </div>
        </div>

        {/* Procurement Stepper */}
        <ProcurementStepper
          currentStage={product.procurementStage}
          onStageClick={(stage) => onStageChange(product._id, stage)}
        />

        {/* Action Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Request Balances button */}
            {product.balanceRequestsSent ? (
              <button
                onClick={() => onRequestBalances(product._id)}
                className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all"
              >
                <CheckCircle2 size={14} /> Balances Requested
                <RotateCcw size={12} className="ml-1 text-white/30" />
              </button>
            ) : (
              <button
                onClick={() => canRequestBalances && onRequestBalances(product._id)}
                disabled={!canRequestBalances}
                className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  canRequestBalances
                    ? 'bg-accent text-white hover:bg-white hover:text-black'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                <Send size={14} /> Request Pending Balances
              </button>
            )}
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-all"
          >
            View Customers ({preOrderCount})
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Customer List */}
      {expanded && (
        <div className="border-t border-white/10 p-6">
          {detail === undefined ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-white/5 rounded" />
              ))}
            </div>
          ) : detail.preOrders.length === 0 ? (
            <p className="text-white/30 text-sm font-mono">
              No pre-orders for this product.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-white/30 border-b border-white/10">
                    <th className="text-left py-2 pr-4">Name</th>
                    <th className="text-left py-2 pr-4">Email</th>
                    <th className="text-right py-2 pr-4">Deposit</th>
                    <th className="text-right py-2 pr-4">Balance Due</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.preOrders.map((po) => (
                    <tr
                      key={po._id}
                      className={`border-b border-white/5 ${
                        po.status === 'cancelled' ? 'opacity-40' : ''
                      }`}
                    >
                      <td className="py-2 pr-4 font-mono text-white/70">
                        {po.customerName}
                      </td>
                      <td className="py-2 pr-4 font-mono text-white/40 text-xs">
                        {po.customerEmail}
                      </td>
                      <td className="py-2 pr-4 font-mono text-white/60 text-right">
                        {formatCurrency(po.depositPaid)}
                      </td>
                      <td className="py-2 pr-4 font-mono text-right">
                        <span
                          className={
                            po.balancePaymentStatus === 'verified'
                              ? 'text-green-400'
                              : 'text-amber-400'
                          }
                        >
                          {formatCurrency(po.balanceAmount)}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          {STATUS_LABELS[po.status] ?? po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
