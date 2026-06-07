import { useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useNotificationStore } from '@/stores/useNotificationStore';

export function useSupabaseRealtime() {
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    let ordersSub: any = null;
    let productsSub: any = null;
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted || !user) return;

      // ─── Subscribe to Order Status Updates for THIS user ───────────────────
      ordersSub = supabase
        .channel(`orders-user-${user.id}-${Math.random().toString(36).substring(7)}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `customer_id=eq.${user.id}`,
          },
          (payload) => {
            const newOrder = payload.new as any;
            const oldOrder = payload.old as any;

            if (oldOrder.status !== newOrder.status) {
              const statusMessages: Record<string, string> = {
                confirmed: 'Your order has been confirmed! 🎉',
                shipped: 'Your order is on the way! 🚚',
                delivered: 'Your order has been delivered! 📦',
                cancelled: 'Your order has been cancelled.',
              };

              addNotification({
                title: 'Order Status Updated',
                body:
                  statusMessages[newOrder.status] ||
                  `Your order is now ${newOrder.status}.`,
                type: 'order',
                data: { orderId: newOrder.id },
              });
            }
          }
        )
        .subscribe();

      // ─── Subscribe to New Product Arrivals (global) ────────────────────────
      productsSub = supabase
        .channel(`new-products-${Math.random().toString(36).substring(7)}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'products' },
          (payload) => {
            const product = payload.new as any;
            if (product?.name) {
              addNotification({
                title: '✨ New Arrival!',
                body: `${product.name} just dropped. Check it out before it sells out!`,
                type: 'product',
                data: { productId: product.id },
              });
            }
          }
        )
        .subscribe();
    });

    return () => {
      mounted = false;
      if (ordersSub) supabase.removeChannel(ordersSub);
      if (productsSub) supabase.removeChannel(productsSub);
    };
  }, []);
}
