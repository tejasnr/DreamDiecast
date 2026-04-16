'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useCart, type AppliedCoupon } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Tag, X, Loader2, ChevronDown } from 'lucide-react';
import { isPreOrderItem } from '@/lib/data';

export default function CouponInput() {
  const { cart, cartTotal, appliedCoupon, setCoupon, clearCoupon, balancePaymentItem } = useCart();
  const { user } = useAuth();

  const [isExpanded, setIsExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Build cart items for validation
  const cartItems = cart.map((item) => ({
    productId: item.id,
    name: item.name,
    price: isPreOrderItem(item) ? (item.bookingAdvance ?? 100) : item.price,
    quantity: item.quantity,
    brand: item.brand || '',
    category: item.category || '',
    listingType: item.listingType,
  }));

  // Query-based validation (only runs when we have a code to validate)
  const [validateCode, setValidateCode] = useState<string | null>(null);
  const validationResult = useQuery(
    api.coupons.validateCoupon,
    validateCode && user
      ? {
          code: validateCode,
          userId: user.convexUserId as Id<'users'>,
          cartItems,
          subtotal: cartTotal,
        }
      : 'skip'
  );

  // Disable on balance payment flow
  if (balancePaymentItem) return null;

  const handleApply = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a coupon code');
      return;
    }
    if (!user) {
      setError('Please log in to use coupons');
      return;
    }
    setError(null);
    setIsValidating(true);
    setValidateCode(trimmed);
  };

  // Process validation result
  useEffect(() => {
    if (isValidating && validationResult !== undefined) {
      if (validationResult.valid) {
        const coupon: AppliedCoupon = {
          code: validationResult.code,
          couponId: validationResult.couponId,
          discountType: validationResult.discountType,
          discountAmount: validationResult.discountAmount,
          shippingWaived: validationResult.shippingWaived,
          message: validationResult.message,
        };
        setCoupon(coupon);
        setCode('');
      } else {
        setError(validationResult.reason);
      }
      setIsValidating(false);
      setValidateCode(null);
    }
  }, [isValidating, validationResult, setCoupon]);

  const handleRemove = () => {
    clearCoupon();
    setCode('');
    setError(null);
    setValidateCode(null);
  };

  // Applied state
  if (appliedCoupon) {
    return (
      <div className="border border-green-500/20 bg-green-500/5 p-4 rounded-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-green-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
              Coupon Applied
            </span>
          </div>
          <button
            onClick={handleRemove}
            className="text-white/40 hover:text-red-400 transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
          >
            <X size={14} /> Remove
          </button>
        </div>
        <p className="text-sm text-green-300">{appliedCoupon.message}</p>
      </div>
    );
  }

  // Collapsed state
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-between p-4 border border-white/10 hover:border-white/20 transition-all rounded-sm group"
      >
        <div className="flex items-center gap-2 text-white/40 group-hover:text-white/60 transition-colors">
          <Tag size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Have a coupon code?
          </span>
        </div>
        <ChevronDown size={16} className="text-white/20 group-hover:text-white/40 transition-colors" />
      </button>
    );
  }

  // Expanded state
  return (
    <div className="border border-white/10 p-4 rounded-sm space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Tag size={14} className="text-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Coupon Code
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Enter code..."
          className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-sm font-mono uppercase focus:border-accent outline-none transition-colors rounded-sm"
          disabled={isValidating}
        />
        <button
          onClick={handleApply}
          disabled={isValidating || !code.trim()}
          className="bg-accent text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isValidating ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
