-- Create surveys table if it doesn't exist
create table if not exists public.surveys (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  customer_address text not null,
  system_type text not null,
  control_equipment text not null,
  grade text not null,
  item_count integer not null,
  notes text,
  user_id uuid references auth.users on delete cascade not null
);

-- Enable RLS
alter table public.surveys enable row level security;

-- Create policies
create policy "Users can read own surveys"
  on surveys for select
  using (auth.uid() = user_id);

create policy "Users can insert own surveys"
  on surveys for insert
  with check (auth.uid() = user_id);

create policy "Users can update own surveys"
  on surveys for update
  using (auth.uid() = user_id);

create policy "Users can delete own surveys"
  on surveys for delete
  using (auth.uid() = user_id);

-- Grant access to authenticated users
grant all on public.surveys to authenticated;