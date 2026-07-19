-- Denormalize the comment author's display identity so a shared trade's
-- journal can attribute each note. profiles is owner-only under RLS, so a
-- join wouldn't resolve other collaborators' names — capture at write time.
alter table public.trade_comments add column if not exists author_name text;
alter table public.trade_comments add column if not exists author_email text;

-- Backfill existing notes from the author's account.
update public.trade_comments c
set author_email = u.email,
    author_name = p.full_name
from auth.users u
left join public.profiles p on p.id = u.id
where u.id = c.user_id and c.author_email is null;
