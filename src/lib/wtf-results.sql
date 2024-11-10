-- Create table for storing WTF search results
create table if not exists public.wtf_results (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    search_id uuid not null unique,
    results jsonb not null,
    processed boolean default false
);

-- Enable RLS
alter table public.wtf_results enable row level security;

-- Create policies
create policy "Anyone can insert wtf results"
    on wtf_results for insert
    with check (true);

create policy "Anyone can view wtf results"
    on wtf_results for select
    using (true);

-- Create index for faster lookups
create index if not exists wtf_results_search_id_idx on wtf_results(search_id);

-- Create cleanup function
create or replace function cleanup_old_wtf_results()
returns void as $$
begin
    delete from wtf_results
    where created_at < now() - interval '24 hours';
end;
$$ language plpgsql;

-- Create scheduled cleanup (requires pg_cron extension)
-- select cron.schedule('0 0 * * *', $$select cleanup_old_wtf_results()$$);