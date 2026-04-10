'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  BRANDS,
  SCALES,
  CATEGORIES,
  CONDITIONS,
  MATERIALS,
  LISTING_TYPES,
} from '@/lib/constants';
import ImageDropzone from './ImageDropzone';
import AssetPickerModal from './AssetPickerModal';
import AutocompleteInput from './AutocompleteInput';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  editProduct?: any;
  nameSuggestions?: string[];
  skuSuggestions?: string[];
}

function resolveListingType(product: any): 'in-stock' | 'pre-order' {
  if (product.listingType === 'pre-order') return 'pre-order';
  if (product.listingType === 'in-stock') return 'in-stock';
  if (product.category === 'Pre-Order' || product.isPreorder) return 'pre-order';
  return 'in-stock';
}

const INITIAL_FORM = {
  name: '',
  sku: '',
  brand: BRANDS[0] as string,
  scale: SCALES[0] as string,
  category: CATEGORIES[0] as string,
  condition: CONDITIONS[0] as string,
  material: MATERIALS[0] as string,
  price: '',
  stock: '0',
  bookingAdvance: '',
  totalFinalPrice: '',
  eta: '',
  specialFeatures: '',
  description: '',
};

export default function ProductForm({
  isOpen,
  onClose,
  editProduct,
  nameSuggestions = [],
  skuSuggestions = [],
}: ProductFormProps) {
  const { user } = useAuth();
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);

  const [listingType, setListingType] = useState<'in-stock' | 'pre-order'>(
    'in-stock'
  );
  const [form, setForm] = useState(INITIAL_FORM);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editProduct) {
      const lt = resolveListingType(editProduct);
      setListingType(lt);
      setForm({
        name: editProduct.name || '',
        sku: editProduct.sku || '',
        brand: editProduct.brand || BRANDS[0],
        scale: editProduct.scale || SCALES[0],
        category:
          editProduct.category && CATEGORIES.includes(editProduct.category as any)
            ? editProduct.category
            : editProduct.category || CATEGORIES[0],
        condition: editProduct.condition || editProduct.details?.material ? CONDITIONS[0] : CONDITIONS[0],
        material:
          editProduct.material ||
          editProduct.details?.material ||
          MATERIALS[0],
        price: editProduct.price?.toString() || '',
        stock: (editProduct.stock || 0).toString(),
        bookingAdvance: (editProduct.bookingAdvance || editProduct.price || '').toString(),
        totalFinalPrice: (editProduct.totalFinalPrice || '').toString(),
        eta: editProduct.eta || '',
        specialFeatures:
          editProduct.specialFeatures ||
          editProduct.details?.features?.join(', ') ||
          '',
        description: editProduct.description || '',
      });
      const existingImages = editProduct.images?.length
        ? editProduct.images
        : editProduct.image
          ? [editProduct.image]
          : [];
      setImages(existingImages);
    } else {
      setForm(INITIAL_FORM);
      setImages([]);
      setListingType('in-stock');
    }
    setValidationError('');
  }, [editProduct, isOpen]);

  if (!isOpen) return null;

  const handleAssetSelect = (urls: string[]) => {
    const newImages = [...images];
    for (const url of urls) {
      if (!newImages.includes(url)) {
        newImages.push(url);
      }
    }
    setImages(newImages.slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (images.length === 0) {
      setValidationError('Please add at least one image.');
      return;
    }

    const isPreOrder = listingType === 'pre-order';

    if (isPreOrder) {
      const advance = parseFloat(form.bookingAdvance);
      const total = parseFloat(form.totalFinalPrice);
      if (isNaN(advance) || advance <= 0) {
        setValidationError('Booking advance must be greater than 0.');
        return;
      }
      if (isNaN(total) || total <= 0) {
        setValidationError('Total final price must be greater than 0.');
        return;
      }
      if (advance >= total) {
        setValidationError('Booking advance must be less than total final price.');
        return;
      }
    } else {
      if (isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) {
        setValidationError('Price must be greater than 0.');
        return;
      }
    }

    setSaving(true);
    try {
      const price = isPreOrder
        ? parseFloat(form.bookingAdvance)
        : parseFloat(form.price);

      const payload: any = {
        workosUserId: user!.workosUserId,
        name: form.name,
        price,
        images,
        image: images[0],
        category: form.category,
        brand: form.brand,
        scale: form.scale,
        description: form.description || undefined,
        sku: form.sku || undefined,
        condition: form.condition,
        material: form.material,
        specialFeatures: form.specialFeatures || undefined,
        listingType,
        isPreorder: isPreOrder,
        status: isPreOrder ? 'Pre-Order' : 'In Stock',
      };

      if (isPreOrder) {
        payload.bookingAdvance = parseFloat(form.bookingAdvance);
        payload.totalFinalPrice = parseFloat(form.totalFinalPrice);
        payload.eta = form.eta || undefined;
      } else {
        payload.stock = parseInt(form.stock) || 0;
      }

      if (editProduct) {
        await updateProduct({ ...payload, id: editProduct._id });
      } else {
        await createProduct(payload);
      }

      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const isPreOrder = listingType === 'pre-order';

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="relative w-full max-w-2xl glass p-10 overflow-y-auto max-h-[90vh]"
        >
          <h2 className="text-3xl font-display font-bold uppercase mb-6">
            {editProduct ? 'Edit Product' : 'Add New Model'}
          </h2>

          {/* Listing Type Toggle */}
          <div className="flex bg-white/5 p-1 rounded-sm border border-white/10 mb-8">
            {LISTING_TYPES.map((lt) => (
              <button
                key={lt}
                type="button"
                onClick={() => setListingType(lt)}
                className={`flex-1 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  listingType === lt
                    ? 'bg-accent text-white'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {lt === 'in-stock' ? 'In-Stock' : 'Pre-Order'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Dropzone */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                Product Images *
              </label>
              <ImageDropzone
                images={images}
                onImagesChange={setImages}
                onOpenAssetPicker={() => setAssetPickerOpen(true)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SKU */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  SKU
                </label>
                <AutocompleteInput
                  value={form.sku}
                  onChange={(val) => setForm({ ...form, sku: val })}
                  suggestions={skuSuggestions}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                  placeholder="e.g. CM64-RB-02"
                />
              </div>

              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  Product Name *
                </label>
                <AutocompleteInput
                  required
                  value={form.name}
                  onChange={(val) => setForm({ ...form, name: val })}
                  suggestions={nameSuggestions}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                  placeholder="e.g. Pagani Huayra R"
                />
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  Brand *
                </label>
                <select
                  required
                  value={
                    BRANDS.includes(form.brand as any)
                      ? form.brand
                      : ''
                  }
                  onChange={(e) =>
                    setForm({ ...form, brand: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors appearance-none"
                >
                  {!BRANDS.includes(form.brand as any) && form.brand && (
                    <option value={form.brand}>{form.brand}</option>
                  )}
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scale */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  Scale *
                </label>
                <select
                  required
                  value={form.scale}
                  onChange={(e) =>
                    setForm({ ...form, scale: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors appearance-none"
                >
                  {!SCALES.includes(form.scale as any) && (
                    <option value={form.scale}>{form.scale}</option>
                  )}
                  {SCALES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  Category *
                </label>
                <select
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors appearance-none"
                >
                  {!CATEGORIES.includes(form.category as any) &&
                    form.category && (
                      <option value={form.category}>
                        {form.category} (legacy)
                      </option>
                    )}
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  Condition
                </label>
                <select
                  value={form.condition}
                  onChange={(e) =>
                    setForm({ ...form, condition: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors appearance-none"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Material */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  Material
                </label>
                <select
                  value={form.material}
                  onChange={(e) =>
                    setForm({ ...form, material: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors appearance-none"
                >
                  {MATERIALS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional pricing fields */}
              {!isPreOrder ? (
                <>
                  {/* In-Stock: Price */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      Price (INR) *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                      placeholder="1950"
                    />
                  </div>

                  {/* Stock Quantity */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) =>
                        setForm({ ...form, stock: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                      placeholder="10"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Pre-Order: Booking Advance */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      Booking Advance (INR) *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={form.bookingAdvance}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          bookingAdvance: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                      placeholder="100"
                    />
                  </div>

                  {/* Total Final Price */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      Total Final Price (INR) *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={form.totalFinalPrice}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          totalFinalPrice: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                      placeholder="2500"
                    />
                  </div>

                  {/* ETA */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      ETA
                    </label>
                    <input
                      type="text"
                      value={form.eta}
                      onChange={(e) =>
                        setForm({ ...form, eta: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                      placeholder="e.g. July 2026"
                    />
                  </div>
                </>
              )}

              {/* Special Features */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  Special Features
                </label>
                <input
                  type="text"
                  value={form.specialFeatures}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      specialFeatures: e.target.value,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
                  placeholder="Opening Parts, Full Carbon Body, Rubber Tires"
                />
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  Description (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-accent outline-none transition-colors h-28 resize-none"
                  placeholder="Additional product details..."
                />
              </div>
            </div>

            {/* Validation error */}
            {validationError && (
              <div className="text-red-400 text-xs font-mono bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-sm">
                {validationError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-accent text-white py-4 font-display font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                {saving
                  ? 'Saving...'
                  : editProduct
                    ? 'Update Product'
                    : 'Save Product'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-8 border border-white/10 hover:bg-white/5 transition-all uppercase text-xs tracking-widest"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      <AssetPickerModal
        isOpen={assetPickerOpen}
        onClose={() => setAssetPickerOpen(false)}
        onSelect={handleAssetSelect}
        selectedUrls={images}
      />
    </>
  );
}
