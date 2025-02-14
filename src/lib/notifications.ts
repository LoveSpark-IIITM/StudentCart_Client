import { supabase } from './supabase';

export async function setupNotifications() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user) {
    console.log('User is not logged in. Notifications disabled.');
    return;
  }

  let permission = Notification.permission;

  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission === 'granted') {
    // Subscribe to new orders
    if(user){
      supabase
        .channel('orders')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            const order = payload.new;
            showNotification(order);
          }
        )
        .subscribe();
    }
  }
}

function showNotification(order: any) {
  const notification = new Notification('New Order Received!', {
    body: `Order #${order.id} - $${order.total_amount.toFixed(2)}`,
    icon: '/vite.svg', // You can replace this with your own icon
    badge: '/vite.svg', // You can replace this with your own badge
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}
