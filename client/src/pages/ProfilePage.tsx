import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ChangeEvent } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import "../stylesheets/profilepage.css";

// L'interface pour les données complètes de l'utilisateur
interface UserProfile {
  id: string;
  public_name: string;
  email: string;
  avatar_url: string | null;
  createdAt: string;
}

// Fonction de fetch pour TanStack Query
const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer les informations du profil.");
  }
  return response.json();
};

function ProfilePage() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<UserProfile>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
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

      await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de la mise à jour de l'avatar.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div className="profile-page-container">Chargement du profil...</div>;
  }
  if (isError) {
    return (
      <div className="profile-page-container">
        Erreur lors du chargement du profil.
      </div>
    );
  }

  return (
    // La div .profile-card a été supprimée. Le contenu est maintenant directement ici.
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
            <button type="submit" className="button-classic" disabled={isUploading}>
              {isUploading ? "Envoi..." : "Enregistrer l'avatar"}
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

      <section className="profile-actions-section">
        <button type="button" className="button-danger" onClick={logout}>
          Se déconnecter
        </button>
      </section>
    </div>
  );
}

export default ProfilePage;