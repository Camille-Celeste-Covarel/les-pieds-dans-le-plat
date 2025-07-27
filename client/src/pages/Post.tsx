import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
import { FaShareAlt, FaUserCircle } from "react-icons/fa";
import { Link, useLocation, useParams } from "react-router-dom";
import Modal from "../components/Modal/Modal";
import { useAuth } from "../contexts/AuthContext";
import "../stylesheets/Post.css";
import { useToastStore } from "../utils/useToast";

interface FullPost {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  slug: string;
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

// La fonction de fetch qui appelle l'API
const fetchPost = async (slug: string): Promise<FullPost> => {
  const response = await fetch(
    // L'URL de l'API reste la même, c'est le routeur Express qui gère le slug avec un '/'
    `${import.meta.env.VITE_API_URL}/api/articles/${slug}`,
    { credentials: "include" },
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Article non trouvé.");
  }
  return response.json();
};

// --- Fonctions de mutation pour les actions admin ---
const updatePostStatus = async (variables: {
  postId: string;
  status: "approved" | "rejected";
  reason?: string;
}) => {
  const { postId, status, reason } = variables;
  const body: { status: string; rejection_reason?: string } = { status };
  if (status === "rejected" && reason) {
    body.rejection_reason = reason;
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/admin/posts/${postId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error("La mise à jour du statut a échoué.");
  }
  return response.json();
};

const updatePostContext = async (variables: {
  postId: string;
  context: string;
}) => {
  const { postId, context } = variables;
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/admin/posts/${postId}/context`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ context }),
    },
  );
  if (!response.ok) {
    throw new Error("La mise à jour du contexte a échoué.");
  }
  return response.json();
};

function Post() {
  // On garde useParams pour la compatibilité si on accède à la page directement
  const { author, title } = useParams<{ author: string; title: string }>();
  const location = useLocation();

  // On détermine le slug de manière robuste pour qu'il fonctionne dans l'overlay.
  // 1. On essaie avec le hash (cas de l'overlay : #/auteur/titre)
  const slugFromHash = location.hash.startsWith("#/")
    ? location.hash.substring(2)
    : undefined;
  // 2. On essaie avec les paramètres (cas d'un accès direct à l'URL)
  const slugFromParams = author && title ? `${author}/${title}` : undefined;
  // On utilise le slug du hash en priorité, car c'est le signe qu'on est dans l'overlay.
  const slug = slugFromHash || slugFromParams;

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  // States pour l'UI
  const [context, setContext] = useState("");
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const {
    data: post,
    isLoading,
    isError,
    error,
  } = useQuery<FullPost, Error>({
    // La clé de la query utilise le slug reconstruit pour être unique
    queryKey: ["post", slug],
    // On appelle la fonction de fetch avec le slug reconstruit
    queryFn: () => fetchPost(slug as string),
    // La requête ne s'active que si le slug a bien été reconstruit
    enabled: !!slug,
  });

  const mutationOptions = {
    onSuccess: () => {
      // Rafraîchit les données de la page après une mutation réussie
      void queryClient.invalidateQueries({ queryKey: ["post", slug] });
      // Rafraîchit aussi la liste des posts dans le dashboard admin
      void queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
    },
    onError: (err: Error) => {
      // Gère les erreurs de manière centralisée
      addToast(err.message, "error");
    },
  };

  const statusMutation = useMutation({
    mutationFn: updatePostStatus,
    ...mutationOptions,
  });

  const contextMutation = useMutation({
    mutationFn: updatePostContext,
    ...mutationOptions,
    onSuccess: () => {
      mutationOptions.onSuccess();
      addToast("Contexte mis à jour !", "success");
    },
  });

  // Synchronise le state du contexte lorsque les données du post arrivent
  useEffect(() => {
    if (post) {
      setContext(post.admin_context || "");
    }
  }, [post]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      addToast("Lien de l'article copié !", "success");
    });
  };

  const handleConfirmRejection = () => {
    if (!post || !rejectionReason.trim()) {
      addToast("La raison du rejet est obligatoire.", "error");
      return;
    }
    statusMutation.mutate({
      postId: post.id,
      status: "rejected",
      reason: rejectionReason,
    });
    setIsRejectionModalOpen(false);
    setRejectionReason("");
  };

  if (isLoading)
    return <p className="post-status-message">Chargement de l'article...</p>;
  if (isError)
    return <p className="post-status-message error">{error.message}</p>;
  if (!post) return <p className="post-status-message">Article non trouvé.</p>;

  const isPendingForAdmin = user?.isAdmin && post.status === "pending_review";
  const isApprovedForAdmin = user?.isAdmin && post.status === "approved";

  return (
    <div className="post-page-container">
      {isPendingForAdmin && (
        <div className="admin-validation-panel">
          <h3>Panneau de Modération</h3>
          <p>Cet article est en attente de relecture.</p>
          <div className="admin-actions">
            <button
              type="button"
              className="button-approve"
              onClick={() =>
                statusMutation.mutate({ postId: post.id, status: "approved" })
              }
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? "..." : "Approuver"}
            </button>
            <button
              type="button"
              className="button-reject"
              onClick={() => setIsRejectionModalOpen(true)}
              disabled={statusMutation.isPending}
            >
              Rejeter
            </button>
          </div>
        </div>
      )}

      <article className="post-content-area">
        <header className="post-header">
          <h1>{post.title}</h1>
          {post.subtitle && <p className="post-subtitle">{post.subtitle}</p>}
          <div className="post-meta">
            <div className="author-info">
              {post.author.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={`Avatar de ${post.author.public_name}`}
                  className="author-avatar-small"
                />
              ) : (
                <FaUserCircle size={40} />
              )}
              <div>
                <span>Écrit par </span>
                <Link to={`/profil/${post.author.public_name}`}>
                  {post.author.public_name}
                </Link>
                {post.publishedAt && (
                  <span className="publish-date">
                    , publié le{" "}
                    {new Date(post.publishedAt).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {post.admin_context && (
          <div className="admin-context-box">
            <strong>Le mot de l'administration :</strong>
            <p>{post.admin_context}</p>
          </div>
        )}

        <div
          className="post-body"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: DOMPurify filtre les possibles attaques XSS
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(post.content),
          }}
        />

        <footer className="post-footer">
          <div className="tags-container">
            {post.tags.map((tag) => (
              <span key={tag.id} className="tag-pill">
                {tag.name}
              </span>
            ))}
          </div>
          <div className="share-container">
            <button
              type="button"
              onClick={handleShare}
              className="share-button"
              aria-label="Partager l'article"
            >
              <FaShareAlt />
              <span>Partager</span>
            </button>
          </div>
        </footer>
      </article>

      {isApprovedForAdmin && (
        <section className="admin-context-form-section">
          <h3>Mot de l'administration</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (post) contextMutation.mutate({ postId: post.id, context });
            }}
          >
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ajoutez un contexte, une précision ou une mise en perspective ici..."
              rows={4}
            />
            <button
              type="submit"
              className="button-classic"
              disabled={contextMutation.isPending}
            >
              {contextMutation.isPending
                ? "Enregistrement..."
                : "Enregistrer le mot de l'admin"}
            </button>
          </form>
        </section>
      )}

      <Modal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        title="Rejeter l'article"
      >
        <div className="rejection-form">
          <label htmlFor="rejection-reason">
            Veuillez indiquer la raison du rejet :
          </label>
          <textarea
            id="rejection-reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            placeholder="Cette raison sera visible par l'auteur de l'article."
          />
          <div className="modal-actions">
            <button
              type="button"
              className="button-classic-outline"
              onClick={() => setIsRejectionModalOpen(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="button-danger"
              onClick={handleConfirmRejection}
            >
              Confirmer le rejet
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Post;
