import { useState } from "react";
import { LexicalEditor } from "../components/Editor/LexicalEditor";
import "../stylesheets/exprimezvous.css";

function ExprimezVous() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [editorState, setEditorState] = useState<string>("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation simple côté client
    if (!title.trim()) {
      setMessage({ type: "error", text: "Le titre est obligatoire." });
      return;
    }
    if (!editorState || editorState.length < 50) {
      setMessage({
        type: "error",
        text: "Le contenu de l'article est obligatoire.",
      });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/posts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title,
            subtitle,
            content: editorState,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue.");
      }

      setMessage({
        type: "success",
        text: "Votre article a bien été soumis pour relecture !",
      });
      setTitle("");
      setSubtitle("");
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "error",
          text: "Une erreur inconnue est survenue.",
        });
      }
    }
  };

  return (
    <div className="exprimez-vous-container">
      <h1>Exprimez-vous</h1>
      <p>
        Partagez vos pensées, vos histoires, vos idées. Chaque article est relu
        par notre équipe avant publication pour garantir un espace sûr et
        respectueux.
      </p>
      <form onSubmit={handleSubmit} className="exprimez-vous-form">
        <div className="form-group">
          <label htmlFor="title">Titre de votre article</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Un titre percutant"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="subtitle">Sous-titre (optionnel)</label>
          <input
            type="text"
            id="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Une phrase d'accroche"
          />
        </div>

        <div className="form-group">
          <label htmlFor="article-content">Contenu de l'article</label>
          <LexicalEditor onChange={setEditorState} id="article-content" />
        </div>

        {message && (
          <div
            className={`form-message ${message.type}`}
            role="alert"
            aria-live="assertive"
          >
            {message.text}
          </div>
        )}

        <button type="submit" className="submit-button">
          Soumettre pour relecture
        </button>
      </form>
    </div>
  );
}
export default ExprimezVous;
