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
      console.error('Fetch cart error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product_id, quantity = 1) => {
    await api.post('/cart', { product_id, quantity });
    await fetchCart();
  };

  const updateQuantity = async (itemId, quantity) => {
    await api.put(`/cart/${itemId}`, { quantity });
    await fetchCart();
  };

  const removeItem = async (itemId) => {
    await api.delete(`/cart/${itemId}`);
    await fetchCart();
  };

  const clearCart = async () => {
    await api.delete('/cart');
    await fetchCart();
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
