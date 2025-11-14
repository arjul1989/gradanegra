'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Comercio {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  logo?: string;
  imagenBanner?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  website?: string;
  redesSociales?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  colorPrimario?: string;
  colorSecundario?: string;
  tipoPlan: 'free' | 'basic' | 'pro' | 'premium' | 'enterprise';
  limiteEventos: number;
  comision: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Billing fields (optional)
  nit?: string;
  razonSocial?: string;
  direccionFiscal?: string;
  emailFacturacion?: string;
}

interface ComercioContextType {
  comercio: Comercio | null;
  loading: boolean;
  error: string | null;
  refreshComercio: () => Promise<void>;
  updateComercio: (data: Partial<Comercio>) => Promise<void>;
}

const ComercioContext = createContext<ComercioContextType | undefined>(undefined);

export function ComercioProvider({ children }: { children: ReactNode }) {
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchComercio = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comercios/by-user/${user.uid}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError('No tienes un comercio asociado');
        } else {
          throw new Error('Error al cargar comercio');
        }
        setComercio(null);
        return;
      }

      const data = await response.json();
      setComercio(data);
    } catch (err) {
      console.error('Error fetching comercio:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setComercio(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshComercio = async () => {
    await fetchComercio();
  };

  const updateComercio = async (data: Partial<Comercio>) => {
    if (!comercio) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comercios/${comercio.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar comercio');
      }

      const updated = await response.json();
      setComercio(updated);
    } catch (err) {
      console.error('Error updating comercio:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchComercio();
  }, [user]);

  return (
    <ComercioContext.Provider
      value={{
        comercio,
        loading,
        error,
        refreshComercio,
        updateComercio,
      }}
    >
      {children}
    </ComercioContext.Provider>
  );
}

export function useComercio() {
  const context = useContext(ComercioContext);
  if (context === undefined) {
    throw new Error('useComercio must be used within a ComercioProvider');
  }
  return context;
}
