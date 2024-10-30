-- Drop existing table if it exists
DROP TABLE IF EXISTS wtf_settings;

-- Create wtf_settings table
CREATE TABLE wtf_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    google_vision_enabled BOOLEAN DEFAULT FALSE,
    google_vision_api_key TEXT,
    custom_api_enabled BOOLEAN DEFAULT FALSE,
    custom_api_url TEXT,
    custom_api_key TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE wtf_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view wtf settings" ON wtf_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage wtf settings" ON wtf_settings
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

-- Insert default settings if none exist
INSERT INTO wtf_settings (
    google_vision_enabled,
    custom_api_enabled,
    is_active
)
SELECT 
    FALSE,
    FALSE,
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM wtf_settings
    WHERE is_active = TRUE
);