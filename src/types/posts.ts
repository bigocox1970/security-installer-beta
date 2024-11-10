export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: {
    nickname: string | null;
    full_name: string | null;
    email: string;
  };
  author_id: string;
  created_at: string;
  likes: number;
  comments: number;
  categories: string[];
  tags: string[];
  isStarred?: boolean;
}

export interface PostProps {
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}