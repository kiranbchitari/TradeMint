-- ============================================================================
-- Trade sharing / collaboration — security foundation.
-- Per-trade shares with viewer/commenter/editor roles for existing users.
-- ============================================================================

-- --- Shares table ----------------------------------------------------------
create table if not exists public.trade_shares (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  collaborator_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('viewer', 'commenter', 'editor')),
  -- Denormalized display data captured at invite time so the share list and
  -- "shared with me" view render without opening up profiles.
  collaborator_email text,
  collaborator_name text,
  owner_email text,
  owner_name text,
  created_at timestamptz not null default now(),
  unique (trade_id, collaborator_id)
);

create index if not exists trade_shares_collaborator_idx
  on public.trade_shares (collaborator_id);
create index if not exists trade_shares_trade_idx
  on public.trade_shares (trade_id);
create index if not exists trade_shares_owner_idx
  on public.trade_shares (owner_id);

alter table public.trade_shares enable row level security;

-- Owner manages the share; both parties can read it.
create policy "trade_shares_select" on public.trade_shares for select
  using (
    owner_id = (select auth.uid())
    or collaborator_id = (select auth.uid())
  );
create policy "trade_shares_insert" on public.trade_shares for insert
  with check (owner_id = (select auth.uid()));
create policy "trade_shares_update" on public.trade_shares for update
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "trade_shares_delete" on public.trade_shares for delete
  using (owner_id = (select auth.uid()));

-- --- Access helper functions (SECURITY DEFINER: they do their own checks and
--     must bypass RLS to avoid recursion against the very tables being gated) --
create or replace function public.can_view_trade(tid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trades t
    where t.id = tid and (
      t.user_id = auth.uid()
      or exists (
        select 1 from public.trade_shares s
        where s.trade_id = t.id and s.collaborator_id = auth.uid()
      )
    )
  );
$$;

create or replace function public.can_comment_trade(tid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trades t
    where t.id = tid and (
      t.user_id = auth.uid()
      or exists (
        select 1 from public.trade_shares s
        where s.trade_id = t.id and s.collaborator_id = auth.uid()
          and s.role in ('commenter', 'editor')
      )
    )
  );
$$;

create or replace function public.can_edit_trade(tid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trades t
    where t.id = tid and (
      t.user_id = auth.uid()
      or exists (
        select 1 from public.trade_shares s
        where s.trade_id = t.id and s.collaborator_id = auth.uid()
          and s.role = 'editor'
      )
    )
  );
$$;

create or replace function public.is_trade_owner(tid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trades t
    where t.id = tid and t.user_id = auth.uid()
  );
$$;

grant execute on function public.can_view_trade(uuid) to authenticated;
grant execute on function public.can_comment_trade(uuid) to authenticated;
grant execute on function public.can_edit_trade(uuid) to authenticated;
grant execute on function public.is_trade_owner(uuid) to authenticated;

-- --- trades: split ALL into per-command, add collaboration --------------------
drop policy if exists "trades_all_own" on public.trades;

create policy "trades_select" on public.trades for select using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.trade_shares s
    where s.trade_id = trades.id and s.collaborator_id = (select auth.uid())
  )
);
create policy "trades_insert" on public.trades for insert
  with check (user_id = (select auth.uid()));
create policy "trades_update" on public.trades for update using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.trade_shares s
    where s.trade_id = trades.id and s.collaborator_id = (select auth.uid())
      and s.role = 'editor'
  )
) with check (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.trade_shares s
    where s.trade_id = trades.id and s.collaborator_id = (select auth.uid())
      and s.role = 'editor'
  )
);
create policy "trades_delete" on public.trades for delete
  using (user_id = (select auth.uid()));

-- Ownership can never change through an UPDATE (defends against an editor
-- rewriting user_id to hijack the trade; ownership transfer isn't a feature).
create or replace function public.trades_lock_owner()
returns trigger language plpgsql as $$
begin
  new.user_id := old.user_id;
  return new;
end;
$$;
drop trigger if exists trades_lock_owner on public.trades;
create trigger trades_lock_owner before update on public.trades
  for each row execute function public.trades_lock_owner();

-- --- trade_comments: view for anyone with access; add for commenter/editor ---
drop policy if exists "trade_comments_all_own" on public.trade_comments;

create policy "trade_comments_select" on public.trade_comments for select
  using (public.can_view_trade(trade_id));
create policy "trade_comments_insert" on public.trade_comments for insert
  with check (
    user_id = (select auth.uid()) and public.can_comment_trade(trade_id)
  );
create policy "trade_comments_update" on public.trade_comments for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
-- Author can delete their own note; trade owner can moderate any note.
create policy "trade_comments_delete" on public.trade_comments for delete
  using (user_id = (select auth.uid()) or public.is_trade_owner(trade_id));

-- --- Read visibility for a shared trade's related library rows ----------------
-- Additive permissive SELECT policies; each table keeps its owner-only
-- *_all_own policy for full owner access and all writes.
create policy "strategies_select_shared" on public.strategies for select using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.trades t
    where t.strategy_id = strategies.id and public.can_view_trade(t.id)
  )
);
create policy "accounts_select_shared" on public.accounts for select using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.trades t
    where t.account_id = accounts.id and public.can_view_trade(t.id)
  )
);
create policy "tags_select_shared" on public.tags for select using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.trade_tags tt
    where tt.tag_id = tags.id and public.can_view_trade(tt.trade_id)
  )
);
create policy "mistakes_select_shared" on public.mistakes for select using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.trade_mistakes tm
    where tm.mistake_id = mistakes.id and public.can_view_trade(tm.trade_id)
  )
);
create policy "trade_tags_select_shared" on public.trade_tags for select
  using (public.can_view_trade(trade_id));
create policy "trade_mistakes_select_shared" on public.trade_mistakes for select
  using (public.can_view_trade(trade_id));

-- --- Invite RPC: privileged email lookup + share + notification ---------------
create or replace function public.share_trade(
  p_trade_id uuid, p_email text, p_role text
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_owner_email text;
  v_owner_name text;
  v_collab uuid;
  v_collab_email text;
  v_collab_name text;
  v_symbol text;
begin
  if v_owner is null then return 'unauthenticated'; end if;
  if p_role not in ('viewer', 'commenter', 'editor') then
    return 'invalid_role';
  end if;

  -- Caller must own the trade.
  select symbol into v_symbol
  from public.trades where id = p_trade_id and user_id = v_owner;
  if v_symbol is null then return 'not_owner'; end if;

  -- Resolve collaborator by email (existing users only).
  select u.id, u.email, p.full_name
    into v_collab, v_collab_email, v_collab_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where lower(u.email) = lower(trim(p_email))
  limit 1;
  if v_collab is null then return 'user_not_found'; end if;
  if v_collab = v_owner then return 'cannot_share_with_self'; end if;

  select u.email, p.full_name into v_owner_email, v_owner_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_owner;

  insert into public.trade_shares (
    trade_id, owner_id, collaborator_id, role,
    collaborator_email, collaborator_name, owner_email, owner_name
  ) values (
    p_trade_id, v_owner, v_collab, p_role,
    v_collab_email, v_collab_name, v_owner_email, v_owner_name
  )
  on conflict (trade_id, collaborator_id)
  do update set role = excluded.role;

  insert into public.notifications (user_id, title, body, href, type)
  values (
    v_collab,
    'A trade was shared with you',
    coalesce(v_owner_name, v_owner_email, 'Someone')
      || ' gave you ' || p_role || ' access to their ' || v_symbol || ' trade.',
    '/trades/' || p_trade_id::text,
    'trade_share'
  );

  return 'ok';
end;
$$;

grant execute on function public.share_trade(uuid, text, text) to authenticated;
