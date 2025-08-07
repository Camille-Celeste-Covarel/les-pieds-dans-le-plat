import { useQuery } from "@tanstack/react-query";
import { FaUserCircle } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import "../stylesheets/PublicProfile.css";
import type { PublicProfileData } from "../types/pages/PagesTypes";

const fetchPublicProfile = async (
  publicName: string,
): Promise<PublicProfileData> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/users/profile/${publicName}`,
  );
  if (!response.ok) {
    throw new Error("Impossible de charger le profil.");
  }
  return response.json();
};

function PublicProfile() {
  const { publicName } = useParams<{ publicName: string }>();

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery<PublicProfileData, Error>({
    queryKey: ["publicProfile", publicName],
    queryFn: () => fetchPublicProfile(publicName as string),
    enabled: !!publicName,
  });

  if (isLoading)
    return <p className="profile-status-message">Chargement du profil...</p>;
  if (isError)
    return (
      <p className="profile-status-message error">Ce profil n'existe pas.</p>
    );
  if (!profile)
    return <p className="profile-status-message">Profil non trouvé.</p>;

  return (
    <div className="public-profile-container">
      <header className="public-profile-header">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={`Avatar de ${profile.public_name}`}
            className="public-avatar"
          />
        ) : (
          <FaUserCircle className="public-avatar-default" size={100} />
        )}
        <h1>{profile.public_name}</h1>
      </header>

      <section className="public-posts-section">
        <h2>Publications</h2>
        {profile.posts.length === 0 ? (
          <p>Cet auteur n'a encore rien publié.</p>
        ) : (
          <div className="public-posts-list">
            {profile.posts.map((post) => (
              <Link
                to={`/${post.slug}`}
                key={post.slug}
                className="public-post-card"
              >
                <h3>{post.title}</h3>
                {post.subtitle && <p>{post.subtitle}</p>}
                <span className="post-date">
                  Publié le{" "}
                  {new Date(post.publishedAt).toLocaleDateString("fr-FR")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default PublicProfile;
