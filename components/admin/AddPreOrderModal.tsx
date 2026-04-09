'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { motion } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AddPreOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddPreOrderModal({
  isOpen,
  onClose,
}: AddPreOrderModalProps) {
  const { user } = useAuth();
  const preOrderProducts = useQuery(api.products.listPreOrderProducts);
  const createManualPO = useMutation(api.preOrders.createManual);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    productId: '' as string,
    depositPaid: '',
    notes: '',
  });
  const [autoTotal, setAutoTotal] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleProductChange = (productId: string) => {
    setForm({ ...form, productId });
    const product = preOrderProducts?.find(
      (p: any) => p._id === productId
    );
    if (product) {
      setAutoTotal(product.totalFinalPrice ?? product.price);
    } else {
      setAutoTotal(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.customerName || !form.depositPaid) return;

    setSaving(true);
    try {
      await createManualPO({
        workosUserId: user?.workosUserId,
        customerName: form.customerName,
        customerPhone: form.customerPhone || undefined,
        productId: form.productId as Id<'products'>,
        depositPaid: parseFloat(form.depositPaid),
        notes: form.notes || undefined,
      });
      setForm({
        customerName: '',
        customerPhone: '',
        productId: '',
        depositPaid: '',
        notes: '',
      });
      setAutoTotal(null);
      onClose();
    } catch (err) {
      console.error('Error creating manual PO:', err);
      alert('Failed to create pre-order.');
    } finally {
      setSaving(false);
    }
  };

  const balanceDue =
    autoTotal !== null && form.depositPaid
      ? Math.max(0, autoTotal - parseFloat(form.depositPaid || '0'))
      : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-lg glass p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight">
            Add Manual Pre-Order
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              Customer Name *
            </label>
            <input
              required
              type="text"
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              Customer Phone
            </label>
            <input
              type="text"
              value={form.customerPhone}
              onChange={(e) =>
                setForm({ ...form, customerPhone: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              Product *
            </label>
            <select
              required
              value={form.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors appearance-none"
            >
              <option value="">Select a pre-order product...</option>
              {(preOrderProducts ?? []).map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.name} — ₹{p.totalFinalPrice ?? p.price}
                </option>
              ))}
            </select>
          </div>

          {autoTotal !== null && (
            <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
              Total Price: ₹{autoTotal.toLocaleString()}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              Amount Paid (Deposit) *
            </label>
            <input
              required
              type="number"
              min="1"
              value={form.depositPaid}
              onChange={(e) =>
                setForm({ ...form, depositPaid: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
              placeholder="e.g. 500"
            />
          </div>

          {balanceDue !== null && (
            <div className="text-xs font-mono">
              Balance Due:{' '}
              <span className={balanceDue > 0 ? 'text-orange-400' : 'text-green-400'}>
                ₹{balanceDue.toLocaleString()}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors h-20 resize-none"
              placeholder="Optional notes (source, special requests...)"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-accent text-white py-4 font-display font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="animate-spin" size={16} />}
              {saving ? 'Adding...' : 'Add Pre-Order'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 border border-white/10 hover:bg-white/5 transition-all uppercase text-xs tracking-widest"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
