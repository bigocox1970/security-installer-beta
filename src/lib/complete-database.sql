-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    full_name TEXT,
    status TEXT CHECK (status IN ('active', 'suspended', 'deleted')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    preferences JSONB DEFAULT '{
        "email_notifications": true,
        "dark_mode": true
    }'::jsonb
);

-- Create blog posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT array[]::text[],
    categories TEXT[] DEFAULT array[]::text[],
    featured_image TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    meta_description TEXT,
    reading_time_minutes INTEGER
);

-- Create post comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    is_edited BOOLEAN DEFAULT FALSE,
    likes INTEGER DEFAULT 0
);

-- Create blog categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL
);

-- Create blog tags table
CREATE TABLE IF NOT EXISTS public.blog_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_id UUID NOT NULL,
    item_type TEXT CHECK (item_type IN ('post', 'manual', 'standard')) NOT NULL,
    UNIQUE(user_id, item_id, item_type)
);

-- Create manuals table
CREATE TABLE IF NOT EXISTS public.manuals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    file_url TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    likes INTEGER DEFAULT 0
);

-- Create standards table
CREATE TABLE IF NOT EXISTS public.standards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    file_url TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    likes INTEGER DEFAULT 0
);

-- Create supplier settings table
CREATE TABLE IF NOT EXISTS public.supplier_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Store',
    search_query TEXT NOT NULL,
    search_terms TEXT[] NOT NULL DEFAULT array[]::text[],
    search_radius INTEGER NOT NULL DEFAULT 5000,
    is_default BOOLEAN DEFAULT FALSE
);

-- Create module settings table
CREATE TABLE IF NOT EXISTS public.module_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    manuals_enabled BOOLEAN DEFAULT TRUE,
    standards_enabled BOOLEAN DEFAULT TRUE,
    ai_assistant_enabled BOOLEAN DEFAULT TRUE,
    community_chat_enabled BOOLEAN DEFAULT TRUE,
    favorites_enabled BOOLEAN DEFAULT TRUE,
    survey_enabled BOOLEAN DEFAULT TRUE,
    suppliers_enabled BOOLEAN DEFAULT TRUE,
    wtf_enabled BOOLEAN DEFAULT TRUE,
    user_posts_enabled BOOLEAN DEFAULT TRUE,
    display_order TEXT[] DEFAULT array[
        'manuals_enabled',
        'standards_enabled',
        'ai_assistant_enabled',
        'favorites_enabled',
        'suppliers_enabled',
        'survey_enabled',
        'community_chat_enabled',
        'wtf_enabled',
        'user_posts_enabled'
    ],
    is_active BOOLEAN DEFAULT TRUE
);

-- Create WTF settings table
CREATE TABLE IF NOT EXISTS public.wtf_settings (
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

-- Create WTF results table
CREATE TABLE IF NOT EXISTS public.wtf_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    search_id UUID NOT NULL UNIQUE,
    results JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE
);

-- Create AI assistant settings table
CREATE TABLE IF NOT EXISTS public.ai_assistant_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
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
    is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wtf_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wtf_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_assistant_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view own data"
    ON users FOR SELECT
    USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can update own data"
    ON users FOR UPDATE
    USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Create policies for user profiles
CREATE POLICY "Users can view any profile"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create policies for blog posts
CREATE POLICY "Anyone can view published posts"
    ON blog_posts FOR SELECT
    USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "Authors can create posts"
    ON blog_posts FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can update own posts"
    ON blog_posts FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
    ON blog_posts FOR DELETE
    USING (auth.uid() = author_id);

-- Create policies for comments
CREATE POLICY "Anyone can view comments"
    ON post_comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create comments"
    ON post_comments FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments"
    ON post_comments FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
    ON post_comments FOR DELETE
    USING (auth.uid() = author_id);

-- Create policies for categories and tags
CREATE POLICY "Anyone can view categories"
    ON blog_categories FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view tags"
    ON blog_tags FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage categories"
    ON blog_categories
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can manage tags"
    ON blog_tags
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Create policies for favorites
CREATE POLICY "Users can view own favorites"
    ON favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
    ON favorites
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policies for manuals and standards
CREATE POLICY "Anyone can view manuals"
    ON manuals FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view standards"
    ON standards FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage manuals and standards"
    ON manuals
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can manage standards"
    ON standards
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Create policies for settings tables
CREATE POLICY "Anyone can view settings"
    ON supplier_settings FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view module settings"
    ON module_settings FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view WTF settings"
    ON wtf_settings FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view AI settings"
    ON ai_assistant_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage all settings"
    ON supplier_settings
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Create necessary functions and triggers
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    
    INSERT INTO public.user_profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
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
     5000, true)
ON CONFLICT DO NOTHING;

INSERT INTO blog_categories (name, slug, description)
VALUES
    ('Security Systems', 'security-systems', 'Articles about security systems and installations'),
    ('Industry News', 'industry-news', 'Latest news from the security industry'),
    ('Tips & Tricks', 'tips-tricks', 'Helpful tips and tricks for security installers'),
    ('Product Reviews', 'product-reviews', 'Reviews of security products and equipment')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;