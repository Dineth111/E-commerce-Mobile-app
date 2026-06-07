import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/useNotificationStore';

export function useSupabaseRealtime() {
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    let ordersSub: any = null;
    let reviewsSub: any = null;

    // ─── Listen to New Orders ───────────────────────────────────────
    ordersSub = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new as any;
          addNotification({
            title: 'New Order Received! 📦',
            body: `Order #${order.id?.substring(0, 8).toUpperCase()} has been placed for LKR ${(order.total_amount || 0).toLocaleString()}.`,
            type: 'order',
            data: { orderId: order.id },
          });
        }
      )
      .subscribe();

    // ─── Listen to New Reviews (Pending Moderation) ────────────────
    reviewsSub = supabase
      .channel('admin-new-reviews')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews' },
        (payload) => {
          const review = payload.new as any;
          if (review.status === 'pending') {
            addNotification({
              title: 'New Review Pending! 🌟',
              body: `Review from "${review.username || 'Anonymous'}" (${review.rating} stars) needs moderation.`,
              type: 'review',
              data: { reviewId: review.id },
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (ordersSub) supabase.removeChannel(ordersSub);
      if (reviewsSub) supabase.removeChannel(reviewsSub);
    };
  }, []);
}
