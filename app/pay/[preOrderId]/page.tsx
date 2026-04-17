'use client';

import { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  CreditCard,
  Copy,
  Check,
  Upload,
  Loader2,
  ArrowLeft,
  Info,
  MapPin,
  Phone,
  User,
  ChevronDown,
} from 'lucide-react';
import NextImage from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PreOrderTimeline from '@/components/PreOrderTimeline';

export default function BalancePaymentPage() {
  const params = useParams();
  const rawPreOrderId = params?.preOrderId;
  const preOrderId = Array.isArray(rawPreOrderId) ? rawPreOrderId[0] : rawPreOrderId;
  const preOrder = useQuery(
    api.preOrders.getForPayment,
    preOrderId ? { preOrderId: preOrderId as Id<'preOrders'> } : 'skip'
  );
  const submitBalancePayment = useAction(api.preOrders.submitBalancePayment);

  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const upiId = 'sujithsaravanan2004@okaxis';

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Only JPG and PNG files are allowed');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX = 800;

          if (width > height) {
            if (width > MAX) { height *= MAX / width; width = MAX; }
          } else {
            if (height > MAX) { width *= MAX / height; height = MAX; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              setScreenshot(resizedFile);
              setScreenshotPreview(canvas.toDataURL('image/jpeg', 0.7));
              setError(null);
            }
          }, 'image/jpeg', 0.7);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId || !screenshot || !preOrderId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const reader = new FileReader();
      const paymentProofDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(screenshot);
      });

      const shippingAddress =
        editingAddress && addressForm.name && addressForm.pincode
          ? addressForm
          : undefined;

      await submitBalancePayment({
        preOrderId: preOrderId as Id<'preOrders'>,
        transactionId,
        paymentProofDataUrl,
        shippingAddress,
      });

      setSuccess(true);
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Invalid / missing ID
  if (!preOrderId) {
    return (
      <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-display font-bold uppercase tracking-tighter">
            Pre-Order Not Found
          </h1>
          <p className="text-white/40 text-sm uppercase tracking-widest">
            This payment link is invalid or incomplete.
          </p>
          <Link href="/" className="inline-block bg-accent text-white px-8 py-4 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Browse Products
          </Link>
        </div>
      </main>
    );
  }

  // Loading state
  if (preOrder === undefined) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  // Not found
  if (preOrder === null) {
    return (
      <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-display font-bold uppercase tracking-tighter">
            Pre-Order Not Found
          </h1>
          <p className="text-white/40 text-sm uppercase tracking-widest">
            This payment link is invalid or the pre-order no longer exists.
          </p>
          <Link href="/" className="inline-block bg-accent text-white px-8 py-4 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Browse Products
          </Link>
        </div>
      </main>
    );
  }

  // Cancelled
  if (preOrder.status === 'cancelled') {
    return (
      <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-display font-bold uppercase tracking-tighter text-red-400">
            Pre-Order Cancelled
          </h1>
          <p className="text-white/40 text-sm uppercase tracking-widest">
            This pre-order has been cancelled.
          </p>
          <Link href="/" className="inline-block bg-accent text-white px-8 py-4 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Browse Products
          </Link>
        </div>
      </main>
    );
  }

  // Already paid
  if (
    preOrder.balancePaymentStatus === 'submitted' ||
    preOrder.balancePaymentStatus === 'verified' ||
    preOrder.status === 'balance_verified' ||
    preOrder.status === 'shipped' ||
    preOrder.status === 'delivered' ||
    preOrder.status === 'fully_paid_shipped'
  ) {
    return (
      <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
            <Check className="text-green-500 relative" size={80} />
          </div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tighter">
            Payment {preOrder.balancePaymentStatus === 'submitted' ? 'Under Review' : 'Received'}!
          </h1>
          <p className="text-white/40 text-sm uppercase tracking-widest">
            {preOrder.balancePaymentStatus === 'submitted'
              ? 'Your balance payment has been submitted and is being verified.'
              : 'Your item is being prepared for shipping.'}
          </p>
          <Link href="/" className="inline-block bg-accent text-white px-8 py-4 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Visit Store
          </Link>
        </div>
      </main>
    );
  }

  // Success after submission
  if (success) {
    return (
      <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
            <Check className="text-green-500 relative" size={80} />
          </div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tighter">
            Balance Payment <span className="text-accent">Submitted</span>!
          </h1>
          <p className="text-white/40 text-sm uppercase tracking-widest max-w-md mx-auto">
            We&apos;ll verify your payment and ship your {preOrder.productName} soon.
          </p>
          <Link href="/" className="inline-block bg-accent text-white px-8 py-4 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Visit Store
          </Link>
        </div>
      </main>
    );
  }

  // Main payment form
  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 uppercase tracking-widest text-[10px] font-bold">
          <ArrowLeft size={14} /> DreamDiecast
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product & Payment Summary */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-display font-bold uppercase tracking-tighter mb-2">
                Complete Your Payment
              </h1>
              <p className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
                Balance payment for your pre-order
              </p>
            </div>

            <div className="glass p-6 border border-white/10 space-y-6">
              {/* Product Info */}
              <div className="flex gap-4">
                {preOrder.productImage && (
                  <div className="relative w-24 h-24 bg-white/5 rounded-sm overflow-hidden flex-shrink-0">
                    <NextImage
                      src={preOrder.productImage}
                      alt={preOrder.productName}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-display font-bold uppercase tracking-tight">
                    {preOrder.productName}
                  </h2>
                  {preOrder.product && (
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                      {preOrder.product.brand} | {preOrder.product.scale}
                    </p>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <PreOrderTimeline status={preOrder.status} />

              {/* Payment Breakdown */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Payment Summary
                </h3>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Product Price</span>
                  <span>₹{preOrder.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Deposit Paid</span>
                  <span className="text-green-400">-₹{preOrder.depositPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Balance Due</span>
                  <span>₹{preOrder.balanceDue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Shipping</span>
                  <span>₹{preOrder.shippingCharges}</span>
                </div>
                <div className="flex justify-between items-end pt-3 border-t border-white/5">
                  <span className="text-xs font-bold uppercase tracking-widest">Total to Pay</span>
                  <span className="text-2xl font-display font-bold text-accent">
                    ₹{preOrder.totalToPay.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="glass p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-2">
                  <MapPin size={12} className="text-accent" /> Shipping Address
                </h3>
                <button
                  onClick={() => setEditingAddress(!editingAddress)}
                  className="text-[10px] text-accent font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                  {editingAddress ? 'Cancel' : preOrder.shippingAddress ? 'Edit' : 'Add Address'}
                </button>
              </div>

              {!editingAddress && preOrder.shippingAddress ? (
                <div className="text-xs text-white/60 space-y-1">
                  <p className="text-white font-medium">{preOrder.shippingAddress.name}</p>
                  <p>{preOrder.shippingAddress.address}</p>
                  <p>{preOrder.shippingAddress.city}, {preOrder.shippingAddress.state} - {preOrder.shippingAddress.pincode}</p>
                  <p>{preOrder.shippingAddress.phone}</p>
                </div>
              ) : !editingAddress ? (
                <p className="text-[10px] text-white/30 uppercase tracking-widest">
                  No address on file. Click &quot;Add Address&quot; to enter your shipping details.
                </p>
              ) : null}

              {editingAddress && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-1">
                        <User size={10} /> Name
                      </label>
                      <input
                        type="text"
                        value={addressForm.name}
                        onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                        placeholder="Full Name"
                        className="w-full bg-white/5 border border-white/10 p-3 text-xs focus:border-accent outline-none rounded-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-white/40 uppercase tracking-widest font-bold flex items-center gap-1">
                        <Phone size={10} /> Phone
                      </label>
                      <input
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        placeholder="Phone Number"
                        className="w-full bg-white/5 border border-white/10 p-3 text-xs focus:border-accent outline-none rounded-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Address</label>
                    <textarea
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                      placeholder="Street Address"
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 p-3 text-xs focus:border-accent outline-none rounded-sm resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="City"
                      className="w-full bg-white/5 border border-white/10 p-3 text-xs focus:border-accent outline-none rounded-sm"
                    />
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      placeholder="State"
                      className="w-full bg-white/5 border border-white/10 p-3 text-xs focus:border-accent outline-none rounded-sm"
                    />
                    <input
                      type="text"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      placeholder="Pincode"
                      maxLength={6}
                      className="w-full bg-white/5 border border-white/10 p-3 text-xs focus:border-accent outline-none rounded-sm font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* UPI Payment Section */}
          <div className="space-y-8">
            <div className="glass p-8 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -mr-16 -mt-16" />

              <h2 className="text-xl font-display font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
                <CreditCard size={20} className="text-accent" /> Pay via UPI
              </h2>

              <div className="space-y-8">
                {/* UPI Details */}
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="relative w-48 h-48 bg-white p-2 rounded-lg shadow-2xl">
                    <NextImage
                      src="/assets/QR.png"
                      alt="UPI QR Code"
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  <div className="w-full space-y-2">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">UPI ID</p>
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-sm">
                      <span className="font-mono text-sm font-bold text-accent">{upiId}</span>
                      <button onClick={handleCopyUpi} className="text-white/40 hover:text-white transition-colors">
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-accent/10 border border-accent/20 p-3 rounded-sm w-full">
                    <p className="text-[10px] text-accent font-bold uppercase tracking-widest">
                      Amount to pay: ₹{preOrder.totalToPay.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t border-white/5">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                      Transaction ID / UTR
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter 12-digit UPI Transaction ID"
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm focus:border-accent outline-none transition-colors rounded-sm font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                      Payment Screenshot
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                        id="balance-screenshot-upload"
                        required
                      />
                      <label
                        htmlFor="balance-screenshot-upload"
                        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed transition-all cursor-pointer rounded-sm ${
                          screenshot ? 'border-accent/50 bg-accent/5' : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        {screenshotPreview ? (
                          <div className="relative w-full h-full p-2">
                            <NextImage
                              src={screenshotPreview}
                              alt="Preview"
                              fill
                              className="object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <p className="text-[10px] font-bold uppercase tracking-widest">Change Image</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload size={24} className="text-white/20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Upload Screenshot</p>
                            <p className="text-[8px] text-white/20 uppercase tracking-widest">JPG, PNG</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !transactionId || !screenshot}
                    className="w-full bg-accent text-white py-5 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all glow-orange flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Processing...
                      </>
                    ) : (
                      'Submit Payment'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
