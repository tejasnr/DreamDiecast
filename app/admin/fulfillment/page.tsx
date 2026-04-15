'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Truck } from 'lucide-react';
import Link from 'next/link';
import FulfillmentBoard from '@/components/admin/FulfillmentBoard';
import CommandPalette from '@/components/admin/CommandPalette';

export default function FulfillmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const board = useQuery(
    api.orders.listFulfillmentBoard,
    user?.role === 'admin' ? { workosUserId: user.workosUserId } : 'skip'
  );

  const isAdmin = user?.role === 'admin';
  const loading = authLoading || (isAdmin && board === undefined);

  if (!authLoading && (!user || !isAdmin)) {
    router.push('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (!isAdmin || !board) return null;

  const totalOrders =
    board.toPack.length +
    board.labelGenerated.length +
    board.inTransit.length +
    board.delivered.length;

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-4 uppercase tracking-widest text-[10px] font-bold"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <h1 className="text-5xl md:text-8xl font-display font-bold uppercase tracking-tighter leading-none">
              Order <span className="text-white/20">Fulfillment</span>
            </h1>
            <p className="text-accent text-[10px] font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
              <Truck size={14} /> {totalOrders} Orders in Pipeline
            </p>
          </div>
          <div className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
            Drag cards forward to update status
          </div>
        </div>

        <FulfillmentBoard data={board} workosUserId={user!.workosUserId} />
      </div>

      <CommandPalette />
    </main>
  );
}
