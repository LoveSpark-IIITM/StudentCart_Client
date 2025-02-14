import React, { useEffect, useState } from 'react';
import { Package2, RefreshCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem, Product } from '../types/database';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface OrderListProps {
  status?: Order['status'];
  showActions?: boolean;
}

export function OrderList({ status, showActions = true }: OrderListProps) {
  const [orders, setOrders] = useState<
    (Order & { order_items: (OrderItem & { product: Product })[] })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const query = supabase
      .from('orders')
      .select(`
        id, 
        status, 
        total_amount, 
        delivery_address, 
        created_at, 
        phone_number, 
        customer_name,
        order_items (
          id, 
          quantity,
          product: products!inner (id, price, name, image_url)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (status) {
      query.eq('status', status);
    } else {
      query.eq('status', 'pending'); // Default to 'pending'
    }
    
    const { data: ordersData, error: ordersError } = await query
      .returns<(Order & { order_items: (OrderItem & { product: Product })[] })[]>();
    
    


      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Order ${orderId} marked as ${status}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  useEffect(() => {
    fetchOrders();
    // Subscribe to changes
    const channel = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [status]);

 

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                    <p className="text-sm font-medium text-gray-800">{order.customer_name}</p>
                    <p className="text-sm text-gray-600">{order.phone_number}</p>
                    <p className="text-sm text-gray-600">{order.delivery_address}</p>
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                        >
                          Process
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'processing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {order.order_items?.length > 0 ? (
                    order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500">{item.quantity} × ${(item.product.price).toFixed(2)}</p>
                        </div>
                        <p className="font-medium">${(item.quantity * item.product.price).toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No items in this order.</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No orders found.</p>
          )}
        </div>
      )}
    </div>
  );
}
