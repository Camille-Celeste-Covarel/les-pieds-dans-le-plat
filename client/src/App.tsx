import type React from "react";
import { isMobile } from "react-device-detect";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import { Overlay } from "./components/Overlay/Overlay";
import ToastContainer from "./components/Toast/ToastContainer";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { OverlayProvider } from "./contexts/OverlayContext/OverlayContext";
import { overlayRoutes } from "./middlewares/overlays.tsx";
import Post from "./pages/Post.tsx";

import "./components/Overlay/Overlay.css";
import "./stylesheets/App.css";
import "./stylesheets/normalize.css";

interface OverlayRoute {
  component: React.ReactNode;
  protection: "public" | "protected" | "admin";
}

function AppContent() {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  const isRootPath = location.pathname === "/";

  let currentOverlayRoute: OverlayRoute | undefined;

  if (!isMobile) {
    // 1. On vérifie d'abord si le hash correspond à une route de post dynamique
    if (location.hash.startsWith("#/")) {
      currentOverlayRoute = {
        component: <Post />,
        protection: "protected",
      };
    } else {
      // 2. Sinon, on utilise la liste statique pour les autres overlays (login, profil...)
      currentOverlayRoute = overlayRoutes[location.hash];
    }
  }

  let isAuthorized = false;
  if (currentOverlayRoute) {
    switch (currentOverlayRoute.protection) {
      case "public":
        isAuthorized = true;
        break;
      case "protected":
        isAuthorized = isAuthenticated;
        break;
      case "admin":
        isAuthorized = isAuthenticated && isAdmin;
        break;
      default:
        isAuthorized = false;
    }
  }

  const shouldShowOverlay = isAuthorized && currentOverlayRoute;
  const overlayContent = shouldShowOverlay ? shouldShowOverlay.component : null;

  const shouldShowMainPage = !isRootPath;
  const routeContent = <Outlet />;

  if (isRootPath) {
    return <main className="main-content">{routeContent}</main>;
  }

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {shouldShowMainPage && (
          <div className="main-page-container">{routeContent}</div>
        )}
        {shouldShowOverlay && <Overlay>{overlayContent}</Overlay>}
        <ToastContainer />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <OverlayProvider>
        <AppContent />
      </OverlayProvider>
    </AuthProvider>
  );
}

export default App;
