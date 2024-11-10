-- Drop existing table if it exists
DROP TABLE IF EXISTS supplier_settings;

-- Create supplier_settings table
CREATE TABLE supplier_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    value text NOT NULL,
    label text NOT NULL,
    icon text NOT NULL DEFAULT 'Store',
    search_query text NOT NULL,
    search_terms text[] NOT NULL DEFAULT array[]::text[],
    search_radius integer NOT NULL DEFAULT 5000,
    is_default boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE supplier_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view supplier settings"
    ON supplier_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage supplier settings"
    ON supplier_settings
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Insert default suppliers
INSERT INTO supplier_settings (value, label, icon, search_query, search_terms, search_radius, is_default)
VALUES
    ('security', 'Security Suppliers', 'Shield', 'security system supplier', 
     array['security system supplier', 'security installer', 'cctv installer', 'alarm installer', 'security equipment supplier'],
     5000, true),
    ('electrical', 'Electrical Suppliers', 'Zap', 'electrical supplier',
     array['electrical supplier', 'electrical wholesaler', 'electrical distributor', 'electrical parts supplier'],
     5000, true),
    ('bacon-sarnie', 'Bacon Sarnie Suppliers', 'Coffee', 'cafe breakfast',
     array['cafe breakfast', 'breakfast cafe', 'sandwich shop', 'cafe', 'coffee shop'],
     5000, true);