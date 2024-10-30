export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string | null
          nickname: string | null
          role: 'admin' | 'user'
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          full_name?: string | null
          nickname?: string | null
          role?: 'admin' | 'user'
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string | null
          nickname?: string | null
          role?: 'admin' | 'user'
        }
      }
      user_profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          nickname: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
          location: string | null
          social_links: {
            twitter?: string
            linkedin?: string
            github?: string
          }
          preferences: {
            email_notifications: boolean
            dark_mode: boolean
          }
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          nickname?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          social_links?: {
            twitter?: string
            linkedin?: string
            github?: string
          }
          preferences?: {
            email_notifications?: boolean
            dark_mode?: boolean
          }
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          nickname?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          social_links?: {
            twitter?: string
            linkedin?: string
            github?: string
          }
          preferences?: {
            email_notifications?: boolean
            dark_mode?: boolean
          }
        }
      }
      manuals: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          category: string
          file_url: string
          uploaded_by: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          category: string
          file_url: string
          uploaded_by: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          category?: string
          file_url?: string
          uploaded_by?: string
        }
      }
      standards: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          category: string
          file_url: string
          uploaded_by: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          category: string
          file_url: string
          uploaded_by: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          category?: string
          file_url?: string
          uploaded_by?: string
        }
      }
      user_posts: {
        Row: {
          id: string
          created_at: string
          title: string
          content: string
          excerpt: string
          author_id: string
          likes: number
          comments: number
          categories: string[]
          tags: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          content: string
          excerpt?: string
          author_id: string
          likes?: number
          comments?: number
          categories?: string[]
          tags?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          content?: string
          excerpt?: string
          author_id?: string
          likes?: number
          comments?: number
          categories?: string[]
          tags?: string[]
        }
      }
      post_comments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          content: string
          post_id: string
          author_id: string
          is_edited: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          content: string
          post_id: string
          author_id: string
          is_edited?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          content?: string
          post_id?: string
          author_id?: string
          is_edited?: boolean
        }
      }
      post_categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      favorites: {
        Row: {
          id: string
          created_at: string
          user_id: string
          item_id: string
          item_type: 'manual' | 'standard' | 'user-posts'
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          item_id: string
          item_type: 'manual' | 'standard' | 'user-posts'
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          item_id?: string
          item_type?: 'manual' | 'standard' | 'user-posts'
        }
      }
      feature_requests: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          priority: 'low' | 'medium' | 'high'
          status: 'pending' | 'in_progress' | 'completed' | 'rejected'
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          priority: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed' | 'rejected'
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          priority?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed' | 'rejected'
          user_id?: string
        }
      }
      surveys: {
        Row: {
          id: string
          created_at: string
          customer_name: string
          customer_address: string
          system_type: string
          control_equipment: string
          grade: string
          item_count: number
          notes: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          customer_name: string
          customer_address: string
          system_type: string
          control_equipment: string
          grade: string
          item_count: number
          notes?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          customer_name?: string
          customer_address?: string
          system_type?: string
          control_equipment?: string
          grade?: string
          item_count?: number
          notes?: string | null
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
