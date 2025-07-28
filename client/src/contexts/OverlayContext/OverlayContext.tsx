import { type ReactNode, createContext, useCallback, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { OverlayContextType } from "../../types/contexts/contextsTypes";

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export const OverlayProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const openOverlay = useCallback(
    (hash: string) => {
      navigate(`${location.pathname}${hash}`);
    },
    [navigate, location.pathname],
  );

  const closeOverlay = useCallback(() => {
    navigate(location.pathname);
  }, [navigate, location.pathname]);

  const value = { openOverlay, closeOverlay };

  return (
    <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
  );
};

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (context === undefined) {
    throw new Error("useOverlay must be used within an OverlayProvider");
  }
  return context;
};
