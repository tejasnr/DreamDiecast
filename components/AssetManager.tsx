'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Link as LinkIcon,
  Trash2,
  Camera,
  Image as ImageIcon,
  Loader2,
  Check,
  CheckCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Id } from '@/convex/_generated/dataModel';
import ConfirmModal from '@/components/admin/ConfirmModal';

interface AssetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (url: string) => void;
}

export default function AssetManager({ isOpen, onClose, onSelect }: AssetManagerProps) {
  const { user } = useAuth();
  const assets = useQuery(api.assets.list);
  const createAsset = useAction(api.assets.create);
  const removeAsset = useMutation(api.assets.remove);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    variant: 'danger' | 'default';
    onConfirm: () => void;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadFiles = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({ done: 0, total: imageFiles.length });

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (file.size > 5 * 1024 * 1024) {
        alert(`Skipping "${file.name}" — exceeds 5MB limit.`);
        setUploadProgress({ done: i + 1, total: imageFiles.length });
        continue;
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        await createAsset({
          workosUserId: user?.workosUserId,
          name: file.name,
          type: 'image',
          dataUrl,
        });
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
      }
      setUploadProgress({ done: i + 1, total: imageFiles.length });
    }

    setUploading(false);
    setUploadProgress(null);
  };

  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files));
    }
  }, [user]);

  const handleDelete = (id: string) => {
    setConfirmModal({
      title: 'Delete Asset',
      message: 'Are you sure you want to delete this asset? This cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await removeAsset({ workosUserId: user?.workosUserId, id: id as Id<"assets"> });
        } catch (err) {
          console.error('Error deleting asset:', err);
        }
      },
    });
  };

  const handleBulkDelete = () => {
    setConfirmModal({
      title: 'Delete Selected Assets',
      message: `Delete ${selectedAssets.size} asset(s)? This cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        const assetsToDelete = assets?.filter(a => selectedAssets.has(a.url)) || [];
        for (const asset of assetsToDelete) {
          try {
            await removeAsset({ workosUserId: user?.workosUserId, id: asset._id as Id<"assets"> });
          } catch (err) {
            console.error('Error deleting asset:', err);
          }
        }
        setSelectedAssets(new Set());
      },
    });
  };

  const toggleAssetSelection = (url: string) => {
    const next = new Set(selectedAssets);
    if (next.has(url)) {
      next.delete(url);
    } else {
      next.add(url);
    }
    setSelectedAssets(next);
  };

  const handleAddSelectedToProduct = () => {
    if (onSelect && selectedAssets.size > 0) {
      for (const url of selectedAssets) {
        onSelect(url);
      }
      setSelectedAssets(new Set());
    }
  };

  const handleSelectAll = () => {
    if (selectedAssets.size === (assets?.length || 0)) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(assets?.map(a => a.url) || []));
    }
  };

  if (!isOpen) return null;

  const loading = assets === undefined;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl h-[95vh] md:h-[85vh] glass flex flex-col overflow-hidden border border-white/10"
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div>
            <h2 className="text-2xl font-display font-bold uppercase tracking-tight">Asset Library</h2>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono mt-1">Manage images & media</p>
          </div>
          <div className="flex items-center gap-3">
            {assets && assets.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                {selectedAssets.size === assets.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Bulk Upload Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mx-3 md:mx-6 mt-4 md:mt-6 border-2 border-dashed rounded-sm transition-all ${
              isDragging
                ? 'border-accent bg-accent/10'
                : 'border-white/20 bg-white/[0.02] hover:border-white/40'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Loader2 className="animate-spin text-accent" size={32} />
                <span className="text-xs text-white/40 uppercase tracking-widest font-mono">
                  Uploading {uploadProgress?.done ?? 0} / {uploadProgress?.total ?? 0}...
                </span>
                {uploadProgress && (
                  <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <Upload size={32} className="text-white/20" />
                <span className="text-xs text-white/40 uppercase tracking-widest font-mono text-center">
                  Drag & Drop multiple images here
                </span>
                <span className="text-[10px] text-white/20 font-mono">
                  5MB max per file &middot; JPG, PNG, WebP
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-black px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-accent hover:text-white transition-all"
                  >
                    <Upload size={14} /> Browse Files
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="bg-white/10 text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-accent hover:text-white transition-all border border-white/10"
                  >
                    <Camera size={14} /> Take Photo
                  </button>
                </div>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleBulkFileSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
            />
          </div>

          {/* Selection actions bar */}
          <AnimatePresence>
            {selectedAssets.size > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mx-3 md:mx-6 mt-3 overflow-hidden"
              >
                <div className="flex items-center justify-between bg-accent/10 border border-accent/30 px-4 py-3 rounded-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-accent">
                    {selectedAssets.size} asset{selectedAssets.size > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBulkDelete}
                      className="bg-red-500/20 text-red-400 px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={14} /> Delete Selected
                    </button>
                    {onSelect && (
                      <button
                        onClick={handleAddSelectedToProduct}
                        className="bg-accent text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:text-black transition-all"
                      >
                        <CheckCircle size={14} /> Add to Product
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedAssets(new Set())}
                      className="text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Asset Grid */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
              </div>
            ) : !assets || assets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-4">
                <ImageIcon size={48} />
                <p className="uppercase tracking-[0.3em] text-xs font-mono">No assets found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {assets.map((asset: any) => {
                  const isSelected = selectedAssets.has(asset.url);
                  return (
                    <div
                      key={asset._id}
                      className={`group relative aspect-video glass overflow-hidden transition-all cursor-pointer border-2 ${
                        isSelected
                          ? 'border-accent ring-1 ring-accent/50'
                          : 'border-white/5 hover:border-accent/50'
                      }`}
                      onClick={() => toggleAssetSelection(asset.url)}
                    >
                      <Image
                        src={asset.url}
                        alt={asset.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-accent text-white p-1 rounded-full z-10">
                          <Check size={12} />
                        </div>
                      )}
                      {/* Mobile-visible delete */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(asset._id); }}
                        className="absolute top-1 right-1 z-10 p-1.5 bg-black/70 text-red-400 rounded md:hidden"
                      >
                        <Trash2 size={14} />
                      </button>
                      {/* Desktop hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                        <p className="text-[10px] font-bold uppercase tracking-tight truncate">{asset.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(asset._id); }}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white transition-all rounded hidden md:block"
                          >
                            <Trash2 size={12} />
                          </button>
                          <div className="flex items-center gap-1 text-[8px] text-white/40 font-mono">
                            <LinkIcon size={8} />
                            URL
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={!!confirmModal}
        title={confirmModal?.title || ''}
        message={confirmModal?.message || ''}
        variant={confirmModal?.variant || 'default'}
        onConfirm={() => confirmModal?.onConfirm()}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  );
}
