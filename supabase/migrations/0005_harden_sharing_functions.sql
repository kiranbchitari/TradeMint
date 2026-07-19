-- Pin the trigger function's search_path (function_search_path_mutable).
create or replace function public.trades_lock_owner()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.user_id := old.user_id;
  return new;
end;
$$;

-- These SECURITY DEFINER helpers are only for RLS policy evaluation and the
-- authenticated share RPC — the anon role should never reach them. Revoke the
-- implicit PUBLIC execute; the explicit authenticated grants remain.
-- (Superseded by 0006, which moves the helpers into the private schema.)
revoke execute on function public.can_view_trade(uuid) from public;
revoke execute on function public.can_comment_trade(uuid) from public;
revoke execute on function public.can_edit_trade(uuid) from public;
revoke execute on function public.is_trade_owner(uuid) from public;
revoke execute on function public.share_trade(uuid, text, text) from public;

grant execute on function public.can_view_trade(uuid) to authenticated;
grant execute on function public.can_comment_trade(uuid) to authenticated;
grant execute on function public.can_edit_trade(uuid) to authenticated;
grant execute on function public.is_trade_owner(uuid) to authenticated;
grant execute on function public.share_trade(uuid, text, text) to authenticated;
