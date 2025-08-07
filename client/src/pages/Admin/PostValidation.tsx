import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
// On importe Link pour la navigation en pleine page
import { Link } from "react-router-dom";
import { useOverlay } from "../../contexts/OverlayContext/OverlayContext";
import "../../stylesheets/Admin.css";

// Type pour les articles reçus de l'API admin
interface AdminPost {
  id: string;
  title: string;
  slug: string;
  hook: string | null;
  author: {
    public_name: string;
  };
}

type PostStatusFilter = "pending_review" | "approved" | "rejected";

const fetchAdminPosts = async (
  status: PostStatusFilter,
): Promise<AdminPost[]> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/admin/posts?status=${status}`,
    { credentials: "include" },
  );
  if (!response.ok) throw new Error("Impossible de récupérer les articles.");
  return response.json();
};

function PostValidation() {
  const [activeFilter, setActiveFilter] =
    useState<PostStatusFilter>("pending_review");
  const { openOverlay } = useOverlay();

  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery<AdminPost[], Error>({
    queryKey: ["adminPosts", activeFilter],
    queryFn: () => fetchAdminPosts(activeFilter),
  });

  const filters: { label: string; value: PostStatusFilter }[] = [
    { label: "En attente", value: "pending_review" },
    { label: "Approuvés", value: "approved" },
    { label: "Rejetés", value: "rejected" },
  ];

  return (
    <>
      <h2>Validation des Articles</h2>
      <div className="admin-filters">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={activeFilter === filter.value ? "active" : ""}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading && <p>Chargement des articles...</p>}
      {isError && (
        <p style={{ color: "red" }}>Erreur lors du chargement des articles.</p>
      )}

      {posts && (
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Accroche</th>
              <th>Auteur</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.length > 0 ? (
              posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td className="hook-cell">{post.hook}</td>
                  <td>{post.author.public_name}</td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="button-classic-outline"
                      onClick={() => openOverlay(`#/${post.slug}`)}
                    >
                      Modérer (Overlay)
                    </button>
                    <Link
                      to={`/${post.slug}`}
                      className="button-classic"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Voir (Pleine page)
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  Aucun article dans cette catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </>
  );
}

export default PostValidation;
