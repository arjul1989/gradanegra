"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function PerfilRedirect() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      // Si no hay usuario, redirigir al login
      router.replace("/login");
      return;
    }

    // Redirigir a la página de perfil de usuario buyer
    router.replace("/usuario/perfil");
  }, [user, router]);

  // Mostrar un loading mientras se redirecciona
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="text-white text-lg">Cargando perfil...</p>
      </div>
    </div>
  );
}

