-- Move the SECURITY DEFINER RLS helpers into a schema PostgREST does not
-- expose, so they're callable during RLS evaluation but NOT reachable as a
-- public /rest/v1/rpc endpoint (clears the anon/authenticated-executable lints).
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.can_view_trade(tid uuid)
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

create or replace function private.can_comment_trade(tid uuid)
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

create or replace function private.is_trade_owner(tid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trades t
    where t.id = tid and t.user_id = auth.uid()
  );
$$;

grant execute on function private.can_view_trade(uuid) to authenticated;
grant execute on function private.can_comment_trade(uuid) to authenticated;
grant execute on function private.is_trade_owner(uuid) to authenticated;

-- Repoint the policies that used the public helpers to the private ones.
drop policy if exists "trade_comments_select" on public.trade_comments;
create policy "trade_comments_select" on public.trade_comments for select
  using (private.can_view_trade(trade_id));

drop policy if exists "trade_comments_insert" on public.trade_comments;
create policy "trade_comments_insert" on public.trade_comments for insert
  with check (
    user_id = (select auth.uid()) and private.can_comment_trade(trade_id)
  );

drop policy if exists "trade_comments_delete" on public.trade_comments;
create policy "trade_comments_delete" on public.trade_comments for delete
  using (user_id = (select auth.uid()) or private.is_trade_owner(trade_id));

drop policy if exists "strategies_select_shared" on public.strategies;
create policy "strategies_select_shared" on public.strategies for select using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.trades t
    where t.strategy_id = strategies.id and private.can_view_trade(t.id)
  )
);

drop policy if exists "accounts_select_shared" on public.accounts;
create policy "accounts_select_shared" on public.accounts for select using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.trades t
    where t.account_id = accounts.id and private.can_view_trade(t.id)
  )
);

drop policy if exists "tags_select_shared" on public.tags;
create policy "tags_select_shared" on public.tags for select using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.trade_tags tt
    where tt.tag_id = tags.id and private.can_view_trade(tt.trade_id)
  )
);

drop policy if exists "mistakes_select_shared" on public.mistakes;
create policy "mistakes_select_shared" on public.mistakes for select using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.trade_mistakes tm
    where tm.mistake_id = mistakes.id and private.can_view_trade(tm.trade_id)
  )
);

drop policy if exists "trade_tags_select_shared" on public.trade_tags;
create policy "trade_tags_select_shared" on public.trade_tags for select
  using (private.can_view_trade(trade_id));

drop policy if exists "trade_mistakes_select_shared" on public.trade_mistakes;
create policy "trade_mistakes_select_shared" on public.trade_mistakes for select
  using (private.can_view_trade(trade_id));

-- Drop the now-unreferenced public helpers.
drop function if exists public.can_view_trade(uuid);
drop function if exists public.can_comment_trade(uuid);
drop function if exists public.can_edit_trade(uuid);
drop function if exists public.is_trade_owner(uuid);

-- share_trade stays a public RPC (the app calls it), but anon never should.
revoke execute on function public.share_trade(uuid, text, text) from anon;
