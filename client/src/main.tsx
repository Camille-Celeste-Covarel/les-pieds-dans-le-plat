import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import App from "./App";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import LeMur from "./pages/LeMur.tsx";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage.tsx";
import RegisterPage from "./pages/RegisterPage";
import Regles from "./pages/Regles.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AdminRoute from "./utils/AdminRoute.tsx";
import ProtectedRoute from "./utils/ProtectedRoute";
import ExprimezVous from "./pages/ExprimezVous.tsx";
import Concept from "./pages/Concept.tsx";

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "/le-mur",
        element: <LeMur />,
      },
      {
        path: "/les-regles-du-jeu",
        element: <Regles />,
      },
      {
        path: "/exprimez-vous",
        element: <ExprimezVous />,
      },
      {
        path: "/le-concept",
        element: <Concept />,
      },
      {
        path: "/login",
        element: <LoginPage />,
        handle: { isOverlay: true },
      },
      {
        path: "/register",
        element: <RegisterPage />,
        handle: { isOverlay: true },
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
        handle: { isOverlay: true },
      },
      {
        path: "/reset-password",
        element: <ResetPassword />,
        handle: { isOverlay: true },
      },
      {
        path: "/admin/dashboard",
        element: (
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
        ),
        handle: { isOverlay: true },
      },
      {
        path: "/profil",
        element: (
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
        ),
        handle: { isOverlay: true },
      },
    ],
  },
]);


const rootElement = document.getElementById("root");
if (rootElement == null) {
  throw new Error(`Your HTML Document should contain a <div id="root"></div>`);
}

const queryClient = new QueryClient();

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  </StrictMode>,
);
