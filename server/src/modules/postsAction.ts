import type { Response } from "express";
import type { AuthRequest } from "../middleware/isConnected";
import { Posts } from "../models/_index";

// --- Action pour créer un nouvel article (celle que vous aviez déjà) ---
const create = async (req: AuthRequest, res: Response) => {
  const { title, subtitle, content } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(403).json({ error: "Token invalide ou corrompu." });
  }

  if (!title || !content) {
    return res
      .status(400)
      .json({ error: "Le titre et le contenu sont obligatoires." });
  }

  try {
    const newPost = await Posts.create({
      user_id: userId,
      title,
      subtitle: subtitle || null,
      content,
      status: "pending_review",
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Erreur lors de la création de l'article :", error);
    res.status(500).json({ error: "Une erreur interne est survenue." });
  }
};

// --- Action pour récupérer les articles (pour l'admin et le public) ---
const browse = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const whereCondition: { status?: string } = {};

    if (
      status &&
      ["pending_review", "approved", "rejected"].includes(status as string)
    ) {
      whereCondition.status = status as string;
    } else if (!req.user?.isAdmin) {
      // Si l'utilisateur n'est pas admin et ne filtre pas, on ne montre que les articles approuvés
      whereCondition.status = "approved";
    }
    // Si l'utilisateur est admin et ne filtre pas, on montre tout

    const posts = await Posts.findAll({
      where: whereCondition,
      include: [
        {
          association: "author",
          attributes: ["public_name", "avatar_url"],
        },
      ],
      order: [
        ["publishedAt", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    // Construire l'URL absolue pour l'avatar de l'auteur
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const postsWithAbsoluteAvatarUrl = posts.map((post) => {
      const postJson = post.toJSON();
      if (postJson.author?.avatar_url) {
        postJson.author.avatar_url = `${baseUrl}${postJson.author.avatar_url}`;
      }
      return postJson;
    });

    res.json(postsWithAbsoluteAvatarUrl);
  } catch (error) {
    console.error("Erreur lors de la récupération des articles :", error);
    res.status(500).json({ error: "Une erreur interne est survenue." });
  }
};

// --- Action pour un admin pour changer le statut d'un article ---
const updateStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Le statut fourni est invalide." });
  }

  try {
    const post = await Posts.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: "Article non trouvé." });
    }

    post.status = status;
    // Si l'article est approuvé, on définit sa date de publication
    if (status === "approved" && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du statut de l'article :",
      error,
    );
    res.status(500).json({ error: "Une erreur interne est survenue." });
  }
};

export default {
  create,
  browse,
  updateStatus,
};
