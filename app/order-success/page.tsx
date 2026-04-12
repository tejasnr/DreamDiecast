'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { CheckCircle, MessageCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { trackEvent } from '@/lib/posthog';
import PreOrderTimeline from '@/components/PreOrderTimeline';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const isPreOrder = searchParams.get('preOrder') === 'true';

  useEffect(() => {
    if (orderId) {
      trackEvent('order_completed', { orderId, isPreOrder });
    }
  }, [orderId, isPreOrder]);

  return (
    <div className="max-w-2xl mx-auto text-center space-y-12">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="relative inline-block"
      >
        <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
        <CheckCircle className="text-green-500 relative" size={120} />
      </motion.div>

      <div className="space-y-4">
        <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter">
          {isPreOrder ? (
            <>Pre-Order <span className="text-accent">Confirmed</span>!</>
          ) : (
            <>Order <span className="text-accent">Placed</span></>
          )}
        </h1>
        <p className="text-white/40 uppercase tracking-widest text-xs font-bold max-w-md mx-auto leading-relaxed">
          {isPreOrder
            ? "Your deposit has been submitted. We'll notify you via WhatsApp when your item arrives."
            : "Your order has been submitted successfully. We are now waiting for payment verification."}
        </p>
      </div>

      {isPreOrder && (
        <div className="glass p-6 border border-white/10">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-4">Your Pre-Order Journey</p>
          <PreOrderTimeline status="deposit_submitted" className="justify-center" />
        </div>
      )}

      <div className="glass p-8 border border-white/10 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Order Reference</p>
        <p className="text-2xl font-mono font-bold text-white tracking-widest">#{orderId || 'PENDING'}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
        <a
          href={isPreOrder
            ? "https://chat.whatsapp.com/BvgtaCooKYpJpsfDo978Fy?mode=gi_t"
            : `https://wa.me/919148724708?text=Hello, I just placed an order with ID: ${orderId}. Please verify my payment.`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 text-white px-8 py-5 font-display font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-500/10"
        >
          <MessageCircle size={20} /> {isPreOrder ? 'Join our WhatsApp Community' : 'Contact us on WhatsApp'}
        </a>
        <Link
          href={isPreOrder ? "/garage?tab=pre-orders" : "/garage"}
          className="bg-white/5 text-white px-8 py-5 font-display font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 border border-white/10"
        >
          <ShoppingBag size={20} /> {isPreOrder ? 'View Pre-Orders' : 'View My Garage'}
        </Link>
      </div>

      <div className="pt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-all uppercase tracking-widest text-[10px] font-bold group"
        >
          Return to Store <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-[#050505] pt-40 pb-20 px-6">
      <Suspense fallback={<div className="text-center py-20 uppercase tracking-widest text-xs opacity-40">Loading success details...</div>}>
        <OrderSuccessContent />
      </Suspense>
    </main>
  );
}
