import { supabase } from '@/services/supabase';

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image_url?: string;
}

export async function createOrder(
  items: any[],
  totalAmount: number,
  shippingAddress: string,
  paymentMethod: string
) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in to place an order');
  }

  const orderItems: OrderItem[] = items.map((item) => ({
    product_id: item.product.id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    size: item.size,
    color: typeof item.color === 'string' ? item.color : item.color?.name,
    image_url: item.product.images?.[0],
  }));

  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_id: user.id,
      total_amount: totalAmount,
      status: 'pending',
      items: orderItems,
      shipping_address: shippingAddress,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getUserOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
