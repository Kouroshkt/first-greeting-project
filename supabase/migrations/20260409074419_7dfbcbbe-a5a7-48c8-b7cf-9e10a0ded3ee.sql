
-- Create transactions table for all completed transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number INTEGER NOT NULL UNIQUE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('kort', 'swish')),
  amount NUMERIC(10,2) NOT NULL,
  tax NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'failed')),
  encrypted_ref TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table for KDS queue
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id),
  order_number INTEGER NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('dine-in', 'take-away')),
  items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Kiosk is anonymous - allow inserts from anon and service role
CREATE POLICY "Allow anonymous inserts on transactions" ON public.transactions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select on transactions" ON public.transactions
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous inserts on orders" ON public.orders
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select on orders" ON public.orders
  FOR SELECT TO anon USING (true);

-- Sequence for order numbers (resets concept - simple incrementing)
CREATE SEQUENCE public.order_number_seq START 1;

-- Function to get next order number
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS INTEGER
LANGUAGE sql
AS $$
  SELECT nextval('public.order_number_seq')::INTEGER;
$$;

-- Update trigger for orders
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
