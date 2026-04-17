'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Star, Loader2, ImageIcon, Camera } from 'lucide-react';
import Image from 'next/image';

interface ImageDropzoneProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  onOpenAssetPicker: () => void;
  maxImages?: number;
}

export default function ImageDropzone({
  images,
  onImagesChange,
  onOpenAssetPicker,
  maxImages = 10,
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File, maxWidth = 1600, quality = 0.82): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Compression failed'));
            resolve(blob);
          },
          'image/webp',
          quality
        );
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large (max 10MB): ' + file.name);
      return null;
    }
    try {
      const compressed = await compressImage(file);
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
      const siteUrl = convexUrl.replace('.cloud', '.site');
      const res = await fetch(`${siteUrl}/upload`, {
        method: 'POST',
        body: compressed,
      });
      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error('Error uploading file:', err);
      return null;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, maxImages - images.length);
    if (fileArray.length === 0) return;

    setUploading(true);
    setUploadProgress({ done: 0, total: fileArray.length });
    const newUrls: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const url = await uploadFile(fileArray[i]);
      if (url) newUrls.push(url);
      setUploadProgress({ done: i + 1, total: fileArray.length });
    }

    if (newUrls.length > 0) {
      onImagesChange([...images, ...newUrls]);
    }
    setUploading(false);
    setUploadProgress(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [images]
  );

  const handleRemove = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const handleReorderDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleReorderDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onImagesChange(reordered);
    setDragIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-sm p-8 text-center transition-all ${
          isDragging
            ? 'border-accent bg-accent/10'
            : 'border-white/20 hover:border-white/40 bg-white/[0.02]'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
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
          <div className="flex flex-col items-center gap-2">
            <Upload size={32} className="text-white/20" />
            <span className="text-xs text-white/40 uppercase tracking-widest font-mono">
              Drag & Drop images here
            </span>
            <span className="text-[10px] text-white/20 font-mono">
              Max {maxImages} images · Auto-compressed to WebP
            </span>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/10 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10"
              >
                <Upload size={14} /> Browse Files
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="bg-white/10 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10"
              >
                <Camera size={14} /> Take Photo
              </button>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Browse Library button */}
      <button
        type="button"
        onClick={onOpenAssetPicker}
        className="w-full bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
      >
        <ImageIcon size={16} /> Browse Asset Library
      </button>

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={() => handleReorderDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleReorderDrop(index)}
              className={`relative aspect-square bg-white/5 border overflow-hidden group cursor-grab active:cursor-grabbing ${
                index === 0
                  ? 'border-accent ring-1 ring-accent/50'
                  : 'border-white/10'
              }`}
            >
              <Image
                src={url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Cover badge */}
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-accent text-white p-1 rounded-sm">
                  <Star size={10} fill="currentColor" />
                </div>
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-sm"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
