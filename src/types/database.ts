export interface Product {
  id: string; // Changed from number to string
  name: string;
  image_url: string; // Kept only fields present in the response
  price:number;
}

export interface OrderItem {
  id: string; // Changed from number to string
  quantity: number;
  product: Product;
}

export interface Order {
  id: string; // Changed from number to string
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  delivery_address: string;
  created_at: string;
  phone_number: string; // Changed from number to string
  customer_name: string;
  order_items: OrderItem[]; // Updated to match API response
}
