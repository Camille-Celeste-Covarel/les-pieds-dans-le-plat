import { type ReactNode, useEffect, useState } from "react";
import { useOverlay } from "../../contexts/OverlayContext/OverlayContext.tsx";

export function Overlay({ children }: { children: ReactNode }) {
  const { closeOverlay } = useOverlay();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      closeOverlay();
    }, 300);
  };

  if (!children) {
    return null;
  }

  return (
      <>
        <div
            className={`overlay-backdrop ${isOpen ? "open" : ""}`}
            onClick={handleClose}
            aria-hidden="true"
        />
        <div className={`overlay-container ${isOpen ? "open" : ""}`}>
          <button
              type="button"
              className="close-button"
              onClick={handleClose}
              aria-label="Fermer"
          >
            &times;
          </button>
          <div className="overlay-content">{children}</div>
        </div>
      </>
  );
}