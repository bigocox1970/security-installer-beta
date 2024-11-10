export interface UserProfile {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  social_links: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  preferences: {
    email_notifications: boolean;
    dark_mode: boolean;
    hide_email: boolean;
  };
}