-- Create wtf_settings table if it doesn't exist
create table if not exists public.wtf_settings (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    google_vision_enabled boolean default false,
    google_vision_api_key text,
    custom_api_enabled boolean default false,
    custom_api_url text,
    custom_api_key text,
    is_active boolean default true,
    unique (is_active) where (is_active = true)
);

-- Enable RLS
alter table public.wtf_settings enable row level security;

-- Create policies
create policy "Public can view wtf settings"
    on wtf_settings for select
    using (true);

create policy "Admins can manage wtf settings"
    on wtf_settings
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

-- Insert default settings if none exist
insert into wtf_settings (
    google_vision_enabled,
    custom_api_enabled,
    is_active
) values (
    false,
    false,
    true
) on conflict do nothing;