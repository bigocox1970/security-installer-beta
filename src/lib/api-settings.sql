-- Create api_settings table
create table if not exists public.api_settings (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    google_vision_api_key text,
    custom_api_endpoint text,
    use_custom_api boolean default false
);

-- Enable RLS
alter table public.api_settings enable row level security;

-- Create policies
create policy "Public can view api settings"
    on api_settings for select
    using (true);

create policy "Admins can manage api settings"
    on api_settings
    using (
        exists (
            select 1 from public.users
            where id = auth.uid()
            and role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from public.users
            where id = auth.uid()
            and role = 'admin'
        )
    );

-- Insert default settings if not exists
insert into api_settings (google_vision_api_key, custom_api_endpoint, use_custom_api)
select '', '', false
where not exists (select 1 from api_settings);