export interface FormData {
  email: string;
  public_name: string;
  password: string;
  confirmPassword: string;
}

export interface FormErrors {
  email?: string;
  public_name?: string;
  password?: string;
  confirmPassword?: string;
}

export interface PublicProfileData {
  public_name: string;
  avatar_url: string | null;
  posts: {
    title: string;
    subtitle: string | null;
    slug: string;
    publishedAt: string;
  }[];
}

export interface UserProfile {
  id: string;
  public_name: string;
  email: string;
  avatar_url: string | null;
  createdAt: string;
}
export interface MyPost {
  title: string;
  slug: string;
  status: "pending_review" | "approved" | "rejected";
  createdAt: string;
  rejection_reason: string | null;
}

export interface FullPost {
  id: string;
  title: string;
  hook: string | null;
  content: string;
  slug: string;
  is_featured: boolean;
  status: "pending_review" | "approved" | "rejected";
  admin_context: string | null;
  publishedAt: string | null;
  author: {
    public_name: string;
    avatar_url: string | null;
  };
  tags: {
    id: number;
    name: string;
  }[];
}

export interface PostOnTheWall {
  id: string;
  title: string;
  hook: string | null;
  slug: string;
  is_featured: boolean;
  author: {
    public_name: string;
    avatar_url: string | null;
  };
  tags: {
    id: number;
    name: string;
  }[];
}

export interface Tag {
  id: number;
  name: string;
}

export interface NewPostPayload {
  title: string;
  hook: string;
  content: string;
  tagIds: number[];
}

export interface RouteError {
  status?: number;
  statusText?: string;
  message?: string;
  data?: string;
}

export interface AdminPostPanelProps {
  post: FullPost;
}
