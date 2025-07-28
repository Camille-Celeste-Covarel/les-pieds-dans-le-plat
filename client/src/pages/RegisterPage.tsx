import type React from "react";
import { useRef, useState } from "react";
import { FaEye, FaEyeSlash, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router";
import { useToastStore } from "../utils/useToast";
import "../stylesheets/registerpage.css";

interface FormData {
  email: string;
  public_name: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  public_name?: string;
  password?: string;
  confirmPassword?: string;
}

function RegisterPage() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    public_name: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.public_name.trim())
      newErrors.public_name = "Le pseudonyme est requis";

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 6) {
      newErrors.password =
        "Le mot de passe doit contenir au moins 6 caractères";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new window.FormData();
      formDataToSend.append("email", formData.email);
      formDataToSend.append("public_name", formData.public_name);
      formDataToSend.append("password", formData.password);

      if (avatarFile) {
        formDataToSend.append("avatar", avatarFile);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        {
          method: "POST",
          body: formDataToSend,
        },
      );

      const data = await response.json();

      if (response.ok) {
        addToast("Compte créé avec succès ! Bienvenue !", "success");
        navigate("/login");
      } else {
        addToast(data.error || "Erreur lors de la création du compte", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Erreur réseau. Veuillez vérifier votre connexion.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const imageUrl = window.URL.createObjectURL(file);
      setAvatar(imageUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <div className="register-container">
        <section className="register-profil-section">
          <h2>Créer un compte</h2>
          <div className="profil-picture-container">
            {avatar ? (
              <img
                src={avatar}
                className="profil-avatar"
                alt="Aperçu de l'avatar"
              />
            ) : (
              <FaUserCircle className="profil-avatar-default" size={100} />
            )}
            <button
              type="button"
              className="button-classic"
              onClick={triggerFileInput}
            >
              Choisir un avatar
            </button>
            <input
              ref={fileInputRef}
              id="profile-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </div>
          <div className="form-group">
            <h3>Pseudonyme de publication</h3>
            <input
              type="text"
              name="public_name"
              value={formData.public_name}
              onChange={handleChange}
              className={errors.public_name ? "error" : ""}
              placeholder="Entrez votre pseudonyme"
              disabled={isLoading}
            />
            {errors.public_name && (
              <span className="error-message">{errors.public_name}</span>
            )}
          </div>
          <div className="form-group">
            <h3>Email</h3>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
              placeholder="Entrez votre email"
              disabled={isLoading}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>
          <div className="form-group">
            <h3>Mot de passe</h3>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "error" : ""}
                placeholder="Entrez votre mot de passe"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>
          <div className="form-group">
            <h3>Confirmer le mot de passe</h3>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "error" : ""}
                placeholder="Confirmez votre mot de passe"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
                aria-label={
                  showConfirmPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="button-classic submit-button"
            disabled={isLoading}
          >
            {isLoading ? "Création en cours..." : "Créer mon compte"}
          </button>
        </section>
      </div>
    </form>
  );
}

export default RegisterPage;
