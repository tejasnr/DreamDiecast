'use client';

import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onCancel}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md glass border border-white/10 p-8 space-y-6"
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-red-500/20 text-red-400' : 'bg-accent/20 text-accent'}`}>
              {variant === 'danger' ? <AlertTriangle size={20} /> : <Info size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-display font-bold uppercase tracking-tight">{title}</h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">{message}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white border border-white/10 hover:border-white/30 transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => { onConfirm(); onCancel(); }}
              className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                variant === 'danger'
                  ? 'bg-red-500 text-white hover:bg-red-400'
                  : 'bg-accent text-white hover:bg-white hover:text-black'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
