/*
  # Grocery Store Schema

  1. New Tables
    - `products`
      - `id` (serial, primary key)
      - `name` (text)
      - `price` (numeric)
      - `description` (text)
      - `stock` (integer)
      - `created_at` (timestamptz)
    
    - `orders`
      - `id` (serial, primary key)
      - `user_id` (uuid, references auth.users)
      - `status` (enum: pending, processing, completed, cancelled)
      - `total_amount` (numeric)
      - `created_at` (timestamptz)
    
    - `order_items`
      - `id` (serial, primary key)
      - `order_id` (integer, references orders)
      - `product_id` (integer, references products)
      - `quantity` (integer)
      - `price` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create order status enum
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  name text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  description text,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id serial PRIMARY KEY,
  order_id integer REFERENCES orders ON DELETE CASCADE NOT NULL,
  product_id integer REFERENCES products NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (true);

-- Insert sample products
INSERT INTO products (name, price, description, stock)
VALUES
  ('Organic Bananas', 2.99, 'Fresh organic bananas, per bunch', 100),
  ('Whole Milk', 3.49, 'Fresh whole milk, 1 gallon', 50),
  ('Whole Wheat Bread', 2.99, 'Freshly baked whole wheat bread', 30),
  ('Eggs', 4.99, 'Large brown eggs, dozen', 40),
  ('Chicken Breast', 8.99, 'Fresh boneless chicken breast, per pound', 25);