import { isMobile } from "react-device-detect";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ProfileDropdown } from "./ProfileDropdown";
import "./Header.css";

function Header() {
  const { isAdmin } = useAuth();

  const renderDesktopNav = () => (
    <div className="desktop-nav-container">
      <nav className="desktop-nav-links">
        <Link to="/le-mur">Le Mur</Link>
        <Link to="/les-regles-du-jeu">Les Règles du Jeu</Link>
        <Link to="/exprimez-vous">Exprimez-vous</Link>
        <Link to="/le-concept">Le Concept</Link>
        {isAdmin && (
          <Link to="/admin/dashboard" className="desktop-nav-link-button">
            Dashboard Admin
          </Link>
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
        <span className="logo-text">les pieds dans le plat</span>
      </Link>

      {isMobile ? renderMobileNav() : renderDesktopNav()}
    </header>
  );
}

export default Header;
