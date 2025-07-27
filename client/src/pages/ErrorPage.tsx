import { Link, useRouteError } from "react-router-dom";

// Interface pour typer l'objet d'erreur de React Router
interface RouteError {
  status?: number;
  statusText?: string;
  message?: string;
  data?: string;
}

export default function ErrorPage() {
  // useRouteError() nous donne l'erreur qui a été levée
  const error = useRouteError() as RouteError;
  console.error(error);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "sans-serif",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1>Oops! Une erreur est survenue.</h1>
      <p>
        {error.status === 404
          ? "La page que vous cherchez n'existe pas."
          : "Quelque chose s'est mal passé de notre côté."}
      </p>
      <p style={{ color: "#888" }}>
        <i>{error.statusText || error.message}</i>
      </p>
      <Link
        to="/"
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#333",
          color: "white",
          textDecoration: "none",
          borderRadius: "5px",
        }}
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
