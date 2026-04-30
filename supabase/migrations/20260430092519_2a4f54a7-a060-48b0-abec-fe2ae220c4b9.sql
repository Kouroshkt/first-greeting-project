-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
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

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id),
  order_number INTEGER NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('dine-in', 'take-away')),
  items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','preparing','done','ready','picked_up','completed'])),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts on transactions" ON public.transactions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anonymous select on transactions" ON public.transactions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anonymous inserts on orders" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anonymous select on orders" ON public.orders
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anonymous updates on orders" ON public.orders
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Order number sequence
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS INTEGER
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT nextval('public.order_number_seq')::INTEGER;
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Priority logs
CREATE TABLE IF NOT EXISTS public.priority_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  order_number INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.priority_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous select on priority_logs"
  ON public.priority_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anonymous insert on priority_logs"
  ON public.priority_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_priority_logs_order_id ON public.priority_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_priority_logs_created_at ON public.priority_logs(created_at DESC);