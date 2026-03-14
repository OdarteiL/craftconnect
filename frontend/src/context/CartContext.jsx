import { createContext, useContext, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

async function fetchCart() {
  const { data } = await api.get('/cart');
  return data; // { items, total, count }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    [queryClient]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: !!user,
    placeholderData: { items: [], total: '0.00', count: 0 },
  });

  const addMutation = useMutation({
    mutationFn: ({ product_id, quantity = 1 }) => api.post('/cart', { product_id, quantity }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }) =>
      quantity < 1
        ? api.delete(`/cart/${itemId}`)
        : api.put(`/cart/${itemId}`, { quantity }),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (itemId) => api.delete(`/cart/${itemId}`),
    onSuccess: invalidate,
  });

  const clearMutation = useMutation({
    mutationFn: () => api.delete('/cart'),
    onSuccess: invalidate,
  });

  const items = data?.items ?? [];
  const total = useMemo(
    () => items.reduce((sum, item) => sum + parseFloat(item.product?.price || 0) * item.quantity, 0).toFixed(2),
    [items]
  );
  const count = items.length;

  const value = useMemo(() => ({
    items,
    total,
    count,
    loading: isLoading,
    addToCart: (product_id, quantity = 1) => addMutation.mutateAsync({ product_id, quantity }),
    updateQuantity: (itemId, quantity) => updateMutation.mutateAsync({ itemId, quantity }),
    removeItem: (itemId) => removeMutation.mutateAsync(itemId),
    clearCart: () => clearMutation.mutateAsync(),
  }), [items, total, count, isLoading, addMutation, updateMutation, removeMutation, clearMutation]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
