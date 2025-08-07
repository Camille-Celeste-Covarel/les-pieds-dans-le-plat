import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { useState } from "react";
import { FaShareAlt, FaStar, FaUserCircle } from "react-icons/fa";
import { Link, useLocation, useParams } from "react-router-dom";
import AdminPostPanel from "./Admin/AdminPostPanel.tsx";
import "./Admin/AdminPostPanel.css";
import Modal from "../components/Modal/Modal";
import { useAuth } from "../contexts/AuthContext";
import { useOverlay } from "../contexts/OverlayContext/OverlayContext";
import "../stylesheets/Post.css";
import type { FullPost } from "../types/pages/PagesTypes";
import { useToastStore } from "../utils/useToast";

// La fonction de fetch qui appelle l'API
const fetchPost = async (slug: string): Promise<FullPost> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/articles/${slug}`,
    { credentials: "include" },
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Article non trouvé.");
  }
  return response.json();
};

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

function Post() {
  const { author, title } = useParams<{ author: string; title: string }>();
  const location = useLocation();
  useOverlay();

  const slugFromHash = location.hash.startsWith("#/")
    ? location.hash.substring(2)
    : undefined;
  const slugFromParams = author && title ? `${author}/${title}` : undefined;
  const slug = slugFromHash || slugFromParams;

  const isInOverlay = !!slugFromHash;

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const {
    data: post,
    isLoading,
    isError,
    error,
  } = useQuery<FullPost, Error>({
    queryKey: ["post", slug],
    queryFn: () => fetchPost(slug as string),
    enabled: !!slug,
  });

  const statusMutation = useMutation({
    mutationFn: updatePostStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["post", slug] });
      void queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      addToast("Statut mis à jour !", "success");
    },
    onError: (err: Error) => {
      addToast(err.message, "error");
    },
  });

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
    <div
      className={isInOverlay ? "post-overlay-container" : "post-page-container"}
    >
      {isPendingForAdmin && (
        <div className="admin-validation-panel">
          <h3>Panneau de Relecture</h3>
          <p>Cet article est en attente de relecture.</p>
          <div className="admin-actions">
            <button
              type="button"
              className="button-approve"
              onClick={() =>
                statusMutation.mutate({
                  postId: post.id,
                  status: "approved",
                })
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

      {isApprovedForAdmin && <AdminPostPanel post={post} />}

      <article className="post-content-area">
        <header className="post-header">
          <h1>{post.title}</h1>
          {post.is_featured && (
            <div className="featured-badge">
              <FaStar />
              <span>Choix de l'administration</span>
            </div>
          )}
          {post.hook && <p className="post-hook">{post.hook}</p>}

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
