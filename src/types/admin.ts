export interface ModuleSettings {
  id: string;
  manuals_enabled: boolean;
  standards_enabled: boolean;
  ai_assistant_enabled: boolean;
  community_chat_enabled: boolean;
  favorites_enabled: boolean;
  survey_enabled: boolean;
  suppliers_enabled: boolean;
  wtf_enabled: boolean;
  user_posts_enabled: boolean;
  display_order: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}
