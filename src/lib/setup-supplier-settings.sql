-- Drop existing policies if they exist
drop policy if exists "Public can view supplier settings" on supplier_settings;
drop policy if exists "Admins can manage supplier settings" on supplier_settings;

-- Create supplier_settings table if it doesn't exist
create table if not exists public.supplier_settings (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    value text not null unique,  -- Add unique constraint
    label text not null,
    icon text not null,
    search_query text not null,
    search_terms text[] not null,
    search_radius integer not null default 5000,
    is_default boolean default false
);

-- Enable RLS
alter table public.supplier_settings enable row level security;

-- Create policies
create policy "Public can view supplier settings"
    on supplier_settings for select
    using (true);

create policy "Admins can manage supplier settings"
    on supplier_settings
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

-- First, delete all existing records
delete from supplier_settings;

-- Then insert default suppliers
insert into supplier_settings (value, label, icon, search_query, search_terms, search_radius, is_default)
values
    ('security', 'Security Suppliers', 'Shield', 'security system supplier', 
     array['security system supplier', 'security installer', 'cctv installer', 'alarm installer', 'security equipment supplier'],
     5000, true),
    ('electrical', 'Electrical Suppliers', 'Zap', 'electrical supplier',
     array['electrical supplier', 'electrical wholesaler', 'electrical distributor', 'electrical parts supplier'],
     5000, true),
    ('bacon-sarnie', 'Bacon Sarnie Suppliers', 'Coffee', 'cafe breakfast',
     array['cafe breakfast', 'breakfast cafe', 'sandwich shop', 'cafe', 'coffee shop'],
     5000, true);