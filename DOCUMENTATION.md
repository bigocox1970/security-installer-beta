# Security Installer App Documentation

## Project Overview
A comprehensive web application for security installation professionals to manage manuals, standards, and collaborate with the community.

## Core Features

### 1. Authentication System
- User registration and login
- Role-based access (Admin/User)
- Protected routes and features
- Session management with Supabase Auth

### 2. Document Management

#### Manuals
- Upload/download technical manuals
- PDF file support
- Categorization system
- Search functionality
- Favorite/bookmark system
- Admin-only deletion

#### Standards
- Industry standards repository
- Admin-controlled uploads
- Public viewing
- Favorite/bookmark system
- Category organization

### 3. Community Features

#### User Posts
- Create/edit/delete posts
- Rich text content
- Like/favorite system
- Preview with "Read More"
- Author attribution

#### Community Chat
- Real-time messaging
- User presence
- Message history
- Chat rooms/topics

### 4. AI Features

#### WTF/What is This?
- Image recognition system
- Dual API support:
  1. Google Vision API
  2. Custom API integration
- Result handling and display
- Admin configuration panel

##### Custom API Integration
- Endpoint Configuration
- Request Format:
```json
{
  "image": "base64_encoded_image_data",
  "searchId": "unique_search_id",
  "callbackUrl": "https://your-app-url/api/wtf-callback"
}
```
- Response Format:
```json
{
  "search_id": "the-search-id",
  "results": ["Result 1", "Result 2", ...]
}
```

#### AI Assistant
- Multiple backend support:
  1. Ollama (local)
  2. OpenAI
  3. Custom API (n8n/Flowise)
- Configurable parameters:
  - Temperature
  - Max tokens
  - System prompt
  - Model selection
- Real-time chat interface
- Context-aware responses

### 5. Tools & Utilities

#### Site Survey Tool
- Customer information capture
- System type selection
- Equipment details
- Notes and specifications
- Survey history

#### Supplier Finder
- Google Maps integration
- Multiple supplier categories
- Location-based search
- Contact information

## Technical Stack

### Frontend
- React 18.3.1
- TypeScript
- Tailwind CSS
- Lucide Icons
- React Google Maps

### Backend (Supabase)
- Authentication
- PostgreSQL Database
- Storage
- Real-time subscriptions

## Database Schema

### AI-Related Tables

#### WTF Settings
```sql
create table public.wtf_settings (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    google_vision_enabled boolean default false,
    google_vision_api_key text,
    custom_api_enabled boolean default false,
    custom_api_url text,
    custom_api_key text,
    is_active boolean default false
);
```

#### WTF Results
```sql
create table public.wtf_results (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now() not null,
    search_id uuid not null unique,
    results jsonb not null,
    processed boolean default false
);
```

#### AI Assistant Settings
```sql
create table public.ai_assistant_settings (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    enabled boolean default false,
    api_url text,
    api_key text,
    model_name text,
    temperature numeric(3,2) default 0.7,
    max_tokens integer default 2048,
    system_prompt text,
    is_active boolean default false
);
```

[Previous database tables remain the same...]

## File Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AiAssistantSettings.tsx
│   │   ├── WtfSettings.tsx
│   │   └── ...
│   ├── AiAssistant.tsx
│   ├── WhatIsThis.tsx
│   └── ...
├── hooks/
│   ├── useWtfSettings.ts
│   └── ...
├── lib/
│   ├── ai-assistant-settings.sql
│   ├── wtf-settings.sql
│   ├── wtf-results.sql
│   └── ...
└── types/
    └── admin.ts
```

## Environment Setup

1. Create `.env` file in project root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

## AI Integration Setup

### 1. WTF Feature
1. Access admin panel
2. Go to "WTF Settings" tab
3. Configure desired recognition service:
   - Google Vision API
   - Custom API endpoint

### 2. AI Assistant
1. Access admin panel
2. Go to "AI Assistant" tab
3. Configure preferred backend:
   - Ollama (local)
   - OpenAI
   - Custom API

#### Ollama Setup
1. Install Ollama locally
2. Pull desired model (e.g., `llama2`)
3. Configure API URL: `http://localhost:11434/api/chat`

#### OpenAI Setup
1. Obtain OpenAI API key
2. Configure in admin panel
3. Select model (e.g., `gpt-3.5-turbo`)

#### Custom API Setup
1. Set up n8n/Flowise workflow
2. Configure webhook endpoint
3. Set API URL in admin panel

## Future Development

1. Enhanced AI capabilities
2. Mobile app version
3. Offline access
4. Video content integration
5. Advanced search features
6. Analytics dashboard
7. Team collaboration tools
8. Integration with supplier APIs

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License - See LICENSE file for details