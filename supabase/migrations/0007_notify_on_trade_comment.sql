-- When a note is added to a trade, notify everyone with access to that trade
-- except the author (the owner + all collaborators). SECURITY DEFINER so it can
-- write notifications for other users; lives in the private (unexposed) schema.
create or replace function private.notify_trade_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_symbol text;
begin
  select t.user_id, t.symbol into v_owner, v_symbol
  from public.trades t where t.id = new.trade_id;
  if v_owner is null then return new; end if;

  insert into public.notifications (user_id, title, body, href, type)
  select r.uid,
         coalesce(new.author_name, new.author_email, 'Someone')
           || ' commented on ' || v_symbol,
         left(new.body, 140),
         '/trades/' || new.trade_id::text,
         'trade_comment'
  from (
    select v_owner as uid
    union
    select s.collaborator_id
    from public.trade_shares s
    where s.trade_id = new.trade_id
  ) r
  where r.uid is not null and r.uid <> new.user_id;

  return new;
end;
$$;

drop trigger if exists notify_trade_comment on public.trade_comments;
create trigger notify_trade_comment
  after insert on public.trade_comments
  for each row execute function private.notify_trade_comment();
