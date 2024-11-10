-- Drop existing table and indexes
DROP INDEX IF EXISTS ai_assistant_settings_active_idx;
DROP TABLE IF EXISTS ai_assistant_settings;

-- Create ai_assistant_settings table
CREATE TABLE ai_assistant_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, NOW()) NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    provider TEXT CHECK (provider IN ('openai', 'ollama', 'flowise')),
    api_url TEXT,
    api_key TEXT,
    model_name TEXT,
    temperature NUMERIC(3, 2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2048,
    global_prompt_template TEXT,
    global_greeting_message TEXT DEFAULT 'Hi! How can I help you today?',
    chatbot_enabled BOOLEAN DEFAULT FALSE,
    flowise_chatflow_id TEXT,
    flowise_api_host TEXT,
    personality_type TEXT CHECK (personality_type IN ('professional', 'friendly', 'funny', 'custom')),
    custom_personality TEXT,
    is_active BOOLEAN DEFAULT FALSE
);

-- Create unique index for active settings
CREATE UNIQUE INDEX ai_assistant_settings_active_idx ON ai_assistant_settings (is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE ai_assistant_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view ai assistant settings" ON ai_assistant_settings 
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage ai assistant settings" ON ai_assistant_settings 
    USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- Insert default settings if none exist
INSERT INTO ai_assistant_settings (
    enabled,
    provider,
    personality_type,
    global_greeting_message,
    global_prompt_template,
    is_active
)
SELECT 
    FALSE,
    'openai',
    'professional',
    'Hi! How can I help you today?',
    'You are a helpful security system installation assistant. Use the provided manuals and standards to answer questions accurately.',
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM ai_assistant_settings WHERE is_active = TRUE
);