CREATE TABLE public.priority_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  order_number INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.priority_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous select on priority_logs"
  ON public.priority_logs FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert on priority_logs"
  ON public.priority_logs FOR INSERT TO anon WITH CHECK (true);

CREATE INDEX idx_priority_logs_order_id ON public.priority_logs(order_id);
CREATE INDEX idx_priority_logs_created_at ON public.priority_logs(created_at DESC);