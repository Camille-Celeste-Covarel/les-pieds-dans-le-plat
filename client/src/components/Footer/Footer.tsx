import { isMobile } from "react-device-detect";
import {
  FaBook,
  FaComments,
  FaLightbulb,
  FaUserShield,
} from "react-icons/fa";
import { TbSpeakerphone } from "react-icons/tb";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import "./Footer.css";

function Footer() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const iconSize = 35;

  const navItems = [
    { path: "/le-mur", title: "Le Mur", icon: <TbSpeakerphone size={iconSize} /> },
    {
      path: "/les-regles-du-jeu",
      title: "Les Règles du Jeu",
      icon: <FaBook size={iconSize} />,
    },
    {
      path: "/exprimez-vous",
      title: "Exprimez-vous",
      icon: <FaComments size={iconSize} />,
    },
    {
      path: "/le-concept",
      title: "Le Concept",
      icon: <FaLightbulb size={iconSize} />,
    },
  ];

  return (
    <div className="navbar-container">
      {isMobile && (
        <>
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              title={item.title}
            >
              {item.icon}
            </button>
          ))}

          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate("/admin/dashboard")}
              title="Administration"
            >
              <FaUserShield size={iconSize} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default Footer;
