import { supabase } from '../supabase/client';
import type { Order, OrderStatus } from '../types';

interface OrderFilters {
  status?: OrderStatus;
  user_id?: string;
  limit?: number;
}

export async function getOrders(filters?: OrderFilters): Promise<Order[]> {
  let query = supabase.from('orders').select('*');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function getOrderById(id: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Order;
}

/** Admin only — update order status */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Order;
}

/** Subscribe to real-time order changes */
export function subscribeToOrders(callback: (order: Order) => void) {
  return supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        callback(payload.new as Order);
      }
    )
    .subscribe();
}

/** Get daily revenue for the last N days */
export async function getDailyRevenue(days: number): Promise<{ date: string; revenue: number; order_count: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('orders')
    .select('total, created_at')
    .gte('created_at', startDate.toISOString())
    .neq('status', 'cancelled');

  if (error) throw error;

  // Group by date
  const grouped: Record<string, { revenue: number; order_count: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    grouped[key] = { revenue: 0, order_count: 0 };
  }

  (data ?? []).forEach((order: any) => {
    const key = order.created_at.split('T')[0];
    if (grouped[key]) {
      grouped[key].revenue += order.total;
      grouped[key].order_count += 1;
    }
  });

  return Object.entries(grouped)
    .map(([date, vals]) => ({ date, ...vals }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
