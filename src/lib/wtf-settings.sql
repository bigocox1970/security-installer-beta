-- Drop existing table if it exists
DROP TABLE IF EXISTS wtf_settings;

-- Create wtf_settings table with new fields
CREATE TABLE wtf_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    google_vision_enabled BOOLEAN DEFAULT FALSE,
    google_vision_api_key TEXT,
    custom_api_enabled BOOLEAN DEFAULT FALSE,
    provider TEXT CHECK (provider IN ('openai', 'ollama', 'flowise')),
    api_url TEXT,
    api_key TEXT,
    model_name TEXT,
    flowise_chatflow_id TEXT,
    flowise_api_host TEXT,
    prompt_template TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create unique partial index for is_active
CREATE UNIQUE INDEX wtf_settings_active_idx ON wtf_settings (id) WHERE (is_active = true);

-- Enable RLS
ALTER TABLE wtf_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view wtf settings"
    ON wtf_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage wtf settings"
    ON wtf_settings
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
    provider,
    flowise_api_host,
    flowise_chatflow_id,
    prompt_template,
    is_active
) VALUES (
    FALSE,
    TRUE,
    'flowise',
    'https://3d6a426cebe4.ngrok.app',
    'b68aca2b-605a-43b4-97b8-ef20656e33a4',
    'Your job is to the analyse the image and try to find a match in the database. Then you can i identify the type and manufacture of the security equipment and answer " this looks like a pyronix enforcer alarm system, would you like to see the manual? "',
    TRUE
) ON CONFLICT DO NOTHING;