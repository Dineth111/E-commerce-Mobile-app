import { useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useNotificationStore } from '@/stores/useNotificationStore';

export function useSupabaseRealtime() {
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    let ordersSub: any = null;
    let productsSub: any = null;
    let promotionsSub: any = null;
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

      // ─── Subscribe to New Promotions (global) ─────────────────────────────
      promotionsSub = supabase
        .channel(`new-promotions-${Math.random().toString(36).substring(7)}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'promotions' },
          (payload) => {
            const promo = payload.new as any;
            if (promo?.code) {
              const discountText = promo.type === 'percentage' 
                ? `${promo.value}% OFF` 
                : `LKR ${promo.value} OFF`;
              addNotification({
                title: promo.title || '🎁 Special Promotion!',
                body: promo.description || `Use promo code ${promo.code} to get ${discountText} on your next order!`,
                type: 'promo',
                data: { 
                  promoCode: promo.code,
                  productId: promo.product_id || null,
                },
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
      if (promotionsSub) supabase.removeChannel(promotionsSub);
    };
  }, []);
}
