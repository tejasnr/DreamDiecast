'use client';

import { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, Megaphone } from 'lucide-react';
import Link from 'next/link';
import CampaignCard from '@/components/admin/CampaignCard';
import ConfirmModal from '@/components/admin/ConfirmModal';
import type { ProcurementStage } from '@/components/admin/ProcurementStepper';

const STAGE_LABELS: Record<ProcurementStage, string> = {
  brand_ordered: 'Ordered',
  international_transit: 'Transit',
  customs_processing: 'Customs',
  inventory_ready: 'In-Hand',
};

export default function CampaignsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const isAdmin = user?.role === 'admin';
  const campaigns = useQuery(
    api.campaigns.getCampaigns,
    isAdmin ? { workosUserId: user!.workosUserId } : 'skip'
  );

  const updateCampaignStage = useMutation(api.products.updateCampaignStage);
  const sendBalanceRequestEmail = useAction(api.emails.sendBalanceRequestEmail);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    variant: 'danger' | 'default';
    onConfirm: () => void;
  } | null>(null);

  if (!authLoading && (!user || !isAdmin)) {
    router.push('/');
    return null;
  }

  if (authLoading || campaigns === undefined) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  const handleStageChange = (productId: Id<'products'>, stage: ProcurementStage) => {
    const campaign = campaigns.find((c) => c.product._id === productId);
    if (!campaign) return;

    const currentStage = campaign.product.procurementStage;
    const stageKeys: ProcurementStage[] = [
      'brand_ordered',
      'international_transit',
      'customs_processing',
      'inventory_ready',
    ];
    const currentIdx = currentStage ? stageKeys.indexOf(currentStage) : -1;
    const targetIdx = stageKeys.indexOf(stage);
    const isRegression = targetIdx < currentIdx;

    const message = isRegression
      ? `This will move "${campaign.product.name}" backward to ${STAGE_LABELS[stage]}. Customer statuses will be updated.`
      : `Move "${campaign.product.name}" to ${STAGE_LABELS[stage]}? This will update all ${campaign.preOrderCount} customer orders.`;

    setConfirmModal({
      title: `Move to ${STAGE_LABELS[stage]}`,
      message,
      variant: isRegression ? 'danger' : 'default',
      onConfirm: async () => {
        await updateCampaignStage({
          workosUserId: user!.workosUserId,
          productId,
          newStage: stage,
        });
      },
    });
  };

  const handleRequestBalances = (productId: Id<'products'>) => {
    const campaign = campaigns.find((c) => c.product._id === productId);
    if (!campaign) return;

    const label = campaign.product.balanceRequestsSent
      ? 'Resend Balance Requests'
      : 'Request Pending Balances';

    setConfirmModal({
      title: label,
      message: `Send balance payment requests to ${campaign.pendingBalanceCount} customers for "${campaign.product.name}"?`,
      variant: 'default',
      onConfirm: async () => {
        try {
          const result = await sendBalanceRequestEmail({
            workosUserId: user!.workosUserId,
            productId,
          });
          const msgs: string[] = [];
          msgs.push(`Sent ${result.emailsSent} balance request email${result.emailsSent !== 1 ? 's' : ''}`);
          if (result.skipped > 0) {
            msgs.push(`${result.skipped} skipped (no email on file)`);
          }
          setToast({
            message: msgs.join('. '),
            type: result.skipped > 0 ? 'warning' : 'success',
          });
          setTimeout(() => setToast(null), 5000);
        } catch (err) {
          console.error('Error sending balance requests:', err);
          setToast({ message: 'Failed to send balance request emails.', type: 'warning' });
          setTimeout(() => setToast(null), 5000);
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-accent transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex items-center space-x-3 mb-4">
            <span className="w-12 h-[2px] bg-accent" />
            <span className="text-accent font-mono text-xs tracking-[0.4em] uppercase">
              Campaign Management
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter">
            Pre-Order Campaigns
          </h1>
        </div>

        {/* Campaign List */}
        {campaigns.length === 0 ? (
          <div className="text-center py-24 border border-white/5">
            <Megaphone size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/40 uppercase tracking-widest text-[10px] font-mono">
              No active pre-order campaigns.
            </p>
            <p className="text-white/20 text-sm font-mono mt-2">
              Create a product with listing type &ldquo;Pre-Order&rdquo; to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.product._id}
                product={campaign.product}
                preOrderCount={campaign.preOrderCount}
                pendingBalanceCount={campaign.pendingBalanceCount}
                verifiedBalanceCount={campaign.verifiedBalanceCount}
                workosUserId={user!.workosUserId}
                onStageChange={handleStageChange}
                onRequestBalances={handleRequestBalances}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmModal}
        title={confirmModal?.title || ''}
        message={confirmModal?.message || ''}
        variant={confirmModal?.variant || 'default'}
        onConfirm={() => confirmModal?.onConfirm()}
        onCancel={() => setConfirmModal(null)}
      />

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <div
            className={`px-5 py-3 text-sm font-mono border ${
              toast.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
