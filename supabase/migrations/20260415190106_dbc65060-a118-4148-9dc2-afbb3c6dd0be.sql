
-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Allow anonymous updates on orders (KDS needs to change status)
CREATE POLICY "Allow anonymous updates on orders"
ON public.orders
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
