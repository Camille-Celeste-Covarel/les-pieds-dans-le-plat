import { useNavigate } from "react-router-dom";
import LaLiberte from "../ressources/img/La_Liberté_guidant_le_peuple_-_Eugène_Delacroix_-_Musée_du_Louvre_Peintures_RF_129_-_après_restauration_2024.jpg";
import "../stylesheets/landingpage.css";

function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            <div className="landing-content">
                <div className="landing-text-wrapper">
                    <h1 className="landing-title">Les Pieds dans le Plat</h1>
                    <p>
                        Nous sommes ravis de vous accueillir dans un espace où la liberté d'expression rime avec
                        qualité et respect. Notre ambition est de créer une communauté où chacun peut partager
                        ses idées et découvrir de nouvelles perspectives dans un environnement sain et stimulant.
                    </p>
                    <p>
                        Nous avons à cœur de vous offrir une plateforme exempte des écueils habituels du web. Ici,
                        la bienveillance et la précision de l'information sont nos maîtres mots. Nous nous engageons
                        à ce que chaque contenu soit une ouverture sur la pensée de chacun, favorisant des échanges
                        authentiques et constructifs.
                    </p>
                    <p>
                        Nous sommes impatients de lire vos contributions et de voir les échanges positifs et constructifs
                        que notre communauté va générer. C'est votre voix, éclairée et respectueuse, qui fera la
                        richesse de ce projet.
                    </p>
                    <p>
                        L'équipe des Pieds dans le Plat
                    </p>
                </div>
                <button
                    type="button"
                    className="landing-button"
                    onClick={() => navigate("/le-mur")}
                >
                    Accéder au site
                </button>
            </div>

            <div className="landing-image-section">
                <img
                    src={LaLiberte}
                    alt="La Liberté guidant le peuple par Eugène Delacroix"
                    className="landing-image"
                />
                <h1 className="landing-title-mobile">Les Pieds dans le Plat</h1>
            </div>
        </div>
    );
}

export default LandingPage;