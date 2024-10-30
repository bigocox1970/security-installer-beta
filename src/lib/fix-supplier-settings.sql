-- Drop and recreate supplier_settings table with proper constraints
drop table if exists supplier_settings;

create table supplier_settings (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    value text not null,
    label text not null,
    icon text not null default 'Store',
    search_query text,
    search_terms text[] not null default array[]::text[],
    search_radius integer not null default 5000
);

-- Enable RLS
alter table supplier_settings enable row level security;

-- Create policies
create policy "Public can view supplier settings"
    on supplier_settings for select
    using (true);

create policy "Admins can manage supplier settings"
    on supplier_settings
    using (
        auth.role() = 'authenticated' 
        and exists (
            select 1 from users
            where users.id = auth.uid()
            and users.role = 'admin'
        )
    )
    with check (
        auth.role() = 'authenticated' 
        and exists (
            select 1 from users
            where users.id = auth.uid()
            and users.role = 'admin'
        )
    );

-- Create trigger for updated_at
create trigger set_supplier_settings_timestamp
    before update on supplier_settings
    for each row
    execute function update_updated_at_column();

-- Grant necessary permissions
grant all on supplier_settings to authenticated;