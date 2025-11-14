"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface CompraData {
  id: string;
  eventoId: string;
  monto: number;
  email: string;
  nombre: string;
  telefono: string;
  status: string;
  fechaCreacion: any;
  evento?: {
    nombre: string;
    fecha: any;
    lugar: string;
    ciudad: string;
  };
}

export default function EfectyComprobante() {
  const router = useRouter();
  const params = useParams();
  const compraId = params.compraId as string;

  const [compra, setCompra] = useState<CompraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function cargarCompra() {
      try {
        const response = await fetch(`${API_URL}/api/compras/${compraId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setCompra(data.data);
        } else {
          setError("Compra no encontrada");
        }
      } catch (err) {
        console.error('Error al cargar compra:', err);
        setError("Error al cargar la información");
      } finally {
        setLoading(false);
      }
    }

    if (compraId) {
      cargarCompra();
    }
  }, [compraId]);

  // Función para simular el pago (solo en desarrollo)
  const simularPagoAprobado = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payments/simulate-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          compraId: compraId,
          status: 'approved'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Pago simulado como aprobado. Revisa tu sección "Mis Tickets"');
        router.push('/mis-boletos');
      }
    } catch (err) {
      alert('Error al simular el pago');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Cargando comprobante...</div>
      </div>
    );
  }

  if (error || !compra) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Link
            href="/"
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  const fechaVencimiento = new Date();
  fechaVencimiento.setHours(fechaVencimiento.getHours() + 48); // 48 horas para pagar

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Comprobante de Pago - Efecty</h1>
          <p className="text-slate-400">Pago en efectivo pendiente</p>
        </div>

        {/* Comprobante */}
        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 mb-6">
          
          {/* Logo/Header del comprobante */}
          <div className="text-center mb-6 pb-6 border-b border-slate-700">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">store</span>
            </div>
            <h2 className="text-xl font-bold text-white">Pago Efecty</h2>
            <p className="text-slate-400">Pago en efectivo pendiente</p>
          </div>

          {/* Información de la compra */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-400">Número de referencia:</span>
              <span className="text-white font-mono">{compra.id.split('-')[0].toUpperCase()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Evento:</span>
              <span className="text-white text-right max-w-xs">{compra.evento?.nombre || 'Evento'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Monto a pagar:</span>
              <span className="text-white font-bold text-xl">
                ${compra.monto?.toLocaleString('es-CO')} COP
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Fecha de vencimiento:</span>
              <span className="text-amber-400 font-semibold">
                {fechaVencimiento.toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mb-6">
            <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">info</span>
              Instrucciones para pagar
            </h3>
            <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
              <li>Acércate a cualquier punto Efecty</li>
              <li>Proporciona el número de referencia</li>
              <li>Paga el monto exacto de ${compra.monto?.toLocaleString('es-CO')} COP</li>
              <li>Guarda tu comprobante de pago físico</li>
              <li>Espera la confirmación por email (hasta 24 horas)</li>
            </ol>
          </div>

          {/* Información de prueba para desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-amber-900/20 border border-amber-500/50 rounded-lg p-4 mb-6">
              <h3 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">code</span>
                Modo de pruebas - Solo desarrollo
              </h3>
              <p className="text-sm text-amber-200 mb-3">
                Como estás en desarrollo, puedes simular que el pago fue aprobado en Efecty:
              </p>
              <button
                onClick={simularPagoAprobado}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg text-sm"
              >
                ✅ Simular pago aprobado
              </button>
              <p className="text-xs text-amber-300 mt-2">
                Esto marcará la compra como completada y generará los tickets automáticamente.
              </p>
            </div>
          )}

          {/* Código de barras simulado */}
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 mb-4 inline-block">
              <div className="w-64 h-16 bg-black flex items-center justify-center">
                <div className="flex space-x-1">
                  {/* Simulación de código de barras */}
                  <div className="w-1 bg-black h-full"></div>
                  <div className="w-0.5 bg-white h-full"></div>
                  <div className="w-1 bg-black h-full"></div>
                  <div className="w-0.5 bg-white h-full"></div>
                  <div className="w-1 bg-black h-full"></div>
                  <div className="w-0.5 bg-white h-full"></div>
                  <div className="w-1 bg-black h-full"></div>
                  <div className="w-0.5 bg-white h-full"></div>
                  <div className="w-1 bg-black h-full"></div>
                  <div className="w-0.5 bg-white h-full"></div>
                  <div className="w-1 bg-black h-full"></div>
                  <div className="w-0.5 bg-white h-full"></div>
                  <div className="w-1 bg-black h-full"></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400">* En producción verás el código de barras real aquí</p>
          </div>
        </div>

        {/* Información del comprador */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <h3 className="text-white font-semibold mb-2">Información del comprador</h3>
          <div className="text-sm text-slate-300 space-y-1">
            <p><span className="text-slate-400">Nombre:</span> {compra.nombre}</p>
            <p><span className="text-slate-400">Email:</span> {compra.email}</p>
            <p><span className="text-slate-400">Teléfono:</span> {compra.telefono}</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          <button
            onClick={() => window.print()}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">print</span>
            Imprimir comprobante
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/"
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Volver al inicio
            </Link>
            
            <Link
              href="/mis-compras"
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Mis compras
            </Link>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
          <p className="text-xs text-slate-500">
            ¿Necesitas ayuda? Contacta a soporte en support@gradanegra.com
          </p>
        </div>
      </div>
    </div>
  );
}