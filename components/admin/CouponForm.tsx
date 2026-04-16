'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Tag } from 'lucide-react';
import { BRANDS, CATEGORIES } from '@/lib/constants';

interface CouponFormProps {
  isOpen: boolean;
  onClose: () => void;
  editCoupon?: any;
  workosUserId: string;
}

export default function CouponForm({ isOpen, onClose, editCoupon, workosUserId }: CouponFormProps) {
  const createCoupon = useMutation(api.coupons.create);
  const updateCoupon = useMutation(api.coupons.update);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat' | 'free_shipping'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [minOrderAmount, setMinOrderAmount] = useState<string>('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [perUserLimit, setPerUserLimit] = useState<string>('1');
  const [validFrom, setValidFrom] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [applicableBrands, setApplicableBrands] = useState<string[]>([]);
  const [applicableCategories, setApplicableCategories] = useState<string[]>([]);
  const [applicableListingTypes, setApplicableListingTypes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (editCoupon) {
      setCode(editCoupon.code);
      setDescription(editCoupon.description || '');
      setDiscountType(editCoupon.discountType);
      setDiscountValue(editCoupon.discountValue?.toString() || '');
      setMinOrderAmount(editCoupon.minOrderAmount?.toString() || '');
      setMaxDiscountAmount(editCoupon.maxDiscountAmount?.toString() || '');
      setUsageLimit(editCoupon.usageLimit?.toString() || '');
      setPerUserLimit(editCoupon.perUserLimit?.toString() || '');
      setValidFrom(editCoupon.validFrom ? new Date(editCoupon.validFrom).toISOString().slice(0, 16) : '');
      setValidUntil(editCoupon.validUntil ? new Date(editCoupon.validUntil).toISOString().slice(0, 16) : '');
      setApplicableBrands(editCoupon.applicableBrands || []);
      setApplicableCategories(editCoupon.applicableCategories || []);
      setApplicableListingTypes(editCoupon.applicableListingTypes || []);
      setIsActive(editCoupon.isActive);
    } else {
      setCode('');
      setDescription('');
      setDiscountType('percentage');
      setDiscountValue('');
      setMinOrderAmount('');
      setMaxDiscountAmount('');
      setUsageLimit('');
      setPerUserLimit('1');
      setValidFrom('');
      setValidUntil('');
      setApplicableBrands([]);
      setApplicableCategories([]);
      setApplicableListingTypes([]);
      setIsActive(true);
    }
    setError(null);
  }, [editCoupon, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        workosUserId,
        description: description || undefined,
        discountType,
        discountValue: discountValue ? Number(discountValue) : undefined,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        perUserLimit: perUserLimit ? Number(perUserLimit) : undefined,
        validFrom: validFrom ? new Date(validFrom).getTime() : undefined,
        validUntil: validUntil ? new Date(validUntil).getTime() : undefined,
        applicableBrands: applicableBrands.length > 0 ? applicableBrands : undefined,
        applicableCategories: applicableCategories.length > 0 ? applicableCategories : undefined,
        applicableListingTypes: applicableListingTypes.length > 0 ? applicableListingTypes : undefined,
        isActive,
      };

      if (editCoupon) {
        await updateCoupon({ ...payload, id: editCoupon._id as Id<'coupons'> });
      } else {
        await createCoupon({ ...payload, code: code.trim().toUpperCase() });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const toggleBrand = (brand: string) => {
    setApplicableBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const toggleCategory = (cat: string) => {
    setApplicableCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleListingType = (lt: string) => {
    setApplicableListingTypes((prev) =>
      prev.includes(lt) ? prev.filter((l) => l !== lt) : [...prev, lt]
    );
  };

  // Live preview
  const previewText = (() => {
    const parts: string[] = [];
    if (code || editCoupon) parts.push(code.toUpperCase() || editCoupon?.code || 'CODE');
    parts.push('—');
    if (discountType === 'percentage') {
      parts.push(`${discountValue || '?'}% off`);
      if (maxDiscountAmount) parts.push(`(up to ₹${maxDiscountAmount})`);
    } else if (discountType === 'flat') {
      parts.push(`₹${discountValue || '?'} off`);
    } else {
      parts.push('Free Shipping');
    }
    if (minOrderAmount) parts.push(`on orders above ₹${minOrderAmount}`);
    if (validUntil) {
      parts.push(`Valid until ${new Date(validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);
    }
    return parts.join(' ');
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-12"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl mx-4 bg-[#0a0a0a] border border-white/10 p-8 z-10"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight">
                {editCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Code */}
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editCoupon}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                  maxLength={20}
                  placeholder="e.g. DREAM10"
                  className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono uppercase focus:border-accent outline-none transition-colors disabled:opacity-50"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Description (admin note)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Instagram promo May 2026"
                  className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-accent outline-none transition-colors"
                />
              </div>

              {/* Discount Type */}
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Discount Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['percentage', 'flat', 'free_shipping'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDiscountType(type)}
                      className={`p-3 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        discountType === type
                          ? 'bg-accent text-white border-accent'
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {type === 'percentage' ? '% Off' : type === 'flat' ? '₹ Off' : 'Free Ship'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Value */}
              {discountType !== 'free_shipping' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    {discountType === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={discountType === 'percentage' ? 100 : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono focus:border-accent outline-none transition-colors"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Min Order */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono focus:border-accent outline-none transition-colors"
                  />
                </div>

                {/* Max Discount Cap */}
                {discountType === 'percentage' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                      Max Discount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      placeholder="Optional cap"
                      className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono focus:border-accent outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Usage Limit */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono focus:border-accent outline-none transition-colors"
                  />
                </div>

                {/* Per User Limit */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono focus:border-accent outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    Valid From
                  </label>
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-accent outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    Valid Until
                  </label>
                  <input
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-accent outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Scope: Brands */}
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Applicable Brands (leave empty for all)
                </label>
                <div className="flex flex-wrap gap-2">
                  {BRANDS.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => toggleBrand(brand)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        applicableBrands.includes(brand)
                          ? 'bg-accent/20 border-accent/40 text-accent'
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope: Categories */}
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Applicable Categories (leave empty for all)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        applicableCategories.includes(cat)
                          ? 'bg-accent/20 border-accent/40 text-accent'
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope: Listing Types */}
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Applicable Listing Types (leave empty for all)
                </label>
                <div className="flex gap-2">
                  {['in-stock', 'pre-order'].map((lt) => (
                    <button
                      key={lt}
                      type="button"
                      onClick={() => toggleListingType(lt)}
                      className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        applicableListingTypes.includes(lt)
                          ? 'bg-accent/20 border-accent/40 text-accent'
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      {lt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Active</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isActive ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      isActive ? 'left-[26px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Preview */}
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent/60 block mb-2">
                  Preview
                </span>
                <p className="text-sm text-white/80 flex items-center gap-2">
                  <Tag size={14} className="text-accent" />
                  {previewText}
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-accent text-white py-4 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : editCoupon ? (
                  'Update Coupon'
                ) : (
                  'Create Coupon'
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
