import crypto from "node:crypto";
import bcrypt from "bcrypt";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { Op } from "sequelize";
import type { AuthRequest } from "../middleware/isConnected";
import { Posts, User } from "../models/_index";

interface MulterFiles {
  avatar?: Express.Multer.File[];
}

// L'opération BREAD : Browse (Read All)
// Récupère tous les utilisateurs de la base de données.
const browse: RequestHandler = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ["password", "reset_token", "reset_token_expiry"],
      },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// L'opération BREAD : Read (Read One)
// Récupère un utilisateur spécifique par son ID.
const read: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ["password", "reset_token", "reset_token_expiry"],
      },
    });

    if (user == null) {
      res.sendStatus(404);
    } else {
      res.json(user);
    }
  } catch (err) {
    next(err);
  }
};

// L'opération BREAD : Add (Create)
// Ajoute un nouvel utilisateur à la base de données.
const add: RequestHandler = async (req, res) => {
  res.status(501).json({ message: "Fonction non implémentée." });
};

// L'opération BREAD : Edit (Update)
const edit: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { password, is_admin, ...updateData } = req.body;

    const [affectedCount] = await User.update(updateData, {
      where: { id: userId },
    });

    if (affectedCount === 0) {
      res.sendStatus(404);
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    next(err);
  }
};

// L'opération BREAD : Destroy (Delete)
// Supprime un utilisateur par son ID.
const destroy: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const deletedCount = await User.destroy({
      where: { id: userId },
    });

    if (deletedCount === 0) {
      res.sendStatus(404);
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    next(err);
  }
};

const register: RequestHandler = async (req, res, next) => {
  try {
    const { email, password, public_name } = req.body;

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { public_name }] },
    });

    if (existingUser) {
      const errorMessage =
        existingUser.email === email
          ? "Un utilisateur avec cet email existe déjà"
          : "Ce pseudonyme est déjà utilisé";
      return res.status(409).json({ error: errorMessage });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const files = req.files as MulterFiles;
    let avatar_url: string | undefined;

    if (files.avatar?.[0]) {
      avatar_url = `/uploads/avatars/${files.avatar[0].filename}`;
    }

    const user = await User.create({
      email,
      password: hashedPassword,
      public_name,
      avatar_url,
      is_admin: false,
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: {
        id: user.id,
        email: user.email,
        public_name: user.public_name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    next(err);
  }
};

const login: RequestHandler = async (req, res, next) => {
  try {
    const { public_name, password } = req.body;

    const user = await User.findOne({ where: { public_name } });
    if (!user) {
      return res
        .status(401)
        .json({ error: "Identifiant ou mot de passe incorrect" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ error: "Identifiant ou mot de passe incorrect" });
    }

    const jwtSecret = process.env.JWT_SECRET as string;
    const token = jwt.sign({ id: user.id, isAdmin: user.is_admin }, jwtSecret, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    } as jwt.SignOptions);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const avatarUrl = user.avatar_url ? `${baseUrl}${user.avatar_url}` : null;

    const userResponse = {
      id: user.id,
      email: user.email,
      public_name: user.public_name,
      isAdmin: user.is_admin,
      avatarUrl,
    };

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Connexion réussie",
      user: userResponse,
    });
  } catch (err) {
    next(err);
  }
};

const logout: RequestHandler = async (req, res, next) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ message: "Déconnexion réussie" });
  } catch (err) {
    next(err);
  }
};

const check: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Utilisateur non authentifié." });
    }

    const userFromDb = await User.findByPk(req.user.id, {
      attributes: ["id", "public_name", "is_admin", "avatar_url"],
    });

    if (!userFromDb) {
      return res.status(404).json({ error: "Utilisateur non trouvé en BDD." });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const avatarUrl = userFromDb.avatar_url
      ? `${baseUrl}${userFromDb.avatar_url}`
      : null;

    res.json({
      authenticated: true,
      user: {
        public_name: userFromDb.public_name,
        isAdmin: userFromDb.is_admin,
        avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({ message: "Si l'email existe, un lien a été envoyé." });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 heure

    user.reset_token = token;
    user.reset_token_expiry = tokenExpiry;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      html: `<p>Pour réinitialiser votre mot de passe, cliquez sur ce lien : <a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    res.json({ message: "Si l'email existe, un lien a été envoyé." });
  } catch (err) {
    next(err);
  }
};

const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Le mot de passe doit faire au moins 6 caractères." });
    }

    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Lien invalide ou expiré." });
    }

    user.password = await bcrypt.hash(password, 12);
    user.reset_token = null;
    user.reset_token_expiry = null;
    await user.save();

    res.json({ message: "Votre mot de passe a bien été réinitialisé." });
  } catch (err) {
    next(err);
  }
};

const getMe: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    const user = await User.findByPk(req.user.id, {
      attributes: {
        exclude: ["password", "reset_token", "reset_token_expiry"],
      },
    });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const absoluteAvatarUrl = user.avatar_url
      ? `${baseUrl}${user.avatar_url}`
      : null;

    res.json({
      ...user.get(),
      avatar_url: absoluteAvatarUrl,
    });
  } catch (err) {
    next(err);
  }
};

const updateAvatar: RequestHandler = async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier n'a été envoyé." });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    user.avatar_url = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const absoluteAvatarUrl = `${baseUrl}${user.avatar_url}`;

    res.status(200).json({
      message: "Avatar mis à jour avec succès.",
      avatar_url: absoluteAvatarUrl,
    });
  } catch (err) {
    next(err);
  }
};

const readPublicProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { publicName } = req.params;

    // 1. Trouver l'utilisateur par son pseudo
    const user = await User.findOne({
      where: { public_name: publicName },
      // On récupère son ID pour trouver ses posts, mais on ne l'exposera pas
      attributes: ["id", "public_name", "avatar_url"],
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    // 2. Récupérer uniquement ses articles APPROUVÉS
    const approvedPosts = await Posts.findAll({
      where: {
        user_id: user.id,
        status: "approved",
      },
      // On sélectionne uniquement les champs nécessaires pour la liste publique
      attributes: ["title", "subtitle", "slug", "publishedAt"],
      order: [["publishedAt", "DESC"]],
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const absoluteAvatarUrl = user.avatar_url
      ? `${baseUrl}${user.avatar_url}`
      : null;

    // 3. Construire la réponse finale avec uniquement les données publiques
    res.json({
      public_name: user.public_name,
      avatar_url: absoluteAvatarUrl,
      posts: approvedPosts,
    });
  } catch (err) {
    next(err);
  }
};

// --- NOUVELLE Action pour que l'utilisateur connecté récupère ses propres articles ---
const getMyPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const userPosts = await Posts.findAll({
      where: { user_id: userId },
      // On récupère les infos utiles pour la page de profil privée
      attributes: ["title", "slug", "status", "createdAt", "rejection_reason"],
      order: [["createdAt", "DESC"]],
    });

    res.json(userPosts);
  } catch (err) {
    next(err);
  }
};

export default {
  browse,
  read,
  readPublicProfile,
  add,
  edit,
  destroy,
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  check,
  getMe,
  getMyPosts,
  updateAvatar,
};
