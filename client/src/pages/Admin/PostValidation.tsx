import { useCallback, useEffect, useState } from "react";

// Définissons un type pour nos articles pour plus de clarté
interface Post {
  id: string;
  title: string;
  status: "pending_review" | "approved" | "rejected";
  author: {
    public_name: string;
  };
  createdAt: string;
}

function PostValidation() {
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/posts?status=pending_review`,
        {
          credentials: "include", // Important pour envoyer le cookie d'authentification
        },
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des articles.");
      }
      const data = await response.json();
      setPendingPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingPosts();
  }, [fetchPendingPosts]);

  const handleUpdateStatus = async (
    postId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/posts/${postId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        },
      );
      if (!response.ok) {
        throw new Error(
          `Impossible de ${status === "approved" ? "approuver" : "rejeter"} l'article.`,
        );
      }
      // Mettre à jour l'UI en retirant l'article de la liste
      setPendingPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== postId),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  };

  if (isLoading) return <p>Chargement des articles en attente...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="admin-post-validation">
      <h2>Articles en attente de relecture</h2>
      {pendingPosts.length === 0 ? (
        <p>Aucun article à relire pour le moment.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Auteur</th>
              <th>Date de soumission</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingPosts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.author.public_name}</td>
                <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    type={"button"}
                    onClick={() => handleUpdateStatus(post.id, "approved")}
                  >
                    Approuver
                  </button>
                  <button
                    type={"button"}
                    onClick={() => handleUpdateStatus(post.id, "rejected")}
                  >
                    Rejeter
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PostValidation;
