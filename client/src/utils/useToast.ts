import { create } from "zustand";

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (message: string, type?: "success" | "error") => void;
  removeToast: (id: number) => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = "success") => {
    const id = toastId++;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Le toast disparaît automatiquement après 4 secondes
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
