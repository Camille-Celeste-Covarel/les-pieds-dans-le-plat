import type { ReactNode } from "react";
import LoginPage from "./../pages/LoginPage";
import RegisterPage from "./../pages/RegisterPage";
import ForgotPassword from "./../pages/ForgotPassword";
import ResetPassword from "./../pages/ResetPassword";
import ProfilePage from "./../pages/ProfilePage";
import AdminDashboard from "./../pages/AdminDashboard";

// Définition du type pour un overlay
interface OverlayRoute {
    component: ReactNode;
    protection: "public" | "protected" | "admin";
}

// Registre central des overlays
// La clé est le hash qui sera utilisé dans l'URL
export const overlayRoutes: { [key: string]: OverlayRoute } = {
    "#login": { component: <LoginPage />, protection: "public" },
    "#register": { component: <RegisterPage />, protection: "public" },
    "#forgot-password": { component: <ForgotPassword />, protection: "public" },
    "#reset-password": { component: <ResetPassword />, protection: "public" },
    "#profil": { component: <ProfilePage />, protection: "protected" },
    "#admin": { component: <AdminDashboard />, protection: "admin" },
};