import { supabase } from '../supabase/client';
import type { Product, TotalStats, DailyRevenue, TopProduct, OrderStatusCount } from '../types';

export async function getTotalStats(): Promise<TotalStats> {
  const [ordersRes, usersRes] = await Promise.all([
    supabase.from('orders').select('total, status'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  const orders = (ordersRes.data ?? []) as { total: number; status: string }[];
  const nonCancelled = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = nonCancelled.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = nonCancelled.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    total_revenue: totalRevenue,
    total_orders: totalOrders,
    total_users: usersRes.count ?? 0,
    avg_order_value: Math.round(avgOrderValue * 100) / 100,
  };
}

export async function getDailyRevenue(days: number = 30): Promise<DailyRevenue[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('orders')
    .select('total, created_at')
    .gte('created_at', startDate.toISOString())
    .neq('status', 'cancelled');

  if (error) throw error;

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

export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('items')
    .neq('status', 'cancelled');

  if (error) throw error;

  // Tally up product sales
  const productMap: Record<string, { name: string; sales_count: number; revenue: number }> = {};

  (orders ?? []).forEach((order: any) => {
    const items = order.items ?? [];
    items.forEach((item: any) => {
      if (!productMap[item.product_id]) {
        productMap[item.product_id] = { name: item.product_name, sales_count: 0, revenue: 0 };
      }
      productMap[item.product_id].sales_count += item.qty;
      productMap[item.product_id].revenue += item.price * item.qty;
    });
  });

  const sorted = Object.entries(productMap)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, limit);

  return sorted.map(([id, info]) => ({
    product: { id, name: info.name } as Product,
    sales_count: info.sales_count,
    revenue: info.revenue,
  }));
}

export async function getOrdersByStatus(): Promise<OrderStatusCount[]> {
  const { data, error } = await supabase.from('orders').select('status');
  if (error) throw error;

  const counts: Record<string, number> = {};
  (data ?? []).forEach((o: any) => {
    counts[o.status] = (counts[o.status] ?? 0) + 1;
  });

  return Object.entries(counts).map(([status, count]) => ({
    status: status as any,
    count,
  }));
}
