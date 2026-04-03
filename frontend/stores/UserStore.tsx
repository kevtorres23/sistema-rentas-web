import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserState = {
    id: string;
    role: "tenant" | string; // Reemplazar "string" con el otro rol que el usuario puede tener una vez tengamos acceso a la BD.
    updateUserId: (newId: string) => void;
    updateUserRole: (newRole: string) => void;
};

/**
 * Tienda de Zustand utilizada para manejar el estado global del usuario en el sistema.
 */

export const useUserStore = create<UserState>()(
    persist((set) => ({
        id: "",
        role: "",
        updateUserId: (newId: string) => set({
            id: newId
        }),
        updateUserRole: (newRole: string) => set({
            role: newRole
        })
    }),
        {
            name: "user-store"
        })
);