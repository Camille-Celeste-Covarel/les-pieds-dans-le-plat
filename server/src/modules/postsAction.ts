import express, { type Response } from "express";
import authenticateToken, { type AuthRequest } from "../middleware/isConnected";
import { Posts } from "../models/posts.model";

const router = express.Router();

// Route pour créer un nouvel article
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  // On récupère les données du corps de la requête
  const { title, subtitle, content } = req.body;

  // L'ID de l'utilisateur est ajouté à `req.user` par le middleware `authenticateToken`
  const userId = req.user?.id;

  // --- Validation ---
  if (!userId) {
    // Sécurité supplémentaire : si le token est valide mais que l'ID est manquant
    return res.status(403).json({ error: "Token invalide ou corrompu." });
  }

  if (!title || !content) {
    return res
      .status(400)
      .json({ error: "Le titre et le contenu sont obligatoires." });
  }

  try {
    // --- Création de l'article en base de données ---
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
});

export default router;
