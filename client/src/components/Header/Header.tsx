import { isMobile } from "react-device-detect";
import { FaGithubAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useOverlay } from "../../contexts/OverlayContext/OverlayContext";
import { ProfileDropdown } from "./ProfileDropdown";
import "./Header.css";

function Header() {
  const { isAdmin } = useAuth();
  const { openOverlay } = useOverlay();

  const renderDesktopNav = () => (
    <div className="desktop-nav-container">
      <nav className="desktop-nav-links">
        <Link to="/le-mur">Le Mur</Link>
        <Link to="/les-regles-du-jeu">Les Règles du Jeu</Link>
        <Link to="/exprimez-vous">Exprimez-vous</Link>
        <Link to="/le-concept">Le Concept</Link>
        {isAdmin && (
          <button
            type="button"
            className="desktop-nav-link-button"
            onClick={() => openOverlay("#admin")}
          >
            Dashboard Admin
          </button>
        )}
      </nav>
      <ProfileDropdown />
    </div>
  );

  const renderMobileNav = () => <ProfileDropdown />;

  return (
    <header className="topbar-container">
      <Link
        to="/"
        className="logo-button"
        title="Retour à l'accueil"
        aria-label="Retour à l'accueil"
      >
        <FaGithubAlt
          className="logo-icon"
          size={40}
          style={{ color: "white" }}
        />
      </Link>

      {isMobile ? renderMobileNav() : renderDesktopNav()}
    </header>
  );
}

export default Header;