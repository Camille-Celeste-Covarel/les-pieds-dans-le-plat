# Plan d'Action : Refonte des Articles et Profils 🚀

Feuille de route pour l'implémentation du système d'articles complet, des profils publics, et des outils de modération associés.

---

## Étape 0 : Mise à jour de la Base de Données 🏗️

Cette étape prépare le terrain en modifiant la structure de la table `posts`.

### Action

*   Créer une **nouvelle migration Sequelize** pour ajouter les colonnes nécessaires à la table `posts`.
*   Ajouter les champs :
    *   `slug` (STRING, UNIQUE, NOT NULL)
    *   `rejection_reason` (TEXT, NULLABLE)
    *   `admin_context` (TEXT, NULLABLE)
*   Mettre à jour le modèle Sequelize `Posts` pour qu'il reconnaisse ces nouveaux champs.

### Fichiers concernés

*   **Nouveau :** `server/migrations/YYYYMMDDHHMMSS-add-fields-to-posts.js`
*   **Modification :** `server/src/models/posts.model.ts`

---

## Étape 1 : Évolution du Backend (API) ⚙️

C'est le cœur de la refonte logique. Nous créons et adaptons les routes pour supporter les nouvelles fonctionnalités.

### Actions

1.  **Tags :** Créer une route `GET /api/tags` pour lister tous les tags existants.
2.  **Profils Publics :** Créer la route `GET /api/users/profile/:publicName` en s'assurant qu'elle ne renvoie que des données publiques (`public_name`, `avatar_url`, liste des articles **approuvés**).
3.  **Création de Post :** Mettre à jour l'action `posts.create` pour gérer la création du `slug` (`public_name/titre-de-l-article`) et l'association des `tagIds` reçus du front.
4.  **Lecture de Post :** Créer l'action `posts.read` (`GET /api/articles/:slug`) avec une logique de sécurité stricte pour n'afficher les articles non-approuvés qu'aux admins ou à leur auteur.
5.  **Actions Admin :** Mettre à jour `updateStatus` pour gérer la `rejection_reason` et créer une nouvelle action `updateContext` pour le "mot de l'administration".
6.  **Profil Privé :** Créer la route `GET /api/users/me/posts` pour que l'utilisateur connecté puisse voir tous ses articles et leur statut.

### Fichiers concernés

*   **Modification :** `server/src/router.ts`
*   **Modification majeure :** `server/src/modules/postsAction.ts`
*   **Modification :** `server/src/modules/userActions.ts`
*   **Nouveau :** `server/src/modules/tagsAction.ts`

---

## Étape 2 : Évolution du Frontend (Interface Utilisateur) 🎨

Nous allons maintenant construire l'interface qui utilisera notre nouvelle API.

### Actions

1.  **Routing :** Mettre à jour `main.tsx` avec les nouvelles routes pour `/articles/:slug` et `/profil/:publicName`.
2.  **Profil Public :** Créer la page `PublicProfile.tsx` pour afficher les profils publics.
3.  **Profil Privé :** Mettre à jour `ProfilePage.tsx` pour y inclure la liste des publications de l'utilisateur.
4.  **Le Mur :** Mettre à jour `LeMur.tsx` : le lien de l'auteur pointera vers son profil public, la carte de l'article affichera l'aperçu et les tags, et seul un texte "Voir ce texte" sera cliquable.
5.  **Page Article :** Créer la page `Post.tsx` qui affichera l'article, le panneau admin conditionnel, le mot de l'administration, et le **nouveau bouton de partage** (copie du lien).
6.  **Formulaire de création :** Mettre à jour `ExprimezVous.tsx` pour permettre la sélection de tags depuis une liste (cases à cocher).
7.  **Validation Admin :** Simplifier `PostValidation.tsx` pour qu'il ne contienne plus que des liens vers la page `Post.tsx` pour la relecture.

### Fichiers concernés

*   **Modification :** `client/src/main.tsx`
*   **Nouveau :** `client/src/pages/PublicProfile.tsx`
*   **Modification :** `client/src/pages/ProfilePage.tsx`
*   **Modification :** `client/src/pages/LeMur.tsx`
*   **Nouveau :** `client/src/pages/Post.tsx`
*   **Modification :** `client/src/pages/ExprimezVous.tsx`
*   **Modification :** `client/src/pages/Admin/PostValidation.tsx`

---

## Étape 3 : Audit de Sécurité et de Données 🛡️

C'est l'étape de vérification finale, une fois que tout est fonctionnel.

### Action

*   Passer en revue chaque route de l'API une par une et vérifier la réponse JSON retournée. S'assurer qu'aucune donnée sensible (mot de passe, email, token, `is_admin`, etc.) n'est exposée sur les routes publiques ou à des utilisateurs non autorisés. Utiliser systématiquement `attributes: { exclude: [...] }` dans les requêtes Sequelize.

### Fichiers à auditer

*   `server/src/modules/userActions.ts`
*   `server/src/modules/postsAction.ts`
*   `server/src/modules/tagsAction.ts`

---

## Récapitulatif Final des Modifications par Fichier Clé

*   **`server/migrations/...` (Nouveau) :** Ajoute `slug`, `rejection_reason`, `admin_context` à la table `posts`.
*   **`server/src/router.ts` (Modifié) :** Déclare les nouvelles routes.
*   **`server/src/modules/postsAction.ts` (Modifié) :** Le plus gros chantier backend. Gère la création avec slug/tags, la lecture sécurisée par slug, et les nouvelles actions de modération.
*   **`server/src/modules/userActions.ts` (Modifié) :** Ajoute la logique pour afficher un profil public de manière sécurisée et pour lister les posts d'un utilisateur.
*   **`client/src/main.tsx` (Modifié) :** Déclare les routes pour `/articles/:slug` et `/profil/:publicName`.
*   **`client/src/pages/LeMur.tsx` (Modifié) :** Refonte visuelle des cartes d'article (aperçu, tags, lien unique) et ajout des liens vers les profils publics.
*   **`client/src/pages/Post.tsx` (Nouveau) :** La nouvelle page centrale pour lire un article. Affiche le contenu, le mot de l'admin, les tags, le panneau de modération (pour les admins) et le bouton de partage.
*   **`client/src/pages/ProfilePage.tsx` (Modifié) :** Ajout de la section "Mes Publications" avec le statut de chaque article.
*   **`client/src/pages/PublicProfile.tsx` (Nouveau) :** Page minimaliste affichant l'avatar, le pseudo et les articles publiés d'un utilisateur.
*   **`client/src/pages/ExprimezVous.tsx` (Modifié) :** Le formulaire de création inclura désormais une sélection de tags à partir d'une liste.
*   **`client/src/pages/Admin/PostValidation.tsx` (Modifié) :** Le tableau est simplifié pour devenir une simple liste de liens pointant vers la page `Post.tsx` pour la validation.