# Security Installer App

A comprehensive security installation management system built with React, Supabase, and Tailwind CSS.

## Features

- Manual & Standards Management
- User Posts & Community Chat
- Site Survey Tools
- Supplier Finder
- AI Assistant with Ollama/OpenAI Integration
- WTF (What is This?) Image Recognition
- Dark Mode Support

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Supabase credentials
4. Run development server: `npm run dev`

## AI Integration

### WTF/What is This?

The WTF feature supports two methods of image recognition:

1. Google Vision API
2. Custom API Integration

#### Custom API Response Format

Your custom API endpoint should accept POST requests with:
```json
{
  "image": "base64_encoded_image_data",
  "searchId": "unique_search_id",
  "callbackUrl": "https://your-app-url/api/wtf-callback"
}
```

And should respond to the callback URL with:
```json
{
  "search_id": "the-search-id",
  "results": ["Result 1", "Result 2", ...]
}
```

### AI Assistant

The AI Assistant supports multiple backends:

1. Ollama (Local)
   - Default URL: `http://localhost:11434/api/chat`
   - Supports models like `llama2`

2. OpenAI
   - Uses the ChatGPT API
   - Supports models like `gpt-3.5-turbo`

3. Custom API (via n8n/Flowise)
   - Configure custom endpoint in admin panel

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Admin Configuration

Access the admin panel to configure:

1. WTF Settings
   - Enable/disable Google Vision API
   - Configure custom API endpoint
   - Set API keys

2. AI Assistant Settings
   - Choose backend (Ollama/OpenAI/Custom)
   - Configure API endpoints
   - Set model parameters
   - Customize system prompt

## Database Setup

1. Create a new Supabase project
2. Run the SQL from `src/lib/combined-database.sql`
3. Set up storage buckets for manuals and standards
4. Configure the necessary tables for AI functionality:
   - `wtf_settings`
   - `wtf_results`
   - `ai_assistant_settings`