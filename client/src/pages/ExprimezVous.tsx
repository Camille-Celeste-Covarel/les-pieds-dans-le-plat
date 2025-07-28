import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import { LexicalEditor } from "../components/Editor/LexicalEditor";
import { useToastStore } from "../utils/useToast";
import "../stylesheets/exprimezvous.css";

interface Tag {
  id: number;
  name: string;
}

interface NewPostPayload {
  title: string;
  hook: string;
  content: string;
  tagIds: number[];
}

// --- Fonctions d'API ---
const fetchTags = async (): Promise<Tag[]> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tags`);
  if (!response.ok) {
    throw new Error("Impossible de charger les tags.");
  }
  return response.json();
};

const createPost = async (payload: NewPostPayload) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Une erreur est survenue.");
  }
  return response.json();
};

function ExprimezVous() {
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [editorState, setEditorState] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const {
    data: tags,
    isLoading: isLoadingTags,
    error: tagsError,
  } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  // --- Mutation pour la création de post ---
  const postMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      addToast("Votre article a bien été soumis pour relecture !", "success");
      void queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      setTitle("");
      setHook("");
      setEditorState("");
      setSelectedTags([]);
      setEditorKey((prevKey) => prevKey + 1);
    },
    onError: (error: Error) => {
      addToast(error.message, "error");
    },
  });

  const handleTagChange = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      addToast("Le titre est obligatoire.", "error");
      return;
    }
    if (!hook.trim()) {
      addToast("L'accroche est obligatoire.", "error");
      return;
    }
    if (!editorState || editorState.length < 50) {
      addToast(
        "Le contenu de l'article est obligatoire et doit faire au moins 50 caractères.",
        "error",
      );
      return;
    }

    postMutation.mutate({
      title,
      hook,
      content: editorState,
      tagIds: selectedTags,
    });
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
            disabled={postMutation.isPending}
          />
        </div>

        <div className="form-group">
          <label htmlFor="hook">Accroche de l'article</label>
          <div className="form-group-with-counter">
            <textarea
              id="hook"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="Rédigez une courte phrase (300 caractères max) qui donnera envie de lire votre texte. Elle servira d'aperçu."
              rows={3}
              maxLength={300}
              required
              disabled={postMutation.isPending}
            />
            <small className="char-counter">{hook.length} / 300</small>
          </div>
        </div>

        <fieldset className="form-group" disabled={postMutation.isPending}>
          <legend>Thématiques (optionnel)</legend>
          {isLoadingTags && <p>Chargement des thématiques...</p>}
          {tagsError && (
            <p style={{ color: "red" }}>
              Erreur de chargement des thématiques.
            </p>
          )}
          <div className="tags-selection-container">
            {tags?.map((tag) => (
              <div key={tag.id} className="tag-checkbox">
                <input
                  type="checkbox"
                  id={`tag-${tag.id}`}
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => handleTagChange(tag.id)}
                />
                <label htmlFor={`tag-${tag.id}`}>{tag.name}</label>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="form-group">
          <label htmlFor="article-content">Contenu de l'article</label>
          <LexicalEditor
            key={editorKey}
            onChange={setEditorState}
            id="article-content"
            isEditable={!postMutation.isPending}
          />
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={postMutation.isPending}
        >
          {postMutation.isPending
            ? "Envoi en cours..."
            : "Soumettre pour relecture"}
        </button>
      </form>
    </div>
  );
}
export default ExprimezVous;
