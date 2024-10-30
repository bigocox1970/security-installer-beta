-- Create blog posts table
create table if not exists public.blog_posts (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    content text not null,
    excerpt text,
    author_id uuid references auth.users on delete cascade not null,
    status text check (status in ('draft', 'published', 'archived')) default 'draft',
    likes integer default 0,
    views integer default 0,
    tags text[] default array[]::text[],
    categories text[] default array[]::text[],
    featured_image text,
    is_featured boolean default false,
    meta_description text,
    reading_time_minutes integer
);

-- Create blog comments table
create table if not exists public.blog_comments (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    post_id uuid references blog_posts on delete cascade not null,
    author_id uuid references auth.users on delete cascade not null,
    content text not null,
    likes integer default 0,
    parent_id uuid references blog_comments(id) on delete cascade,
    is_approved boolean default true
);

-- Create blog categories table
create table if not exists public.blog_categories (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null unique,
    slug text not null unique,
    description text,
    parent_id uuid references blog_categories(id) on delete set null
);

-- Create blog tags table
create table if not exists public.blog_tags (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null unique,
    slug text not null unique,
    description text
);

-- Enable RLS
alter table blog_posts enable row level security;
alter table blog_comments enable row level security;
alter table blog_categories enable row level security;
alter table blog_tags enable row level security;

-- Create policies for blog_posts
create policy "Anyone can view published posts"
    on blog_posts for select
    using (status = 'published');

create policy "Authors can view own drafts"
    on blog_posts for select
    using (auth.uid() = author_id);

create policy "Authors can create posts"
    on blog_posts for insert
    with check (auth.role() = 'authenticated');

create policy "Authors can update own posts"
    on blog_posts for update
    using (auth.uid() = author_id);

create policy "Authors can delete own posts"
    on blog_posts for delete
    using (auth.uid() = author_id);

-- Create policies for blog_comments
create policy "Anyone can view approved comments"
    on blog_comments for select
    using (is_approved = true);

create policy "Authors can view own comments"
    on blog_comments for select
    using (auth.uid() = author_id);

create policy "Authenticated users can create comments"
    on blog_comments for insert
    with check (auth.role() = 'authenticated');

create policy "Authors can update own comments"
    on blog_comments for update
    using (auth.uid() = author_id);

create policy "Authors can delete own comments"
    on blog_comments for delete
    using (auth.uid() = author_id);

-- Create policies for blog_categories and blog_tags
create policy "Anyone can view categories"
    on blog_categories for select
    using (true);

create policy "Anyone can view tags"
    on blog_tags for select
    using (true);

create policy "Admins can manage categories"
    on blog_categories using (
        exists (
            select 1 from public.users
            where id = auth.uid()
            and role = 'admin'
        )
    );

create policy "Admins can manage tags"
    on blog_tags using (
        exists (
            select 1 from public.users
            where id = auth.uid()
            and role = 'admin'
        )
    );

-- Create function to calculate reading time
create or replace function calculate_reading_time(content text)
returns integer as $$
declare
    words_per_minute constant integer := 200;
    word_count integer;
begin
    -- Rough calculation of word count
    word_count := array_length(regexp_split_to_array(content, '\s+'), 1);
    return greatest(1, ceil(word_count::float / words_per_minute));
end;
$$ language plpgsql immutable;

-- Create trigger to update reading time
create or replace function update_reading_time()
returns trigger as $$
begin
    new.reading_time_minutes := calculate_reading_time(new.content);
    return new;
end;
$$ language plpgsql;

create trigger update_post_reading_time
    before insert or update of content on blog_posts
    for each row
    execute function update_reading_time();

-- Create function to generate excerpt
create or replace function generate_excerpt(content text, max_length integer default 160)
returns text as $$
declare
    stripped_content text;
    excerpt text;
begin
    -- Remove HTML tags and extra whitespace
    stripped_content := regexp_replace(content, '<[^>]*>', '', 'g');
    stripped_content := regexp_replace(stripped_content, '\s+', ' ', 'g');
    stripped_content := trim(stripped_content);
    
    -- Get first max_length characters
    if length(stripped_content) <= max_length then
        return stripped_content;
    end if;
    
    excerpt := substring(stripped_content from 1 for max_length);
    -- Try to cut at last complete word
    excerpt := substring(excerpt from 1 for length(excerpt) - position(' ' in reverse(excerpt)));
    return excerpt || '...';
end;
$$ language plpgsql immutable;

-- Create trigger to update excerpt
create or replace function update_excerpt()
returns trigger as $$
begin
    if new.excerpt is null or new.excerpt = '' then
        new.excerpt := generate_excerpt(new.content);
    end if;
    return new;
end;
$$ language plpgsql;

create trigger update_post_excerpt
    before insert or update of content on blog_posts
    for each row
    execute function update_excerpt();

-- Insert some default categories
insert into blog_categories (name, slug, description) values
    ('Security Systems', 'security-systems', 'Articles about security systems and installations'),
    ('Industry News', 'industry-news', 'Latest news from the security industry'),
    ('Tips & Tricks', 'tips-tricks', 'Helpful tips and tricks for security installers'),
    ('Product Reviews', 'product-reviews', 'Reviews of security products and equipment')
on conflict (slug) do nothing;