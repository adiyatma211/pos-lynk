import { useState, useCallback, useMemo } from 'react';
import type { TransactionItem, Product } from '@/types/pos';

interface CartItem extends TransactionItem {
  productId: string;
}

interface UseCartReturn {
  cart: CartItem[];
  cartSubtotal: number;
  cartCount: number;
  addToCart: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getCartItem: (productId: string) => CartItem | undefined;
  getCartTotal: () => number;
  getItemQuantity: (productId: string) => number;
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) {
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);

      if (existingItem) {
        if (existingItem.qty >= product.stock) {
          return prevCart;
        }

        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      } else {
        return [...prevCart, {
          productId: product.id,
          name: product.name,
          price: product.price,
          qty: 1
        }];
      }
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId
          ? { ...item, qty: quantity }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart =>
      prevCart.filter(item => item.productId !== productId)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const isInCart = useCallback((productId: string) => {
    return cart.some(item => item.productId === productId);
  }, [cart]);

  const getCartItem = useCallback((productId: string) => {
    return cart.find(item => item.productId === productId);
  }, [cart]);

  const getItemQuantity = useCallback((productId: string) => {
    const item = cart.find(cartItem => cartItem.productId === productId);
    return item?.qty || 0;
  }, [cart]);

  // Memoized calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [cart]);

  return {
    cart,
    cartSubtotal,
    cartCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isInCart,
    getCartItem,
    getCartTotal,
    getItemQuantity,
  };
}