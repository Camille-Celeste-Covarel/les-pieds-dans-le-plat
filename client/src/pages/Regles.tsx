import {
  FaCalendarAlt,
  FaComments,
  FaRegHeart,
  FaSearch,
  FaShieldAlt,
  FaUserCheck,
} from "react-icons/fa";
import "../stylesheets/Regles.css";

const rulesData = [
  {
    icon: <FaRegHeart />,
    title: "Exprimez-vous librement et respectueusement",
    text: "Partagez vos idées en veillant toujours à la bienveillance et au respect d'autrui.",
  },
  {
    icon: <FaSearch />,
    title: "Privilégiez la qualité de l'information",
    text: "Assurez-vous que vos contributions sont basées sur des faits et évitent la désinformation ou la panique morale.",
  },
  {
    icon: <FaComments />,
    title: "Favorisez l'ouverture et le dialogue",
    text: "Chaque message est une opportunité de comprendre la pensée des autres et de créer des échanges constructifs.",
  },
  {
    icon: <FaShieldAlt />,
    title: "Contribuez à un environnement sain",
    text: "Aide-nous à maintenir une plateforme exempte de discours haineux, de manipulations ou d'idées réactionnaires.",
  },
  {
    icon: <FaUserCheck />,
    title: "Un contenu vérifié",
    text: "Chaque publication sera vérifiée manuellement par notre équipe pour assurer la qualité et le respect de nos valeurs.",
  },
  {
    icon: <FaCalendarAlt />,
    title: "Un post par personne et par mois",
    text: "Pour garantir la qualité des échanges et la visibilité de chaque voix, nous limitons la publication à un post par personne et par mois.",
  },
];

function Regles() {
  return (
    <div className="main-page-container rules-page">
      <h1>Les Règles du Jeu</h1>
      <p className="rules-intro">
        Pour que cet espace reste un lieu d'échange riche et respectueux, nous
        vous invitons à suivre ces quelques principes directeurs :
      </p>

      <ul className="rules-list">
        {rulesData.map((rule) => (
          <li key={rule.title} className="rule-item">
            <div className="rule-header">
              <span className="rule-icon">{rule.icon}</span>
              <h3 className="rule-title">{rule.title}</h3>
            </div>
            <p className="rule-text">{rule.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default Regles;
