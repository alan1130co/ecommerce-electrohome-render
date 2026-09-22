import { create } from "zustand";

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

// Toast global mínimo — un solo mensaje a la vez, sin cola. Suficiente
// para confirmaciones puntuales (agregar a wishlist, etc.) sin traer una
// librería externa.
export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));
