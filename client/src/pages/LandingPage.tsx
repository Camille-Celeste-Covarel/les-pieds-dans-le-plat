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
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non
                        risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing
                        nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas
                        ligula massa, varius a, semper congue, euismod non, mi.
                    </p>
                    <p>
                        Proin porttitor, orci nec nonummy molestie, enim est eleifend mi,
                        non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa,
                        scelerisque vitae, consequat in, pretium a, enim. Pellentesque
                        congue.
                    </p>
                    <p>
                        Ut in risus volutpat libero pharetra tempor. Cras vestibulum
                        bibendum augue. Praesent egestas leo in pede. Praesent blandit odio
                        eu enim. Pellentesque sed dui ut augue blandit sodales.
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