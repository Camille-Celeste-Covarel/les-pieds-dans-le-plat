import type { Response } from "express";
import slugify from "slugify";
import type { AuthRequest } from "../middleware/isConnected";
import { Posts, User } from "../models/_index";
import { convertLexicalToHtml } from "../tools/lexicalToHtml";

// --- Action pour créer un nouvel article (celle que vous aviez déjà) ---
const create = async (req: AuthRequest, res: Response) => {
  const { title, subtitle, content, tagIds } = req.body;
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
    const author = await User.findByPk(userId, { attributes: ["public_name"] });
    if (!author) {
      return res.status(404).json({ error: "Auteur non trouvé." });
    }

    const slug = `${slugify(author.public_name, {
      lower: true,
      strict: true,
    })}/${slugify(title, { lower: true, strict: true })}`;

    const existingPost = await Posts.findOne({ where: { slug } });
    if (existingPost) {
      return res.status(409).json({
        error:
          "Un article avec ce titre existe déjà pour vous. Veuillez choisir un autre titre.",
      });
    }

    const newPost = await Posts.create({
      user_id: userId,
      title,
      subtitle: subtitle || null,
      content,
      slug,
      status: "pending_review",
    });

    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await newPost.setTags(tagIds);
    }

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Erreur lors de la création de l'article :", error);
    res.status(500).json({ error: "Une erreur interne est survenue." });
  }
};

const read = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const post = await Posts.findOne({
      where: { slug },
      include: [
        {
          association: "author",
          attributes: ["public_name", "avatar_url"],
        },
        {
          association: "tags",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
    });

    if (!post) {
      return res.status(404).json({ error: "Article non trouvé." });
    }

    // Règle de sécurité : un article non approuvé n'est visible que par un admin
    if (post.status !== "approved" && !req.user?.isAdmin) {
      return res
        .status(403)
        .json({ error: "Accès non autorisé à cette ressource." });
    }

    // Construire l'URL absolue pour l'avatar de l'auteur
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const postJson = post.toJSON();
    if (postJson.author?.avatar_url) {
      postJson.author.avatar_url = `${baseUrl}${postJson.author.avatar_url}`;
    }

    if (postJson.content) {
      postJson.content = convertLexicalToHtml(postJson.content);
    }

    res.json(postJson);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article :", error);
    res.status(500).json({ error: "Une erreur interne est survenue." });
  }
};

// --- Action pour récupérer les articles (mise à jour) ---
const browse = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const whereCondition: { status?: string } = {};

    if (
      status &&
      ["pending_review", "approved", "rejected"].includes(status as string)
    ) {
      if (req.user?.isAdmin) {
        whereCondition.status = status as string;
      } else {
        return res
          .status(403)
          .json({ error: "Accès non autorisé à ce filtre." });
      }
    } else if (!req.user?.isAdmin) {
      whereCondition.status = "approved";
    }

    const posts = await Posts.findAll({
      where: whereCondition,
      include: [
        {
          association: "author",
          attributes: ["public_name", "avatar_url"],
        },
        {
          association: "tags",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
      order: [
        ["publishedAt", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const formattedPosts = posts.map((post) => {
      const postJson = post.toJSON();
      if (postJson.author?.avatar_url) {
        postJson.author.avatar_url = `${baseUrl}${postJson.author.avatar_url}`;
      }

      const htmlContent = convertLexicalToHtml(postJson.content);
      const plainTextContent = htmlContent.replace(/<[^>]*>?/gm, "");
      const contentPreview =
        plainTextContent.substring(0, 400) +
        (plainTextContent.length > 400 ? "..." : "");

      return {
        id: postJson.id,
        title: postJson.title,
        subtitle: postJson.subtitle,
        slug: postJson.slug,
        author: postJson.author,
        tags: postJson.tags,
        contentPreview,
      };
    });

    res.json(formattedPosts);
  } catch (error) {
    console.error("Erreur lors de la récupération des articles :", error);
    res.status(500).json({ error: "Une erreur interne est survenue." });
  }
};

// --- Action pour un admin pour changer le statut d'un article ---
const updateStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, rejection_reason } = req.body;

  if (!status || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Le statut fourni est invalide." });
  }

  if (status === "rejected" && !rejection_reason) {
    return res
      .status(400)
      .json({ error: "Une raison est obligatoire pour un refus." });
  }

  try {
    const post = await Posts.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: "Article non trouvé." });
    }

    post.status = status;
    if (status === "approved") {
      if (!post.publishedAt) {
        post.publishedAt = new Date();
      }
      post.rejection_reason = null;
    } else {
      post.rejection_reason = rejection_reason;
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

const updateContext = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { context } = req.body;

  try {
    const post = await Posts.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: "Article non trouvé." });
    }

    if (post.status !== "approved") {
      return res.status(400).json({
        error: "Le contexte ne peut être ajouté qu'à un article approuvé.",
      });
    }

    post.admin_context = context || null;
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du contexte de l'article :",
      error,
    );
    res.status(500).json({ error: "Une erreur interne est survenue." });
  }
};

// --- Action pour un admin pour récupérer tous les articles pour le dashboard ---
const browseForAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const whereCondition: { status?: string } = {};

    if (
      status &&
      ["pending_review", "approved", "rejected"].includes(status as string)
    ) {
      whereCondition.status = status as string;
    }

    const posts = await Posts.findAll({
      where: whereCondition,
      attributes: ["id", "title", "slug", "status", "createdAt", "publishedAt"],
      include: [
        {
          association: "author",
          attributes: ["public_name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(posts);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des articles pour l'admin :",
      error,
    );
    res.status(500).json({ error: "Une erreur interne est survenue." });
  }
};

export default {
  create,
  read,
  browse,
  updateStatus,
  updateContext,
  browseForAdmin,
};
