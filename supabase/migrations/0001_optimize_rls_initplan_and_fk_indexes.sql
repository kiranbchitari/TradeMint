-- Optimize RLS policies + add covering FK indexes (Supabase advisor findings).
--
-- 1. auth_rls_initplan (WARN): bare `auth.uid()` in a policy is re-evaluated
--    once per row. Wrapping it in a scalar subselect `(select auth.uid())`
--    makes Postgres evaluate it once per query. Behaviour is identical; only
--    the query plan changes. Applies to every owner-scoped table.
-- 2. unindexed_foreign_keys (INFO): add covering indexes for the FKs the
--    advisor flagged so joins/cascades don't fall back to sequential scans.

-- Simple owner policies: user_id = auth.uid(), ALL command, TO public.
drop policy if exists "accounts_all_own" on public.accounts;
create policy "accounts_all_own" on public.accounts for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "brokers_all_own" on public.brokers;
create policy "brokers_all_own" on public.brokers for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "mistakes_all_own" on public.mistakes;
create policy "mistakes_all_own" on public.mistakes for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "notes_all_own" on public.notes;
create policy "notes_all_own" on public.notes for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "notifications_all_own" on public.notifications;
create policy "notifications_all_own" on public.notifications for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "playbooks_all_own" on public.playbooks;
create policy "playbooks_all_own" on public.playbooks for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "reports_all_own" on public.reports;
create policy "reports_all_own" on public.reports for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "sessions_all_own" on public.sessions;
create policy "sessions_all_own" on public.sessions for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "strategies_all_own" on public.strategies;
create policy "strategies_all_own" on public.strategies for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "tags_all_own" on public.tags;
create policy "tags_all_own" on public.tags for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "trade_images_all_own" on public.trade_images;
create policy "trade_images_all_own" on public.trade_images for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "trade_mistakes_all_own" on public.trade_mistakes;
create policy "trade_mistakes_all_own" on public.trade_mistakes for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "trade_tags_all_own" on public.trade_tags;
create policy "trade_tags_all_own" on public.trade_tags for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "trades_all_own" on public.trades;
create policy "trades_all_own" on public.trades for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- profiles keyed on id, split by command.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select
  using (id = (select auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert
  with check (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Covering indexes for foreign keys flagged by the performance advisor.
create index if not exists accounts_broker_id_idx on public.accounts (broker_id);
create index if not exists trade_images_user_id_idx on public.trade_images (user_id);
create index if not exists trades_broker_id_idx on public.trades (broker_id);
create index if not exists trades_market_idx on public.trades (market);
