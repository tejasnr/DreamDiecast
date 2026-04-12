'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, isPreOrderItem } from '@/lib/data';
import Toast from '@/components/Toast';
import { trackEvent } from '@/lib/posthog';

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
  addToCart: (product: Product) => void;
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
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; image?: string }>({
    isVisible: false,
    message: '',
  });

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

  const addToCart = (product: Product) => {
    // Check stock
    if (product.stock !== undefined && product.stock <= 0 && !isPreOrderItem(product)) {
      setToast({
        isVisible: true,
        message: `${product.name} is out of stock`,
        image: product.image
      });
      setTimeout(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
      }, 3000);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });

    trackEvent('add_to_cart', { productId: product.id, name: product.name, price: product.price, category: product.category });

    // Show toast
    setToast({
      isVisible: true,
      message: product.name,
      image: product.image
    });

    // Auto hide toast
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

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
          // Check stock limit
          if (item.stock !== undefined && quantity > item.stock && !isPreOrderItem(item)) {
            setToast({
              isVisible: true,
              message: `Only ${item.stock} units available for ${item.name}`,
              image: item.image
            });
            setTimeout(() => {
              setToast(prev => ({ ...prev, isVisible: false }));
            }, 3000);
            return item; // Don't update if exceeds stock
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
