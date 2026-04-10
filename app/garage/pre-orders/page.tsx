'use client';

import { useGarage, GarageItem } from '@/hooks/useGarage';
import { useAuth } from '@/context/AuthContext';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { motion } from 'motion/react';
import { Loader2, Clock, Calendar, ArrowRight, Car, CreditCard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function MyPreOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading: itemsLoading } = useGarage();
  const updateGarageStatus = useMutation(api.garage.updateStatus);
  const [payingId, setPayingId] = useState<string | null>(null);

  const preOrderItems = items.filter(item => item.status === 'pre-ordered' || item.status === 'arrived');

  const handleFinalPayment = async (item: GarageItem) => {
    if (!user) return;
    try {
      setPayingId(item.id);

      await updateGarageStatus({
        workosUserId: user.workosUserId,
        garageItemId: item.id as Id<'garageItems'>,
        status: 'owned',
        price: item.originalPrice || item.price,
      });
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setPayingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <Car className="text-white/20" size={40} />
        </div>
        <h1 className="text-4xl font-display font-bold uppercase tracking-tighter mb-4">Access Denied</h1>
        <p className="text-white/40 max-w-md mb-8 uppercase tracking-widest text-xs">Please login to view your pre-orders.</p>
        <Link href="/" className="bg-white text-black px-8 py-4 font-display font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all">
          Return Home
        </Link>
      </div>
    );
  }

  if (itemsLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-[1px] bg-accent"></span>
              <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">Pending Arrivals</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-display font-bold uppercase tracking-tighter leading-none">
              Pre-<span className="text-white/20">Orders</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <Link href="/garage" className="px-6 py-3 bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
              Owned ({items.filter(i => i.status === 'owned').length})
            </Link>
            <Link href="/garage/pre-orders" className="px-6 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest">
              Pre-Orders ({preOrderItems.length})
            </Link>
          </div>
        </div>

        {preOrderItems.length === 0 ? (
          <div className="border border-white/10 p-20 text-center">
            <Clock className="mx-auto text-white/10 mb-6" size={48} />
            <h2 className="text-2xl font-display font-bold uppercase mb-2">No active pre-orders</h2>
            <p className="text-white/40 text-sm uppercase tracking-widest mb-8">You haven&apos;t secured any upcoming releases yet.</p>
            <Link href="/pre-orders" className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest hover:gap-4 transition-all">
              View The Vault <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {preOrderItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group flex flex-col md:flex-row items-center border p-6 gap-8 transition-colors ${item.status === 'arrived' ? 'bg-accent/5 border-accent/30' : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'}`}
              >
                <div className="relative w-full md:w-48 aspect-[16/9] overflow-hidden bg-black">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <p className="text-accent text-[10px] font-bold uppercase tracking-widest mb-1">{item.brand} • {item.scale}</p>
                  <h3 className="text-2xl font-display font-bold uppercase tracking-tight mb-2">{item.name}</h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-white/40">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Applied: {new Date(item.purchasedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={12} className={item.status === 'arrived' ? 'text-green-500' : 'text-accent'} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${item.status === 'arrived' ? 'text-green-500' : 'text-accent'}`}>
                        Status: {item.status === 'arrived' ? 'Arrived - Final Payment Required' : 'Pending Release'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Total Price: ${item.originalPrice || item.price}</p>
                    <span className="text-2xl font-display font-bold">${item.price} Paid</span>
                  </div>

                  {item.status === 'arrived' && (
                    <button
                      onClick={() => handleFinalPayment(item)}
                      disabled={payingId === item.id}
                      className="bg-white text-black px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-2 glow-orange"
                    >
                      {payingId === item.id ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <>
                          <CreditCard size={14} /> Pay Balance (${(item.originalPrice || item.price) - item.price})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
