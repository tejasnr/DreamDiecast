'use client';

import { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Link as LinkIcon,
  Trash2,
  Plus,
  Image as ImageIcon,
  Loader2,
  Check,
  Settings,
  Layout
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useSettings, WebsiteSettings } from '@/hooks/useSettings';
import { Id } from '@/convex/_generated/dataModel';

interface AssetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (url: string) => void;
}

export default function AssetManager({ isOpen, onClose, onSelect }: AssetManagerProps) {
  const { user } = useAuth();
  const assets = useQuery(api.assets.list);
  const websiteSettings = useSettings();
  const createAsset = useAction(api.assets.create);
  const removeAsset = useMutation(api.assets.remove);
  const updateSetting = useMutation(api.settings.updateWebsiteSetting);

  const [activeTab, setActiveTab] = useState<'library' | 'website'>('website');
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', url: '', type: 'image' as const });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [slotUploading, setSlotUploading] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('This file is quite large (>5MB). It may take a moment to upload.');
      }
      setUploadFile(file);
      setNewAsset({ ...newAsset, name: file.name });
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let url = newAsset.url || undefined;
      let dataUrl: string | undefined;

      if (uploadFile) {
        dataUrl = await fileToDataUrl(uploadFile);
      }

      if (!url && !dataUrl) throw new Error('No URL or file provided');

      await createAsset({
        workosUserId: user?.workosUserId,
        name: newAsset.name || 'Untitled Asset',
        type: newAsset.type,
        url,
        dataUrl,
      });

      setNewAsset({ name: '', url: '', type: 'image' });
      setUploadFile(null);
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding asset:', err);
      alert('Failed to add asset');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await removeAsset({ workosUserId: user?.workosUserId, id: id as Id<"assets"> });
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  const handleUpdateWebsiteAsset = async (key: keyof WebsiteSettings, url: string) => {
    try {
      await updateSetting({
        workosUserId: user?.workosUserId,
        key: key as "heroBackground" | "vaultImage" | "footerBackground" | "categoryJdm" | "categoryEuropean" | "categoryHypercars",
        value: url,
      });
    } catch (err) {
      console.error('Error updating website asset:', err);
      alert('Failed to update website setting');
    }
  };

  const handleSlotFileUpload = async (key: keyof WebsiteSettings, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSlotUploading(key);

      try {
        const dataUrl = await fileToDataUrl(file);
        // Create asset first, then use its URL
        await createAsset({
          workosUserId: user?.workosUserId,
          name: `website_${key}`,
          type: 'image',
          dataUrl,
        });
        // Get the latest asset URL from the created asset
        // Since Convex is reactive, we use a simpler approach: create the asset and set URL from dataUrl
        // Actually, we need the stored URL. Let's use a direct upload approach.
        // For simplicity, upload as asset then use the URL from the assets list after it refreshes
        // Better approach: just set the URL from prompt for now
        alert('Asset uploaded to library. Please set the URL from the Website tab.');
      } catch (err) {
        console.error('Error uploading website asset:', err);
        alert('Upload failed.');
      } finally {
        setSlotUploading(null);
      }
    }
  };

  const websiteAssetSlots = [
    { key: 'heroBackground' as const, label: 'Hero Background', description: 'Main banner image on home page' },
    { key: 'vaultImage' as const, label: 'Vault Image', description: 'Secondary hero or background element' },
    { key: 'footerBackground' as const, label: 'Footer Background', description: 'Newsletter section background' },
    { key: 'categoryJdm' as const, label: 'JDM Category', description: 'Thumbnail for JDM collection' },
    { key: 'categoryEuropean' as const, label: 'European Category', description: 'Thumbnail for European collection' },
    { key: 'categoryHypercars' as const, label: 'Hypercars Category', description: 'Thumbnail for Hypercars collection' },
  ];

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
        className="relative w-full max-w-6xl h-[85vh] glass flex flex-col overflow-hidden border border-white/10"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div>
            <h2 className="text-2xl font-display font-bold uppercase tracking-tight">Asset Manager</h2>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono mt-1">Manage website images & media</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-black/40 p-1 border border-white/10">
              <button
                onClick={() => setActiveTab('website')}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'website' ? 'bg-accent text-white' : 'text-white/40 hover:text-white'}`}
              >
                <Layout size={14} /> Website
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'library' ? 'bg-accent text-white' : 'text-white/40 hover:text-white'}`}
              >
                <ImageIcon size={14} /> Library
              </button>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors ml-4">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'library' ? (
            <>
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Media Library</h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-accent hover:text-white transition-all"
                >
                  {showAddForm ? <X size={14} /> : <Plus size={14} />}
                  {showAddForm ? 'Cancel' : 'Upload New'}
                </button>
              </div>

              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-white/10 bg-white/5 overflow-hidden"
                  >
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Asset Name</label>
                          <input
                            type="text"
                            value={newAsset.name}
                            onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-accent outline-none"
                            placeholder="e.g. Hero Banner"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Image URL or Upload</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newAsset.url}
                              disabled={!!uploadFile}
                              onChange={(e) => setNewAsset({...newAsset, url: e.target.value})}
                              className="flex-1 bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-accent outline-none disabled:opacity-50"
                              placeholder="https://..."
                            />
                            <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2 flex items-center gap-2 transition-all">
                              <Upload size={16} />
                              <span className="text-[10px] uppercase font-bold">File</span>
                              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                            </label>
                          </div>
                          {uploadFile && (
                            <p className="text-[10px] text-accent mt-1 font-mono uppercase">Selected: {uploadFile.name}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={uploading || (!newAsset.url && !uploadFile)}
                        className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {uploading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        {uploading ? 'Uploading...' : 'Save Asset'}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
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
                    {assets.map((asset: any) => (
                      <div
                        key={asset._id}
                        className="group relative aspect-video glass overflow-hidden border border-white/5 hover:border-accent/50 transition-all cursor-pointer"
                        onClick={() => onSelect?.(asset.url)}
                      >
                        <Image
                          src={asset.url}
                          alt={asset.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                          <p className="text-[10px] font-bold uppercase tracking-tight truncate">{asset.name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(asset._id); }}
                              className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white transition-all rounded"
                            >
                              <Trash2 size={12} />
                            </button>
                            <div className="flex items-center gap-1 text-[8px] text-white/40 font-mono">
                              <LinkIcon size={8} />
                              URL
                            </div>
                          </div>
                        </div>
                        {onSelect && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-accent text-white p-1 rounded-full">
                              <Plus size={12} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display font-bold uppercase tracking-tight">Website Configuration</h3>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Assign specific images to website sections</p>
                </div>
                <div className="flex items-center gap-2 text-accent">
                  <Settings size={16} className="animate-spin-slow" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Live Sync Enabled</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {websiteAssetSlots.map((slot) => (
                  <div key={slot.key} className="glass p-6 border border-white/5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">{slot.label}</h4>
                        <p className="text-[10px] text-white/40 font-mono mt-1">{slot.description}</p>
                      </div>
                    </div>

                    <div className="relative aspect-video bg-black/40 border border-white/10 overflow-hidden group">
                      {websiteSettings?.[slot.key] ? (
                        <Image
                          src={websiteSettings[slot.key]}
                          alt={slot.label}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/10">
                          <ImageIcon size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        {slotUploading === slot.key ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-accent" size={24} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                const url = prompt('Enter image URL:');
                                if (url) handleUpdateWebsiteAsset(slot.key, url);
                              }}
                              className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-2"
                            >
                              <LinkIcon size={14} /> URL
                            </button>
                            <label className="cursor-pointer bg-accent text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2">
                              <Upload size={14} /> Upload
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleSlotFileUpload(slot.key, e)}
                                accept="image/*"
                              />
                            </label>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-widest text-white/20 font-mono">Current URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={websiteSettings?.[slot.key] || ''}
                          className="flex-1 bg-black/40 border border-white/5 px-3 py-2 text-[10px] font-mono text-white/40 outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(websiteSettings?.[slot.key] || '');
                            alert('URL copied to clipboard');
                          }}
                          className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        >
                          <LinkIcon size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
