import path from "node:path";
import express from "express";
import isAdmin from "./middleware/isAdmin";
import authenticateToken from "./middleware/isConnected";
import uploadAvatar from "./middleware/uploadAvatar";
import postsActions from "./modules/postsAction";
import tagsActions from "./modules/tagsAction";
import userActions from "./modules/userActions";
import { startCronJobs } from "./tools/cron.service";

const router = express.Router();
router.use(express.static(path.join(__dirname, "..", "public")));

/* ************************************************************************* */
// 🌍 Routes PUBLIQUES (accessibles à tous)
/* ************************************************************************* */

// Routes d'authentification
router.post("/auth/login", userActions.login);
router.post(
  "/auth/register",
  uploadAvatar.fields([{ name: "avatar", maxCount: 1 }]),
  userActions.register,
);
router.post("/auth/logout", userActions.logout);
router.post("/auth/forgot-password", userActions.forgotPassword);
router.post("/auth/reset-password", userActions.resetPassword);

router.get("/posts", postsActions.browse);
router.get("/tags", tagsActions.browse);
router.get("/users/profile/:publicName", userActions.readPublicProfile);

/* ************************************************************************* */
// 🛡️ Wall d'autorisation - Tout ce qui suit nécessite d'être connecté
/* ************************************************************************* */

router.use(authenticateToken);

/* ************************************************************************* */
// 🔒 Routes PROTÉGÉES (utilisateur connecté requis)
/* ************************************************************************* */

router.get("/articles/:slug(*)", postsActions.read);

// Route pour les users
router.get("/users/me", userActions.getMe);
router.get("/users/me/posts", userActions.getMyPosts);
router.patch(
  "/users/me/avatar",
  uploadAvatar.single("avatar"),
  userActions.updateAvatar,
);

router.post("/posts", postsActions.create);

router.get("/auth/check", userActions.check);

/* ************************************************************************* */
// 👑 Wall d'administration - Tout ce qui suit nécessite d'être Admin
/* ************************************************************************* */

router.use(isAdmin);

/* ************************************************************************* */
// 🔑 Routes ADMIN (connecté ET admin requis)
/* ************************************************************************* */

// Routes utilisateurs
router.get("/users/:id", userActions.read);
router.get("/users", userActions.browse);
router.post("/users", userActions.add);
router.put("/users/:id", userActions.edit);
router.delete("/users/:id", userActions.destroy);

// Routes pour la gestion des articles par l'admin
router.get("/admin/posts", postsActions.browseForAdmin);
router.patch("/admin/posts/:id/status", postsActions.updateStatus);
router.patch("/admin/posts/:id/context", postsActions.updateContext);
router.patch("/admin/posts/:id/feature", postsActions.toggleFeature);
router.delete("/admin/posts/:id", postsActions.destroy);

// Démarrage des tâches de fond (cron jobs)
startCronJobs();

export default router;
