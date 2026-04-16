'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Plus, Trash2, Edit2, Tag, Loader2 } from 'lucide-react';
import CouponForm from './CouponForm';
import ConfirmModal from './ConfirmModal';

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function DiscountBadge({ coupon }: { coupon: any }) {
  if (coupon.discountType === 'percentage') {
    return (
      <span className="bg-accent/10 text-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
        {coupon.discountValue}% Off
      </span>
    );
  }
  if (coupon.discountType === 'flat') {
    return (
      <span className="bg-blue-500/10 text-blue-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
        ₹{coupon.discountValue} Off
      </span>
    );
  }
  return (
    <span className="bg-green-500/10 text-green-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
      Free Shipping
    </span>
  );
}

export default function CouponManager({ workosUserId }: { workosUserId: string }) {
  const coupons = useQuery(api.coupons.list, { workosUserId });
  const stats = useQuery(api.coupons.getStats, { workosUserId });
  const toggleActive = useMutation(api.coupons.toggleActive);
  const removeCoupon = useMutation(api.coupons.remove);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    variant: 'danger' | 'default';
    onConfirm: () => void;
  } | null>(null);

  const handleEdit = (coupon: any) => {
    setEditCoupon(coupon);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditCoupon(null);
    setIsFormOpen(true);
  };

  const handleDelete = (coupon: any) => {
    const msg = coupon.timesUsed > 0
      ? `"${coupon.code}" has been used ${coupon.timesUsed} time(s). It will be deactivated instead of deleted.`
      : `Delete coupon "${coupon.code}"? This action cannot be undone.`;

    setConfirmModal({
      title: coupon.timesUsed > 0 ? 'Deactivate Coupon' : 'Delete Coupon',
      message: msg,
      variant: 'danger',
      onConfirm: async () => {
        await removeCoupon({ workosUserId, id: coupon._id as Id<'coupons'> });
        setConfirmModal(null);
      },
    });
  };

  const handleToggle = async (coupon: any) => {
    await toggleActive({ workosUserId, id: coupon._id as Id<'coupons'> });
  };

  if (coupons === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header + Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-2">
            Coupon Codes
          </h2>
          {stats && (
            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <span>
                Active: <span className="text-green-400">{stats.activeCoupons}</span>
              </span>
              <span>
                Redemptions (month): <span className="text-accent">{stats.monthlyRedemptions}</span>
              </span>
              <span>
                Top Code: <span className="text-white/60 font-mono">{stats.topCode}</span>
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleCreate}
          className="bg-accent text-white px-8 py-3 font-display font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Create Coupon
        </button>
      </div>

      {/* Coupon List */}
      {coupons.length === 0 ? (
        <div className="text-center py-24 border border-white/5 carbon-pattern">
          <Tag size={32} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
            No coupons yet. Create your first coupon to start offering discounts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <div
              key={coupon._id}
              className={`glass p-6 flex flex-col md:flex-row items-start md:items-center gap-6 ${
                !coupon.isActive ? 'opacity-50' : ''
              }`}
            >
              {/* Code + Type */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg font-mono font-bold tracking-wider">
                    {coupon.code}
                  </span>
                  <DiscountBadge coupon={coupon} />
                </div>
                {coupon.description && (
                  <p className="text-[10px] text-white/30 uppercase tracking-widest truncate">
                    {coupon.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  {coupon.minOrderAmount && (
                    <span>Min: ₹{coupon.minOrderAmount}</span>
                  )}
                  {coupon.maxDiscountAmount && (
                    <span>Max: ₹{coupon.maxDiscountAmount}</span>
                  )}
                  {coupon.applicableBrands && coupon.applicableBrands.length > 0 && (
                    <span>{coupon.applicableBrands.join(', ')}</span>
                  )}
                  {coupon.applicableCategories && coupon.applicableCategories.length > 0 && (
                    <span>{coupon.applicableCategories.join(', ')}</span>
                  )}
                </div>
              </div>

              {/* Usage */}
              <div className="text-center min-w-[100px]">
                <p className="text-sm font-mono font-bold">
                  {coupon.timesUsed}
                  {coupon.usageLimit !== undefined ? ` / ${coupon.usageLimit}` : ''}
                </p>
                <p className="text-[8px] text-white/30 uppercase tracking-widest">
                  {coupon.usageLimit !== undefined ? 'used' : 'used (unlimited)'}
                </p>
              </div>

              {/* Validity */}
              <div className="text-center min-w-[120px]">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                  {coupon.validFrom || coupon.validUntil
                    ? `${coupon.validFrom ? formatDate(coupon.validFrom) : '...'} — ${coupon.validUntil ? formatDate(coupon.validUntil) : '...'}`
                    : 'Always valid'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Active Toggle */}
                <button
                  onClick={() => handleToggle(coupon)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    coupon.isActive ? 'bg-green-500' : 'bg-white/20'
                  }`}
                  title={coupon.isActive ? 'Deactivate' : 'Activate'}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      coupon.isActive ? 'left-[26px]' : 'left-0.5'
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleEdit(coupon)}
                  className="p-3 bg-white/5 hover:bg-accent hover:text-white transition-all rounded-full"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={() => handleDelete(coupon)}
                  className="p-3 bg-white/5 hover:bg-red-500 hover:text-white transition-all rounded-full"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CouponForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditCoupon(null);
        }}
        editCoupon={editCoupon}
        workosUserId={workosUserId}
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
