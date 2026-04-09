'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { motion } from 'motion/react';
import { X, Check, Search, Loader2, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface AssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  selectedUrls?: string[];
}

export default function AssetPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedUrls = [],
}: AssetPickerModalProps) {
  const assets = useQuery(api.assets.list);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedUrls));

  if (!isOpen) return null;

  const filteredAssets = (assets ?? []).filter(
    (a: any) =>
      a.type === 'image' &&
      a.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (url: string) => {
    const next = new Set(selected);
    if (next.has(url)) {
      next.delete(url);
    } else {
      next.add(url);
    }
    setSelected(next);
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-4xl h-[75vh] glass flex flex-col overflow-hidden border border-white/10"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div>
            <h2 className="text-xl font-display font-bold uppercase tracking-tight">
              Select from Asset Library
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono mt-1">
              {selected.size} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 pl-9 pr-4 py-2.5 text-sm focus:border-accent outline-none transition-colors"
              placeholder="Search assets..."
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {assets === undefined ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-accent" size={32} />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-4">
              <ImageIcon size={48} />
              <p className="uppercase tracking-[0.3em] text-xs font-mono">
                No assets found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {filteredAssets.map((asset: any) => {
                const isSelected = selected.has(asset.url);
                return (
                  <div
                    key={asset._id}
                    onClick={() => toggleSelect(asset.url)}
                    className={`relative aspect-square bg-white/5 overflow-hidden cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'border-accent ring-1 ring-accent/50'
                        : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <Image
                      src={asset.url}
                      alt={asset.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-accent text-white p-1 rounded-full">
                        <Check size={12} />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                      <p className="text-[9px] font-mono text-white/60 truncate">
                        {asset.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="px-6 py-3 bg-accent text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50"
          >
            Add {selected.size} Selected
          </button>
        </div>
      </motion.div>
    </div>
  );
}
