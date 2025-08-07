import { useState } from "react";
import PostValidation from "./Admin/PostValidation";

const AdminDashboard = () => {
  // On définit les onglets disponibles. C'est ici que vous pourrez en ajouter.
  const tabs = [
    { id: "posts", label: "Validation des Articles" },
    { id: "users", label: "Gestion des Utilisateurs" },
    // { id: "stats", label: "Statistiques" }, -> Exemple pour le futur
  ];

  // On utilise un état pour savoir quel onglet est actif.
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="admin-dashboard-container">
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1>Panneau d'Administration</h1>
        <p>Bienvenue dans l'espace réservé aux administrateurs.</p>
      </div>

      <nav className="admin-tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="admin-tab-content">
        {activeTab === "posts" && <PostValidation />}
        {activeTab === "users" && (
          <div>
            <h2>Gestion des Utilisateurs</h2>
            <p>Ce composant sera bientôt disponible.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
