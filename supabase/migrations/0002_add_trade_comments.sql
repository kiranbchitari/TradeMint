-- Journal-style commentary on a trade: timestamped notes capturing how the
-- trader feels as the trade progresses. Child of trades (cascade delete),
-- RLS-scoped to the owner.
create table if not exists public.trade_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trade_id uuid not null references public.trades (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  emotion text check (
    emotion in (
      'calm', 'confident', 'disciplined', 'excited', 'fearful',
      'greedy', 'fomo', 'revenge', 'frustrated', 'bored'
    )
  ),
  created_at timestamptz not null default now()
);

alter table public.trade_comments enable row level security;

create policy "trade_comments_all_own" on public.trade_comments for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Covers both the trade_id FK and the per-trade chronological fetch/order.
create index if not exists trade_comments_trade_id_idx
  on public.trade_comments (trade_id, created_at);
-- Covers the user_id FK.
create index if not exists trade_comments_user_id_idx
  on public.trade_comments (user_id);
