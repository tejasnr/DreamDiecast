'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Phone,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Truck,
  AlertCircle,
  Package
} from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { trackEvent } from '@/lib/posthog';
import { FLAT_SHIPPING_RATE } from '@/lib/constants';

export default function CheckoutDetailsPage() {
  const { cart, cartTotal, setCheckoutDetails, setShippingCharges, balancePaymentItem } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isShippingFree = !balancePaymentItem && cart.length > 0 && cart.every(item => item.category === 'Pre-Order');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [shippingInfo, setShippingInfo] = useState<{ cost: number; courier: string; etd: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
    if (cart.length === 0 && !balancePaymentItem && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, cart, router, balancePaymentItem]);

  const handlePincodeChange = (pincode: string) => {
    const cleaned = pincode.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pincode: cleaned }));

    if (cleaned.length === 6) {
      if (!/^\d{6}$/.test(cleaned)) {
        setError('Please enter a valid 6-digit pincode');
        return;
      }
      calculateShipping(cleaned);
    } else {
      setShippingInfo(null);
      setShippingCharges(0);
      setError(null);
    }
  };

  const calculateShipping = (pincode: string) => {
    setError(null);
    if (isShippingFree) {
      setShippingInfo({ cost: 0, courier: 'Free Shipping', etd: '' });
      setShippingCharges(0);
      return;
    }
    setShippingInfo({
      cost: FLAT_SHIPPING_RATE,
      courier: 'Standard Shipping',
      etd: '5-7',
    });
    setShippingCharges(FLAT_SHIPPING_RATE);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingInfo) {
      setError('Please enter a valid pincode to calculate shipping');
      return;
    }

    setCheckoutDetails(formData);
    trackEvent('checkout_started', { itemCount: cart.length, total: cartTotal + (shippingInfo?.cost || 0) });
    router.push('/checkout');
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 uppercase tracking-widest text-[10px] font-bold">
          <ArrowLeft size={14} /> Back to Store
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Details Form */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-display font-bold uppercase tracking-tighter mb-2">Shipping Details</h1>
              <p className="text-white/40 uppercase tracking-widest text-[10px] font-bold">Where should we send your collectibles?</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="glass p-8 border border-white/10 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-2">
                      <User size={12} className="text-accent" /> Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm focus:border-accent outline-none transition-colors rounded-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-2">
                      <Phone size={12} className="text-accent" /> Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm focus:border-accent outline-none transition-colors rounded-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-2">
                      <MapPin size={12} className="text-accent" /> Street Address
                    </label>
                    <textarea
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="House No, Building, Street, Area"
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm focus:border-accent outline-none transition-colors rounded-sm resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">City</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        className="w-full bg-white/5 border border-white/10 p-4 text-sm focus:border-accent outline-none transition-colors rounded-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">State</label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="State"
                        className="w-full bg-white/5 border border-white/10 p-4 text-sm focus:border-accent outline-none transition-colors rounded-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Pincode</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="6-digit Pincode"
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm focus:border-accent outline-none transition-colors rounded-sm font-mono"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                {shippingInfo && (
                  <div className="p-4 bg-accent/10 border border-accent/20 rounded-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-accent">
                        <Truck size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{shippingInfo.courier}</span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {shippingInfo.cost === 0 ? 'FREE' : `₹${shippingInfo.cost}`}
                      </span>
                    </div>
                    {shippingInfo.cost > 0 ? (
                      <p className="text-[8px] text-accent/60 uppercase tracking-widest">
                        Estimated Delivery: {shippingInfo.etd} days
                      </p>
                    ) : (
                      <p className="text-[8px] text-accent/60 uppercase tracking-widest">
                        Shipping will be calculated when item arrives
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!shippingInfo}
                  className="w-full bg-accent text-white py-5 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all glow-orange flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary Preview */}
          <div className="space-y-8">
            <div className="glass p-8 border border-white/10">
              <h2 className="text-xl font-display font-bold uppercase tracking-tight mb-6">Order Summary</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-xs uppercase tracking-widest text-white/40">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs uppercase tracking-widest text-white/40">
                  <span>Shipping</span>
                  <span>{shippingInfo ? (shippingInfo.cost === 0 ? 'FREE' : `₹${shippingInfo.cost}`) : '--'}</span>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                  <span className="text-sm font-bold uppercase tracking-widest">Total</span>
                  <span className="text-4xl font-display font-bold text-white">
                    ₹{(cartTotal + (shippingInfo?.cost || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-sm overflow-hidden flex-shrink-0 relative">
                      {item.image ? (
                        <NextImage
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <Package size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-tight truncate">{item.name}</p>
                      <p className="text-[8px] text-white/40 uppercase tracking-widest">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
