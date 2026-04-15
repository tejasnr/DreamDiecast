'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { X, EyeOff, Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from './ConfirmModal';

export default function BulkActionBar({
  selectedIds,
  onClear,
  workosUserId,
}: {
  selectedIds: Set<Id<'products'>>;
  onClear: () => void;
  workosUserId: string;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bulkUpdateStatus = useMutation(api.products.bulkUpdateStatus);
  const bulkDelete = useMutation(api.products.bulkDelete);

  const count = selectedIds.size;
  if (count === 0) return null;

  const ids = Array.from(selectedIds);

  const handleBulkStatus = async (status: 'active' | 'unlisted') => {
    try {
      await bulkUpdateStatus({ workosUserId, productIds: ids, status });
      onClear();
    } catch (err) {
      console.error('Bulk status update failed:', err);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const result = await bulkDelete({ workosUserId, productIds: ids });
      if (result.skipped > 0) {
        alert(`Deleted ${result.deleted} products. ${result.skipped} skipped (have active pre-orders).`);
      }
      onClear();
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-900 border border-white/10 px-6 py-3 rounded-sm shadow-2xl">
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest mr-2">
          {count} selected
        </span>
        <button
          onClick={() => handleBulkStatus('unlisted')}
          className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all rounded-sm"
        >
          <EyeOff size={14} /> Mark Offline
        </button>
        <button
          onClick={() => handleBulkStatus('active')}
          className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all rounded-sm"
        >
          <Eye size={14} /> Mark Active
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all rounded-sm"
        >
          <Trash2 size={14} /> Delete
        </button>
        <button
          onClick={onClear}
          className="p-2 text-white/30 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        title="Delete Products"
        message={`Delete ${count} product${count > 1 ? 's' : ''}? This cannot be undone. Products with active pre-orders will be skipped.`}
        variant="danger"
        onConfirm={() => {
          setConfirmDelete(false);
          handleBulkDelete();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
