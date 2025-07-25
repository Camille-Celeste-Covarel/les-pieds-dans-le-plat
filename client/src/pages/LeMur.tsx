import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../stylesheets/LeMur.css";

interface ApprovedPost {
  id: string;
  title: string;
  subtitle: string | null;
  author: {
    public_name: string;
    avatar_url: string | null;
  };
}

function LeMur() {
  const [posts, setPosts] = useState<ApprovedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApprovedPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Cette route est publique et ne retourne que les articles "approved"
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/posts`,
        );
        if (!response.ok) {
          throw new Error("Impossible de charger les articles.");
        }
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovedPosts();
  }, []);

  if (isLoading) return <p>Chargement du mur...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="le-mur-container">
      <h1>Le Mur</h1>
      <p>Découvrez les dernières publications de notre communauté.</p>

      {posts.length === 0 ? (
        <p>Il n'y a encore rien sur le mur. Soyez le premier à écrire !</p>
      ) : (
        <div className="le-mur-grid">
          {posts.map((post) => (
            <Link to={`/posts/${post.id}`} key={post.id} className="post-card">
              <div className="post-card-header">
                {post.author.avatar_url && (
                  <img
                    src={post.author.avatar_url}
                    alt={`Avatar de ${post.author.public_name}`}
                    className="author-avatar"
                  />
                )}
                <span className="author-name">{post.author.public_name}</span>
              </div>
              <div className="post-card-body">
                <h2>{post.title}</h2>
                {post.subtitle && <p>{post.subtitle}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default LeMur;
