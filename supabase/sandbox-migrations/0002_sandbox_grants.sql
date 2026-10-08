-- 0002_sandbox_grants.sql
-- Row level security on every sandbox table, read-only policies for the browser roles, and read-only grants.
-- No insert, update, or delete is granted to anon or authenticated. Writes stay with the owner (postgres / service role).

do $$
declare t text;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'sandbox' and c.relkind = 'r'
  loop
    execute format('alter table sandbox.%I enable row level security', t);
    execute format('drop policy if exists %I on sandbox.%I', t || '_read_all', t);
    execute format('create policy %I on sandbox.%I for select to anon, authenticated using (true)', t || '_read_all', t);
  end loop;
end $$;

grant usage on schema sandbox to anon, authenticated;
grant select on all tables in schema sandbox to anon, authenticated;
-- Views created later in this schema (0004) get SELECT too; explicit grants are repeated in 0004 for clarity.
alter default privileges for role postgres in schema sandbox grant select on tables to anon, authenticated;
