import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToastStore } from "../utils/useToast";
import "../stylesheets/profilepage.css";
import type { MyPost, UserProfile } from "../types/pages/PagesTypes";

// Fonction de fetch pour le profil
const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Impossible de récupérer les informations du profil.");
  }
  return response.json();
};
const fetchMyPosts = async (): Promise<MyPost[]> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/users/me/posts`,
    {
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error("Impossible de récupérer vos publications.");
  }
  return response.json();
};

const updateAvatar = async (avatarFile: File) => {
  const formData = new FormData();
  formData.append("avatar", avatarFile);

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/users/me/avatar`,
    {
      method: "PATCH",
      credentials: "include",
      body: formData,
    },
  );
  if (!response.ok) {
    throw new Error("Échec de la mise à jour de l'avatar.");
  }
  return response.json();
};

const getStatusLabel = (status: MyPost["status"]) => {
  switch (status) {
    case "approved":
      return <span className="status-pill approved">Publié</span>;
    case "pending_review":
      return <span className="status-pill pending">En attente</span>;
    case "rejected":
      return <span className="status-pill rejected">Rejeté</span>;
    default:
      return status;
  }
};

function ProfilePage() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const {
    data: user,
    isLoading: isLoadingUser,
    isError: isUserError,
  } = useQuery<UserProfile>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });
  const {
    data: myPosts,
    isLoading: isLoadingPosts,
    isError: isPostsError,
  } = useQuery<MyPost[]>({
    queryKey: ["myPosts"],
    queryFn: fetchMyPosts,
  });

  const avatarMutation = useMutation({
    mutationFn: updateAvatar,
    onSuccess: () => {
      addToast("Avatar mis à jour avec succès !", "success");
      void queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: (error: Error) => {
      addToast(error.message, "error");
    },
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarFile) return;
    avatarMutation.mutate(avatarFile);
  };

  if (isLoadingUser) {
    return (
      <div className="profile-page-container">Chargement du profil...</div>
    );
  }
  if (isUserError) {
    return (
      <div className="profile-page-container">
        Erreur lors du chargement du profil.
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <section className="profile-header">
        <h2>Mon Profil</h2>
        <p>Gérez vos informations personnelles et votre avatar.</p>
      </section>

      <section className="profile-avatar-section">
        <h3>Avatar</h3>
        <div className="avatar-display">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Aperçu du nouvel avatar"
              className="avatar-img"
            />
          ) : user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Avatar de l'utilisateur"
              className="avatar-img"
            />
          ) : (
            <FaUserCircle className="avatar-default-icon" size={120} />
          )}
        </div>
        <form onSubmit={handleAvatarSubmit}>
          <label htmlFor="avatar-upload" className="button-classic-outline">
            Changer d'avatar
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          {avatarFile && (
            <button
              type="submit"
              className="button-classic"
              disabled={avatarMutation.isPending}
            >
              {avatarMutation.isPending ? "Envoi..." : "Enregistrer l'avatar"}
            </button>
          )}
        </form>
      </section>

      <section className="profile-details-section">
        <h3>Informations</h3>
        <div className="info-group">
          <span className="info-label">Pseudonyme</span>
          <span className="info-value">{user?.public_name}</span>
        </div>
        <div className="info-group">
          <span className="info-label">Email</span>
          <span className="info-value">{user?.email}</span>
        </div>
        <div className="info-group">
          <span className="info-label">Membre depuis le</span>
          <span className="info-value">
            {user && new Date(user.createdAt).toLocaleDateString("fr-FR")}
          </span>
        </div>
      </section>

      <section className="profile-posts-section">
        <h3>Mes Publications</h3>
        {isLoadingPosts && <p>Chargement de vos publications...</p>}
        {isPostsError && (
          <p style={{ color: "red" }}>Erreur de chargement des publications.</p>
        )}
        {myPosts && myPosts.length === 0 && (
          <p>
            Vous n'avez encore rien publié.{" "}
            <Link to="/exprimez-vous">Lancez-vous !</Link>
          </p>
        )}
        {myPosts && myPosts.length > 0 && (
          <div className="my-posts-list">
            {myPosts.map((post) => (
              <div key={post.slug} className="my-post-item">
                <div className="my-post-info">
                  <Link to={`/${post.slug}`} className="my-post-title-link">
                    {post.title}
                  </Link>
                  <div className="my-post-meta">
                    {getStatusLabel(post.status)}
                  </div>
                </div>
                {post.status === "rejected" && post.rejection_reason && (
                  <p className="rejection-reason-display">
                    <strong>Motif du rejet :</strong> {post.rejection_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="profile-actions-section">
        <button type="button" className="button-danger" onClick={logout}>
          Se déconnecter
        </button>
      </section>
    </div>
  );
}

export default ProfilePage;
