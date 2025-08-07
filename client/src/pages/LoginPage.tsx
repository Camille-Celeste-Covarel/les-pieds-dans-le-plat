import type React from "react"; // 1. On importe React pour corriger le bug
import { useState } from "react";
import { isMobile } from "react-device-detect";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useOverlay } from "../contexts/OverlayContext/OverlayContext.tsx";
import "../stylesheets/loginpage.css";

function LoginPage() {
  const [public_name, setPublicName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // 2. On ajoute l'état de chargement
  const navigate = useNavigate();
  const { login } = useAuth();
  const { openOverlay, closeOverlay } = useOverlay();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ public_name, password }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        login(data.user);
        if (isMobile) {
          navigate("/le-mur");
        } else {
          closeOverlay();
        }
      } else {
        setError("Identifiant ou mot de passe incorrect");
      }
    } catch (err) {
      console.error("Erreur: ", err);
      setError("Erreur de connexion au serveur. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    if (isMobile) {
      navigate("/forgot-password");
    } else {
      openOverlay("#forgot-password");
    }
  };

  const handleRegisterClick = () => {
    if (isMobile) {
      navigate("/register");
    } else {
      openOverlay("#register");
    }
  };

  return (
    <div className="login-page-container">
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="public_name">Pseudonyme</label>
          <div className="email-input">
            <input
              type="text"
              id="public_name"
              value={public_name}
              onChange={(e) => setPublicName(e.target.value)}
              required
              placeholder="Tapez votre pseudonyme"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <div className="password-input">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Tapez votre mot de passe"
              disabled={isLoading}
            />
            <button
              type="button"
              className="login-forgot-password"
              onClick={handleForgotPasswordClick}
              disabled={isLoading}
            >
              Mot de passe oublié ?
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="button-classic" disabled={isLoading}>
          {isLoading ? "Connexion..." : "Se connecter"}
        </button>

        <div className="separator">
          <h2>Toujours pas de compte ?</h2>
        </div>

        <button
          type="button"
          className="button-classic"
          onClick={handleRegisterClick}
          disabled={isLoading}
        >
          S'inscrire !
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
