import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext.tsx";
import "../stylesheets/loginpage.css";

function LoginPage() {
  const [public_name, setPublicName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ public_name, password }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        login(data.user);
        navigate("/");
      } else {
        setError("Identifiant ou mot de passe incorrect");
      }
    } catch (error) {
      console.error("Erreur: ", error);
      setError("Erreur de connexion");
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
            />
            <button
              type="button"
              className="login-forgot-password"
              onClick={() => {
                navigate("/forgot-password");
              }}
            >
              Mot de passe oublié ?
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="button-classic">
          Se connecter
        </button>

        <div className="separator">
          <h2>Toujours pas de compte ?</h2>
        </div>

        <button
          type="button"
          className="button-classic"
          onClick={() => navigate("/register")}
        >
          S'inscrire !
        </button>
      </form>
    </div>
  );
}

export default LoginPage;