import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import "../stylesheets/LeMur.css";
import type { PostOnTheWall } from "../types/pages/PagesTypes";

const fetchLatestPosts = async (): Promise<PostOnTheWall[]> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/posts`);
  if (!response.ok) {
    throw new Error("Impossible de charger les articles.");
  }
  return response.json();
};

function LeMur() {
  const {
    data: posts,
    isLoading,
    error,
  } = useQuery<PostOnTheWall[], Error>({
    queryKey: ["latestPosts"],
    queryFn: fetchLatestPosts,
  });

  if (isLoading) return <p>Chargement du mur...</p>;

  if (error) return <p style={{ color: "red" }}>{error.message}</p>;

  return (
    <div className="le-mur-container">
      <h1>Le Mur</h1>
      <p>Découvrez les dernières publications de notre communauté.</p>

      {!posts || posts.length === 0 ? (
        <p>Il n'y a encore rien sur le mur. Soyez le premier à écrire !</p>
      ) : (
        <div className="le-mur-grid">
          {posts.map((post) => (
            <article
              key={post.id}
              className={`post-card ${post.is_featured ? "featured" : ""}`}
            >
              <div className="post-card-header">
                {post.author.avatar_url && (
                  <img
                    src={post.author.avatar_url}
                    alt={`Avatar de ${post.author.public_name}`}
                    className="author-avatar"
                  />
                )}
                <Link
                  to={`/profil/${post.author.public_name}`}
                  className="author-name"
                >
                  {post.author.public_name}
                </Link>
              </div>
              <div className="post-card-body">
                <h2>{post.title}</h2>
                {post.hook && <p className="post-subtitle">{post.hook}</p>}
              </div>
              <div className="post-card-footer">
                <div className="tags-container">
                  {post.tags.map((tag) => (
                    <span key={tag.id} className="tag-pill">
                      {tag.name}
                    </span>
                  ))}
                </div>
                <Link to={`/${post.slug}`} className="read-more-link">
                  Voir ce texte
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default LeMur;
