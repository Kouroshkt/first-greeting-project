create table if not exists public.order_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  order_number integer not null,
  event_type text not null,
  source text not null,
  from_status text,
  to_status text,
  changes jsonb,
  duration_ms bigint,
  created_at timestamptz not null default now()
);

create index if not exists order_logs_order_id_idx on public.order_logs (order_id);
create index if not exists order_logs_created_at_idx on public.order_logs (created_at desc);
create index if not exists order_logs_event_type_idx on public.order_logs (event_type);
create index if not exists order_logs_source_idx on public.order_logs (source);

alter table public.order_logs enable row level security;

drop policy if exists "Allow anonymous select on order_logs" on public.order_logs;
create policy "Allow anonymous select on order_logs"
  on public.order_logs for select to anon, authenticated using (true);

drop policy if exists "Allow anonymous insert on order_logs" on public.order_logs;
create policy "Allow anonymous insert on order_logs"
  on public.order_logs for insert to anon, authenticated with check (true);

alter publication supabase_realtime add table public.order_logs;