"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function PagoPendienteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    if (paymentId) {
      setPaymentInfo({
        paymentId,
        status,
        externalReference
      });
    }
  }, [paymentId, status, externalReference]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 rounded-lg p-8 text-center">
        {/* Icono de Pendiente */}
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-yellow-500 text-4xl">
            pending
          </span>
        </div>

        {/* Título */}
        <h1 className="text-white text-2xl font-bold mb-4">
          Pago Pendiente
        </h1>

        {/* Mensaje */}
        <p className="text-white/70 mb-6">
          Tu pago está siendo procesado. Te notificaremos por email una vez que se confirme.
        </p>

        {/* Información del Pago */}
        {paymentInfo && (
          <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">ID de Pago:</span>
                <span className="text-white text-sm font-mono">{paymentInfo.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Estado:</span>
                <span className="text-yellow-500 text-sm font-semibold">Pendiente</span>
              </div>
              {paymentInfo.externalReference && (
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Referencia:</span>
                  <span className="text-white text-sm font-mono">{paymentInfo.externalReference}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información Adicional */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <h3 className="text-blue-400 font-semibold text-sm mb-2">¿Qué significa esto?</h3>
          <p className="text-white/70 text-xs text-left">
            Tu pago está siendo verificado por Mercado Pago. Esto puede tomar algunos minutos u horas dependiendo del método de pago utilizado.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-3">
          <Link
            href="/mis-boletos"
            className="block w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Ver Mis Boletos
          </Link>
          
          <Link
            href="/"
            className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>

        {/* Nota */}
        <p className="text-white/50 text-xs mt-6">
          Recibirás un email de confirmación una vez que tu pago sea aprobado.
        </p>
      </div>
    </div>
  );
}

export default function PagoPendientePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <PagoPendienteContent />
    </Suspense>
  );
}

