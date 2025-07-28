import type { PostsAttributes } from "../models/models";

export type PostWithAssociations = Omit<PostsAttributes, "author"> & {
  tags?: { id: number; name: string }[];
  author?: { public_name: string; avatar_url: string | null };
};

export interface MulterFiles {
  avatar?: Express.Multer.File[];
}
