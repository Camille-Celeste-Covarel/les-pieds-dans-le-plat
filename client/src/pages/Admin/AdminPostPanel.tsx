import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal/Modal";
import { useToastStore } from "../../utils/useToast";
import type { FullPost as Post } from "../Post";

interface AdminPostPanelProps {
  post: Post;
}

const performAdminAction = async ({
  postId,
  endpoint,
  method,
  body,
}: {
  postId: string;
  endpoint: string;
  method: "PATCH" | "DELETE";
  body?: object;
}) => {
  const url = endpoint
    ? `${import.meta.env.VITE_API_URL}/api/admin/posts/${postId}/${endpoint}`
    : `${import.meta.env.VITE_API_URL}/api/admin/posts/${postId}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "L'action a échoué.");
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return { message: "Article supprimé avec succès." };
  }
  return response.json();
};

function AdminPostPanel({ post }: AdminPostPanelProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [context, setContext] = useState(post.admin_context || "");

  const adminActionMutation = useMutation({
    mutationFn: performAdminAction,
    onSuccess: (data, variables) => {
      addToast(data.message || "Action réussie !", "success");

      if (variables.method === "DELETE") {
        navigate("/");
      } else {
        void queryClient.invalidateQueries({ queryKey: ["post", post.slug] });
        void queryClient.invalidateQueries({ queryKey: ["latestPosts"] });
      }
      setIsDeleteModalOpen(false);
    },
    onError: (error: Error) => {
      addToast(error.message, "error");
    },
  });

  const handleContextSave = () => {
    adminActionMutation.mutate({
      postId: post.id,
      endpoint: "context",
      method: "PATCH",
      body: { context },
    });
  };

  const handleToggleFeature = () => {
    adminActionMutation.mutate({
      postId: post.id,
      endpoint: "feature",
      method: "PATCH",
    });
  };

  const handleDelete = () => {
    adminActionMutation.mutate({
      postId: post.id,
      endpoint: "",
      method: "DELETE",
    });
  };

  return (
    <>
      <div className="admin-post-panel">
        <button
          type="button"
          className="panel-header"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <span>Panneau de Modération</span>
          <span className={`chevron ${isExpanded ? "expanded" : ""}`}>▼</span>
        </button>

        {isExpanded && (
          <div className="panel-content">
            <div className="panel-section">
              <label htmlFor="admin-context">Mot de l'administration</label>
              <input
                type="text"
                id="admin-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ajoutez une note pour l'équipe ici..."
                disabled={adminActionMutation.isPending}
              />
              <button
                type="button"
                onClick={handleContextSave}
                disabled={
                  adminActionMutation.isPending ||
                  context === (post.admin_context || "")
                }
              >
                {adminActionMutation.isPending
                  ? "Sauvegarde..."
                  : "Sauvegarder le mot"}
              </button>
            </div>

            <div className="panel-section actions">
              <button
                type="button"
                onClick={handleToggleFeature}
                disabled={adminActionMutation.isPending}
              >
                {adminActionMutation.isPending
                  ? "..."
                  : post.is_featured
                    ? "Retirer de la une"
                    : "Mettre en avant"}
              </button>
              <button
                type="button"
                className="button-danger"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={adminActionMutation.isPending}
              >
                Supprimer l'article
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
      >
        <p>
          Êtes-vous sûr de vouloir supprimer définitivement cet article ? Cette
          action est irréversible.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="button-classic-outline"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={adminActionMutation.isPending}
          >
            Annuler
          </button>
          <button
            type="button"
            className="button-danger"
            onClick={handleDelete}
            disabled={adminActionMutation.isPending}
          >
            {adminActionMutation.isPending
              ? "Suppression..."
              : "Confirmer la suppression"}
          </button>
        </div>
      </Modal>
    </>
  );
}

export default AdminPostPanel;
