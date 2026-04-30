
-- Fix search_path on get_next_order_number
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS INTEGER
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT nextval('public.order_number_seq')::INTEGER;
$$;
