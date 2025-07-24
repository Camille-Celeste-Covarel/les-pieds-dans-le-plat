import type { Optional } from "sequelize";

/*export interface ExempleAttributes {
  id: string;
  Exemplebis: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export type ExempleCreationAttributes = Optional<
  ExempleAttributes,
  "id" | "createdAt" | "updatedAt"
>;*/

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  public_name: string;
  avatar_url?: string;
  is_admin: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  reset_token?: string | null;
  reset_token_expiry?: Date | null;
}
export type UserCreationAttributes = Optional<
  UserAttributes,
  | "id"
  | "avatar_url"
  | "is_admin"
  | "createdAt"
  | "updatedAt"
  | "reset_token"
  | "reset_token_expiry"
>;

export interface PostsAttributes {
  id: string;
  user_id: string;
  title: string;
  status: string;
  subtitle?: string | null;
  content: string;
  publishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
export type PostsCreationAttributes = Optional<
    PostsAttributes,
    "id" | "status" | "subtitle" | "publishedAt" | "createdAt" | "updatedAt"
>;

export interface tagsAttributes {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export type tagsCreationAttributes = Optional<
   tagsAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export interface post_tags_Attributes {
  post_id: string;
  tag_id: number;
  createdAt?: Date;
  updatedAt?: Date;
}
export type post_tags_CreationAttributes = Optional<
    post_tags_Attributes,
    "createdAt" | "updatedAt"
>;