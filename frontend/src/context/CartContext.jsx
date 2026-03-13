import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState('0.00');
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotal('0.00');
      setCount(0);
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setItems(data.items);
      setTotal(data.total);
      setCount(data.count);
    } catch (err) {
      // Use localStorage for demo
      const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
      setItems(cartData);
      const totalAmount = cartData.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      setTotal(totalAmount.toFixed(2));
      setCount(cartData.reduce((sum, item) => sum + item.quantity, 0));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product_id, quantity = 1) => {
    try {
      await api.post('/cart', { product_id, quantity });
      await fetchCart();
    } catch (err) {
      // Demo mode - use localStorage
      const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingIndex = cartData.findIndex(item => item.product_id === product_id);
      
      if (existingIndex >= 0) {
        cartData[existingIndex].quantity += quantity;
      } else {
        // Get product from dummy data (you'll need to pass this)
        cartData.push({
          id: Date.now(),
          product_id,
          quantity,
          product: { id: product_id, name: 'Product', price: 0 } // Placeholder
        });
      }
      
      localStorage.setItem('cart', JSON.stringify(cartData));
      await fetchCart();
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return removeItem(itemId);
    try {
      await api.put(`/cart/${itemId}`, { quantity });
      await fetchCart();
    } catch (err) {
      const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
      const index = cartData.findIndex(item => item.id === itemId);
      if (index >= 0) {
        cartData[index].quantity = quantity;
        localStorage.setItem('cart', JSON.stringify(cartData));
        await fetchCart();
      }
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/${itemId}`);
      await fetchCart();
    } catch (err) {
      const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
      const filtered = cartData.filter(item => item.id !== itemId);
      localStorage.setItem('cart', JSON.stringify(filtered));
      await fetchCart();
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      await fetchCart();
    } catch (err) {
      localStorage.removeItem('cart');
      await fetchCart();
    }
  };

  return (
    <CartContext.Provider value={{ items, total, count, loading, addToCart, updateQuantity, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
