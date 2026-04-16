'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, isPreOrderItem } from '@/lib/data';
import Toast from '@/components/Toast';
import { trackEvent } from '@/lib/posthog';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface CartItem extends Product {
  quantity: number;
}

interface CheckoutDetails {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  checkoutDetails: CheckoutDetails | null;
  setCheckoutDetails: (details: CheckoutDetails) => void;
  shippingCharges: number;
  setShippingCharges: (charges: number) => void;
  balancePaymentItem: { id: string; name: string; fullPrice: number; image: string; garageItemId: string } | null;
  initiateBalancePayment: (item: { id: string; name: string; price: number; image: string; garageItemId: string }) => void;
  clearBalancePayment: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutDetails, setCheckoutDetails] = useState<CheckoutDetails | null>(null);
  const [shippingCharges, setShippingCharges] = useState<number>(0);
  const [balancePaymentItem, setBalancePaymentItem] = useState<{ id: string; name: string; fullPrice: number; image: string; garageItemId: string } | null>(null);
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; image?: string; type?: 'success' | 'warning' }>({
    isVisible: false,
    message: '',
  });

  const showToast = useCallback((message: string, image?: string, type: 'success' | 'warning' = 'success') => {
    setToast({ isVisible: true, message, image, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('dream_diecast_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('dream_diecast_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback(async (product: Product, qty: number = 1) => {
    const isPO = isPreOrderItem(product);

    // Hype product: limit to 1 per person
    if (product.isHype) {
      if (qty > 1) {
        showToast('Hyped models are limited to 1 per person', product.image, 'warning');
        return;
      }
      const alreadyInCart = cart.find(item => item.id === product.id);
      if (alreadyInCart) {
        showToast('Hyped models are limited to 1 per person', product.image, 'warning');
        return;
      }
    }

    // Real-time stock validation for in-stock items
    if (!isPO) {
      try {
        const stockInfo = await convexClient.query(api.products.checkStock, {
          productId: product.id as any,
        });
        if (!stockInfo.available) {
          showToast(`${product.name} is out of stock`, product.image, 'warning');
          return;
        }
        const existingInCart = cart.find(item => item.id === product.id);
        const currentQty = existingInCart ? existingInCart.quantity : 0;
        if (currentQty + qty > stockInfo.stock) {
          showToast(`Only ${stockInfo.stock - currentQty} left in stock`, product.image, 'warning');
          return;
        }
      } catch (err) {
        // If stock check fails, fall back to local product data
        if (product.stock !== undefined && product.stock <= 0) {
          showToast(`${product.name} is out of stock`, product.image, 'warning');
          return;
        }
        const existingInCart = cart.find(item => item.id === product.id);
        const currentQty = existingInCart ? existingInCart.quantity : 0;
        if (product.stock !== undefined && currentQty + qty > product.stock) {
          showToast(`Only ${product.stock} available`, product.image, 'warning');
          return;
        }
      }
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.isHype) return prevCart;
        const newQty = existingItem.quantity + qty;
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prevCart, { ...product, quantity: qty }];
    });

    trackEvent('add_to_cart', { productId: product.id, name: product.name, price: product.price, category: product.category });

    showToast(product.name, product.image);
  }, [cart, showToast]);

  const removeFromCart = (productId: string) => {
    trackEvent('remove_from_cart', { productId });
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          // Hype product: clamp to 1
          if (item.isHype && quantity > 1) {
            showToast('Hyped models are limited to 1 per person', item.image, 'warning');
            return { ...item, quantity: 1 };
          }
          // Check stock limit
          if (item.stock !== undefined && quantity > item.stock && !isPreOrderItem(item)) {
            showToast(`Only ${item.stock} available`, item.image, 'warning');
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const initiateBalancePayment = (item: { id: string; name: string; price: number; image: string; garageItemId: string }) => {
    setBalancePaymentItem({
      id: item.id,
      name: item.name,
      fullPrice: item.price,
      image: item.image,
      garageItemId: item.garageItemId
    });
    setCart([]); // Clear normal cart when doing balance payment
  };

  const clearBalancePayment = () => {
    setBalancePaymentItem(null);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = balancePaymentItem 
    ? (balancePaymentItem.fullPrice - 100) 
    : cart.reduce((total, item) => {
        const price = isPreOrderItem(item) ? (item.bookingAdvance ?? 100) : item.price;
        return total + (price * item.quantity);
      }, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal,
      checkoutDetails,
      setCheckoutDetails,
      shippingCharges,
      setShippingCharges,
      balancePaymentItem,
      initiateBalancePayment,
      clearBalancePayment
    }}>
      {children}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        productImage={toast.image}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
