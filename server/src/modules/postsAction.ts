import type { Response } from "express";
import slugify from "slugify";
import { Posts, User } from "../models/_index";
import { convertLexicalToHtml } from "../tools/lexicalToHtml";
import type { AuthenticatedRequest } from "../types/middleware/middlewareTypes";
import type { PostWithAssociations } from "../types/modules/modulesTypes";

// --- Action pour créer un nouvel article (celle que vous aviez déjà) ---
const create = async (req: AuthenticatedRequest, res: Response) => {
  const { title, hook, content, tagIds } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(403).json({ error: "Token invalide ou corrompu." });
  }

  if (!title || !content || !hook) {
    return res
      .status(400)
      .json({ error: "Le titre, l'accroche et le contenu sont obligatoires." });
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
      hook: hook || null,
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

const read = async (req: AuthenticatedRequest, res: Response) => {
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

    // --- LOGIQUE DE SÉCURITÉ CORRIGÉE ET CLARIFIÉE ---
    // On vérifie si l'utilisateur a le droit de voir le post.
    const canView =
      post.status === "approved" || // Tout le monde peut voir un post approuvé
      req.user?.isAdmin || // Un admin peut tout voir
      post.user_id === req.user?.id; // L'auteur peut voir son propre post

    if (!canView) {
      return res
        .status(403)
        .json({ error: "Accès non autorisé à cette ressource." });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const postJson = post.get({ plain: true }) as PostWithAssociations;
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

const browse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await Posts.findAll({
      where: { status: "approved" },
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
        ["is_featured", "DESC"],
        ["publishedAt", "DESC"],
      ],
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const formattedPosts = posts.map((post) => {
      const postJson = post.get({ plain: true }) as PostWithAssociations;

      if (postJson.author?.avatar_url) {
        postJson.author.avatar_url = `${baseUrl}${postJson.author.avatar_url}`;
      }

      return {
        id: postJson.id,
        title: postJson.title,
        hook: postJson.hook,
        slug: postJson.slug,
        is_featured: postJson.is_featured,
        author: postJson.author,
        tags: postJson.tags,
      };
    });

    res.json(formattedPosts);
  } catch (error) {
    console.error("Erreur lors de la récupération des articles :", error);
    res.status(500).json({ error: "Une erreur interne est survenue." });
  }
};

// --- Action pour un admin pour récupérer les articles pour le dashboard (MISE À JOUR) ---
const browseForAdmin = async (req: AuthenticatedRequest, res: Response) => {
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
      attributes: ["id", "title", "slug", "hook"],
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

// --- Action pour un admin pour changer le statut d'un article (inchangée) ---
const updateStatus = async (req: AuthenticatedRequest, res: Response) => {
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

const updateContext = async (req: AuthenticatedRequest, res: Response) => {
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

const toggleFeature = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const post = await Posts.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: "Article non trouvé." });
    }

    if (post.status !== "approved") {
      return res.status(400).json({
        error: "Seul un article approuvé peut être mis en avant.",
      });
    }

    // On inverse la valeur du booléen
    post.is_featured = !post.is_featured;
    await post.save();

    res.status(200).json({
      message: "Statut de mise en avant mis à jour.",
      post,
    });
  } catch (error) {
    console.error("Erreur lors de la mise en avant de l'article :", error);
    res.status(500).json({ error: "Une erreur interne est survenue." });
  }
};

const destroy = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const post = await Posts.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: "Article non trouvé." });
    }

    await post.destroy();
    res.status(200).json({ message: "Article supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article :", error);
    res.status(500).json({ error: "Une erreur interne est survenue." });
  }
};

// MODIFIÉ: On exporte les nouvelles actions
export default {
  create,
  read,
  browse,
  updateStatus,
  updateContext,
  browseForAdmin,
  toggleFeature,
  destroy,
};
