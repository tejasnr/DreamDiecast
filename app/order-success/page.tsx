'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { CheckCircle, MessageCircle, ArrowRight, ShoppingBag, Clock, Bell, Package } from 'lucide-react';
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
      </div>

      {/* Detailed info */}
      <div className="glass p-8 border border-white/10 max-w-lg mx-auto">
        {isPreOrder ? (
          <div className="space-y-4 text-sm text-white/50 leading-relaxed">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
              <span>Your pre-order deposit has been submitted successfully.</span>
            </div>
            <div className="flex items-start gap-3 text-left">
              <Bell size={16} className="text-accent mt-0.5 shrink-0" />
              <span>We'll verify your payment and notify you once the stock arrives in hand.</span>
            </div>
            <div className="flex items-start gap-3 text-left">
              <Package size={16} className="text-accent mt-0.5 shrink-0" />
              <span>You'll be notified when it's time to pay the remaining balance before shipping.</span>
            </div>
            <div className="flex items-start gap-3 text-left">
              <ShoppingBag size={16} className="text-accent mt-0.5 shrink-0" />
              <span>You can track your pre-order anytime in <Link href="/garage" className="text-white font-bold underline underline-offset-2 hover:text-accent transition-colors">My Purchases</Link>.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-sm text-white/50 leading-relaxed">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
              <span>Your order has been placed successfully!</span>
            </div>
            <div className="flex items-start gap-3 text-left">
              <Clock size={16} className="text-accent mt-0.5 shrink-0" />
              <span>Your payment will be verified shortly, and your order will be packed and shipped.</span>
            </div>
            <div className="flex items-start gap-3 text-left">
              <Bell size={16} className="text-accent mt-0.5 shrink-0" />
              <span>You'll receive updates on WhatsApp as your order progresses.</span>
            </div>
            <div className="flex items-start gap-3 text-left">
              <ShoppingBag size={16} className="text-accent mt-0.5 shrink-0" />
              <span>You can track your order anytime in <Link href="/garage" className="text-white font-bold underline underline-offset-2 hover:text-accent transition-colors">My Purchases</Link>.</span>
            </div>
          </div>
        )}
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
        <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-wider sm:tracking-widest break-all">
          #{orderId || 'PENDING'}
        </p>
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
